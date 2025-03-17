import os
import logging
from logging.handlers import RotatingFileHandler
import time
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
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import func

# Charging env values
load_dotenv()
MAX_SESSION_DURATION = int(os.getenv('MAX_SESSION_DURATION', 6000))
MAX_CHARACTERS = int(os.getenv('MAX_CHARACTERS', 20000))
MAX_MESSAGE_CHARACTERS = int(os.getenv('MAX_MESSAGE_CHARACTERS', 5000))

# Logging config
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO').upper(),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# More config for production
if os.getenv('FLASK_ENV') == 'production':
    handler = RotatingFileHandler(
        'app.log',
        maxBytes=1024 * 1024 * 10,  # 10 MB
        backupCount=5
    )
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)


# Initialize Flask
app = Flask(__name__)

# Configuration of database
class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@"
        f"{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DB')}"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

app.config.from_object(Config)

app.config['BASIC_AUTH_USERNAME'] = os.getenv('BASIC_AUTH_USERNAME')
app.config['BASIC_AUTH_PASSWORD'] = os.getenv('BASIC_AUTH_PASSWORD')

# Initialisation of extensions
db.init_app(app)
migrate.init_app(app, db)  # Initialisation de Migrate

basic_auth = BasicAuth(app)

# Registering admin's blueprint
app.register_blueprint(admin_bp, url_prefix='/admin')

with app.app_context():
    db.session.remove()
    db.engine.dispose()

# Checking database connexion
with app.app_context():
    try:
        db.engine.connect()
        print("✅ Connexion DB réussie !")
    except Exception as e:
        print(f"❌ Erreur DB : {e}")
conversations = {}

#________________________!!!_______________________
# Path for html template
template_name = "test.html"

# Path for user history
@app.route('/thread/<string:thread_id>/messages', methods=['GET'])
def get_thread_messages(thread_id):
    messages = Message.query.filter_by(thread_id=thread_id).order_by(Message.created_at.asc()).all()
    return jsonify([{
        "content": message.content,
        "origin": message.origin,
        "created_at": message.created_at.isoformat()
    } for message in messages])


@app.route('/test')
def test():
    return render_template(template_name)

