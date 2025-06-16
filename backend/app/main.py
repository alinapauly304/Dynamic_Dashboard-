"""dynamic dashboard"""
from fastapi import FastAPI
from fastapi import Body,Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from sqlmodel import Field, SQLModel, Session, create_engine, select,text
from app.database import engine
from app.models import users, project, permission
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime, timedelta
import re
from app.utils.hashing import hash_password,verify_password
from app.utils.jwt import  create_token,decode_token
   
from sqlalchemy.exc import SQLAlchemyError

from app.config import origins

Base.metadata.create_all(bind=engine)

app=FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health Check"])
def health_check():
    """_summary_

    Returns:
        _type_: _description_
    """
    return {"status": "ok", "message": "Server is running"}


class Login_item(BaseModel):
    username:str
    password:str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role_id: int

@app.post("/login",response_model=LoginResponse)
def login(login:Login_item):
    """_summary_

    Args:
        username (str, optional): _description_. Defaults to Body(...).
        password (str, optional): _description_. Defaults to Body(...).

    Raises:
        HTTPException: _description_
        HTTPException: _description_
        HTTPException: _description_

    Returns:
        _type_: _description_
    """
    try:
        with Session(engine) as session:
            user_obj = session.exec(
                select(users.User).where(users.User.username == login.username)
            ).first()

            if not user_obj or not verify_password(login.password, user_obj.password_hash):
                raise HTTPException(status_code=401, detail="Invalid credentials")

            token = create_token({"sub": user_obj.username})
            return {
                "access_token": token,
                "token_type": "bearer",
                "role_id": user_obj.role_id
            }

    except SQLAlchemyError as db_error:
        raise HTTPException(status_code=500, detail="Database error")

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")



class RegisterItem(BaseModel):
    username: str 
    email: EmailStr
    password: str = Field(min_length=8)
    role_name: str 
    organization_name: str 

@validator("password")
def strong_password(cls, value):
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
        raise ValueError("Password must contain at least one special character")
    return value

@app.post("/register")
def register(registerUser:RegisterItem):
    
    try:
        with Session(engine) as session:
            existing = session.exec(
                select(users.User).where(users.User.username ==registerUser. username)
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")

            role_obj = session.exec(
                select(users.Role).where(users.Role.name == registerUser.role_name)
            ).first()
            if not role_obj:
                raise HTTPException(status_code=400, detail="Invalid role")

            org_obj = session.exec(
                select(users.Organization).where(users.Organization.name == registerUser.organization_name)
            ).first()
            if not org_obj:
                raise HTTPException(status_code=400, detail="Invalid organization")

            new_user = users.User(
                username=registerUser.username,
                email=registerUser.email,
                password_hash=hash_password(registerUser.password),
                role_id=role_obj.id,
                organization_id=org_obj.id,
                created_at=datetime.utcnow(),
                is_active=True
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)

            return {
                "message": "User registered",
                "username": new_user.username,
                "role": role_obj.name
            }

    except SQLAlchemyError as db_error:
        raise HTTPException(status_code=500, detail="Database error")

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
