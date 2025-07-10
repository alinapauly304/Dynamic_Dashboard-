from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.project import Project, ProjectTeam  
from app.models.users import User,Role
from app.schemas.user_projects_schema import ProjectListItem,ProjectsResponse,ProjectStatsResponse
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.utils.logger import LoggerSetup
import os
from datetime import datetime


router = APIRouter(prefix="/user", tags=["User"])

logger = LoggerSetup.setup_logger('user_projects', os.path.join(os.getcwd(), 'logs'))

def get_db():
    db = SessionLocal()
    try:
        logger.debug("Database session created")
        yield db
    finally:
        logger.debug("Database session closed")
        db.close()



@router.get("/projects", response_model=ProjectsResponse)
def get_user_organization_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects belonging to the current user's organization"""
    try:
        logger.info(f"User {current_user.id} requesting organization projects")
        if not current_user.organization_id:
            logger.warning(f"User {current_user.id} not associated with any organization")
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
        
            logger.info(f"Successfully returned {len(projects_response)} projects to user {current_user.id}")
        return ProjectsResponse(projects=projects_response)
    
    except Exception as e:
        logger.error(f"Error retrieving organization projects for user {current_user.id}: {str(e)}")
        raise

@router.get("/projects/{project_id}", response_model=dict)
def get_user_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific project (only if it belongs to user's organization)"""
    try:
        logger.info(f"User {current_user.id} requesting details of project {project_id}")
        # Check if user has an organization
        if not current_user.organization_id:
            logger.warning(f"User {current_user.id} not associated with any organization")
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
            logger.warning(f"Project {project_id} not found or not accessible for user {current_user.id}")
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
        
        logger.info(f"Successfully retrieved project {project_id} details for user {current_user.id}")
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
    except Exception as e:
        logger.error(f"Error retrieving project {project_id} details for user {current_user.id}: {str(e)}")
        raise

@router.get("/projects/stats/summary", response_model=ProjectStatsResponse)
def get_user_organization_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project statistics for the user's organization"""
    try:
        logger.info(f"User {current_user.id} requesting organization project stats")
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
        logger.info(f"Calculating stats for {len(projects)} projects in organization {current_user.organization_id}")
        
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
        logger.info(f"Successfully returned project stats for user {current_user.id}: {total_projects} total, {active_projects} active, {in_progress_projects} in progress, {completed_projects} completed")
        return ProjectStatsResponse(
            total_projects=total_projects,
            active_projects=active_projects,
            in_progress_projects=in_progress_projects,
            completed_projects=completed_projects,
            organization_id=current_user.organization_id
        )
    except Exception as e:
        logger.error(f"Error retrieving project stats for user {current_user.id}: {str(e)}")
        raise

@router.get("/assigned-projects", response_model=ProjectsResponse)
def get_user_assigned_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects where the current user is a team member"""
    try:
        logger.info(f"User {current_user.id} requesting assigned projects")
        # Check if user has an organization
        if not current_user.organization_id:
            logger.warning(f"User {current_user.id} not associated with any organization")
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
        logger.info(f"Successfully returned {len(projects_response)} assigned projects to user {current_user.id}")
        return ProjectsResponse(projects=projects_response)
    except Exception as e:
        logger.error(f"Error retrieving assigned projects for user {current_user.id}: {str(e)}")
        raise


@router.get("/assigned-projects/{project_id}", response_model=dict)
def get_user_assigned_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific assigned project"""
    try:
        logger.info(f"User {current_user.id} requesting details for assigned project {project_id}")
        # Check if user has an organization
        if not current_user.organization_id:
            logger.warning(f"User {current_user.id} not associated with any organization")
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
            logger.warning(f"User {current_user.id} not a team member of project {project_id}")
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
    except Exception as e:
        logger.error(f"Error retrieving assigned project {project_id} details for user {current_user.id}: {str(e)}")
        raise

@router.get("/team-projects/stats", response_model=dict)
def get_user_team_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for projects where user is a team member"""
    try:
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
    except Exception as e:
        raise

# Add this to your user_projects.py file

from app.utils.permissions import get_user_permissions, user_has_permission

@router.get("/permissions", response_model=dict)
def get_user_permissions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all permissions for the current user"""
    try:
        logger.info(f"User {current_user.id} requesting permissions")
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
    except Exception as e:
        logger.error(f"Error retrieving permissions for user {current_user.id}: {str(e)}")
        raise

@router.get("/permissions/check/{permission_name}", response_model=dict)
def check_user_permission(
    permission_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if user has a specific permission"""
    try:
        logger.info(f"User {current_user.id} checking permission '{permission_name}'")
        has_permission = user_has_permission(current_user, permission_name, db)
        logger.info(f"User {current_user.id} permission check for '{permission_name}': {has_permission}")
        return {
            "permission": permission_name,
            "has_permission": has_permission,
            "user_id": current_user.id
        }
    except Exception as e:
        logger.error(f"Error checking permission '{permission_name}' for user {current_user.id}: {str(e)}")
        raise