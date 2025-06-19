import React, { useState, useEffect } from 'react';
import './MyProjects.css'
function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user projects data
    setLoading(true);
    
    fetch("http://localhost:8000/user/projects", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
        // Set default projects on error
        setProjects([
          { id: 1, name: 'Pet Connect', status: 'Active', created: '2024-01-15' },
          { id: 2, name: 'Restaurant Management System', status: 'In Progress', created: '2024-02-20' },
          { id: 3, name: 'Arduino Timer', status: 'Completed', created: '2024-03-10' }
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="projects-container">
        <h2>My Projects</h2>
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>My Projects</h2>
      <div className="projects-header">
        <p>Total Projects: {projects.length}</p>
        <button className="new-project-btn">+ New Project</button>
      </div>
      
      {projects.length === 0 ? (
        <div className="no-projects">
          <p>No projects found. Create your first project!</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`status ${project.status?.toLowerCase().replace(' ', '-')}`}>
                  {project.status}
                </span>
              </div>
              <div className="project-details">
                <p>Created: {project.created}</p>
                <div className="project-actions">
                  <button className="view-btn">View</button>
                  <button className="edit-btn">Edit</button>
                  <button className="delete-btn">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProjects;