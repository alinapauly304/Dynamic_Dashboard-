from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.users import User, Role
from app.models.permission import Permission, RolePermission
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/admin/roles", tags=["Role Management"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enhanced admin check function
def is_admin(user: User, db: Session):
    """Check if user has admin privileges with detailed logging"""
    try:
        logger.info(f"Checking admin privileges for user: {user.username} (ID: {user.id}, Role ID: {user.role_id})")
        
        # Method 1: Check if user has admin role (role_id 2)
        if user.role_id == 2:
            logger.info(f"User {user.username} has admin role (role_id 2)")
            return user
        
        # Method 2: Get user's role from database and check name
        user_role = db.query(Role).filter(Role.id == user.role_id).first()
        if user_role:
            logger.info(f"User {user.username} has role: {user_role.name}")
            if 'admin' in user_role.name.lower():
                logger.info(f"User {user.username} has admin role by name")
                return user
        else:
            logger.warning(f"Role ID {user.role_id} not found in database")
            
        # Method 3: Check if user has system.admin permission
        has_admin_permission = db.query(Permission).join(
            RolePermission, Permission.id == RolePermission.permission_id
        ).filter(
            RolePermission.role_id == user.role_id,
            Permission.name == "system.admin"
        ).first()
        
        if has_admin_permission:
            logger.info(f"User {user.username} has system.admin permission")
            return user
            
        logger.warning(f"User {user.username} denied admin access")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Admin access required. User {user.username} does not have sufficient privileges."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin check failed for user {user.username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking admin privileges"
        )

# Pydantic models for API
class PermissionRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
        orm_mode = True

class RoleRead(BaseModel):
    id: int
    name: str
    permissions: List[PermissionRead] = []

    class Config:
        from_attributes = True
        orm_mode = True

class RoleCreate(BaseModel):
    name: str
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permission_ids: Optional[List[int]] = None

# Health check endpoint for debugging
@router.get("/health/check")
def health_check():
    """Simple health check endpoint"""
    logger.info("Health check endpoint accessed")
    return {
        "status": "healthy", 
        "message": "Role management API is working",
        "timestamp": str(datetime.utcnow())
    }

# Get all permissions with enhanced error handling
@router.get("/permissions", response_model=List[PermissionRead])
def get_all_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available permissions"""
    try:
        logger.info(f"User {current_user.username} requesting permissions list")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Fetch permissions
        permissions = db.query(Permission).all()
        logger.info(f"Retrieved {len(permissions)} permissions for user {current_user.username}")
        
        # Convert to response format
        result = []
        for perm in permissions:
            result.append({
                "id": perm.id,
                "name": perm.name,
                "description": perm.description or perm.name
            })
        
        logger.info(f"Returning {len(result)} permissions to frontend")
        return result
        
    except HTTPException as he:
        logger.error(f"HTTP error in get_all_permissions: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in get_all_permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve permissions"
        )

# Get all roles with their permissions - Enhanced version
@router.get("/", response_model=List[RoleRead])
def get_all_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all roles with their permissions - Enhanced with detailed logging"""
    try:
        logger.info(f"User {current_user.username} requesting roles list")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Get all roles
        roles = db.query(Role).all()
        logger.info(f"Found {len(roles)} roles in database")
        
        result = []
        
        for role in roles:
            try:
                logger.info(f"Processing role: {role.name} (ID: {role.id})")
                
                # Get permissions for this role using explicit JOIN
                role_permissions = db.query(Permission).join(
                    RolePermission, 
                    Permission.id == RolePermission.permission_id
                ).filter(
                    RolePermission.role_id == role.id
                ).all()
                
                logger.info(f"Role '{role.name}' has {len(role_permissions)} permissions")
                
                # Convert permissions to dict format
                permissions_data = []
                for perm in role_permissions:
                    permissions_data.append({
                        "id": perm.id,
                        "name": perm.name,
                        "description": perm.description or perm.name
                    })
                
                role_data = {
                    "id": role.id,
                    "name": role.name,
                    "permissions": permissions_data
                }
                result.append(role_data)
                
            except Exception as role_error:
                logger.error(f"Error processing role {role.id} ({role.name}): {role_error}")
                # Still add the role but with empty permissions
                role_data = {
                    "id": role.id,
                    "name": role.name,
                    "permissions": []
                }
                result.append(role_data)
        
        logger.info(f"Successfully processed {len(result)} roles, returning to frontend")
        return result
        
    except HTTPException as he:
        logger.error(f"HTTP error in get_all_roles: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in get_all_roles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve roles"
        )

# Test endpoint for frontend debugging
@router.get("/test")
def test_endpoint(current_user: User = Depends(get_current_user)):
    """Test endpoint to verify authentication"""
    logger.info(f"Test endpoint accessed by user: {current_user.username}")
    return {
        "message": "Authentication successful",
        "user": {
            "username": current_user.username,
            "role_id": current_user.role_id,
            "id": current_user.id
        },
        "timestamp": str(datetime.utcnow())
    }

# Create a new role with enhanced error handling
@router.post("/", response_model=RoleRead)
def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new role with permissions"""
    try:
        logger.info(f"User {current_user.username} creating new role: {role_data.name}")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Check if role name already exists
        existing_role = db.query(Role).filter(Role.name == role_data.name).first()
        if existing_role:
            logger.warning(f"Role name '{role_data.name}' already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists"
            )
        
        # Create the role
        new_role = Role(name=role_data.name)
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        
        logger.info(f"Created new role: {new_role.name} (ID: {new_role.id})")
        
        # Add permissions to the role
        added_permissions = []
        for permission_id in role_data.permission_ids:
            # Verify permission exists
            permission = db.query(Permission).filter(Permission.id == permission_id).first()
            if permission:
                # Check if this role-permission combination already exists
                existing_rp = db.query(RolePermission).filter(
                    RolePermission.role_id == new_role.id,
                    RolePermission.permission_id == permission_id
                ).first()
                
                if not existing_rp:
                    role_permission = RolePermission(
                        role_id=new_role.id,
                        permission_id=permission_id
                    )
                    db.add(role_permission)
                    added_permissions.append(permission)
        
        db.commit()
        logger.info(f"Added {len(added_permissions)} permissions to role {new_role.name}")
        
        # Return role with permissions
        permissions_data = []
        for perm in added_permissions:
            permissions_data.append({
                "id": perm.id,
                "name": perm.name,
                "description": perm.description or perm.name
            })
        
        return {
            "id": new_role.id,
            "name": new_role.name,
            "permissions": permissions_data
        }
        
    except HTTPException as he:
        logger.error(f"HTTP error in create_role: {he.detail}")
        db.rollback()
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in create_role: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )

from datetime import datetime