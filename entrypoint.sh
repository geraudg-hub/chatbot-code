#!/bin/sh

# Check if the database exists
echo "Checking if the database exists..."

if flask db upgrade; then
    echo "✅ The database is up to date."
else
    echo "⚠️  The database does not seem to exist. Attempting to create it..."
    
    # Initialize the database
    flask db init && flask db migrate -m "Initial migration" && flask db upgrade

    if [ $? -eq 0 ]; then
        echo "✅ Database created and migrations applied successfully."
    else
        echo "❌ Failed to create the database."
        exit 1
    fi
fi

# Start the Flask application
echo "🚀 Starting the application..."
flask --app app.py --debug run -h 0.0.0.0 -p 5000
