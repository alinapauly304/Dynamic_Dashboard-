import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backend_url } from '../config';
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
  const [error, setError] = useState('');

  // Helper function to get token from localStorage
  const getAuthToken = () => {
    try {
      // First try to get token directly
      let token = localStorage.getItem('token');
      
      // If not found, try to get from user_obj
      if (!token) {
        const userObj = localStorage.getItem('user_obj');
        if (userObj) {
          const userData = JSON.parse(userObj);
          token = userData.access_token;
        }
      }
      
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  // Fetch projects from backend
  useEffect(() => {
    fetchProjects();
  }, [searchTerm, filterStatus, sortBy]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        // Optionally redirect to login
        // window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (sortBy) params.append('sort_by', sortBy);

      const response = await axios.get(`${backend_url}projects/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setProjects(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching projects:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('No authentication token found. Please login again.');
          return;
        }

        await axios.delete(`${backend_url}projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Remove from local state
        setProjects(projects.filter(p => p.id !== projectId));
        setError('');
      } catch (err) {
        console.error('Error deleting project:', err);
        if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          setError(err.response?.data?.detail || 'Failed to delete project');
        }
      }
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleViewProject = async (project) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await axios.get(`${backend_url}projects/${project.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSelectedProject(response.data);
    } catch (err) {
      console.error('Error fetching project details:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to fetch project details');
      }
    }
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setShowNewProjectModal(true);
  };

  const handleSaveProject = async (projectData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }
      
      if (selectedProject && showEditModal) {
        // Update existing project
        const response = await axios.put(`${backend_url}projects/${selectedProject.id}`, projectData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Update in local state
        setProjects(projects.map(p => 
          p.id === selectedProject.id ? response.data : p
        ));
      } else {
        // Create new project
        const response = await axios.post(`${backend_url}projects/`, projectData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Add to local state
        setProjects([...projects, response.data]);
      }
      
      setShowEditModal(false);
      setShowNewProjectModal(false);
      setSelectedProject(null);
      setError('');
    } catch (err) {
      console.error('Error saving project:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to save project');
      }
    }
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
      
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}
      
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
        <p>{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        <button className="new-project-btn" onClick={handleNewProject}>
          + New Project
        </button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="no-projects">
          <p>No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map(project => (
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
              </div>

              {/* Team Members */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '4px' }}>
                  Team Members:
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {project.team && project.team.length > 0 ? project.team.map((member, index) => (
                    <span key={index} style={{
                      fontSize: '11px',
                      background: '#f8f9fa',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e9ecef'
                    }}>
                      {member}
                    </span>
                  )) : (
                    <span style={{ fontSize: '11px', color: '#6c757d' }}>No team members assigned</span>
                  )}
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
      {selectedProject && !showEditModal && !showNewProjectModal && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <ProjectFormModal
          project={selectedProject}
          onSave={handleSaveProject}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          title="Edit Project"
        />
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <ProjectFormModal
          onSave={handleSaveProject}
          onClose={() => setShowNewProjectModal(false)}
          title="Create New Project"
        />
      )}
    </div>
  );
};

// Project Detail Modal Component
const ProjectDetailModal = ({ project, onClose }) => (
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
        onClick={onClose}
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
      
      <h3 style={{ marginBottom: '24px', color: '#2c3e50' }}>{project.name}</h3>
      
      <div className="profile-field">
        <label>Description:</label>
        <span>{project.description || 'No description provided'}</span>
      </div>
      
      <div className="profile-field">
        <label>Owner:</label>
        <span>{project.owner}</span>
      </div>
      
      <div className="profile-field">
        <label>Status:</label>
        <span>{project.status}</span>
      </div>
      
      <div className="profile-field">
        <label>Progress:</label>
        <span>{project.progress}%</span>
      </div>
      
      <div className="profile-field">
        <label>Created:</label>
        <span>{new Date(project.createdDate).toLocaleDateString()}</span>
      </div>
      
      <div className="profile-field">
        <label>Modified:</label>
        <span>{new Date(project.lastModified).toLocaleDateString()}</span>
      </div>
      
      <div className="profile-field">
        <label>Team:</label>
        <span>{project.team && project.team.length > 0 ? project.team.join(', ') : 'No team members'}</span>
      </div>
    </div>
  </div>
);

// Project Form Modal Component
const ProjectFormModal = ({ project, onSave, onClose, title }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Project name is required');
      return;
    }
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
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
        maxWidth: '500px', 
        width: '90%',
        margin: 0,
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
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
        
        <h3 style={{ marginBottom: '24px', color: '#2c3e50' }}>{title}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="profile-field">
            <label>Project Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div className="profile-field">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Project
            </button>
            <button 
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageProjects;