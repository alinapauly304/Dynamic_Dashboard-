import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [viewingOrg, setViewingOrg] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: ''
  });

  // Get user token from localStorage
  const getUserToken = () => {
    const userObj = localStorage.getItem('user_obj');
    if (userObj) {
      const userData = JSON.parse(userObj);
      return userData.access_token;
    }
    return null;
  };

  // API base URL 
  const API_BASE_URL = 'http://localhost:8000'; 

  // Fetch organizations from backend
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getUserToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/organizations/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match what your existing models provide
      const transformedData = data.map(org => ({
        id: org.id,
        name: org.name,
        members: org.members || 0,
        projects: org.projects || 0,
        status: org.status || 'active',
        createdAt: org.created_at
      }));
      
      setOrganizations(transformedData);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to fetch organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    try {
      const token = getUserToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      // Prepare the payload with proper structure
      const payload = {
        name: formData.name.trim()
      };

      if (editingOrg) {
        // Update existing organization
        const response = await fetch(`${API_BASE_URL}/organizations/${editingOrg.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update organization');
        }

        const updatedOrg = await response.json();
        // Transform the response to match our frontend structure
        const transformedOrg = {
          id: updatedOrg.id,
          name: updatedOrg.name,
          members: updatedOrg.members || 0,
          projects: updatedOrg.projects || 0,
          status: updatedOrg.status || 'active',
          createdAt: updatedOrg.created_at
        };
        setOrganizations(organizations.map(org =>
          org.id === editingOrg.id ? transformedOrg : org
        ));
        setEditingOrg(null);
      } else {
        // Add new organization
        const response = await fetch(`${API_BASE_URL}/organizations/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to create organization');
        }

        const newOrg = await response.json();
        // Transform the response to match our frontend structure
        const transformedOrg = {
          id: newOrg.id,
          name: newOrg.name,
          members: newOrg.members || 0,
          projects: newOrg.projects || 0,
          status: newOrg.status || 'active',
          createdAt: newOrg.created_at
        };
        setOrganizations([...organizations, transformedOrg]);
      }

      // Reset form
      setFormData({ name: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving organization:', error);
      setError(error.message);
    }
  };

  const handleEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name
    });
    setShowAddForm(true);
    setViewingOrg(null);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      setError('');
      const token = getUserToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete organization');
      }

      // Remove from local state
      setOrganizations(organizations.filter(org => org.id !== id));
      setViewingOrg(null);
    } catch (error) {
      console.error('Error deleting organization:', error);
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingOrg(null);
    setFormData({ name: '' });
    setError('');
  };

  const handleViewOrganization = async (orgId) => {
    try {
      const token = getUserToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      // Fetch organization details
      const orgResponse = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch organization details');
      }

      const orgDetails = await orgResponse.json();

      // Fetch projects for this specific organization using the new endpoint
      const projectsResponse = await fetch(`${API_BASE_URL}/organizations/${orgId}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let projects = [];
      if (projectsResponse.ok) {
        projects = await projectsResponse.json();
      } else {
        console.warn('Failed to fetch projects for organization:', orgId);
        // If the specific endpoint fails, try the general projects endpoint as fallback
        try {
          const fallbackResponse = await fetch(`${API_BASE_URL}/projects/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (fallbackResponse.ok) {
            const allProjects = await fallbackResponse.json();
            // Filter projects to show only those belonging to this organization
            projects = allProjects.filter(project => project.organization_id === orgId);
          }
        } catch (fallbackError) {
          console.warn('Fallback project fetch also failed:', fallbackError);
        }
      }

      // Set the viewing organization with all details
      setViewingOrg({
        ...orgDetails,
        projectsList: projects
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error fetching organization details:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Organizations</h2>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}
      
      <div className="projects-header">
        <p>Total organizations: {organizations.length}</p>
        <button 
          className="new-project-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Organization
        </button>
      </div>

      {showAddForm && (
        <div className="project-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingOrg ? 'Edit Organization' : 'Add New Organization'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="edit-btn">
                {editingOrg ? 'Update Organization' : 'Add Organization'}
              </button>
              <button type="button" onClick={handleCancel} className="view-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingOrg && (
        <div className="project-card" style={{ marginBottom: '24px', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#2c3e50', margin: 0 }}>Organization Details</h3>
            <button 
              onClick={() => setViewingOrg(null)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <strong>Name:</strong> {viewingOrg.name}
            </div>
            <div>
              <strong>Created:</strong> {new Date(viewingOrg.created_at).toLocaleDateString()}
            </div>
            <div>
              <strong>Total Members:</strong> {viewingOrg.users ? viewingOrg.users.length : 0}
            </div>
            <div>
              <strong>Total Projects:</strong> {viewingOrg.projectsList ? viewingOrg.projectsList.length : 0}
            </div>
            
            {viewingOrg.users && viewingOrg.users.length > 0 && (
              <div>
                <strong>Members:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {viewingOrg.users.map(user => (
                    <li key={user.id} style={{ marginBottom: '4px' }}>
                      {user.username} ({user.email}) - Role ID: {user.role_id}
                      {!user.is_active && <span style={{ color: '#dc3545' }}> (Inactive)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {viewingOrg.projectsList && viewingOrg.projectsList.length > 0 ? (
              <div>
                <strong>Projects ({viewingOrg.projectsList.length}):</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {viewingOrg.projectsList.map(project => (
                    <li key={project.id} style={{ marginBottom: '8px' }}>
                      <div>
                        <strong>{project.name}</strong>
                        {project.description && (
                          <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '2px' }}>
                            {project.description}
                          </div>
                        )}
                        <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '2px' }}>
                          Created: {new Date(project.created_at).toLocaleDateString()}
                          {project.owner && ` • Owner: ${project.owner.username || 'Unknown'}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <strong>Projects (0):</strong>
                <p style={{ margin: '8px 0', color: '#6c757d', fontStyle: 'italic' }}>
                  No projects found for this organization.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {organizations.length === 0 ? (
        <div className="no-projects">
          <p>No organizations found. Create your first organization to get started.</p>
        </div>
      ) : (
        <div className="projects-list">
          {organizations.map(org => (
            <div key={org.id} className="project-card">
              <div className="project-header">
                <h3>{org.name}</h3>
        
              </div>
              
              <div className="project-details">
                <div>
                  <p>{org.members} members</p>
                  <p>{org.projects} projects</p>
                  <p style={{ fontSize: '12px', color: '#6c757d' }}>
                    Created: {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="project-actions">
                  <button 
                    className="view-btn" 
                    onClick={() => handleViewOrganization(org.id)}
                  >
                    View
                  </button>
                  <button className="edit-btn" onClick={() => handleEdit(org)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(org.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageOrganizations;