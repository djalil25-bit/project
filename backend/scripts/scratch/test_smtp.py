import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Set up Django environment
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_email():
    print("Testing SMTP connection...")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    
    try:
        html_content = "<h1>Institutional Test</h1><p>Testing your personal email.</p>"
        send_mail(
            'Test to Djalil',
            'Test Body',
            settings.DEFAULT_FROM_EMAIL,
            ['djalilbendilmi25@gmail.com'],
            html_message=html_content,
            fail_silently=False,
        )
        print("SUCCESS: Email sent to Djalil successfully!")
    except Exception as e:
        print(f"ERROR: Failed to send email: {e}")

if __name__ == "__main__":
    test_email()
