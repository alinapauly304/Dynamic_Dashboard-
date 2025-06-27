from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
import re
from sqlalchemy.exc import SQLAlchemyError

from app.models import users
from app.database import engine
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_token
from app.utils.logger import logger

router = APIRouter()

class Login_item(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role_id: int

@router.post("/login", response_model=LoginResponse)
def login(login: Login_item):
    """_summary_

    Args:
        login (Login_item): _description_

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
                logger.warning(f"Failed login attempt for username: {login.username}")
                raise HTTPException(status_code=401, detail="Invalid credentials")

            logger.info(f"User logged in: {login.username}")
            token = create_token({"sub": user_obj.username})

            return {
                "access_token": token,
                "token_type": "bearer",
                "role_id": user_obj.role_id
            }

    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


class RegisterItem(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)

    @validator("password")
    def strong_password(cls, value):
        """_summary_

        Args:
            value (_type_): _description_

        Raises:
            ValueError: _description_
            ValueError: _description_
            ValueError: _description_
            ValueError: _description_

        Returns:
            _type_: _description_
        """
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character")
        return value

@router.post("/register")
def register(registerUser: RegisterItem):
    """_summary_

    Args:
        registerUser (RegisterItem): _description_

    Raises:
        HTTPException: _description_
        HTTPException: _description_
        HTTPException: _description_

    Returns:
        _type_: _description_
    """
    try:
        with Session(engine) as session:
            logger.info(f"Register request received for: {registerUser.username}")
            existing = session.exec(
                select(users.User).where(users.User.username == registerUser.username)
            ).first()
            if existing:
                logger.warning(f"Registration failed — username taken: {registerUser.username}")
                raise HTTPException(status_code=400, detail="Username already taken")

            new_user = users.User(
                username=registerUser.username,
                email=registerUser.email,
                password_hash=hash_password(registerUser.password),
                role_id=1,
                organization_id=1,
                created_at=datetime.utcnow(),
                is_active=True
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)

            return {
                "message": "User registered",
                "username": new_user.username,
                "role": "user"
            }

    except SQLAlchemyError as db_error:
        logger.error(f"Database error: {str(db_error)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.exception("Unhandled error during registration")
        raise HTTPException(status_code=500, detail="Internal server error")
