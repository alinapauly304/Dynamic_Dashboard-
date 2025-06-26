from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Creating a new project (matches your existing model)
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: Optional[int] = None  # Will default to current user if not provided

# Reading a project (used in API responses)
class ProjectRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    owner_id: int
    organization_id: Optional[int]

    class Config:
        orm_mode = True

# Updating a project (only fields that exist in your model)
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Team member schema
class TeamMember(BaseModel):
    id: int
    username: str
    email: str
    role: Optional[str] = None

# Adding team member to project
class ProjectTeamCreate(BaseModel):
    user_id: int

# Response schema for the frontend (includes computed/default fields)
class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    status: str = "active"  # Default since not in your model
    createdDate: str
    lastModified: str
    owner: str
    organization: str
    owner_id: int
    team: List[TeamMember] = []  # List of team members
    priority: str = "medium"  # Default
    budget: int = 0  # Default
    progress: int = 0  # Default