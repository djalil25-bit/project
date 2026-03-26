import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='admin@agrigov.com').exists():
    User.objects.create_superuser('admin@agrigov.com', 'admin', full_name='System Admin')
    print('Superuser created successfully: admin@agrigov.com / admin')
else:
    print('Superuser already exists.')
