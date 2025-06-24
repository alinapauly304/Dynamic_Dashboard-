from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})  
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWT Error: {e}")  # Debug print
        return None
    
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.models import users
from app.database import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme)) -> users.User:
    print(f"Received token: {token[:20]}...")  # Debug print (first 20 chars only)
    
    payload = decode_token(token)
    if payload is None:
        print("Token decode failed")  # Debug print
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    username: str = payload.get("sub")
    if username is None:
        print("No username in token payload")  # Debug print
        raise HTTPException(status_code=401, detail="Invalid token")

    print(f"Looking for user: {username}")  # Debug print

    db = next(get_db())
    try:
        user = db.query(users.User).filter(users.User.username == username).first()
        if not user:
            print(f"User {username} not found in database")  # Debug print
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"Found user: {user.username}")  # Debug print
        return user
    finally:
        db.close()