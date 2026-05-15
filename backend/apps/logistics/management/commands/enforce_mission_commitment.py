"""
enforce_mission_commitment.py
Management command that detects transporter inactivity and applies automated penalties.

Usage:
    python manage.py enforce_mission_commitment          # Enforce inactivity (2h window)
    python manage.py enforce_mission_commitment --dry-run # Preview without committing

Schedule via cron (Linux) or Task Scheduler (Windows) every 15-30 minutes.
Example cron: */15 * * * * /path/to/python manage.py enforce_mission_commitment
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

ACTIVATION_WINDOW_HOURS = 2       # Transporter must act within 2 hours
SUSPENSION_DAYS         = 3       # Automatic suspension duration for abandonment (Reduced from 7)


class Command(BaseCommand):
    help = 'Detects stale ASSIGNED missions and enforces transporter commitment rules.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate the check without saving any changes.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        cutoff = now - timezone.timedelta(hours=ACTIVATION_WINDOW_HOURS)

        if dry_run:
            self.stdout.write(self.style.WARNING('[DRY RUN] No changes will be saved.'))

        self.stdout.write(f'[{now.strftime("%Y-%m-%d %H:%M:%S")}] Scanning for stale assigned missions...')

        from apps.logistics.models import DeliveryRequest, DeliveryStatusChoices
        from apps.accounts.models import User

        # Find all ASSIGNED missions past the 2h activation window
        stale_missions = DeliveryRequest.objects.filter(
            status=DeliveryStatusChoices.ASSIGNED,
            accepted_at__lt=cutoff,
            inactivity_flag=False,   # Only process each stale mission once
        ).select_related('transporter', 'order')

        stale_count = stale_missions.count()
        if stale_count == 0:
            self.stdout.write(self.style.SUCCESS('No stale missions found. All transporters are compliant.'))
            return

        self.stdout.write(self.style.WARNING(f'Found {stale_count} stale mission(s). Processing...'))

        processed = 0
        suspended_count = 0

        for delivery in stale_missions:
            transporter = delivery.transporter
            if not transporter:
                continue

            self.stdout.write(
                f'  → Mission #{delivery.id} | Transporter: {transporter.email} | '
                f'Accepted: {delivery.accepted_at} | Status: {delivery.status}'
            )

            if dry_run:
                self.stdout.write(f'    [DRY RUN] Would penalize and reset mission #{delivery.id}.')
                continue

            with transaction.atomic():
                # ── 1. Mark mission as inactivity flagged + escalate to HIGH_PRIORITY ──
                delivery.inactivity_flag = True
                delivery.transporter = None
                delivery.status = DeliveryStatusChoices.HIGH_PRIORITY
                delivery.accepted_at = None
                delivery.assigned_vehicle_id = None
                delivery.assigned_vehicle_info = {}
                delivery.save()

                # ── 2. Log to order timeline ──────────────────────────────────────
                try:
                    delivery.order.add_timeline_entry(
                        status="INACTIVITY_PENALTY",
                        actor=None,
                        note=(
                            f"System: Transporter {transporter.full_name} failed to act within "
                            f"{ACTIVATION_WINDOW_HOURS}h. Mission returned to marketplace as HIGH PRIORITY. "
                            f"Transporter automatically suspended for {SUSPENSION_DAYS} days."
                        )
                    )
                except Exception as e:
                    logger.warning(f"Could not write timeline for mission #{delivery.id}: {e}")

                # ── 3. Immediate suspension for inactivity abandonment ───────────
                transporter.suspended_until = now + timezone.timedelta(days=SUSPENSION_DAYS)
                transporter.suspension_reason = (
                    f"Automatic suspension for {SUSPENSION_DAYS} days due to mission abandonment "
                    f"(Mission #{delivery.id}, system detection)."
                )
                suspension_applied = True
                suspended_count += 1

                transporter.save()

                # ── 5. Notify transporter ──────────────────────────────────────────
                try:
                    from apps.notifications.models import create_notification, NotificationType
                    msg = (
                        f"⚠ Mission #{delivery.id} was automatically released due to inactivity. "
                        f"Your marketplace access is suspended for {SUSPENSION_DAYS} days."
                    )
                    create_notification(
                        user=transporter,
                        message=msg,
                        notif_type=NotificationType.DELIVERY_COMPLETED,
                        link="/transporter-dashboard"
                    )
                except Exception as e:
                    logger.warning(f"Could not send notification to transporter {transporter.id}: {e}")

            processed += 1
            status_msg = '✓ Penalized'
            if suspension_applied:
                status_msg += f' + Suspended until {transporter.suspended_until.strftime("%d %b %H:%M")}'
            self.stdout.write(self.style.SUCCESS(f'    {status_msg}'))

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDone. Processed: {processed} | Suspended: {suspended_count}'
                )
            )
        else:
            self.stdout.write(self.style.WARNING(f'\n[DRY RUN] Would have processed {stale_count} mission(s).'))
