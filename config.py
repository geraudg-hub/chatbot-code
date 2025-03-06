import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BASIC_AUTH_USERNAME = os.getenv('BASIC_AUTH_USERNAME')
    BASIC_AUTH_PASSWORD = os.getenv('BASIC_AUTH_PASSWORD')
