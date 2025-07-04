from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    status=Column(String)
    owner = relationship("User")
    organization = relationship("Organization")

class ProjectTeam(Base):
    __tablename__="projectteam"
    id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    project_id=Column(Integer,ForeignKey("projects.id"))

    user=relationship("User")
    project=relationship("Project")

class Proj_db_detail(Base):
    __tablename__ = "proj_db_detail"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user = Column(String, nullable=False)
    password = Column(String, nullable=False)
    dbname = Column(String, nullable=False)
    host = Column(String, nullable=False,default="localhost")  
    port = Column(Integer, nullable=False, default=5432)  

    project = relationship("Project")