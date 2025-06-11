from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base

from app.database import engine
from app.models import users, project, permission

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