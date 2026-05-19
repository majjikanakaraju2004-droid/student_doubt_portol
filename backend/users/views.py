from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .email_service import send_password_reset_email
from .models import User
from .serializers import ProfileUpdateSerializer, RegisterSerializer, serialize_user


def find_user_by_email(email):
    email = (email or '').strip()
    if not email:
        return None
    return User.objects.filter(
        Q(email__iexact=email) | Q(contact_email__iexact=email)
    ).first()


def build_reset_link(user):
    frontend = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    username = quote(user.username, safe='')
    return f'{frontend}/reset-password?uid={uid}&token={token}&username={username}'

# Register API

class RegisterView(generics.CreateAPIView):

    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


# Login API

class LoginView(APIView):

    permission_classes = [AllowAny]
    
    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role')

        user = authenticate(
            username=username,
            password=password
        )

        if user is not None:

            if user.role == role:

                return Response({
                    'message': 'Login Success',
                    'role': user.role,
                    'user': serialize_user(user),
                })

            else:

                return Response({
                    'message': 'Role Mismatch',
                    'account_role': user.role,
                }, status=400)

        return Response({
            'message': 'Invalid Credentials'
        }, status=400)


class ProfileMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'user': serialize_user(request.user)})

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        if user.email and not user.contact_email:
            user.contact_email = user.email
            user.save(update_fields=['contact_email'])

        return Response({
            'message': 'Profile updated successfully',
            'user': serialize_user(user),
        })


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        if not username or not email:
            return Response(
                {'message': 'Username and registered email are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(username__iexact=username).first()
        generic_ok = {
            'message': (
                'If an account exists for this username and email, '
                'password reset instructions have been sent.'
            ),
            'email_sent': False,
        }

        if not user or user.is_superuser:
            return Response(generic_ok)

        user_email = (user.email or '').strip().lower()
        user_contact_email = (user.contact_email or '').strip().lower()
        input_email = email.lower()

        if input_email != user_email and input_email != user_contact_email:
            return Response(
                {
                    'message': (
                        'Username does not match this email address. '
                        'Enter the username and email registered on your account.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient = (user.contact_email or user.email or '').strip()
        if not recipient:
            return Response(
                {
                    'message': (
                        'This account has no email on file. '
                        'Ask your administrator to add an email to your profile.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_link = build_reset_link(user)

        try:
            send_password_reset_email(
                user=user,
                recipient=recipient,
                reset_link=reset_link,
            )
        except Exception as exc:
            print(f'[PASSWORD RESET ERROR] {exc}')
            # If real SMTP is configured and failed, let the developer know and fallback in DEBUG mode
            if getattr(settings, 'EMAIL_IS_CONFIGURED', False) and settings.DEBUG:
                return Response({
                    'message': (
                        'Email could not be sent (check SMTP settings). '
                        'Use the reset link below to continue in development mode.'
                    ),
                    'email_sent': False,
                    'reset_link': reset_link,
                    'recipient': recipient,
                    'username': user.username,
                    'error': str(exc),
                }, status=status.HTTP_200_OK)

            # If there's a connection failure or real error when SMTP is expected
            if getattr(settings, 'EMAIL_IS_CONFIGURED', False):
                return Response(
                    {
                        'message': (
                            'Unable to send reset email due to an SMTP/server error. '
                            'Please verify EMAIL_HOST_USER / EMAIL_HOST_PASSWORD.'
                        )
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        # Success response (will trigger standard success toast in frontend).
        # In development console backend, this logs to the python terminal server console.
        return Response({
            'message': (
                f'Password reset link sent to {recipient} for user "{user.username}". '
                'Check your inbox and spam folder.'
            ),
            'email_sent': True,
            'username': user.username,
        })


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        confirm = request.data.get('confirm_password', password)

        if not uid or not token or not password:
            return Response(
                {'message': 'uid, token, and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != confirm:
            return Response(
                {'message': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {'message': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'message': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'message': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if username and user.username.lower() != username.lower():
            return Response(
                {
                    'message': (
                        f'This reset link is for user "{user.username}", not "{username}". '
                        'Use the correct link or request a new one.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save(update_fields=['password'])

        return Response({
            'message': f'Password reset successful for "{user.username}". You can log in now.',
            'username': user.username,
        })


class AdminLoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(
            username=username,
            password=password
        )

        if user is not None and user.is_superuser:

            refresh = RefreshToken.for_user(user)

            return Response({

                'message': 'Admin Login Success',

                'access': str(refresh.access_token),

                'refresh': str(refresh),

                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': user.full_name if hasattr(user, 'full_name') else user.username
                }

            })

        return Response({
            'message': 'Invalid Admin Credentials'
        }, status=400)


class CreateFacultyView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        full_name = request.data.get('full_name')
        employee_id = request.data.get('employee_id')
        department = request.data.get('department')
        designation = request.data.get('designation')
        subject_expertise = request.data.get('subject_expertise')
        mobile = request.data.get('mobile')

        if User.objects.filter(username=username).exists():

            return Response({
                'message': 'Faculty username already exists'
            }, status=400)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role='teacher',
            full_name=full_name,
            employee_id=employee_id,
            department=department,
            designation=designation,
            subject_expertise=subject_expertise,
            mobile=mobile,
            contact_email=email,
            account_status='Active'
        )

        return Response({
            'message': 'Faculty Created Successfully',
            'faculty': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'employee_id': user.employee_id,
                'department': user.department,
                'designation': user.designation,
                'subject_expertise': user.subject_expertise,
                'mobile': user.mobile,
                'role': user.role,
            }
        })


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):

        from doubts.models import Doubt

        students = User.objects.filter(role='student', is_superuser=False).count()
        teachers = User.objects.filter(role='teacher', is_superuser=False).count()
        total_users = User.objects.count()

        total_doubts = Doubt.objects.count()
        pending_doubts = Doubt.objects.filter(status='pending').count()
        answered_doubts = Doubt.objects.filter(status='solved').count()

        answered_doubt_objects = Doubt.objects.filter(
            status='solved',
            resolved_at__isnull=False
        )

        total_minutes = 0

        for doubt in answered_doubt_objects:
            resolution_time = doubt.resolved_at - doubt.created_at
            total_minutes += resolution_time.total_seconds() / 60

        average_resolution_time = 0

        if answered_doubt_objects.count() > 0:
            average_resolution_time = round(
                total_minutes / answered_doubt_objects.count(),
                2
            )

        common_topics = (
            Doubt.objects
            .values('topic')
            .annotate(count=Count('topic'))
            .order_by('-count')[:5]
        )
        
        sla_risk_doubts = Doubt.objects.filter(
            status='pending',
            created_at__lte=timezone.now() - timedelta(hours=24)
        ).count()

        return Response({
            'students': students,
            'teachers': teachers,
            'total_users': total_users,
            'total_doubts': total_doubts,
            'pending_doubts': pending_doubts,
            'answered_doubts': answered_doubts,
            'average_resolution_time': average_resolution_time,
            'common_topics': list(common_topics),
            'sla_risk_doubts': sla_risk_doubts, 
        })


class ListUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serialized = [serialize_user(u) for u in users]
        return Response(serialized)


class DeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.is_superuser:
                return Response(
                    {'message': 'Cannot delete superusers'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user_role = user.role
            user_name = user.username
            user.delete()
            return Response({
                'message': f'{user_role.capitalize()} account "{user_name}" deleted successfully'
            })
        except User.DoesNotExist:
            return Response(
                {'message': 'User not found'},
                status=status.HTTP_404_NOT_FOUND,
            )