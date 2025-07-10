from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
import re

class Login_item(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role_id: int


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