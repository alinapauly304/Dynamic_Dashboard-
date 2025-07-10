from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.users import Organization, User
from app.models.project import Project
from app.schemas.organization_schema import OrganizationCreate, OrganizationUpdate, OrganizationResponse, OrganizationWithUsers
from app.utils.jwt import get_current_user, get_db
from datetime import datetime
from app.utils.logger import LoggerSetup
import os

logger = LoggerSetup.setup_logger('organizations', os.path.join(os.getcwd(), 'logs'))

router = APIRouter(prefix="/organizations")

@router.get("/", response_model=List[OrganizationResponse])
def get_all_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all organizations - Admin only"""
    try:
        logger.info(f"User {current_user.id} requesting all organizations")
        
        if current_user.role_id != 2:  # Admin role
            logger.warning(f"User {current_user.id} denied access to all organizations - not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        organizations = db.query(Organization).all()
        logger.info(f"Retrieved {len(organizations)} organizations for admin {current_user.id}")
        
        result = []
        for org in organizations:
            member_count = db.query(User).filter(User.organization_id == org.id).count()
            project_count = db.query(Project).filter(Project.organization_id == org.id).count()
            
            org_dict = {
                "id": org.id,
                "name": org.name,
                "description": "",  
                "website": getattr(org, 'website', ''),
                "industry": getattr(org, 'industry', ''),
                "size": getattr(org, 'size', ''),
                "members": member_count,
                "projects": project_count,
                "status": getattr(org, 'status', 'active'),
                "created_at": org.created_at
            }
            result.append(org_dict)
        
        logger.info(f"Successfully returned {len(result)} organizations to admin {current_user.id}")
        return result
    
    except Exception as e:
        logger.error(f"Error retrieving organizations for admin {current_user.id}: {str(e)}")
        raise

@router.get("/{org_id}", response_model=OrganizationWithUsers)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get organization by ID with users"""
    
    try:
        logger.info(f"User {current_user.id} requesting organization {org_id}")
        
        if current_user.role_id != 2 and current_user.organization_id != org_id:
            logger.warning(f"User {current_user.id} denied access to organization {org_id} - insufficient permissions")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        organization = db.query(Organization).filter(Organization.id == org_id).first()
        if not organization:
            logger.warning(f"Organization {org_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        users = db.query(User).filter(User.organization_id == org_id).all()
        logger.info(f"Retrieved organization {org_id} with {len(users)} users for user {current_user.id}")
        
        return {
            "id": organization.id,
            "name": organization.name,
            "description": "",  
            "status": getattr(organization, 'status', 'active'),
            "created_at": organization.created_at,
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role_id": user.role_id,
                    "is_active": user.is_active,
                    "created_at": user.created_at
                } for user in users
            ]
        }
    
    except Exception as e:
        logger.error(f"Error retrieving organization {org_id} for user {current_user.id}: {str(e)}")
        raise


@router.get("/{org_id}/projects")
def get_organization_projects(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects for a specific organization"""

    try:
        logger.info(f"User {current_user.id} requesting projects for organization {org_id}")
        
        if current_user.role_id != 2 and current_user.organization_id != org_id:
            logger.warning(f"User {current_user.id} denied access to projects for organization {org_id} - insufficient permissions")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Verify organization exists
        organization = db.query(Organization).filter(Organization.id == org_id).first()
        if not organization:
            logger.warning(f"Organization {org_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Get projects with owner information
        projects = db.query(Project).filter(Project.organization_id == org_id).all()
        logger.info(f"Retrieved {len(projects)} projects for organization {org_id}")
        
        result = []
        for project in projects:
            owner_info = None
            if project.owner_id:
                owner = db.query(User).filter(User.id == project.owner_id).first()
                if owner:
                    owner_info = {
                        "id": owner.id,
                        "username": owner.username,
                        "email": owner.email
                    }
            
            project_dict = {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "owner_id": project.owner_id,
                "organization_id": project.organization_id,
                "created_at": project.created_at,
                "owner": owner_info
            }
            result.append(project_dict)
        
        logger.info(f"Successfully returned {len(result)} projects for organization {org_id} to user {current_user.id}")
        return result
    
    except Exception as e:
        logger.error(f"Error retrieving projects for organization {org_id} by user {current_user.id}: {str(e)}")
        raise

@router.post("/", response_model=OrganizationResponse)
def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new organization - Admin only"""
    try:
        logger.info(f"Admin {current_user.id} attempting to create organization '{organization.name}'")
        
        if current_user.role_id != 2: 
            logger.warning(f"User {current_user.id} denied organization creation - not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Check if organization name already exists
        existing_org = db.query(Organization).filter(Organization.name == organization.name).first()
        if existing_org:
            logger.warning(f"Admin {current_user.id} tried to create organization with existing name '{organization.name}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this name already exists"
            )
        
        db_organization = Organization(
            name=organization.name,
            created_at=datetime.utcnow()
        )
        
        db.add(db_organization)
        db.commit()
        db.refresh(db_organization)
        
        logger.info(f"Admin {current_user.id} successfully created organization '{organization.name}' with ID {db_organization.id}")
        
        member_count = db.query(User).filter(User.organization_id == db_organization.id).count()
        project_count = db.query(Project).filter(Project.organization_id == db_organization.id).count()

        return {
            "id": db_organization.id,
            "name": db_organization.name,
            "description": "",  
            "members": member_count,
            "projects": project_count,
            "status": getattr(db_organization, 'status', 'active'),
            "created_at": db_organization.created_at
        }
    
    except Exception as e:
        logger.error(f"Error creating organization by admin {current_user.id}: {str(e)}")
        raise

@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int,
    organization: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update organization - Admin only"""
    try:
        logger.info(f"Admin {current_user.id} attempting to update organization {org_id}")
        
        if current_user.role_id != 2:  # Admin role
            logger.warning(f"User {current_user.id} denied organization update - not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        db_organization = db.query(Organization).filter(Organization.id == org_id).first()
        if not db_organization:
            logger.warning(f"Admin {current_user.id} tried to update non-existent organization {org_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Check if new name conflicts with existing organization
        if organization.name and organization.name != db_organization.name:
            existing_org = db.query(Organization).filter(Organization.name == organization.name).first()
            if existing_org:
                logger.warning(f"Admin {current_user.id} tried to update organization {org_id} with existing name '{organization.name}'")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization with this name already exists"
                )
        
        old_name = db_organization.name
        if organization.name:
            db_organization.name = organization.name
        
        db.commit()
        db.refresh(db_organization)
        
        logger.info(f"Admin {current_user.id} successfully updated organization {org_id} ('{old_name}' -> '{db_organization.name}')")
        
        # Get member count
        member_count = db.query(User).filter(User.organization_id == db_organization.id).count()
        project_count = db.query(Project).filter(Project.organization_id == db_organization.id).count()

        return {
            "id": db_organization.id,
            "name": db_organization.name,
            "description": "",  
            "members": member_count,
            "projects": project_count,
            "status": getattr(db_organization, 'status', 'active'),
            "created_at": db_organization.created_at
        }
    
    except Exception as e:
        logger.error(f"Error updating organization {org_id} by admin {current_user.id}: {str(e)}")
        raise

@router.delete("/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete organization - Admin only"""
    try:
        logger.info(f"Admin {current_user.id} attempting to delete organization {org_id}")
        
        if current_user.role_id != 2:  # Admin role
            logger.warning(f"User {current_user.id} denied organization deletion - not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        db_organization = db.query(Organization).filter(Organization.id == org_id).first()
        if not db_organization:
            logger.warning(f"Admin {current_user.id} tried to delete non-existent organization {org_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Check if organization has users
        users_count = db.query(User).filter(User.organization_id == org_id).count()
        if users_count > 0:
            logger.warning(f"Admin {current_user.id} tried to delete organization {org_id} with {users_count} users")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete organization with {users_count} users. Please reassign users first."
            )
        
        org_name = db_organization.name
        db.delete(db_organization)
        db.commit()
        
        logger.info(f"Admin {current_user.id} successfully deleted organization {org_id} ('{org_name}')")
        
        return {"message": "Organization deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting organization {org_id} by admin {current_user.id}: {str(e)}")
        raise

@router.get("/{org_id}/users", response_model=List[dict])
def get_organization_users(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users in an organization"""
    try:
        logger.info(f"User {current_user.id} requesting users for organization {org_id}")
        
        if current_user.role_id != 2 and current_user.organization_id != org_id:
            logger.warning(f"User {current_user.id} denied access to users for organization {org_id} - insufficient permissions")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Verify organization exists
        organization = db.query(Organization).filter(Organization.id == org_id).first()
        if not organization:
            logger.warning(f"Organization {org_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        users = db.query(User).filter(User.organization_id == org_id).all()
        logger.info(f"Retrieved {len(users)} users for organization {org_id} by user {current_user.id}")
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role_id": user.role_id,
                "is_active": user.is_active,
                "created_at": user.created_at
            } for user in users
        ]
    
    except Exception as e:
        logger.error(f"Error retrieving users for organization {org_id} by user {current_user.id}: {str(e)}")
        raise