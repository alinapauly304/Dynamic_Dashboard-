from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.project import Project, ProjectTeam  # Add ProjectTeam import here
from app.models.users import User,Role
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

@router.get("/assigned-projects", response_model=ProjectsResponse)
def get_user_assigned_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects where the current user is a team member"""
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="User is not associated with any organization"
        )
    
    # Query projects where user is a team member
    # Join ProjectTeam to get projects where current user is a team member
    assigned_projects_query = db.query(Project).join(
        ProjectTeam, Project.id == ProjectTeam.project_id
    ).filter(
        ProjectTeam.user_id == current_user.id,
        Project.organization_id == current_user.organization_id  # Additional security check
    ).all()
    
    # Format response to match frontend expectations
    projects_response = []
    for project in assigned_projects_query:
        # Get owner information
        owner = db.query(User).filter(User.id == project.owner_id).first()
        
        # Determine status based on creation date (same logic as before)
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


@router.get("/assigned-projects/{project_id}", response_model=dict)
def get_user_assigned_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific assigned project"""
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="User is not associated with any organization"
        )
    
    # Verify user is a team member of this project
    team_membership = db.query(ProjectTeam).filter(
        ProjectTeam.project_id == project_id,
        ProjectTeam.user_id == current_user.id
    ).first()
    
    if not team_membership:
        raise HTTPException(
            status_code=403, 
            detail="You are not a team member of this project"
        )
    
    # Query project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=404, 
            detail="Project not found"
        )
    
    # Get owner information
    owner = db.query(User).filter(User.id == project.owner_id).first()
    
    # Get organization information
    from app.models.users import Organization
    organization = db.query(Organization).filter(
        Organization.id == project.organization_id
    ).first()
    
    # Get team members
    team_members = db.query(ProjectTeam).join(User).filter(
        ProjectTeam.project_id == project_id
    ).all()
    
    team_list = []
    for tm in team_members:
        team_list.append({
            "id": tm.user.id,
            "username": tm.user.username,
            "email": tm.user.email,
            "is_current_user": tm.user.id == current_user.id
        })
    
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
        "organization_id": project.organization_id,
        "team": team_list,
        "user_role": "team_member"  # Indicating user's role in this project
    }


@router.get("/team-projects/stats", response_model=dict)
def get_user_team_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for projects where user is a team member"""
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="User is not associated with any organization"
        )
    
    # Get projects where user is a team member
    assigned_projects = db.query(Project).join(
        ProjectTeam, Project.id == ProjectTeam.project_id
    ).filter(
        ProjectTeam.user_id == current_user.id,
        Project.organization_id == current_user.organization_id
    ).all()
    
    total_assigned = len(assigned_projects)
    active_assigned = 0
    in_progress_assigned = 0
    completed_assigned = 0
    
    # Categorize assigned projects by status
    for project in assigned_projects:
        days_since_creation = (datetime.utcnow() - project.created_at).days
        if days_since_creation > 90:
            completed_assigned += 1
        elif days_since_creation > 30:
            in_progress_assigned += 1
        else:
            active_assigned += 1
    
    return {
        "total_assigned_projects": total_assigned,
        "active_assigned_projects": active_assigned,
        "in_progress_assigned_projects": in_progress_assigned,
        "completed_assigned_projects": completed_assigned,
        "organization_id": current_user.organization_id
    }

# Add this to your user_projects.py file

from app.utils.permissions import get_user_permissions, user_has_permission

@router.get("/permissions", response_model=dict)
def get_user_permissions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all permissions for the current user"""
    
    # Get user permissions using the utility function
    permissions = get_user_permissions(current_user, db)
    
    # Also get role information for additional context
    role = db.query(Role).filter(Role.id == current_user.role_id).first() if current_user.role_id else None
    
    return {
        "permissions": permissions,
        "role": {
            "id": role.id if role else None,
            "name": role.name if role else None,
            "is_system": role.is_system if role else False
        } if role else None,
        "user_id": current_user.id,
        "organization_id": current_user.organization_id
    }

@router.get("/permissions/check/{permission_name}", response_model=dict)
def check_user_permission(
    permission_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if user has a specific permission"""
    
    has_permission = user_has_permission(current_user, permission_name, db)
    
    return {
        "permission": permission_name,
        "has_permission": has_permission,
        "user_id": current_user.id
    }