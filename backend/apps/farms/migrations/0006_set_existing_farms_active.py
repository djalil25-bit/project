from django.db import migrations


def set_existing_farms_active(apps, schema_editor):
    """Idempotent: set all existing farms with no status to ACTIVE."""
    Farm = apps.get_model('farms', 'Farm')
    Farm.objects.filter(status='PENDING').update(status='ACTIVE')


def reverse_func(apps, schema_editor):
    """No-op reverse — we don't want to reset farms to PENDING."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('farms', '0005_farm_rejection_reason_farm_reviewed_at_and_more'),
    ]

    operations = [
        migrations.RunPython(set_existing_farms_active, reverse_func),
    ]
