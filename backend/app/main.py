from fastapi import FastAPI
from fastapi import Body,Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from sqlmodel import Field, SQLModel, Session, create_engine, select,text
from app.database import engine
from app.models import users, project, permission
from passlib.context import CryptContext

from datetime import datetime, timedelta

from app.utils.hashing import hash_password,verify_password
from app.utils.jwt import  create_token,decode_token

Base.metadata.create_all(bind=engine)

app=FastAPI()
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return{"message":"hello World"}



@app.post("/login")
def login(username: str = Body(...), password: str = Body(...)):
    with Session(engine) as session:
        user_obj=session.exec(select(users.User).where(users.User.username == username)).first()

        if not user_obj or not verify_password(password, user_obj.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_token({"sub": user_obj.username})
        return {"access_token": token, "token_type": "bearer" ,"role_id":user_obj.role_id}
    
@app.post("/register")
def register(
    username: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    role_name: str = Body(...),
    organization_name: str = Body(...)):

    with Session(engine) as session:
       
        existing = session.exec(select(users.User).where(users.User.username == username)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        role_obj = session.exec(select(users.Role).where(users.Role.name == role_name)).first()
        if not role_obj:
            raise HTTPException(status_code=400, detail="Invalid role")
        org_obj = session.exec(select(users.Organization).where(users.Organization.name == organization_name)).first()
        if not org_obj:
            raise HTTPException(status_code=400, detail="Invalid organization")

        new_user = users.User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role_id=role_obj.id,
        organization_id=org_obj.id,
        created_at=datetime.utcnow(),
        is_active=True
    )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return {"message": "User registered", "username": new_user.username, "role": role_obj.name}


