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
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

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

  // Fetch available users when component mounts
  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
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
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${backend_url}projects/available-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAvailableUsers(response.data);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const fetchTeamMembers = async (projectId) => {
    try {
      setLoadingTeam(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${backend_url}projects/${projectId}/team`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to fetch team members');
    } finally {
      setLoadingTeam(false);
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

  const handleManageTeam = async (project) => {
    setSelectedProject(project);
    setShowTeamModal(true);
    await fetchTeamMembers(project.id);
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

  const handleAddTeamMember = async (userId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.post(`${backend_url}projects/${selectedProject.id}/team`, 
        { user_id: userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh team members
      await fetchTeamMembers(selectedProject.id);
      setError('');
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(err.response?.data?.detail || 'Failed to add team member');
    }
  };

  const handleRemoveTeamMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        const token = getAuthToken();
        if (!token) return;

        await axios.delete(`${backend_url}projects/${selectedProject.id}/team/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Refresh team members
        await fetchTeamMembers(selectedProject.id);
        setError('');
      } catch (err) {
        console.error('Error removing team member:', err);
        setError(err.response?.data?.detail || 'Failed to remove team member');
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
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Team Size:</label>
                  <span style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                    {project.team ? project.team.length : 0} members
                  </span>
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
                  <button 
                    className="edit-btn" 
                    onClick={() => handleManageTeam(project)}
                    style={{ backgroundColor: '#17a2b8', marginLeft: '8px' }}
                  >
                    Team
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
      {selectedProject && !showEditModal && !showNewProjectModal && !showTeamModal && (
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

      {/* Team Management Modal */}
      {showTeamModal && selectedProject && (
        <TeamManagementModal
          project={selectedProject}
          teamMembers={teamMembers}
          availableUsers={availableUsers}
          loadingTeam={loadingTeam}
          onAddMember={handleAddTeamMember}
          onRemoveMember={handleRemoveTeamMember}
          onClose={() => {
            setShowTeamModal(false);
            setSelectedProject(null);
            setTeamMembers([]);
          }}
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
        <label>Created:</label>
        <span>{new Date(project.createdDate).toLocaleDateString()}</span>
      </div>
      
      <div className="profile-field">
        <label>Modified:</label>
        <span>{new Date(project.lastModified).toLocaleDateString()}</span>
      </div>

      {project.team && project.team.length > 0 && (
        <div className="profile-field">
          <label>Team Members:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {project.team.map(member => (
              <span 
                key={member.id}
                style={{
                  background: '#e9ecef',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#495057'
                }}
              >
                {member.username}
              </span>
            ))}
          </div>
        </div>
      )}
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

// Team Management Modal Component
const TeamManagementModal = ({ 
  project, 
  teamMembers, 
  availableUsers, 
  loadingTeam, 
  onAddMember, 
  onRemoveMember, 
  onClose 
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Please select a user to add');
      return;
    }
    onAddMember(parseInt(selectedUserId));
    setSelectedUserId('');
  };

  // Filter out users who are already team members
  const availableToAdd = availableUsers.filter(user => 
    !teamMembers.some(member => member.id === user.id)
  );

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
        maxWidth: '700px', 
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
        
        <h3 style={{ marginBottom: '24px', color: '#2c3e50' }}>
          Manage Team - {project.name}
        </h3>

        {/* Add Team Member Section */}
        <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '16px', color: '#495057' }}>Add Team Member</h4>
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Select User:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a user...</option>
                {availableToAdd.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              disabled={!selectedUserId}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedUserId ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedUserId ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              Add Member
            </button>
          </form>
        </div>

        {/* Current Team Members */}
        <div>
          <h4 style={{ marginBottom: '16px', color: '#495057' }}>
            Current Team Members ({teamMembers.length})
          </h4>
          
          {loadingTeam ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
              No team members assigned to this project.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {teamMembers.map(member => (
                <div 
                  key={member.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {member.username}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {member.email} • {member.role}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageProjects;