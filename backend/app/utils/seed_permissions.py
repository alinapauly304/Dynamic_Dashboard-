from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.permission import Permission, RolePermission
from app.models.users import Role

def seed_permissions():
    """Seed the database with initial permissions and roles"""
    db = SessionLocal()
    
    try:
        # Define permissions
        permissions_data = [
            # User Management
            {"name": "users.create", "description": "Create new users"},
            {"name": "users.read", "description": "View user information"},
            {"name": "users.update", "description": "Edit user information"},
            {"name": "users.delete", "description": "Delete users"},
            
            # Project Management
            {"name": "projects.create", "description": "Create new projects"},
            {"name": "projects.read", "description": "View project information"},
            {"name": "projects.update", "description": "Edit project information"},
            {"name": "projects.delete", "description": "Delete projects"},
            
            # Organization Management
            {"name": "organizations.create", "description": "Create new organizations"},
            {"name": "organizations.read", "description": "View organization information"},
            {"name": "organizations.update", "description": "Edit organization information"},
            {"name": "organizations.delete", "description": "Delete organizations"},
            
            # Role Management
            {"name": "roles.create", "description": "Create new roles"},
            {"name": "roles.read", "description": "View role information"},
            {"name": "roles.update", "description": "Edit role information"},
            {"name": "roles.delete", "description": "Delete roles"},
            
            # Reporting
            {"name": "reports.view", "description": "View reports and analytics"},
            {"name": "reports.export", "description": "Export reports and data"},
            
            # System Administration
            {"name": "system.admin", "description": "Full system administration access"},
            {"name": "settings.update", "description": "Update system settings"},
        ]
        
        # Create permissions if they don't exist
        for perm_data in permissions_data:
            existing_permission = db.query(Permission).filter(
                Permission.name == perm_data["name"]
            ).first()
            
            if not existing_permission:
                permission = Permission(
                    name=perm_data["name"],
                    description=perm_data["description"]
                )
                db.add(permission)
                print(f"Created permission: {perm_data['name']}")
        
        db.commit()
        
        # Create default roles if they don't exist
        default_roles = [
            {"name": "user", "permissions": ["projects.read", "users.read"]},
            {"name": "admin", "permissions": [perm["name"] for perm in permissions_data]},  # All permissions
            {"name": "project_manager", "permissions": [
                "projects.create", "projects.read", "projects.update", "projects.delete",
                "users.read", "organizations.read", "reports.view"
            ]},
        ]
        
        for role_data in default_roles:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            
            if not existing_role:
                # Create role
                role = Role(name=role_data["name"])
                db.add(role)
                db.commit()
                db.refresh(role)
                
                # Add permissions to role
                for perm_name in role_data["permissions"]:
                    permission = db.query(Permission).filter(Permission.name == perm_name).first()
                    if permission:
                        role_permission = RolePermission(
                            role_id=role.id,
                            permission_id=permission.id
                        )
                        db.add(role_permission)
                
                db.commit()
                print(f"Created role: {role_data['name']} with {len(role_data['permissions'])} permissions")
        
        print("Database seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_permissions()