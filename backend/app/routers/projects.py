from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.models.project import Project, ProjectTeam
from app.models.users import User,Organization
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.schemas.project_schema import ProjectCreate, ProjectRead, ProjectUpdate, ProjectTeamCreate
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["Projects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def is_admin(user: User):
    """Check if user has admin privileges"""
    if user.role_id != 2:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/", response_model=List[dict])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in name, description, or owner"),
    sort_by: Optional[str] = Query("name", description="Sort by: name, date, status, priority")
):
    """Get all projects (admin only) with filtering and sorting"""
    is_admin(current_user)
    
    # Base query with join to get owner and organization information
    query = db.query(Project).join(User, Project.owner_id == User.id).outerjoin(Organization, Project.organization_id == Organization.id)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (Project.name.ilike(search_term)) |
            (Project.description.ilike(search_term)) |
            (User.username.ilike(search_term))
        )
    
    projects = query.all()
    
    # Format response to match frontend expectations
    projects_response = []
    for project in projects:
        # Get owner information
        owner = db.query(User).filter(User.id == project.owner_id).first()
        
        # Get organization information
        organization = db.query(Organization).filter(Organization.id == project.organization_id).first()
        
        # Get team members
        team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project.id).all()
        team = [{"id": tm.user.id, "username": tm.user.username, "email": tm.user.email} for tm in team_members]
        
        project_data = {
            "id": project.id,
            "name": project.name,
            "description": project.description or "",
            "status": "active",  # Default status since your model doesn't have this field
            "createdDate": project.created_at.strftime("%Y-%m-%d"),
            "lastModified": project.created_at.strftime("%Y-%m-%d"),  # Using created_at as fallback
            "owner": owner.username if owner else "Unknown",
            "owner_id": project.owner_id,
            "organization": organization.name if organization else "Unknown",  # Add organization name
            "team": team,
            "priority": "medium",  # Default priority
            "budget": 0,  # Default budget
            "progress": 0  # Default progress
        }
        projects_response.append(project_data)
    
    # Sort results
    if sort_by == "name":
        projects_response.sort(key=lambda x: x["name"].lower())
    elif sort_by == "date":
        projects_response.sort(key=lambda x: x["lastModified"], reverse=True)
    elif sort_by == "status":
        projects_response.sort(key=lambda x: x["status"])
 
    return projects_response

@router.get("/{project_id}", response_model=dict)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific project by ID"""
    #is_admin(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get owner information
    owner = db.query(User).filter(User.id == project.owner_id).first()
    organization = db.query(Organization).filter(Organization.id == project.organization_id).first()
    
    # Get team members
    team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project.id).all()
    team = [{"id": tm.user.id, "username": tm.user.username, "email": tm.user.email} for tm in team_members]
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "owner": owner.username if owner else "Unknown",
        "organization": organization.name if organization else "Unknown",
        "owner_id": project.owner_id,
        "status": "active",
        "createdDate": project.created_at.strftime("%Y-%m-%d"),
        "lastModified": project.created_at.strftime("%Y-%m-%d"),
        "team": team
    }

@router.post("/", response_model=dict)
def create_project(
    project_data: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    #is_admin(current_user)
    
    # Verify owner exists (default to current user if not specified)
    owner_id = current_user.id
    if hasattr(project_data, 'owner_id') and project_data.owner_id:
        owner = db.query(User).filter(User.id == project_data.owner_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Project owner not found")
        owner_id = project_data.owner_id
    
    # Create project using your existing model structure
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=owner_id,
        organization_id=current_user.organization_id or 1  # Use user's org or default
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # Get owner and organization for response
    owner = db.query(User).filter(User.id == new_project.owner_id).first()
    organization = db.query(Organization).filter(Organization.id == new_project.organization_id).first()
    
    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description or "",
        "owner": owner.username if owner else "Unknown",
        "owner_id": new_project.owner_id,
        "organization": organization.name if organization else "Unknown",  # Add organization name
        "status": "active",
        "priority": "medium",
        "budget": 0,
        "progress": 0,
        "createdDate": new_project.created_at.strftime("%Y-%m-%d"),
        "lastModified": new_project.created_at.strftime("%Y-%m-%d"),
        "team": []
    }

@router.put("/{project_id}", response_model=dict)
def update_project(
    project_id: int, 
    update_data: ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a project"""
    #is_admin(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project fields that exist in your model
    if update_data.name is not None:
        project.name = update_data.name
    if update_data.description is not None:
        project.description = update_data.description
    
    db.commit()
    db.refresh(project)
    
    # Get owner and organization for response
    owner = db.query(User).filter(User.id == project.owner_id).first()
    organization = db.query(Organization).filter(Organization.id == project.organization_id).first()
    
    # Get team members
    team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project.id).all()
    team = [{"id": tm.user.id, "username": tm.user.username, "email": tm.user.email} for tm in team_members]
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "owner": owner.username if owner else "Unknown",
        "owner_id": project.owner_id,
        "organization": organization.name if organization else "Unknown",  # Add organization name
        "status": "active",
        "priority": "medium",
        "budget": 0,
        "progress": 0,
        "createdDate": project.created_at.strftime("%Y-%m-%d"),
        "lastModified": project.created_at.strftime("%Y-%m-%d"),
        "team": team
    }

