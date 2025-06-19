import React, { useState, useEffect } from 'react';
import './MyProjects.css';
import './MyProfile.css';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProjects([
        {
          id: 1,
          name: 'E-commerce Platform',
          description: 'Full-stack online shopping platform with payment integration',
          status: 'active',
          createdDate: '2024-01-15',
          lastModified: '2024-06-18',
          owner: 'John Smith',
          team: ['Alice Johnson', 'Bob Wilson'],
          priority: 'high',
          budget: 45000,
          progress: 75
        },
        {
          id: 2,
          name: 'Mobile Banking App',
          description: 'Secure mobile application for banking services',
          status: 'in-progress',
          createdDate: '2024-02-20',
          lastModified: '2024-06-17',
          owner: 'Sarah Davis',
          team: ['Mike Brown', 'Lisa Garcia'],
          priority: 'high',
          budget: 60000,
          progress: 45
        },
        {
          id: 3,
          name: 'CRM Dashboard',
          description: 'Customer relationship management system',
          status: 'completed',
          createdDate: '2023-11-10',
          lastModified: '2024-05-30',
          owner: 'David Lee',
          team: ['Emma Taylor', 'Ryan Martinez'],
          priority: 'medium',
          budget: 35000,
          progress: 100
        },
        {
          id: 4,
          name: 'Analytics Platform',
          description: 'Real-time data analytics and reporting system',
          status: 'pending',
          createdDate: '2024-06-01',
          lastModified: '2024-06-15',
          owner: 'Jennifer Wang',
          team: ['Alex Chen', 'Maria Rodriguez'],
          priority: 'low',
          budget: 28000,
          progress: 15
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search functionality
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Sort functionality
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.lastModified) - new Date(a.lastModified);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleSaveProject = (projectData) => {
    if (selectedProject) {
      // Update existing project
      setProjects(projects.map(p => 
        p.id === selectedProject.id ? { ...p, ...projectData, lastModified: new Date().toISOString().split('T')[0] } : p
      ));
    } else {
      // Create new project
      const newProject = {
        ...projectData,
        id: Math.max(...projects.map(p => p.id)) + 1,
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        progress: 0
      };
      setProjects([...projects, newProject]);
    }
    setShowEditModal(false);
    setShowNewProjectModal(false);
    setSelectedProject(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00b894';
      case 'in-progress': return '#fdcb6e';
      case 'completed': return '#74b9ff';
      case 'pending': return '#fd79a8';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="projects-container">
        <h2>Manage Projects</h2>
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Projects</h2>
      
      {/* Admin Controls */}
      <div className="profile-info" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#f8f9fa',
              fontSize: '14px',
              flex: '1',
              minWidth: '200px'
            }}
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#f8f9fa',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#f8f9fa',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {/* Projects Header */}
      <div className="projects-header">
        <p>{sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''} found</p>
        <button className="new-project-btn" onClick={handleNewProject}>
          + New Project
        </button>
      </div>

      {/* Projects List */}
      {sortedProjects.length === 0 ? (
        <div className="no-projects">
          <p>No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="projects-list">
          {sortedProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`status ${project.status}`}>
                  {project.status.replace('-', ' ')}
                </span>
              </div>
              
              <p style={{ color: '#6c757d', marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                {project.description}
              </p>

              {/* Project Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Owner:</label>
                  <span style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                    {project.owner}
                  </span>
                </div>
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Priority:</label>
                  <span style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px', 
                    background: getPriorityColor(project.priority),
                    color: 'white',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {project.priority}
                  </span>
                </div>
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Budget:</label>
                  <span style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                    ${project.budget.toLocaleString()}
                  </span>
                </div>
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Progress:</label>
                  <span style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                    {project.progress}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${project.progress}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(project.status),
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              {/* Team Members */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '4px' }}>
                  Team Members:
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {project.team.map((member, index) => (
                    <span key={index} style={{
                      fontSize: '11px',
                      background: '#f8f9fa',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e9ecef'
                    }}>
                      {member}
                    </span>
                  ))}
                </div>
              </div>

              <div className="project-details">
                <p>Last modified: {new Date(project.lastModified).toLocaleDateString()}</p>
                <div className="project-actions">
                  <button className="view-btn" onClick={() => handleViewProject(project)}>
                    View
                  </button>
                  <button className="edit-btn" onClick={() => handleEditProject(project)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteProject(project.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && !showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="profile-info" style={{ 
            maxWidth: '600px', 
            width: '90%', 
            maxHeight: '80vh', 
            overflowY: 'auto',
            margin: 0,
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedProject(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
            
            <h3 style={{ marginBottom: '24px', color: '#2c3e50' }}>{selectedProject.name}</h3>
            
            <div className="profile-field">
              <label>Description:</label>
              <span>{selectedProject.description}</span>
            </div>
            
            <div className="profile-field">
              <label>Status:</label>
              <span className={`status ${selectedProject.status}`} style={{ 
                display: 'inline-block',
                background: getStatusColor(selectedProject.status),
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {selectedProject.status.replace('-', ' ')}
              </span>
            </div>
            
            <div className="profile-field">
              <label>Owner:</label>
              <span>{selectedProject.owner}</span>
            </div>
            
            <div className="profile-field">
              <label>Priority:</label>
              <span style={{ 
                background: getPriorityColor(selectedProject.priority),
                color: 'white',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {selectedProject.priority}
              </span>
            </div>
            
            <div className="profile-field">
              <label>Budget:</label>
              <span>${selectedProject.budget.toLocaleString()}</span>
            </div>
            
            <div className="profile-field">
              <label>Progress:</label>
              <span>{selectedProject.progress}%</span>
            </div>
            
            <div className="profile-field">
              <label>Created:</label>
              <span>{new Date(selectedProject.createdDate).toLocaleDateString()}</span>
            </div>
            
            <div className="profile-field">
              <label>Modified:</label>
              <span>{new Date(selectedProject.lastModified).toLocaleDateString()}</span>
            </div>
            
            <div className="profile-field">
              <label>Team:</label>
              <span>{selectedProject.team.join(', ')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProjects;