import pytest
import sys
import os
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app as flask_app

@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        with flask_app.app_context():
            yield client

def test_login_success(client):
    correct_password = os.getenv('BETA_PASSWORD', 'ilovebeer1234')
    
    response = client.post('/login', 
                         data={'password': correct_password},
                         follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Session expir' not in response.data
    with client.session_transaction() as sess:
        assert sess.get('authenticated') is True

def test_login_wrong_password(client):
    response = client.post('/login', data={'password': 'wrongpassword'}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Unauthorized access' in response.data
    with client.session_transaction() as sess:
        assert sess.get('authenticated') is not True

def test_login_no_password(client):
    response = client.post('/login', data={}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Unauthorized access' in response.data
