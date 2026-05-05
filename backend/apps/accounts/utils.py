import random
import string
from django.core.mail import send_mail
from django.conf import settings
from .models import OTPCode

def generate_otp():
    """Generate a random 6-digit OTP code."""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(user):
    """Generate and send OTP email to user."""
    if not getattr(settings, 'OTP_ENABLED', True):
        return True

    code = generate_otp()
    
    # Save code in database
    OTPCode.objects.create(user=user, code=code)
    
    subject = "Verify your AgriGov Market Account"
    message = f"Hello {user.full_name},\n\nYour verification code is: {code}\n\nPlease enter this code to complete your registration.\n\nThank you!"
    from_email = settings.DEFAULT_FROM_EMAIL
    
    try:
        send_mail(
            subject,
            message,
            from_email,
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
