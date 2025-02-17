FROM python:3.12-alpine

# Créer un utilisateur non-root
RUN adduser -h /opt/app -D -u 5000 www

# Installer les dépendances
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm -f /tmp/requirements.txt

# Copier les fichiers sources
COPY *.py /opt/app
COPY openai_client.py /opt/app
COPY templates /opt/app/templates
COPY static /opt/app/static
COPY routes /opt/app/routes
COPY models /opt/app/models

# Copier le script d'entrée
COPY entrypoint.sh /opt/app/entrypoint.sh
RUN chmod +x /opt/app/entrypoint.sh

# Exposer le port 5000
EXPOSE 5000

# Point d'entrée
USER www
WORKDIR /opt/app
ENTRYPOINT ["/opt/app/entrypoint.sh"]
CMD ["flask", "--app", "app.py", "--debug", "run", "-h", "0.0.0.0", "-p", "5000"]
