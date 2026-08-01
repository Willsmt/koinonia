#!/bin/sh
set -e

echo "Aplicando migrations..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "Subindo Gunicorn..."
exec gunicorn core.wsgi:application \
    --bind "0.0.0.0:${PORT:-10000}" \
    --workers 1 \
    --log-file -
