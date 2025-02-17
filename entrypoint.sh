#!/bin/sh

# Appliquer les migrations automatiquement au démarrage
echo "Exécution des migrations..."
flask db upgrade

# Lancer l'application Flask
echo "Démarrage de l'application..."
flask --app app.py --debug run -h 0.0.0.0 -p 5000
