from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.users import User
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from typing import List
from datetime import datetime
from pydantic import BaseModel

# Create a separate router for user endpoints
router = APIRouter(prefix="/user", tags=["User"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Define response models for better type safety
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

@router.get("/projects", response_model=ProjectsResponse)
def get_user_organization_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects belonging to the current user's organization"""
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="User is not associated with any organization"
        )
    
    # Query projects that belong to the same organization as the user
    projects = db.query(Project).filter(
        Project.organization_id == current_user.organization_id
    ).all()
    
    # Format response to match frontend expectations
    projects_response = []
    for project in projects:
        # Get owner information
        owner = db.query(User).filter(User.id == project.owner_id).first()
        
        # Determine status based on creation date (you can modify this logic)
        days_since_creation = (datetime.utcnow() - project.created_at).days
        if days_since_creation > 90:
            status = "Completed"
        elif days_since_creation > 30:
            status = "In Progress"
        else:
            status = "Active"
        
        project_data = ProjectListItem(
            id=project.id,
            name=project.name,
            description=project.description or "",
            status=status,
            created=project.created_at.strftime("%Y-%m-%d"),
            owner=owner.username if owner else "Unknown",
            organization_id=project.organization_id
        )
        projects_response.append(project_data)
    
    # Sort projects by creation date (newest first)
    projects_response.sort(key=lambda x: x.created, reverse=True)
    
    return ProjectsResponse(projects=projects_response)

@router.get("/projects/{project_id}", response_model=dict)
def get_user_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific project (only if it belongs to user's organization)"""
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="User is not associated with any organization"
        )
    
    # Query project and verify it belongs to user's organization
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=404, 
            detail="Project not found or not accessible"
        )
    
    # Get owner information
    owner = db.query(User).filter(User.id == project.owner_id).first()
    
    # Get organization information
    from app.models.users import Organization
    organization = db.query(Organization).filter(
        Organization.id == project.organization_id
    ).first()
    
    # Determine status
    days_since_creation = (datetime.utcnow() - project.created_at).days
    if days_since_creation > 90:
        status = "Completed"
    elif days_since_creation > 30:
        status = "In Progress"
    else:
        status = "Active"
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "status": status,
        "created": project.created_at.strftime("%Y-%m-%d"),
        "owner": owner.username if owner else "Unknown",
        "organization": organization.name if organization else "Unknown",
        "organization_id": project.organization_id
    }

@router.get("/projects/stats/summary", response_model=ProjectStatsResponse)
def get_user_organization_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project statistics for the user's organization"""
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="User is not associated with any organization"
        )
    
    # Get all projects for the organization
    projects = db.query(Project).filter(
        Project.organization_id == current_user.organization_id
    ).all()
    
    total_projects = len(projects)
    active_projects = 0
    in_progress_projects = 0
    completed_projects = 0
    
    # Categorize projects by status based on creation date
    for project in projects:
        days_since_creation = (datetime.utcnow() - project.created_at).days
        if days_since_creation > 90:
            completed_projects += 1
        elif days_since_creation > 30:
            in_progress_projects += 1
        else:
            active_projects += 1
    
    return ProjectStatsResponse(
        total_projects=total_projects,
        active_projects=active_projects,
        in_progress_projects=in_progress_projects,
        completed_projects=completed_projects,
        organization_id=current_user.organization_id
    )