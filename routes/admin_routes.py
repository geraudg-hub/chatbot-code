from flask import Blueprint, jsonify, render_template, request
from extensions import db
from models.models import Message, Thread
from sqlalchemy import func
from datetime import datetime, timedelta
from flask_basicauth import BasicAuth


admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

basic_auth = BasicAuth()

@admin_bp.route('/thread/<string:thread_id>/messages', methods=['GET'])
@basic_auth.required
def get_messages_by_thread(thread_id):
    messages = Message.query.filter_by(thread_id=thread_id)\
                           .order_by(Message.created_at.asc())\
                           .all()
    
    return jsonify([{
        "message_id": message.id, 
        "content": message.content,
        "origin": message.origin,
        "created_at": message.created_at.isoformat(),
        "timestamp": message.created_at
    } for message in messages])

# Admin dashboard
@admin_bp.route('/', methods=['GET'])
@basic_auth.required
def admin_dashboard():
    print("Authentification réussie!")
    return render_template('admin_dashboard.html')

@admin_bp.route('/messages/total', methods=['GET'])
@basic_auth.required
def get_total_stats():
    total_threads = Thread.query.count()
    total_messages = Message.query.count()

    return jsonify({
        "total_threads": total_threads,
        "total_messages": total_messages
    })


# Retrieving threads
@admin_bp.route('/threads', methods=['GET'])
@basic_auth.required
def get_threads():
    threads = Thread.query.all()
    data = []
    for thread in threads:
        messages = thread.messages
        message_count = len(messages)
        last_message = messages[-2].content if len(messages) > 1 else messages[0].content if messages else "Aucun"  
        created_at = thread.created_at.isoformat() if thread.created_at else ""
        
        data.append({
            "thread_id": thread.id,
            "title": thread.title,
            "created_at": created_at,
            "message_count": message_count,
            "last_message": last_message
        })
    return jsonify(data)


# Messages / day
@admin_bp.route('/messages/stats', methods=['GET'])
@basic_auth.required
def get_message_stats():
    stats = db.session.query(func.date(Message.created_at), func.count(Message.id))\
        .group_by(func.date(Message.created_at))\
        .all()
    return jsonify([{
        "date": stat[0].isoformat(),
        "message_count": stat[1]
    } for stat in stats])

# Messages / houres
@admin_bp.route('/messages/peak_hours', methods=['GET'])
@basic_auth.required
def get_peak_hours():
    stats = db.session.query(func.hour(Message.created_at), func.count(Message.id))\
        .group_by(func.hour(Message.created_at))\
        .all()
    return jsonify([{"hour": stat[0], "message_count": stat[1]} for stat in stats])

# Last 24h
@admin_bp.route('/messages/last_24h', methods=['GET'])
@basic_auth.required
def get_last_24h_stats():
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)

    threads_count = Thread.query.filter(Thread.created_at > last_24h).count()
    messages_count = Message.query.filter(Message.created_at > last_24h).count()

    return jsonify({
        "threads_count": threads_count,
        "messages_count": messages_count
    })

# Thread & messages / x days
@admin_bp.route('/messages/threads_per_day', methods=['GET'])
@basic_auth.required
def get_threads_and_messages_per_day():
    # Récupérer la valeur de 'days' (ou 7 par défaut)
    days = int(request.args.get('days', 7))
    start_date = datetime.utcnow() - timedelta(days=days)

    thread_data = db.session.query(
        func.date(Thread.created_at).label('date'),
        func.count(Thread.id).label('thread_count')
    ).filter(Thread.created_at >= start_date).group_by(func.date(Thread.created_at)).order_by(func.date(Thread.created_at)).all()

    message_data = db.session.query(
        func.date(Message.created_at).label('date'),
        func.count(Message.id).label('message_count')
    ).filter(Message.created_at >= start_date).group_by(func.date(Message.created_at)).order_by(func.date(Message.created_at)).all()

    return jsonify({
        "threads_data": [{"date": item.date.isoformat(), "thread_count": item.thread_count} for item in thread_data],
        "messages_data": [{"date": item.date.isoformat(), "message_count": item.message_count} for item in message_data]
    })


# Average message / houre
@admin_bp.route('/messages/messages_per_hour', methods=['GET'])
@basic_auth.required
def get_messages_per_hour():
    days = int(request.args.get('days', 7))  # 7 default
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    stats = db.session.query(
        func.hour(Message.created_at).label('hour'),
        func.count(Message.id).label('message_count')
    ).filter(Message.created_at >= start_date).group_by('hour').all()

    hourly_data = [{"hour": stat[0], "message_count": stat[1]} for stat in stats]

    return jsonify(hourly_data)

# Show message of thread
@admin_bp.route('/thread/<string:thread_id>/messages/view', methods=['GET'])
@basic_auth.required
def view_messages(thread_id):
    return render_template('messages.html', thread_id=thread_id)

# Stats page
@admin_bp.route('/statistiques', methods=['GET'])
@basic_auth.required
def statistiques():
    return render_template('statistiques.html')