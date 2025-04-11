#!/bin/sh

# Vérifier si la base de données est accessible
echo "Checking if the database exists..."

if flask db upgrade; then
    echo "✅ The database is up to date."
else
    echo "⚠️ The database does not seem to exist. Attempting to create it..."

    if [ ! -d "migrations" ]; then
        flask db init
    fi

    flask db migrate -m "Initial migration" && flask db upgrade

    if [ $? -eq 0 ]; then
        echo "✅ Database created and migrations applied successfully."
    else
        echo "❌ Failed to create the database."
        exit 1
    fi
fi

echo "🚀 Starting the application..."
flask --app app.py --debug run -h 0.0.0.0 -p 5000