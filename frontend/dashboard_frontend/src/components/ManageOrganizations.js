import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
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

  // API base URL - adjust this to match your backend
  const API_BASE_URL = 'http://localhost:8000'; // Update this to your backend URL

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
        // Optionally redirect to login
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
        description: '', // Not available in your current model
        website: '', // Not available in your current model
        industry: '', // Not available in your current model
        size: '', // Not available in your current model
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

    try {
      const token = getUserToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      if (editingOrg) {
        // Update existing organization
        const response = await fetch(`${API_BASE_URL}/organizations/${editingOrg.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: formData.name }),
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
          description: '',
          website: '',
          industry: '',
          size: '',
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
          body: JSON.stringify({ name: formData.name }),
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
          description: '',
          website: '',
          industry: '',
          size: '',
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

      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch organization details');
      }

      const orgDetails = await response.json();
      // Handle the organization details based on your backend response
      console.log('Organization details:', orgDetails);
      
      let usersList = '';
      if (orgDetails.users && orgDetails.users.length > 0) {
        usersList = orgDetails.users.map(user => `• ${user.username} (${user.email})`).join('\n');
      } else {
        usersList = 'No users found';
      }
      
      alert(`Organization: ${orgDetails.name}\nUsers: ${orgDetails.users ? orgDetails.users.length : 0}\nCreated: ${new Date(orgDetails.created_at).toLocaleDateString()}\n\nUsers:\n${usersList}`);
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
                <span className={`status ${org.status}`}>
                  {org.status}
                </span>
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