from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP)
    
    role = relationship("Role", back_populates="users")
    organization = relationship("Organization", back_populates="users")


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    is_system = Column(Boolean, default=False, nullable=False)
   
    users = relationship("User", back_populates="role")


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    created_at = Column(TIMESTAMP)
    
    users = relationship("User", back_populates="organization")