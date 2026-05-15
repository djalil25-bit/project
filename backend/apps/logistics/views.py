from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

import logging
from django.utils import timezone
from django.db import transaction
from .models import DeliveryRequest, DeliveryStatusChoices, Vehicle
from .serializers import (
    DeliveryRequestSerializer, 
    DeliveryStatusUpdateSerializer,
    ProofOfDeliverySerializer,
    VehicleSerializer,
    TransportPricingRuleSerializer
)
from apps.accounts.permissions import IsTransporterRole, IsFarmerRole
from apps.orders.models import OrderStatusChoices, DeliveryStatusChoices as OrderDeliveryStatus
from apps.common.constants import get_wilaya_name
from .models import DeliveryRequest, DeliveryStatusChoices, Vehicle, TransportPricingRule

class TransportPricingRuleViewSet(viewsets.ModelViewSet):
    queryset = TransportPricingRule.objects.all().order_by('vehicle_type')
    serializer_class = TransportPricingRuleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def calculate_fee(self, request):
        distance = request.data.get('distance')
        weight = request.data.get('weight', 0)
        v_type = request.data.get('vehicle_type', 'truck')
        
        from .models import calculate_transport_fee
        res = calculate_transport_fee(distance, weight, v_type)
        return Response(res)


logger = logging.getLogger(__name__)

class DeliveryRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [IsFarmerRole()]
        if self.action in ['accept', 'update_status', 'my_missions']:
            return [IsTransporterRole()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        user = self.request.user
        
        # 1. Check if farmer owner
        if not order.items.filter(farmer=user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only request delivery for orders containing your products.")
            
        # 2. Check if already exists (OneToOneField replacement logic)
        if hasattr(order, 'delivery_request'):
             existing = order.delivery_request
             if existing.status == DeliveryStatusChoices.CANCELLED:
                 # Remove cancelled request to allow a new one
                 existing.delete()
             else:
                 from rest_framework.exceptions import ValidationError
                 raise ValidationError({"error": f"A delivery request already exists for this order (Status: {existing.status})."})
             
        # Extract pickup_wilaya from the first farm of the order items
        first_item = order.items.first()
        if first_item and first_item.farmer:
            wilaya = ''
            farm = None
            # Try to get from farm first
            if first_item.product and first_item.product.farm:
                farm = first_item.product.farm
                if farm.wilaya:
                    wilaya = farm.wilaya
            
            # Fallback to farmer's registered address (which stores wilaya name)
            if not wilaya:
                wilaya = first_item.farmer.address
                
            if wilaya:
                serializer.validated_data['pickup_wilaya'] = wilaya
            
            # Auto-populate delivery GPS from buyer's order wilaya
        buyer_wilaya = order.wilaya or ''
        if buyer_wilaya and not serializer.validated_data.get('delivery_latitude'):
            from apps.common.constants import WILAYA_COORDS
            coords = WILAYA_COORDS.get(str(buyer_wilaya).strip())
            if coords:
                serializer.validated_data['delivery_latitude'] = coords[0]
                serializer.validated_data['delivery_longitude'] = coords[1]
            
        # 3. Inherit the official transport fee from the order
        # This ensures the buyer, farmer, and transporter all see the exact same price
        if order.transport_fee:
            serializer.validated_data['estimated_fee'] = order.transport_fee
            
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        # We know user is a User instance because of IsAuthenticated permission, 
        # but the IDE might need a hint for custom fields like 'role'.
        qs = DeliveryRequest.objects.all().select_related(
            'order', 'order__buyer', 'transporter'
        ).prefetch_related(
            'order__items', 'order__items__product', 'order__items__product__farm'
        ).order_by('-created_at')
        
        if user.role == 'transporter':
            # Retrieve filter params
            pickup_wilaya = self.request.query_params.get('pickup_wilaya')
            delivery_wilaya = self.request.query_params.get('delivery_wilaya')
            
            from django.db.models import Q
            
            # 1. Define the visibility criteria
            # Transporters see:
            # - Missions already assigned to them
            # - OPEN missions that match their service zones (if set)
            
            service_zones = getattr(user, 'service_zones', []) or []
            open_missions_q = Q(status=DeliveryStatusChoices.OPEN)
            
            if service_zones:
                # If they want ALL_ALGERIA, we do NOT restrict to service zones.
                if pickup_wilaya != 'ALL_ALGERIA':
                    # Restrict to service zones
                    # We remove the fallback for empty wilaya to ensure only matching or "All Algeria" missions are seen
                    zone_q = Q()
                    for zone in service_zones:
                        if zone.strip():
                            zone_q |= Q(pickup_wilaya__iexact=zone.strip())
                    open_missions_q &= zone_q
                
            visibility_q = Q(transporter=user) | open_missions_q
            qs = qs.filter(visibility_q)
            
            # 2. Apply additional search filters from query params
            # BUT: Filters should only apply to OPEN missions. 
            # A transporter should ALWAYS see their own assigned missions regardless of the wilaya filter.
            if pickup_wilaya and pickup_wilaya not in ['ALL_ALGERIA', 'ALL_ZONES']:
                qs = qs.filter(Q(pickup_wilaya__iexact=pickup_wilaya) | Q(transporter=user))
                
            if delivery_wilaya:
                qs = qs.filter(Q(order__wilaya=delivery_wilaya) | Q(transporter=user))

            # 3. Handle specific actions vs general list
            if self.action in ['my_missions', 'update_status']:
                return qs.filter(transporter=user)
            
            # Apply visibility rules to ensure transporters only see 
            # their own missions or available open ones in their zones.
            return qs.filter(visibility_q)
            
        elif user.role == 'farmer':
            return qs.filter(order__items__farmer=user).distinct()
            
        elif user.role == 'buyer':
            return qs.filter(order__buyer=user)
            
        return qs

    @action(detail=False, methods=['get'])
    def my_missions(self, request):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        # ── SUSPENSION GUARD ────────────────────────────────────────────────────
        user = request.user
        if user.suspended_until and user.suspended_until > timezone.now():
            from django.utils.timezone import localtime
            until_str = localtime(user.suspended_until).strftime('%d %b %Y at %H:%M')
            return Response({
                "error": "marketplace_suspended",
                "message": f"Marketplace access temporarily suspended due to repeated mission abandonment. Access resumes on {until_str}.",
                "suspended_until": user.suspended_until.isoformat(),
                "trust_score": user.trust_score,
            }, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            try:
                delivery = DeliveryRequest.objects.select_for_update(nowait=True).get(pk=pk)
            except DeliveryRequest.DoesNotExist:
                return Response({"error": "Delivery request not found."}, status=status.HTTP_404_NOT_FOUND)
            except Exception: # Handles the OperationalError for Database Lock/Nowait
                return Response({"error": "This mission is currently being processed by another transporter."}, status=status.HTTP_409_CONFLICT)

            if delivery.status not in [DeliveryStatusChoices.OPEN, DeliveryStatusChoices.HIGH_PRIORITY]:
                return Response({"error": "This delivery is no longer open. It may have just been accepted by someone else."}, status=status.HTTP_409_CONFLICT)
        
        # 1. NEW: Vehicle Compatibility Validation
        # Check if the transporter has ANY active and approved vehicle that has sufficient capacity
        from .models import VehicleStatusChoices
        has_compatible_vehicle = Vehicle.objects.filter(
            owner=request.user,
            status=VehicleStatusChoices.ACTIVE,
            is_active=True
        ).exists()

        if not has_compatible_vehicle:
            return Response(
                {"error": f"Compatibility Error: Your fleet does not contain an active approved vehicle."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Existing: Transporter active mission limit validation
        active_missions = DeliveryRequest.objects.filter(
            transporter=request.user,
            status__in=[
                DeliveryStatusChoices.ASSIGNED,
                DeliveryStatusChoices.PICKED_UP,
                DeliveryStatusChoices.IN_TRANSIT
            ]
        )
        
        logger.info(f"[LOGISTICS] User {request.user.id} ({request.user.username}) attempting to accept mission {pk}")
        if active_missions.exists():
            mission_details = ", ".join([f"ID:{m.id}({m.status})" for m in active_missions])
            logger.warning(f"[LOGISTICS] Blocked: User {request.user.id} has active missions: {mission_details}")
            return Response(
                {"error": "You cannot accept a new mission until your current mission is completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicle_id = request.data.get('vehicle_id')
        if not vehicle_id:
            return Response({"error": "You must select a vehicle to accept this mission."}, status=status.HTTP_400_BAD_REQUEST)

        # ── DUAL-READ: Try Vehicle model first, then JSON fallback ──
        selected_vehicle = None
        vehicle_obj = None
        try:
            vehicle_obj = Vehicle.objects.get(id=vehicle_id, owner=request.user)
            selected_vehicle = {
                'id': vehicle_obj.id,
                'plate': vehicle_obj.plate,
                'model': vehicle_obj.model,
                'capacity': vehicle_obj.capacity,
                'type': vehicle_obj.type,
                'is_active': vehicle_obj.is_active,
                'status': vehicle_obj.status,
            }
        except (Vehicle.DoesNotExist, ValueError):
            # Fallback to legacy JSON vehicles
            user_vehicles = request.user.vehicles or []
            selected_vehicle = next((v for v in user_vehicles if str(v.get('id')) == str(vehicle_id)), None)

        if not selected_vehicle:
            return Response({"error": "The selected vehicle was not found in your fleet registry."}, status=status.HTTP_400_BAD_REQUEST)
        
        if selected_vehicle.get('is_active') is False:
            return Response({"error": "The selected vehicle is currently marked as inactive/offline."}, status=status.HTTP_400_BAD_REQUEST)

        # (Removed strict vehicle type matching to allow upgrades/flexible assignments)

        # Check admin approval status (Vehicle model only)
        vehicle_status = selected_vehicle.get('status', 'ACTIVE')  # Legacy JSON vehicles default to ACTIVE
        if vehicle_status != 'ACTIVE':
            return Response({"error": "Your vehicle is not yet approved by admin. Please wait for approval before accepting missions."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Capacity Validation logic
        try:
            capacity = float(selected_vehicle.get('capacity', 0))
            total_req = float(delivery.total_quantity)
            if capacity < total_req:
                return Response({
                    "error": f"Payload Violation: Chosen vehicle capacity ({capacity}) < Mission payload ({total_req})."
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
             return Response({"error": "Logic Error: Unable to verify payload compatibility."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Successful Assignment
        delivery.transporter = request.user
        delivery.status = DeliveryStatusChoices.ASSIGNED
        delivery.assigned_vehicle_id = str(vehicle_id)
        delivery.assigned_vehicle_info = {
            "plate": selected_vehicle.get('plate'),
            "model": selected_vehicle.get('model'),
            "capacity": selected_vehicle.get('capacity'),
            "type": selected_vehicle.get('type')
        }
        # ── COMMITMENT ENFORCEMENT: stamp acceptance time ─────────────────
        delivery.accepted_at = timezone.now()
        delivery.inactivity_flag = False
        delivery.save()

        # Update order status
        order = delivery.order
        order.delivery_status = OrderDeliveryStatus.AWAITING_PICKUP
        if order.status == OrderStatusChoices.PENDING or order.status == OrderStatusChoices.CONFIRMED:
             order.status = OrderStatusChoices.CONFIRMED
        delivery.save()
        order.save()

        # Record timeline
        order.add_timeline_entry(
            status=OrderDeliveryStatus.AWAITING_PICKUP,
            actor=request.user,
            note=f"Transporter confirmed using vehicle: {delivery.assigned_vehicle_info.get('model')} ({delivery.assigned_vehicle_info.get('plate')}). 2-hour activation window started."
        )

        # Notify transporter of activation window
        try:
            from apps.notifications.models import create_notification, NotificationType
            create_notification(
                user=request.user,
                message=f"Mission #{delivery.id} accepted. You have 2 hours to depart or relinquish the mission. Inactivity will result in trust score deduction.",
                notif_type=NotificationType.DELIVERY_COMPLETED,
                link=f"/transporter-dashboard"
            )
        except Exception:
            pass

        return Response(DeliveryRequestSerializer(delivery).data)

    @action(detail=True, methods=['post'])
    def start_mission(self, request, pk=None):
        """
        Transporter clicks "Departing to Farm".
        Transitions ASSIGNED → PICKED_UP and clears the 2-hour inactivity risk.
        """
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Not your assigned delivery."}, status=status.HTTP_403_FORBIDDEN)

        if delivery.status != DeliveryStatusChoices.ASSIGNED:
            return Response(
                {"error": f"Mission cannot be started from status '{delivery.status}'. It must be in 'assigned' state."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            delivery.status = DeliveryStatusChoices.PICKED_UP
            delivery.inactivity_flag = False  # Mission is active — no penalty
            delivery.save()

            order = delivery.order
            order.delivery_status = OrderDeliveryStatus.PICKED_UP
            order.save()

            order.add_timeline_entry(
                status=OrderDeliveryStatus.PICKED_UP,
                actor=request.user,
                note="Transporter departed to farm. Mission is now active."
            )

        return Response(DeliveryRequestSerializer(delivery).data)

    @action(detail=True, methods=['post'])
    def relinquish(self, request, pk=None):
        """
        Transporter formally releases the mission before departure.
        Requires a reason text OR a proof image (or both).
        Resets mission to OPEN for other transporters.
        Deducts 15 trust score points. Suspends if below threshold.
        """
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Not your assigned delivery."}, status=status.HTTP_403_FORBIDDEN)

        if delivery.status != DeliveryStatusChoices.ASSIGNED:
            return Response(
                {"error": "You can only relinquish a mission while it is in 'assigned' state."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '').strip()
        proof_file = request.FILES.get('proof')

        if not reason and not proof_file:
            return Response(
                {"error": "You must provide a written reason or upload proof (e.g. vehicle breakdown photo) to relinquish this mission."},
                status=status.HTTP_400_BAD_REQUEST
            )

        MAX_CANCELLATIONS = 3
        SUSPENSION_DAYS = 3

        with transaction.atomic():
            # ── Save relinquishment record ──────────────────────────────────
            delivery.relinquish_reason = reason
            delivery.relinquished_at = timezone.now()
            if proof_file:
                delivery.relinquish_proof = proof_file

            # ── Reset mission to marketplace ────────────────────────────────
            delivery.transporter = None
            delivery.status = DeliveryStatusChoices.OPEN
            delivery.accepted_at = None
            delivery.assigned_vehicle_id = None
            delivery.assigned_vehicle_info = {}
            delivery.inactivity_flag = False
            delivery.save()

            # ── Apply cancellation strike ────────────────────────────────────
            transporter = request.user
            transporter.cancellation_count += 1

            # ── Auto-suspend if limit exceeded ──────────────────────────────
            suspension_applied = False
            if transporter.cancellation_count > MAX_CANCELLATIONS:
                transporter.suspended_until = timezone.now() + timezone.timedelta(days=SUSPENSION_DAYS)
                transporter.suspension_reason = (
                    "Marketplace access temporarily suspended due to repeated mission cancellations."
                )
                suspension_applied = True

            transporter.save()

            # ── Order timeline log ──────────────────────────────────────────
            order = delivery.order
            order.add_timeline_entry(
                status="RELINQUISHED",
                actor=request.user,
                note=f"Transporter relinquished mission. Reason: {reason or 'See proof image'}. Mission returned to marketplace."
            )

            # ── Notify admin ────────────────────────────────────────────────
            try:
                from apps.notifications.models import create_notification, NotificationType
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admins = User.objects.filter(role='admin')
                for admin in admins:
                    create_notification(
                        user=admin,
                        message=f"Mission #{delivery.id} was relinquished by {transporter.full_name}. Reason: {reason or 'Proof provided'}. Mission is back in marketplace.",
                        notif_type=NotificationType.DELIVERY_COMPLETED,
                        link=f"/admin-dashboard"
                    )
                # Notify transporter about penalty
                penalty_msg = f"Mission #{delivery.id} relinquished. Strike {transporter.cancellation_count}/{MAX_CANCELLATIONS}."
                if suspension_applied:
                    penalty_msg = "Marketplace access temporarily suspended due to repeated mission cancellations."
                create_notification(
                    user=transporter,
                    message=penalty_msg,
                    notif_type=NotificationType.DELIVERY_COMPLETED,
                    link=f"/transporter-dashboard"
                )
            except Exception:
                pass

        return Response({
            "message": "Mission successfully relinquished and returned to marketplace.",
            "cancellation_count": transporter.cancellation_count,
            "suspended": suspension_applied,
            "suspended_until": transporter.suspended_until.isoformat() if suspension_applied else None,
        })


    @action(detail=True, methods=['post'], serializer_class=DeliveryStatusUpdateSerializer)
    def update_status(self, request, pk=None):
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Not your assigned delivery."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = DeliveryStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            delivery.status = new_status
            delivery.save()
            
            # Sync with Order
            order = delivery.order
            if new_status == DeliveryStatusChoices.PICKED_UP:
                order.delivery_status = OrderDeliveryStatus.PICKED_UP
            elif new_status == DeliveryStatusChoices.IN_TRANSIT:
                order.delivery_status = OrderDeliveryStatus.IN_TRANSIT
            elif new_status == DeliveryStatusChoices.DELIVERED:
                order.delivery_status = OrderDeliveryStatus.DELIVERED
                order.status = OrderStatusChoices.CONFIRMED # Keep confirmed but delivered
            
            order.save()
            
            # Record timeline
            order.add_timeline_entry(
                status=order.delivery_status,
                actor=request.user
            )

            # Trigger notifications (keeping them simplified)
            try:
                from apps.notifications.models import create_notification, NotificationType
                if new_status == DeliveryStatusChoices.DELIVERED:
                    create_notification(
                        user=order.buyer,
                        message=f"Order #{order.id} has been delivered!",
                        notif_type=NotificationType.DELIVERY_COMPLETED,
                        link=f"/buyer-dashboard/orders"
                    )
            except ImportError:
                pass

            return Response(DeliveryRequestSerializer(delivery).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], serializer_class=ProofOfDeliverySerializer)
    def complete_with_pod(self, request, pk=None):
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Not your assigned delivery."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProofOfDeliverySerializer(data=request.data)
        if serializer.is_valid():
            delivery.pod_recipient_name = serializer.validated_data.get('pod_recipient_name')
            delivery.pod_notes = serializer.validated_data.get('pod_notes', '')
            if 'pod_photo' in request.FILES:
                delivery.pod_photo = request.FILES['pod_photo']
            
            delivery.pod_completed_at = timezone.now()
            delivery.status = DeliveryStatusChoices.DELIVERED
            delivery.save()
            
            # Sync with Order
            order = delivery.order
            order.delivery_status = OrderDeliveryStatus.DELIVERED
            order.status = OrderStatusChoices.CONFIRMED
            order.save()

            # Record timeline
            order.add_timeline_entry(
                status=OrderDeliveryStatus.DELIVERED,
                actor=request.user,
                note=f"Recipient: {delivery.pod_recipient_name}. Notes: {delivery.pod_notes}"
            )
            
            # Notifications
            try:
                from apps.notifications.models import create_notification, NotificationType
                create_notification(
                    user=order.buyer,
                    message=f"Order #{order.id} has been delivered! Proof of delivery is available.",
                    notif_type=NotificationType.DELIVERY_COMPLETED,
                    link=f"/buyer-dashboard/orders"
                )
            except Exception:
                pass

            return Response(DeliveryRequestSerializer(delivery).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def refuse(self, request, pk=None):
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Unauthorized access."}, status=status.HTTP_403_FORBIDDEN)
            
        if delivery.status not in [DeliveryStatusChoices.PICKED_UP, DeliveryStatusChoices.IN_TRANSIT]:
            return Response({"error": "Refusal can only occur after pickup."}, status=status.HTTP_400_BAD_REQUEST)
            
        reason = request.data.get('reason')
        note = request.data.get('note', '')
        
        if not reason:
            return Response({"error": "A refusal reason is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            # Update delivery
            delivery.status = DeliveryStatusChoices.RETURN_IN_PROGRESS
            delivery.save()
            
            # Update order
            order = delivery.order
            order.status = OrderStatusChoices.REFUSED_DELIVERY
            order.delivery_status = OrderDeliveryStatus.RETURN_IN_PROGRESS
            order.refusal_reason = reason
            order.refusal_note = note
            order.refused_at = timezone.now()
            order.save()
            
            # Record timeline
            order.add_timeline_entry(
                status=OrderDeliveryStatus.REFUSED_DELIVERY,
                actor=request.user,
                note=f"Reason: {reason}. Details: {note}"
            )
            
        return Response(DeliveryRequestSerializer(delivery).data)

    @action(detail=True, methods=['post'])
    def mark_returned(self, request, pk=None):
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Unauthorized access."}, status=status.HTTP_403_FORBIDDEN)
            
        if delivery.status != DeliveryStatusChoices.RETURN_IN_PROGRESS:
            return Response({"error": "Return flow not active for this mission."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            # Update delivery
            delivery.status = DeliveryStatusChoices.RETURNED
            delivery.save()
            
            # Update order & record timeline
            order = delivery.order
            order.status = OrderStatusChoices.RETURNED
            order.delivery_status = OrderDeliveryStatus.RETURNED
            order.returned_at = timezone.now()
            order.save()
            
            order.add_timeline_entry(
                status=OrderDeliveryStatus.RETURNED,
                actor=request.user,
                note="Goods returned to farmer. Cycle closed."
            )
            
            # ── STOCK RESTORATION ──
            for item in order.items.all():
                product = item.product
                if product:
                    # Increment stock
                    product.stock += item.quantity
                    product.save()
                    
                    # Log stock increase
                    order.add_timeline_entry(
                        status="STOCK_RESTORED",
                        note=f"Restored {item.quantity} {getattr(product, 'unit', 'units')} for '{product.title}'"
                    )
            
        return Response(DeliveryRequestSerializer(delivery).data)


# ── Vehicle CRUD ViewSet ──────────────────────────────────────────────────
class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsTransporterRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)  # status defaults to PENDING

    def perform_update(self, serializer):
        vehicle = self.get_object()
        # If transporter edits a REJECTED vehicle, resubmit it for review
        if vehicle.status == 'REJECTED':
            serializer.save(status='PENDING', rejection_reason='')
        else:
            serializer.save()
