FROM python:3.12-alpine

# Create non-root user
RUN adduser -h /opt/app -D -u 5000 www

# Dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm -f /tmp/requirements.txt

# Copy sources
COPY *.py /opt/app
COPY openai_client.py /opt/app
COPY templates /opt/app/templates
COPY static /opt/app/static
COPY routes /opt/app/routes
COPY models /opt/app/models
COPY migrations /opt/app/migrations

# Copier script
COPY entrypoint.sh /opt/app/entrypoint.sh
RUN chmod +x /opt/app/entrypoint.sh

# Expose port 5000
EXPOSE 5000

# Entry point
USER www
WORKDIR /opt/app
ENTRYPOINT ["/bin/sh", "/opt/app/entrypoint.sh"]
