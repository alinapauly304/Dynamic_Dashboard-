from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse


username = "dashboard_user"
password = "Alinapauly@304"  
host = "localhost"
database_name = "dashboard_db"

encoded_password = urllib.parse.quote_plus(password)

DATABASE_URL = f"postgresql://{username}:{encoded_password}@{host}/{database_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