@router.delete("/{project_id}")
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project"""
    #is_admin(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete all team members first
    db.query(ProjectTeam).filter(ProjectTeam.project_id == project_id).delete()
    
    # Delete the project
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

# Team Management Endpoints
@router.post("/{project_id}/team", response_model=dict)
def add_team_member(
    project_id: int,
    team_data: ProjectTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a team member to a project"""
    #is_admin(current_user)
    
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user exists and belongs to the same organization as the project
    user = db.query(User).filter(
        User.id == team_data.user_id,
        User.organization_id == project.organization_id,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found or does not belong to the project's organization"
        )
    
    # Check if user is already in the team
    existing_member = db.query(ProjectTeam).filter(
        ProjectTeam.project_id == project_id,
        ProjectTeam.user_id == team_data.user_id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a team member")
    
    # Add team member
    team_member = ProjectTeam(
        project_id=project_id,
        user_id=team_data.user_id
    )
    
    db.add(team_member)
    db.commit()
    
    return {
        "message": "Team member added successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

@router.delete("/{project_id}/team/{user_id}")
def remove_team_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a team member from a project"""
    #is_admin(current_user)
    
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Find and remove team member
    team_member = db.query(ProjectTeam).filter(
        ProjectTeam.project_id == project_id,
        ProjectTeam.user_id == user_id
    ).first()
    
    if not team_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    db.delete(team_member)
    db.commit()
    
    return {"message": "Team member removed successfully"}

@router.get("/{project_id}/team", response_model=List[dict])
def get_project_team(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all team members for a project"""
    #is_admin(current_user)
    
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get team members
    team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project_id).all()
    
    return [
        {
            "id": tm.user.id,
            "username": tm.user.username,
            "email": tm.user.email,
            "role": tm.user.role.name if tm.user.role else "Unknown"
        }
        for tm in team_members
    ]

# Updated endpoint to get users from project's organization
@router.get("/{project_id}/available-users", response_model=List[dict])
def get_available_users_for_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users from the project's organization that can be added to the project"""
    #is_admin(current_user)
    
    # Get the project first
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get users from the same organization as the project
    users = db.query(User).filter(
        User.organization_id == project.organization_id,
        User.is_active == True
    ).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.name if user.role else "Unknown"
        }
        for user in users
    ]

# Keep the original endpoint for backward compatibility (general available users)
@router.get("/available-users", response_model=List[dict])
def get_available_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users that can be added to projects (general endpoint)"""
    #is_admin(current_user)
    
    users = db.query(User).filter(User.is_active == True).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.name if user.role else "Unknown"
        }
        for user in users
    ]

@router.get("/stats/summary")
def get_project_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get project statistics summary"""
    #is_admin(current_user)
    
    total_projects = db.query(Project).count()
    
    return {
        "total_projects": total_projects,
        "active_projects": total_projects,  
        "completed_projects": 0,
        "in_progress_projects": 0
    }