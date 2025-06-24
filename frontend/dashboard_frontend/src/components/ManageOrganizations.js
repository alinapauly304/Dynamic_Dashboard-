import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: ''
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      setOrganizations([
        {
          id: 1,
          name: 'Tech Innovations Inc.',
          description: 'Leading technology solutions provider',
          website: 'https://techinnovations.com',
          industry: 'Technology',
          size: 'Large',
          members: 150,
          projects: 25,
          status: 'active',
          createdAt: '2023-01-15'
        },
        {
          id: 2,
          name: 'Green Energy Solutions',
          description: 'Sustainable energy consulting',
          website: 'https://greenenergy.com',
          industry: 'Energy',
          size: 'Medium',
          members: 45,
          projects: 12,
          status: 'active',
          createdAt: '2023-03-22'
        },
        {
          id: 3,
          name: 'Healthcare Plus',
          description: 'Digital healthcare platform',
          website: 'https://healthcareplus.com',
          industry: 'Healthcare',
          size: 'Small',
          members: 20,
          projects: 8,
          status: 'pending',
          createdAt: '2023-05-10'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOrg) {
      // Update existing organization
      setOrganizations(organizations.map(org =>
        org.id === editingOrg.id
          ? { ...org, ...formData }
          : org
      ));
      setEditingOrg(null);
    } else {
      // Add new organization
      const newOrg = {
        id: Date.now(),
        ...formData,
        members: 0,
        projects: 0,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setOrganizations([...organizations, newOrg]);
    }
    setFormData({ name: '', description: '', website: '', industry: '', size: '' });
    setShowAddForm(false);
  };

  const handleEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      description: org.description,
      website: org.website,
      industry: org.industry,
      size: org.size
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
      setOrganizations(organizations.filter(org => org.id !== id));
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingOrg(null);
    setFormData({ name: '', description: '', website: '', industry: '', size: '' });
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
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Energy">Energy</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Size
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Size</option>
                    <option value="Small">Small (1-50)</option>
                    <option value="Medium">Medium (51-200)</option>
                    <option value="Large">Large (201-1000)</option>
                    <option value="Enterprise">Enterprise (1000+)</option>
                  </select>
                </div>
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
              

              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                marginBottom: '16px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Industry</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {org.industry || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Size</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {org.size || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="project-details">
                <div>
                  <p>{org.members} members</p>
                  <p>{org.projects} projects</p>
                </div>
                <div className="project-actions">
                  <button className="view-btn">View</button>
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