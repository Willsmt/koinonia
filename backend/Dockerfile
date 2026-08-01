FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==2.4.1

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --without dev

COPY . .
RUN chmod +x entrypoint.sh

RUN useradd --create-home django \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R django:django /app
USER django

EXPOSE 10000

ENTRYPOINT ["./entrypoint.sh"]
