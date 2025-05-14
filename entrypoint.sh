#!/bin/sh
set -e

# Checking changes
if [ ! -d "migrations" ]; then
    echo "⚙️ Initialisation des migrations"
    flask db init
    flask db migrate -m "Initial"
fi

# Applying changes
flask db upgrade

echo "🚀 Démarrage de l'application..."
exec flask run -h 0.0.0.0 -p 5000