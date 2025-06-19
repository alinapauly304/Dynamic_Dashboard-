from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from app.database import engine
from app.config import origins
from app.routers import auth,user

from app.routers import admin
from app.utils.hashing import hash_password


Base.metadata.create_all(bind=engine)

app = FastAPI()
print(hash_password("Admin@123"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(admin.router, prefix="/user", tags=["User"])

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "Server is running"}
