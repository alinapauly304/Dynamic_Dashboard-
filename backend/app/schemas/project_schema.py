from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Creating a new project
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

# Reading a project (used in API responses)
class ProjectRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    owner_id: int

    class Config:
        orm_mode = True

# Updating a project
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
