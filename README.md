# Chatbot – Technical Documentation

This project is a **smart chatbot** integrated into a web interface, built with **Flask**, using a **MySQL** database and **Azure OpenAI** API. It is containerized with Docker and ready for deployment in staging or production environments.

---

## Staging Environment

The chatbot is currently deployed at:  
🔗 [https://chatbot.bunkerstaging.com](https://chatbot.bunkerstaging.com)

---

## Environment Variables

Below is the list of environment variables required for the application to function properly. They should be defined in a `.env` file.

### Core Variables

| Variable Name              | Description                                      |
|----------------------------|--------------------------------------------------|
| `DEBUG`                    | Set to `1` to enable development/debug mode      |
| `AZURE_OPENAI_API_KEY`     | Azure OpenAI API key                             |
| `AZURE_OPENAI_ENDPOINT`    | Azure OpenAI endpoint URL                        |
| `AZURE_OPENAI_ASSISTANT_ID`| ID of the assistant used with OpenAI             |
| `DEPLOYMENT_NAME`          | Name of the deployment configuration             |
| `MYSQL_USER`               | MySQL database user                              |
| `MYSQL_PASSWORD`           | MySQL database password                          |
| `MYSQL_DB`                 | MySQL database name                              |
| `MYSQL_HOST`               | MySQL host address                               |
| `MYSQL_PORT`               | MySQL port number                                |
| `BASIC_AUTH_USERNAME`      | Basic auth username for access protection (admin)|
| `BASIC_AUTH_PASSWORD`      | Basic auth password (admin)                      |
| `BASIC_AUTH_REALM`         | Realm name used in basic auth header (admin)     |

### Additional Variables

| Variable Name              | Description                                      |
|----------------------------|--------------------------------------------------|
| `MAX_SESSION_DURATION`     | Max duration of a user session (in seconds)      |
| `MAX_CHARACTERS`           | Max total characters in a session                |
| `MAX_MESSAGE_CHARACTERS`   | Max characters per message                       |
| `LOG_LEVEL`                | Logging level (`INFO`, `DEBUG`, `ERROR`, etc.)   |

### Beta Features

| Variable Name              | Description                                      |
|----------------------------|--------------------------------------------------|
| `BETA_PASSWORD`            | Password required to access beta version         |
| `SECRET_KEY`               | Flask secret key for session management          |

---

## Project Stack

- **Backend**: Python (Flask)
- **Frontend**: HTML, CSS, Bootstrap, DataTables
- **Database**: MySQL
- **External API**: Azure OpenAI
- **Containerization**: Docker
- **Version Control**: Git + GitHub

---

## Deployment & Usage

1. Clone the repository
2. Create and configure your `.env` file using the variables above
3. Build and run the containers using Docker Compose
4. Access the chatbot via the staging URL or your local instance

---

## Folder Structure

chatbot/
│
├── .github/                # GitHub-related configuration (actions, workflows)
├── __pycache__/            # Python bytecode cache
├── db-init/                # Initial database setup scripts
│   └── init.sql            # SQL script: creates DB, user, grants rights
│
├── migrations/             # Alembic migration files
│
├── models/                 # SQLAlchemy models
│   └── models.py
│
├── routes/                 # Flask route files
│   └── admin_routes.py     # Routes for the admin interface
│
├── static/                 # Static files (images, JS)
│   ├── images/             # Images for chatbot interface
│   └── js/                 # JavaScript files
│       ├── admin.js
│       ├── chatbot.js      # Main chatbot logic
│       ├── messages.js
│       └── statistiques.js
│
├── templates/              # HTML templates
│   ├── admin_dashboard.html
│   ├── header.html
│   ├── login.html
│   ├── messages.html
│   ├── statistiques.html
│   └── test.html
│
├── test/                   # Unit and integration tests
│   └── test_app.py
│
├── .env                    # Environment variables (not committed)
├── .gitignore              # Git ignore rules
├── .trivyignore            # Ignore rules for Trivy security scanner
├── .alembic.ini            # Alembic configuration file
├── app.log                 # Log file
├── app.py                  # Main Flask application entry point
├── config.py               # Configuration file (env handling, security, etc.)
├── docker-compose.yml      # Docker Compose file
├── Dockerfile              # Dockerfile for containerization
├── entrypoint.sh           # Script for DB migration & startup
├── extensions.py           # SQLAlchemy & Migrate initialization
├── openai_client.py        # Integration with Azure OpenAI API
├── README.md               # Project documentation (you’re here)
└── requirements.txt        # Python dependencies

## 🛠 Future Improvements

- Admin dashboard enhancements
- NLP fine-tuning with user feedback
- Export conversation history
- Improved error handling and reporting

---

## 📄 License

MIT License – feel free to use, modify, and distribute with attribution.