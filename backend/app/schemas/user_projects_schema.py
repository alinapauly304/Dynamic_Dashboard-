from pydantic import BaseModel, EmailStr
from typing import Optional
from typing import List
from datetime import datetime

class ProjectListItem(BaseModel):
    id: int
    name: str
    description: str
    status: str
    created: str
    owner: str
    organization_id: int

class ProjectsResponse(BaseModel):
    projects: List[ProjectListItem]

class ProjectStatsResponse(BaseModel):
    total_projects: int
    active_projects: int
    in_progress_projects: int
    completed_projects: int
    organization_id: int