from extensions import db
from datetime import datetime

class Thread(db.Model):
    __tablename__ = 'threads'
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # Modification ici
    messages = db.relationship('Message', backref='thread', lazy=True)
    
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    thread_id = db.Column(db.String(36), db.ForeignKey('threads.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    origin = db.Column(db.String(10), nullable=False)
