import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    permission_ids: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get auth token - Fixed to match Login.js format
  const getAuthToken = () => {
    try {
      const userObj = localStorage.getItem('user_obj');
      if (userObj) {
        const userData = JSON.parse(userObj);
        console.log('User data found:', userData);
        return userData.access_token;
      }
      console.log('No user_obj found in localStorage');
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // API base URL
  const API_BASE = 'http://localhost:8000/admin/roles';

  // Fetch roles from backend
  const fetchRoles = async () => {
    console.log('Fetching roles...');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`${API_BASE}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Roles response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch roles: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          // Clear invalid token
          localStorage.removeItem('user_obj');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Fetched roles data:', data);
      
      if (Array.isArray(data)) {
        setRoles(data);
        console.log(`Successfully loaded ${data.length} roles`);
      } else {
        console.error('Roles data is not an array:', data);
        throw new Error('Invalid data format received from server');
      }
      
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(`Failed to load roles: ${error.message}`);
      setRoles([]); // Ensure roles is always an array
    }
  };

  // Fetch permissions from backend
  const fetchPermissions = async () => {
    console.log('Fetching permissions...');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`${API_BASE}/permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Permissions response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch permissions: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          localStorage.removeItem('user_obj');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Fetched permissions data:', data);
      
      if (Array.isArray(data)) {
        setPermissions(data);
        console.log(`Successfully loaded ${data.length} permissions`);
      } else {
        console.error('Permissions data is not an array:', data);
        throw new Error('Invalid permissions data format received from server');
      }
      
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError(`Failed to load permissions: ${error.message}`);
      setPermissions([]); // Ensure permissions is always an array
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log('ManageRoles component mounting, loading data...');
      setLoading(true);
      setError(''); // Clear any previous errors
      
      try {
        // Check if we have a token first
        const token = getAuthToken();
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }

        // Load both roles and permissions
        await Promise.all([fetchRoles(), fetchPermissions()]);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
        console.log('Data loading completed');
      }
    };
    
    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle permission checkbox changes
  const handlePermissionChange = (permissionId) => {
    const updatedPermissions = formData.permission_ids.includes(permissionId)
      ? formData.permission_ids.filter(id => id !== permissionId)
      : [...formData.permission_ids, permissionId];
    
    setFormData({
      ...formData,
      permission_ids: updatedPermissions
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const url = editingRole 
        ? `${API_BASE}/${editingRole.id}` 
        : `${API_BASE}/`;
      
      const method = editingRole ? 'PUT' : 'POST';
      
      console.log('Submitting form:', { method, url, formData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to save role: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      setSuccess(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
      setFormData({ name: '', permission_ids: [] });
      setShowAddForm(false);
      setEditingRole(null);
      
      // Refresh roles list
      await fetchRoles();

    } catch (error) {
      console.error('Error saving role:', error);
      setError(error.message);
    }
  };

  // Handle edit role
  const handleEdit = (role) => {
    console.log('Editing role:', role);
    setEditingRole(role);
    setFormData({
      name: role.name,
      permission_ids: role.permissions ? role.permissions.map(p => p.id) : []
    });
    setShowAddForm(true);
    setError('');
    setSuccess('');
  };

  // Handle delete role
  const handleDelete = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`${API_BASE}/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `Failed to delete role: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      setSuccess('Role deleted successfully!');
      await fetchRoles();

    } catch (error) {
      console.error('Error deleting role:', error);
      setError(error.message);
    }
  };

  // Handle cancel form
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRole(null);
    setFormData({ name: '', permission_ids: [] });
    setError('');
    setSuccess('');
  };

  // Group permissions by category
  const groupPermissionsByCategory = () => {
    const grouped = {};
    permissions.forEach(permission => {
      const category = permission.name.split('.')[0]; // e.g., 'users' from 'users.create'
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(permission);
    });
    return grouped;
  };

  // Test connectivity function
  const testConnectivity = async () => {
    try {
      const token = getAuthToken();
      console.log('Testing connectivity with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE}/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test response status:', response.status);
      const data = await response.json();
      console.log('Test response data:', data);
      
      if (response.ok) {
        setSuccess('Connectivity test successful!');
      } else {
        setError(`Connectivity test failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Connectivity test error:', error);
      setError(`Connectivity test failed: ${error.message}`);
    }
  };

  // Debug info component
  const DebugInfo = () => (
    <div style={{ 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6', 
      borderRadius: '4px', 
      padding: '12px', 
      marginBottom: '16px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <strong>Debug Info:</strong><br/>
      Token: {getAuthToken() ? 'Present' : 'Missing'}<br/>
      Roles: {roles.length} items<br/>
      Permissions: {permissions.length} items<br/>
      Loading: {loading.toString()}<br/>
      API Base: {API_BASE}<br/>
      <button 
        onClick={testConnectivity}
        style={{ 
          marginTop: '8px', 
          padding: '4px 8px', 
          fontSize: '11px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Connectivity
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading">Loading roles and permissions...</div>
        <DebugInfo />
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Roles</h2>
      
      
      
      {error && (
        <div style={{ 
          padding: '12px', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          color: '#c33',
          marginBottom: '16px'
        }}>
          <strong>Error:</strong> {error}
          {error.includes('login') && (
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={() => window.location.href = '/login'}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '12px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '12px', 
          background: '#efe', 
          border: '1px solid #cfc', 
          borderRadius: '4px', 
          color: '#3c3',
          marginBottom: '16px'
        }}>
          {success}
        </div>
      )}
      
      <div className="projects-header">
        <p>Total roles: {roles.length}</p>
        <button 
          className="new-project-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Role
        </button>
      </div>

      {showAddForm && (
        <div className="project-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Role Name *
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
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#495057' }}>
                  Permissions ({formData.permission_ids.length} selected)
                </label>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #e9ecef', 
                  borderRadius: '8px', 
                  padding: '16px' 
                }}>
                  {permissions.length === 0 ? (
                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No permissions available</p>
                  ) : (
                    Object.entries(groupPermissionsByCategory()).map(([category, categoryPermissions]) => (
                      <div key={category} style={{ marginBottom: '16px' }}>
                        <h4 style={{ 
                          margin: '0 0 8px 0', 
                          color: '#667eea', 
                          fontSize: '14px', 
                          fontWeight: '600' 
                        }}>
                          {category}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                          {categoryPermissions.map(permission => (
                            <label key={permission.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '4px',
                              backgroundColor: formData.permission_ids.includes(permission.id) ? '#f0f4ff' : 'transparent'
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.permission_ids.includes(permission.id)}
                                onChange={() => handlePermissionChange(permission.id)}
                                style={{ marginRight: '8px' }}
                              />
                              <span style={{ fontSize: '13px', color: '#495057' }}>
                                {permission.description || permission.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="edit-btn">
                {editingRole ? 'Update Role' : 'Add Role'}
              </button>
              <button type="button" onClick={handleCancel} className="view-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {roles.length === 0 && !loading && !error ? (
        <div className="no-projects">
          <p>No roles found. Create your first role to get started.</p>
        </div>
      ) : (
        <div className="projects-list">
          {roles.map(role => (
            <div key={role.id} className="project-card">
              <div className="project-header">
                <h3>{role.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6c757d',
                    background: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    {role.permissions ? role.permissions.length : 0} permissions
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#495057', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  Assigned Permissions:
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '6px',
                  maxHeight: '80px',
                  overflowY: 'auto'
                }}>
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions.map(permission => (
                      <span key={permission.id} style={{
                        padding: '4px 8px',
                        background: '#e3f2fd',
                        color: '#1565c0',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {permission.description || permission.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '12px' }}>
                      No permissions assigned
                    </span>
                  )}
                </div>
              </div>
              
              <div className="project-actions">
                <button 
                  className="edit-btn" 
                  onClick={() => handleEdit(role)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(role.id, role.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageRoles;