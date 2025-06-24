from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password_hash: str
    role_id: int
    organization_id: int

class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    role_id: int
    organization_id: int
    role_name: Optional[str] = None
    organization_name: Optional[str] = None

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    organization_id: Optional[int] = None