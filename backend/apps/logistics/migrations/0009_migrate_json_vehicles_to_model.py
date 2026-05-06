from django.db import migrations


def migrate_json_vehicles_to_model(apps, schema_editor):
    """
    Idempotent migration: copies vehicle data from User.vehicles JSON array
    into the new Vehicle model. Existing Vehicle records (by owner+plate) are skipped.
    """
    User = apps.get_model('accounts', 'User')
    Vehicle = apps.get_model('logistics', 'Vehicle')

    transporters = User.objects.filter(role='transporter')
    for user in transporters:
        vehicles_json = user.vehicles or []
        for v in vehicles_json:
            plate = v.get('plate', '').strip()
            if not plate:
                continue

            # Idempotent: skip if already migrated
            if Vehicle.objects.filter(owner=user, plate=plate).exists():
                continue

            Vehicle.objects.create(
                owner=user,
                plate=plate,
                model=v.get('model', ''),
                capacity=str(v.get('capacity', '')),
                type=v.get('type', 'Truck'),
                fuelType=v.get('fuelType', 'Diesel'),
                is_active=v.get('is_active', True) if v.get('is_active') is not None else True,
                status='ACTIVE',  # Existing vehicles are trusted
            )


def reverse_func(apps, schema_editor):
    """Reverse: delete migrated vehicles. JSON is preserved on User."""
    Vehicle = apps.get_model('logistics', 'Vehicle')
    Vehicle.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('logistics', '0008_vehicle'),
        ('accounts', '0006_user_is_email_verified_otpcode'),
    ]

    operations = [
        migrations.RunPython(migrate_json_vehicles_to_model, reverse_func),
    ]
