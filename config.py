import os
from dotenv import load_dotenv

load_dotenv()  # Charger les variables depuis le fichier .env

class Config:
    BASIC_AUTH_USERNAME = os.getenv('BASIC_AUTH_USERNAME')
    BASIC_AUTH_PASSWORD = os.getenv('BASIC_AUTH_PASSWORD')
