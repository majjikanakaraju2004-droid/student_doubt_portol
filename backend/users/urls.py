from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ProfileMeView,
    ForgotPasswordView,
    ResetPasswordView,
    AdminLoginView,
    CreateFacultyView,
    AdminDashboardView,
    ListUsersView,
    DeleteUserView,
    EmailDebugView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [

    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('me/', ProfileMeView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view()),
    path('reset-password/', ResetPasswordView.as_view()),
    path('email-debug/', EmailDebugView.as_view()),
    path('admin-login/', AdminLoginView.as_view()),
    path('create-faculty/', CreateFacultyView.as_view()),
    path('admin-dashboard/', AdminDashboardView.as_view()),
    path('list-users/', ListUsersView.as_view()),
    path('delete-user/<int:pk>/', DeleteUserView.as_view()),
    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),

]