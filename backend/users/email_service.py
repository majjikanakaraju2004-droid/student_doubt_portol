"""Outbound email helpers for Synycs."""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


def send_password_reset_email(*, user, recipient: str, reset_link: str) -> None:
    display_name = user.full_name or user.username
    subject = 'Synycs — Reset your password'

    text_body = (
        f'Hello {display_name},\n\n'
        f'You requested a password reset for your Synycs account.\n\n'
        f'Username: {user.username}\n\n'
        f'Open this link to set a new password (link expires after use):\n{reset_link}\n\n'
        f'If you did not request this, ignore this email.\n\n'
        f'— Synycs Team'
    )

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">Synycs — Password reset</h2>
      <p>Hello <strong>{display_name}</strong>,</p>
      <p>You requested a password reset for your Synycs account.</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p style="margin: 24px 0;">
        <a href="{reset_link}"
           style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset my password
        </a>
      </p>
      <p style="font-size: 12px; color: #64748b;">Or copy this link:<br><a href="{reset_link}">{reset_link}</a></p>
      <p style="font-size: 12px; color: #64748b;">If you did not request this, you can ignore this email.</p>
    </div>
    """

    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=[recipient],
    )
    message.attach_alternative(html_body, 'text/html')
    
    import threading
    import os
    
    def send_email_async():
        log_path = os.path.join(settings.BASE_DIR, 'email_debug.txt')
        try:
            message.send(fail_silently=False)
            with open(log_path, 'w') as f:
                f.write("Success: Email sent without errors")
        except Exception as e:
            with open(log_path, 'w') as f:
                f.write(f"SMTP Error: {e}")
            print(f"[ASYNC EMAIL ERROR] Failed to send password reset email: {e}")
            
    threading.Thread(target=send_email_async, daemon=True).start()

