"""
Django settings — production-ready configuration via environment variables.
Copy `.env.example` to `.env` and adjust values before running.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')
# Optional: email.env from setup-email.ps1 (overrides email keys in .env)
load_dotenv(BASE_DIR / 'email.env', override=True)

SECRET_KEY = os.getenv(
    'SECRET_KEY',
    'django-insecure-dev-only-change-in-production',
)

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if h.strip()
]
ALLOWED_HOSTS.extend(['.onrender.com', 'localhost', '127.0.0.1'])

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',')
    if o.strip()
]

# Ensure the production Vercel frontend is always allowed
CORS_ALLOWED_ORIGINS.extend([
    'https://student-doubt-portol.vercel.app',
    'http://student-doubt-portol.vercel.app',
])

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

CSRF_TRUSTED_ORIGINS = [
    'https://student-doubt-portol.vercel.app',
    'https://student-doubt-portol.onrender.com',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'cloudinary_storage',
    'cloudinary',
    'corsheaders',
    'users',
    'doubts',
    'responses',
    'notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Detect Railway or local MySQL variables
DB_NAME = os.getenv('MYSQLDATABASE') or os.getenv('MYSQL_DATABASE') or os.getenv('DB_NAME', 'doubt_system')
DB_USER = os.getenv('MYSQLUSER') or os.getenv('MYSQL_USER') or os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('MYSQLPASSWORD') or os.getenv('MYSQL_PASSWORD') or os.getenv('DB_PASSWORD', 'root')
DB_HOST = os.getenv('MYSQLHOST') or os.getenv('MYSQL_HOST') or os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('MYSQLPORT') or os.getenv('MYSQL_PORT') or os.getenv('DB_PORT', '3306')

# Self-healing: automatically route internal Railway hosts to their public proxy when outside Railway
if DB_HOST == 'mysql.railway.internal' or 'railway.internal' in DB_HOST:
    DB_HOST = 'switchyard.proxy.rlwy.net'
    DB_PORT = '57974'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Cloudinary configuration
if os.getenv('CLOUDINARY_URL'):
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Business rules
DOUBT_SLA_HOURS = int(os.getenv('DOUBT_SLA_HOURS', '24'))
AI_SIMILARITY_THRESHOLD = float(os.getenv('AI_SIMILARITY_THRESHOLD', '0.6'))

# Email — only configured when credentials are provided
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER') or 'majjikanakaraju2004@gmail.com'
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD') or 'rlqr xuyi imak ojdv'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'noreply@synycs.local')
FRONTEND_URL = os.getenv('FRONTEND_URL') or 'http://localhost:5173'

EMAIL_IS_CONFIGURED = bool(EMAIL_HOST_USER and EMAIL_HOST_PASSWORD)
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '30'))

if EMAIL_IS_CONFIGURED:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:

    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
