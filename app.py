import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from openai_client import bot_response, create_new_thread
from routes.admin_routes import admin_bp
from extensions import db, migrate
from models.models import Thread, Message
from config import Config
from flask_basicauth import BasicAuth

# Charger les variables d'environnement
load_dotenv()

# Initialiser Flask
app = Flask(__name__)

# Configuration de la base de données
class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@"
        f"{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DB')}"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

app.config.from_object(Config)

app.config['BASIC_AUTH_USERNAME'] = os.getenv('BASIC_AUTH_USERNAME')
app.config['BASIC_AUTH_PASSWORD'] = os.getenv('BASIC_AUTH_PASSWORD')

# Initialisation des extensions
db.init_app(app)
migrate.init_app(app, db)  # Initialisation de Migrate

basic_auth = BasicAuth(app)

# Enregistrer le blueprint de l'admin
app.register_blueprint(admin_bp, url_prefix='/admin')

with app.app_context():
    db.session.remove()
    db.engine.dispose()

# Vérification connexion à la base
with app.app_context():
    try:
        db.engine.connect()
        print("✅ Connexion DB réussie !")
    except Exception as e:
        print(f"❌ Erreur DB : {e}")
conversations = {}

# Route pour le template html
template_name = "test.html"

@app.route('/test')
def test():
    return render_template(template_name)

# Nouvelle route pour créer un thread
@app.route('/start_chat', methods=['POST'])
def start_chat():
    # Appel à openai_client.py pour créer un nouveau thread
    thread_id = create_new_thread()

    if not thread_id:
        return jsonify({"error": "Impossible de créer un thread."}), 500
    
    # Créer l'entrée dans la table Thread
    new_thread = Thread(id=thread_id, title="Nouvelle conversation")
    db.session.add(new_thread)
    db.session.commit()
    
    # Retourner le thread_id au frontend
    return jsonify({"thread_id": thread_id}), 200

@app.route('/chat', methods=['POST'])
def chat():
    # Récupérer l'identifiant du thread et le message utilisateur depuis la requête JSON
    thread_id = request.json.get("thread_id")
    user_message = request.json.get("message")

    # Vérifier que le message utilisateur n'est pas vide
    if not user_message:
        return jsonify({"error": "Message vide"}), 400

    # Si aucun thread_id n'est fourni, en générer un nouveau avec UUID
    if not thread_id:
        return jsonify({"error": "Thread ID manquant. Veuillez démarer une nouvelle conversation."}), 400
    
    # Chercher le thread dans la base de données
    thread = Thread.query.filter_by(id=thread_id).first()
    if not thread:
        return jsonify({"error": "Thread introuvable"}), 404

    # Enregistrer le message utilisateur dans la base de données
    user_message_db = Message(thread_id=thread.id, content=user_message, origin="user")
    db.session.add(user_message_db)
    db.session.commit()

    # Appeler la fonction bot_response pour obtenir la réponse du bot via Azure OpenAI
    bot_reply = bot_response(user_message, thread_id)

    # Enregistrer la réponse du bot dans la base de données
    bot_message_db = Message(thread_id=thread.id, content=bot_reply, origin="bot")
    db.session.add(bot_message_db)
    db.session.commit()

    # Retourner la réponse du bot et le thread_id sous forme de JSON
    return jsonify({"response": bot_reply, "thread_id": thread_id})

if __name__ == '__main__':
    app.run(debug=True)
