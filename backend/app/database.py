from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse

from .utils.config_reader import config

username = config['database']['username']
password = config['database']['password']
host = config['database']['host']
database_name = config['database']['database_name']

encoded_password = urllib.parse.quote_plus(password)

DATABASE_URL = f"postgresql://{username}:{encoded_password}@{host}/{database_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

