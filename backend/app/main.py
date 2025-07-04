from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from app.database import engine
from app.config import origins
from app.routers import auth,user,roles,projects,organizations,user_projects,Dynamic_db

from app.routers import admin
from app.utils.hashing import hash_password


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(user.router,tags=["User"])
app.include_router(roles.router, tags=["Roles"]) 
app.include_router(projects.router, tags=["Projects"]) 
app.include_router(organizations.router, tags=["Organizations"])
app.include_router(user_projects.router,tags=["User Projects"])
app.include_router(Dynamic_db.router,tags=["Dynamic_db"])
# Debug: Print all registered routes
@app.on_event("startup")
async def startup_event():
    print("Registered routes:")
    for route in app.routes:
        print(f"  {route.methods} {route.path}")

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "Server is running"}