@app.route('/session_status', methods=['GET'])
def session_status():
    try:
        thread_id = request.args.get('thread_id')
        if not thread_id:
            logger.warning("Session status request without thread_id")
            return jsonify({"error": "Thread ID missing"}), 400

        thread = Thread.query.get(thread_id)
        if not thread:
            logger.error(f"Thread introuvable: {thread_id}")
            return jsonify({"error": "Thread cant be found"}), 404


        total_chars = db.session.query(func.sum(func.length(Message.content)))\
                    .filter(Message.thread_id == thread_id)\
                    .scalar() or 0

        session_age = (datetime.utcnow() - thread.created_at).total_seconds()
        remaining_time = MAX_SESSION_DURATION - session_age
        remaining_chars = MAX_CHARACTERS - total_chars

        expired = remaining_time <= 0 or remaining_chars <= 0

        logger.debug(f"Session status checked for thread {thread_id}")
        return jsonify({
            "remaining_time": remaining_time,
            "remaining_chars": remaining_chars,
            "expired": expired
        })
    
    except Exception as e:
        logger.error(f"Error in session_status: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


# New path to create a thread
@app.route('/start_chat', methods=['POST'])
def start_chat():
    try:
        thread_id = create_new_thread()
        if not thread_id:
            logger.error("Failed to create OpenAI thread")
            return jsonify({"error": "Thread creation impossible"}), 500
        
        new_thread = Thread(id=thread_id, title="New thread")
        db.session.add(new_thread)
        db.session.commit()
        logger.info(f"New chat started: {thread_id}")
        
        return jsonify({"thread_id": thread_id}), 200
    
    except Exception as e:
        logger.critical(f"Error starting chat: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": "Error when starting thread"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # [1] First request validation
        logger.info("Début de la requête /chat")
        
        # JSON format checking
        if not request.is_json:
            logger.error("Requête reçue avec un format non JSON")
            return jsonify({"error": "Internal server error"}), 500
            
        data = request.get_json()
        thread_id = data.get("thread_id")
        user_message = data.get("message")

        # [2] Message data validation
        if not thread_id:
            logger.warning("Request without thread_id")
            return jsonify({"error": "Missing thread_id. Start a new conversation"}), 400
            
        if not user_message:
            logger.warning("User message empty")
            return jsonify({"error": "Message empty"}), 400

        # Message lenght cheking
        if len(user_message) > MAX_MESSAGE_CHARACTERS:
            logger.error(f"Message too long ({len(user_message)} caracteres)")
            return jsonify({
                "error": f"Message too long ({len(user_message)}/{MAX_MESSAGE_CHARACTERS} caracteres)"
            }), 400

        # [3] Fetching thread
        thread = Thread.query.filter_by(id=thread_id).first()
        if not thread:
            logger.error(f"Thread cant be found: {thread_id}")
            return jsonify({"error": "Invalide session"}), 404
            
        if thread.status == 'expired':
            logger.warning(f"Atempt to use expired thread: {thread_id}")
            return jsonify({"error": "Session expired. Start a new conversation"}), 403

        # [4] Timout expiration checking
        session_age = (datetime.utcnow() - thread.created_at).total_seconds()
        if session_age > MAX_SESSION_DURATION:
            logger.info(f"Thread expired (time) {thread_id} ({session_age}s)")
            thread.status = 'expired'
            db.session.commit()
            return jsonify({"error": "Session expired"}), 403

        # [5] Caracteres somme checking
        try:
            total_chars = db.session.query(func.sum(func.length(Message.content)))\
                  .filter(Message.thread_id == thread_id)\
                  .scalar() or 0
            logger.debug(f"Total thread caracteres {thread_id}: {total_chars}")
        except Exception as e:
            logger.error(f"Error somme characteres: {str(e)}", exc_info=True)
            return jsonify({"error": "Session verification error"}), 500

        # [6] Characteres limite checking before use
        if len(user_message) > MAX_MESSAGE_CHARACTERS:
            logger.error(f"User message too long ({len(user_message)} caracteres)")
            return jsonify({
                "error": f"Message trop long ({len(user_message)}/{MAX_MESSAGE_CHARACTERS} caracteres)"
            }), 

        # [7] Registering user message
        try:
            user_message_db = Message(
                thread_id=thread.id,
                content=user_message[:MAX_MESSAGE_CHARACTERS],
                origin="user"
            )
            db.session.add(user_message_db)
            db.session.commit()
            logger.debug(f"User message registered: {thread_id}")
        except Exception as e:
            logger.critical(f"Database error saving message: {str(e)}", exc_info=True)
            db.session.rollback()
            return jsonify({"error": "Error in saving the message"}), 500

        # [8] API OPENAI call
        try:
            logger.info(f"Appel OpenAI for thread {thread_id}")
            bot_reply = bot_response(user_message, thread_id)
            
            if not bot_reply:
                raise ValueError("OpenAI response empty")
                
            logger.debug(f" OpenAI response recieved: {len(bot_reply)} caracteres")
        except Exception as e:
            logger.error(f"Erreur API OpenAI: {str(e)}", exc_info=True)
            return jsonify({"error": "IA communication error"}), 500

        # [9] Limites checking final
        new_total = total_chars + len(user_message) + len(bot_reply)
        if new_total > MAX_CHARACTERS:
            logger.warning(f"Caracteres limite after IA answer: {new_total}")
            thread.status = 'expired'
            db.session.commit()
            return jsonify({"error": "Caracteres limite exeeded"}), 403

        # [10] Saving AI response
        try:
            bot_message_db = Message(
                thread_id=thread.id,
                content=bot_reply,
                origin="bot"
            )
            db.session.add(bot_message_db)
            db.session.commit()
            logger.info(f"Conversation completed: {thread_id}")
        except Exception as e:
            logger.critical(f"Error saving IA response in DB: {str(e)}", exc_info=True)
            db.session.rollback()
            return jsonify({"error": "Error saving the response"}), 500

        # [11] Final response
        return jsonify({
            "response": bot_reply,
            "thread_id": thread_id,
            "remaining_chars": MAX_CHARACTERS - new_total
        })

    except Exception as e:
        logger.critical(f"Error not handled in /chat: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    app.run(debug=True)
