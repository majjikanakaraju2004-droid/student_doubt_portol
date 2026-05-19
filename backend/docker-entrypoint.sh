#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "==> Waiting for database connection..."
# Optional: Wait-for-it pattern can go here if needed, but depends_on healthcheck handles it cleanly in docker-compose.

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static assets..."
python manage.py collectstatic --noinput

echo "==> Starting application server..."
# Using Gunicorn in production if available, falling back to runserver in debug/dev container
if pip show gunicorn > /dev/null 2>&1; then
    echo "==> Booting Gunicorn server..."
    exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
else
    echo "==> Gunicorn not installed. Booting Django development server..."
    exec python manage.py runserver 0.0.0.0:8000
fi
