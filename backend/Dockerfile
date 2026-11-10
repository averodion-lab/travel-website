FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV APP_ENV=production PORT=8080
# Cloud Run sends requests to $PORT.
CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 60 wsgi:app
