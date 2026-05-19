from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Send a test email to verify SMTP settings in .env / email.env'

    def add_arguments(self, parser):
        parser.add_argument(
            'recipient',
            nargs='?',
            help='Email address to send the test message to (defaults to DEFAULT_FROM_EMAIL)',
        )

    def handle(self, *args, **options):
        if not getattr(settings, 'EMAIL_IS_CONFIGURED', False):
            raise CommandError(
                'SMTP is not configured. Run setup-email.ps1 or set EMAIL_HOST_USER and '
                'EMAIL_HOST_PASSWORD in backend/.env or backend/email.env'
            )

        recipient = options['recipient'] or settings.EMAIL_HOST_USER
        if not recipient:
            raise CommandError('Provide a recipient email or set EMAIL_HOST_USER.')

        send_mail(
            'Synycs — Test email',
            'If you received this message, password reset emails will work.',
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        self.stdout.write(self.style.SUCCESS(f'Test email sent to {recipient}'))
