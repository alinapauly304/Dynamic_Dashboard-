from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.models.project import Project, ProjectTeam
from app.models.users import User,Organization
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.schemas.project_schema import ProjectCreate, ProjectRead, ProjectUpdate, ProjectTeamCreate
from typing import List, Optional
from datetime import datetime
from app.utils.logger import LoggerSetup
import os

router = APIRouter(prefix="/projects", tags=["Projects"])
logger = LoggerSetup.setup_logger('projects', os.path.join(os.getcwd(), 'logs'))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def is_admin(user: User):
    """Check if user has admin privileges"""
    logger.debug(f"Checking admin privileges for user {user.id} ({user.username}) - role_id: {user.role_id}")
    if user.role_id != 2:
        logger.warning(f"Admin access denied for user {user.id} ({user.username}) - role_id: {user.role_id}")
        raise HTTPException(status_code=403, detail="Admin access required")
    logger.info(f"Admin access granted for user {user.id} ({user.username})")
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
    logger.info(f"User {current_user.id} ({current_user.username}) accessing all projects list")
    logger.debug(f"Filters applied - status: {status}, search: {search}, sort_by: {sort_by}")
    
    try:
        is_admin(current_user)
        
        # Base query with join to get owner and organization information
        logger.debug("Building base query with joins for projects, users, and organizations")
        query = db.query(Project).join(User, Project.owner_id == User.id).outerjoin(Organization, Project.organization_id == Organization.id)
        
        # Apply search filter
        if search:
            logger.debug(f"Applying search filter: {search}")
            search_term = f"%{search.lower()}%"
            query = query.filter(
                (Project.name.ilike(search_term)) |
                (Project.description.ilike(search_term)) |
                (User.username.ilike(search_term))
            )
        
        projects = query.all()
        logger.info(f"Found {len(projects)} projects matching criteria")
        
        projects_response = []
        for project in projects:
            logger.debug(f"Processing project {project.id} ({project.name})")
            
            # Get owner information
            owner = db.query(User).filter(User.id == project.owner_id).first()
            if not owner:
                logger.warning(f"Owner not found for project {project.id}")
            
            # Get organization information
            organization = db.query(Organization).filter(Organization.id == project.organization_id).first()
            if not organization:
                logger.warning(f"Organization not found for project {project.id}")
            
            # Get team members
            team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project.id).all()
            team = [{"id": tm.user.id, "username": tm.user.username, "email": tm.user.email} for tm in team_members]
            logger.debug(f"Project {project.id} has {len(team)} team members")
            
            project_data = {
                "id": project.id,
                "name": project.name,
                "description": project.description or "",
                "status": "active",
                "createdDate": project.created_at.strftime("%Y-%m-%d"),
                "lastModified": project.created_at.strftime("%Y-%m-%d"),
                "owner": owner.username if owner else "Unknown",
                "owner_id": project.owner_id,
                "organization": organization.name if organization else "Unknown",
                "team": team,
                "priority": "medium",
                "budget": 0,
                "progress": 0
            }
            projects_response.append(project_data)
        
        # Sort results
        logger.debug(f"Sorting results by: {sort_by}")
        if sort_by == "name":
            projects_response.sort(key=lambda x: x["name"].lower())
        elif sort_by == "date":
            projects_response.sort(key=lambda x: x["lastModified"], reverse=True)
        elif sort_by == "status":
            projects_response.sort(key=lambda x: x["status"])
        
        logger.info(f"Successfully returned {len(projects_response)} projects to user {current_user.id}")
        return projects_response
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in get_all_projects: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_all_projects for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{project_id}", response_model=dict)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific project by ID"""
    logger.info(f"User {current_user.id} ({current_user.username}) accessing project {project_id}")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on get_project")
        
        logger.debug(f"Querying project {project_id} from database")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        logger.debug(f"Project {project_id} found: {project.name}")
        
        # Get owner information
        owner = db.query(User).filter(User.id == project.owner_id).first()
        if not owner:
            logger.warning(f"Owner {project.owner_id} not found for project {project_id}")
        
        organization = db.query(Organization).filter(Organization.id == project.organization_id).first()
        if not organization:
            logger.warning(f"Organization {project.organization_id} not found for project {project_id}")
        
        # Get team members
        team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project.id).all()
        team = [{"id": tm.user.id, "username": tm.user.username, "email": tm.user.email} for tm in team_members]
        logger.debug(f"Project {project_id} has {len(team)} team members")
        
        logger.info(f"Successfully retrieved project {project_id} for user {current_user.id}")
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
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in get_project: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_project {project_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=dict)
def create_project(
    project_data: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    logger.info(f"User {current_user.id} ({current_user.username}) creating new project: {project_data.name}")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on create_project")
        
        # Verify owner exists (default to current user if not specified)
        owner_id = current_user.id
        if hasattr(project_data, 'owner_id') and project_data.owner_id:
            logger.debug(f"Custom owner_id specified: {project_data.owner_id}")
            owner = db.query(User).filter(User.id == project_data.owner_id).first()
            if not owner:
                logger.warning(f"Project owner {project_data.owner_id} not found - requested by user {current_user.id}")
                raise HTTPException(status_code=404, detail="Project owner not found")
            owner_id = project_data.owner_id
            logger.debug(f"Owner verified: {owner.username}")
        else:
            logger.debug(f"Using current user {current_user.id} as project owner")
        
        # Handle organization assignment
        org_id = current_user.organization_id or 1
        if not current_user.organization_id:
            logger.warning(f"Using default organization_id=1 for project creation - user {current_user.id}")
        
        # Create project using existing model structure
        logger.debug(f"Creating project with owner_id: {owner_id}, organization_id: {org_id}")
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            owner_id=owner_id,
            organization_id=org_id
        )
        
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        logger.info(f"Project {new_project.id} ({new_project.name}) created successfully by user {current_user.id}")
        
        # Get owner and organization for response
        owner = db.query(User).filter(User.id == new_project.owner_id).first()
        organization = db.query(Organization).filter(Organization.id == new_project.organization_id).first()
        
        logger.debug(f"Returning project data for newly created project {new_project.id}")
        return {
            "id": new_project.id,
            "name": new_project.name,
            "description": new_project.description or "",
            "owner": owner.username if owner else "Unknown",
            "owner_id": new_project.owner_id,
            "organization": organization.name if organization else "Unknown",
            "status": "active",
            "priority": "medium",
            "budget": 0,
            "progress": 0,
            "createdDate": new_project.created_at.strftime("%Y-%m-%d"),
            "lastModified": new_project.created_at.strftime("%Y-%m-%d"),
            "team": []
        }
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in create_project: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in create_project for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{project_id}", response_model=dict)
def update_project(
    project_id: int, 
    update_data: ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a project"""
    logger.info(f"User {current_user.id} ({current_user.username}) updating project {project_id}")
    logger.debug(f"Update data: name={update_data.name}, description={update_data.description}")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on update_project")
        
        logger.debug(f"Querying project {project_id} for update")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found for update - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        logger.debug(f"Project {project_id} found for update: {project.name}")
        
        # Track changes
        changes = []
        if update_data.name is not None and update_data.name != project.name:
            old_name = project.name
            project.name = update_data.name
            changes.append(f"name: '{old_name}' -> '{update_data.name}'")
            
        if update_data.description is not None and update_data.description != project.description:
            old_desc = project.description or ""
            project.description = update_data.description
            changes.append(f"description: '{old_desc}' -> '{update_data.description}'")
        
        if changes:
            logger.info(f"Project {project_id} changes: {', '.join(changes)}")
        else:
            logger.debug(f"No changes detected for project {project_id}")
        
        db.commit()
        db.refresh(project)
        
        logger.info(f"Project {project_id} updated successfully by user {current_user.id}")
        
        # Get owner and organization for response
        owner = db.query(User).filter(User.id == project.owner_id).first()
        organization = db.query(Organization).filter(Organization.id == project.organization_id).first()
        
        # Get team members
        team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project.id).all()
        team = [{"id": tm.user.id, "username": tm.user.username, "email": tm.user.email} for tm in team_members]
        logger.debug(f"Updated project {project_id} has {len(team)} team members")
        
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description or "",
            "owner": owner.username if owner else "Unknown",
            "owner_id": project.owner_id,
            "organization": organization.name if organization else "Unknown",
            "status": "active",
            "priority": "medium",
            "budget": 0,
            "progress": 0,
            "createdDate": project.created_at.strftime("%Y-%m-%d"),
            "lastModified": project.created_at.strftime("%Y-%m-%d"),
            "team": team
        }
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in update_project: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_project {project_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{project_id}")
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project"""
    logger.info(f"User {current_user.id} ({current_user.username}) deleting project {project_id}")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on delete_project")
        
        logger.debug(f"Querying project {project_id} for deletion")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found for deletion - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_name = project.name
        logger.warning(f"Deleting project {project_id} ({project_name}) - requested by user {current_user.id}")
        
        # Count team members before deletion
        team_count = db.query(ProjectTeam).filter(ProjectTeam.project_id == project_id).count()
        logger.debug(f"Project {project_id} has {team_count} team members to be removed")
        
        # Delete all team members first
        deleted_team_members = db.query(ProjectTeam).filter(ProjectTeam.project_id == project_id).delete()
        logger.info(f"Deleted {deleted_team_members} team members from project {project_id}")
        
        # Delete the project
        db.delete(project)
        db.commit()
        
        logger.warning(f"Project {project_id} ({project_name}) deleted successfully by user {current_user.id}")
        return {"message": "Project deleted successfully"}
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in delete_project: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete_project {project_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{project_id}/team", response_model=dict)
def add_team_member(
    project_id: int,
    team_data: ProjectTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a team member to a project"""
    logger.info(f"User {current_user.id} ({current_user.username}) adding user {team_data.user_id} to project {project_id} team")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on add_team_member")
        
        logger.debug(f"Querying project {project_id} for team member addition")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found for team member addition - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user exists and belongs to the same organization as the project
        logger.debug(f"Validating user {team_data.user_id} for project {project_id} team")
        user = db.query(User).filter(
            User.id == team_data.user_id,
            User.organization_id == project.organization_id,
            User.is_active == True
        ).first()
        
        if not user:
            logger.warning(f"User {team_data.user_id} not found or not in same organization as project {project_id}")
            raise HTTPException(
                status_code=404, 
                detail="User not found or does not belong to the project's organization"
            )
        
        logger.debug(f"User {team_data.user_id} ({user.username}) validated for project {project_id}")
        
        # Check if user is already in the team
        existing_member = db.query(ProjectTeam).filter(
            ProjectTeam.project_id == project_id,
            ProjectTeam.user_id == team_data.user_id
        ).first()
        
        if existing_member:
            logger.warning(f"User {team_data.user_id} already in team for project {project_id}")
            raise HTTPException(status_code=400, detail="User is already a team member")

        logger.debug(f"Adding user {team_data.user_id} to project {project_id} team")
        team_member = ProjectTeam(
            project_id=project_id,
            user_id=team_data.user_id
        )
        
        db.add(team_member)
        db.commit()
        
        logger.info(f"User {team_data.user_id} ({user.username}) added to project {project_id} team by {current_user.id}")
        
        return {
            "message": "Team member added successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in add_team_member: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in add_team_member for project {project_id}, user {team_data.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{project_id}/team/{user_id}")
def remove_team_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a team member from a project"""
    logger.info(f"User {current_user.id} ({current_user.username}) removing user {user_id} from project {project_id} team")
    
    try:
        logger.debug(f"Querying project {project_id} for team member removal")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found for team member removal - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        logger.debug(f"Looking for team member {user_id} in project {project_id}")
        team_member = db.query(ProjectTeam).filter(
            ProjectTeam.project_id == project_id,
            ProjectTeam.user_id == user_id
        ).first()
        
        if not team_member:
            logger.warning(f"Team member {user_id} not found in project {project_id} - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Team member not found")
        
        # Get user info for logging
        user = db.query(User).filter(User.id == user_id).first()
        username = user.username if user else "Unknown"
        
        logger.debug(f"Removing user {user_id} ({username}) from project {project_id} team")
        db.delete(team_member)
        db.commit()
        
        logger.info(f"User {user_id} ({username}) removed from project {project_id} team by {current_user.id}")
        return {"message": "Team member removed successfully"}
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in remove_team_member: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in remove_team_member for project {project_id}, user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{project_id}/team", response_model=List[dict])
def get_project_team(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all team members for a project"""
    logger.info(f"User {current_user.id} ({current_user.username}) accessing team for project {project_id}")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on get_project_team")
        
        logger.debug(f"Querying project {project_id} for team listing")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found for team listing - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        logger.debug(f"Loading team members for project {project_id}")
        team_members = db.query(ProjectTeam).join(User).filter(ProjectTeam.project_id == project_id).all()
        
        logger.info(f"Project {project_id} has {len(team_members)} team members - accessed by user {current_user.id}")
        
        return [
            {
                "id": tm.user.id,
                "username": tm.user.username,
                "email": tm.user.email,
                "role": tm.user.role.name if tm.user.role else "Unknown"
            }
            for tm in team_members
        ]
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in get_project_team: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_project_team for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{project_id}/available-users", response_model=List[dict])
def get_available_users_for_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users from the project's organization that can be added to the project"""
    logger.info(f"User {current_user.id} ({current_user.username}) accessing available users for project {project_id}")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on get_available_users_for_project")
        
        logger.debug(f"Querying project {project_id} for available users")
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning(f"Project {project_id} not found for available users - requested by user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get users from the same organization as the project
        logger.debug(f"Loading users from organization {project.organization_id} for project {project_id}")
        users = db.query(User).filter(
            User.organization_id == project.organization_id,
            User.is_active == True
        ).all()
        
        logger.info(f"Found {len(users)} available users in organization {project.organization_id} for project {project_id}")
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.name if user.role else "Unknown"
            }
            for user in users
        ]
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in get_available_users_for_project: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_available_users_for_project for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/available-users", response_model=List[dict])
def get_available_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users that can be added to projects (general endpoint)"""
    logger.info(f"User {current_user.id} ({current_user.username}) accessing all available users")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on get_available_users")
        
        logger.debug("Loading all active users")
        users = db.query(User).filter(User.is_active == True).all()
        
        logger.info(f"Found {len(users)} available users - accessed by user {current_user.id}")
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.name if user.role else "Unknown"
            }
            for user in users
        ]
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in get_available_users: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_available_users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats/summary")
def get_project_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get project statistics summary"""
    logger.info(f"User {current_user.id} ({current_user.username}) accessing project statistics")
    
    try:
        #is_admin(current_user)
        logger.info(f"Admin check bypassed for user {current_user.id} on get_project_stats")
        
        logger.debug("Calculating project statistics")
        total_projects = db.query(Project).count()
        
        logger.info(f"Project stats calculated - total: {total_projects} - accessed by user {current_user.id}")
        
        return {
            "total_projects": total_projects,
            "active_projects": total_projects,  
            "completed_projects": 0,
            "in_progress_projects": 0
        }
        
    except HTTPException as e:
        logger.error(f"HTTP Exception in get_project_stats: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_project_stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")