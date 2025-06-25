from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    description: Optional[str] = None  # Accept but ignore

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None  # Accept but ignore
    status: Optional[str] = None

class UserInOrganization(BaseModel):
    id: int
    username: str
    email: str
    role_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrganizationResponse(OrganizationBase):
    id: int
    description: str = ""  # Always return empty string
    members: int = 0
    projects: int = 0
    status: str = "active"
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrganizationWithUsers(OrganizationResponse):
    users: List[UserInOrganization] = []
    
    class Config:
        from_attributes = True