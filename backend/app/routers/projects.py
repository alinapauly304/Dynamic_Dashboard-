from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.models.project import Project
from app.models.users import User
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.schemas.project_schema import ProjectCreate, ProjectRead, ProjectUpdate
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
    
    # Base query with join to get owner information
    query = db.query(Project).join(User, Project.owner_id == User.id)
    
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
        
        # Since we don't have team members table, we'll use a placeholder
        # You can modify this if you have a different way to store team members
        project_data = {
            "id": project.id,
            "name": project.name,
            "description": project.description or "",
            "status": "active",  # Default status since your model doesn't have this field
            "createdDate": project.created_at.strftime("%Y-%m-%d"),
            "lastModified": project.created_at.strftime("%Y-%m-%d"),  # Using created_at as fallback
            "owner": owner.username if owner else "Unknown",
            "team": [],  # Empty team since no team table exists
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
    is_admin(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get owner information
    owner = db.query(User).filter(User.id == project.owner_id).first()
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "owner": owner.username if owner else "Unknown",
        "status": "active",
        "createdDate": project.created_at.strftime("%Y-%m-%d"),
        "lastModified": project.created_at.strftime("%Y-%m-%d"),
        "team": []
    }

@router.post("/", response_model=dict)
def create_project(
    project_data: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    is_admin(current_user)
    
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
        organization_id=1  # Default organization, adjust as needed
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # Get owner for response
    owner = db.query(User).filter(User.id == new_project.owner_id).first()
    
    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description or "",
        "owner": owner.username if owner else "Unknown",
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
    is_admin(current_user)
    
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
    
    # Get owner for response
    owner = db.query(User).filter(User.id == project.owner_id).first()
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "owner": owner.username if owner else "Unknown",
        "status": "active",
        "priority": "medium",
        "budget": 0,
        "progress": 0,
        "createdDate": project.created_at.strftime("%Y-%m-%d"),
        "lastModified": project.created_at.strftime("%Y-%m-%d"),
        "team": []
    }

@router.delete("/{project_id}")
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project"""
    is_admin(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

@router.get("/stats/summary")
def get_project_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get project statistics summary"""
    is_admin(current_user)
    
    total_projects = db.query(Project).count()
    
    return {
        "total_projects": total_projects,
        "active_projects": total_projects,  # Since we don't have status field
        "completed_projects": 0,
        "in_progress_projects": 0
    }