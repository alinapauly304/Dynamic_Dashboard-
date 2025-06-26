import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState(new Set());
  const [updatingPermissions, setUpdatingPermissions] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    permission_ids: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get auth token
  const getAuthToken = () => {
    try {
      const userObj = localStorage.getItem('user_obj');
      if (userObj) {
        const userData = JSON.parse(userObj);
        return userData.access_token;
      }
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
          localStorage.removeItem('user_obj');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        throw new Error('Invalid data format received from server');
      }
      
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(`Failed to load roles: ${error.message}`);
      setRoles([]);
    }
  };

  // Fetch permissions from backend
  const fetchPermissions = async () => {
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
      if (Array.isArray(data)) {
        setPermissions(data);
      } else {
        throw new Error('Invalid permissions data format received from server');
      }
      
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError(`Failed to load permissions: ${error.message}`);
      setPermissions([]);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = getAuthToken();
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }

        await Promise.all([fetchRoles(), fetchPermissions()]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
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

  // Handle permission checkbox changes in add form
  const handlePermissionChange = (permissionId) => {
    const updatedPermissions = formData.permission_ids.includes(permissionId)
      ? formData.permission_ids.filter(id => id !== permissionId)
      : [...formData.permission_ids, permissionId];
    
    setFormData({
      ...formData,
      permission_ids: updatedPermissions
    });
  };

  // Handle real-time permission toggle for existing roles
  const handleRolePermissionToggle = async (roleId, permissionId, role) => {
    // Don't allow changes to system roles
    if (role.is_system) {
      setError('Cannot modify permissions for system roles.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const roleKey = `${roleId}-${permissionId}`;
    setUpdatingPermissions(prev => new Set([...prev, roleKey]));

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Determine if we're adding or removing the permission
      const hasPermission = role.permissions.some(p => p.id === permissionId);
      const newPermissionIds = hasPermission
        ? role.permissions.filter(p => p.id !== permissionId).map(p => p.id)
        : [...role.permissions.map(p => p.id), permissionId];

      const updateData = {
        name: role.name,
        permission_ids: newPermissionIds
      };

      const response = await fetch(`${API_BASE}/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to update role permissions: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const updatedRole = await response.json();

      // Update the local state with the response data
      setRoles(prevRoles => 
        prevRoles.map(r => 
          r.id === roleId ? updatedRole : r
        )
      );

      setSuccess(`Permission ${hasPermission ? 'removed from' : 'added to'} role successfully!`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error updating role permissions:', error);
      setError(`Failed to update permissions: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(roleKey);
        return newSet;
      });
    }
  };

  // Handle form submission for new roles
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`${API_BASE}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to create role: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      setSuccess('Role created successfully!');
      setFormData({ name: '', permission_ids: [] });
      setShowAddForm(false);
      
      await fetchRoles();

    } catch (error) {
      console.error('Error creating role:', error);
      setError(error.message);
    }
  };

  // Handle delete role
  const handleDelete = async (roleId, role) => {
    if (role.is_system) {
      setError('Cannot delete system roles.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
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

  // Toggle role expansion
  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Group permissions by category
  const groupPermissionsByCategory = () => {
    const grouped = {};
    permissions.forEach(permission => {
      const category = permission.name.split('.')[0];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(permission);
    });
    return grouped;
  };

  // Check if role has a specific permission
  const roleHasPermission = (role, permissionId) => {
    if (role.is_system) {
      return true; // System roles have all permissions
    }
    return role.permissions && role.permissions.some(p => p.id === permissionId);
  };

  // Get permission count for display
  const getPermissionCount = (role) => {
    if (role.is_system) {
      return permissions.length; // System roles have all permissions
    }
    return role.permissions ? role.permissions.length : 0;
  };

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading">Loading roles and permissions...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Roles & Permissions</h2>
      
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
        <p>
          Total roles: {roles.length} | 
          System roles: {roles.filter(r => r.is_system).length} | 
          Custom roles: {roles.filter(r => !r.is_system).length}
        </p>
        <button 
          className="new-project-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Role'}
        </button>
      </div>

      {showAddForm && (
        <div className="project-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              Add New Role
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
                  Initial Permissions ({formData.permission_ids.length} of {permissions.length} selected)
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
                          {category} ({categoryPermissions.filter(p => formData.permission_ids.includes(p.id)).length}/{categoryPermissions.length})
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
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
                Create Role
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="view-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles Table */}
      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        {/* Table Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto auto auto', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
          fontWeight: '600',
          fontSize: '14px',
          color: '#495057'
        }}>
          <div>Role Name</div>
          <div style={{ textAlign: 'center' }}>Permissions</div>
          <div style={{ textAlign: 'center' }}>Actions</div>
          <div></div>
        </div>

        {/* Table Rows */}
        {roles.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6c757d' }}>
            No roles found. Create your first role to get started.
          </div>
        ) : (
          roles.map(role => (
            <div key={role.id}>
              {/* Role Row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto auto auto', 
                padding: '16px', 
                borderBottom: expandedRoles.has(role.id) ? 'none' : '1px solid #f1f3f4',
                alignItems: 'center',
                backgroundColor: expandedRoles.has(role.id) ? '#f8f9ff' : 'white'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: '0', color: '#2c3e50' }}>{role.name}</h4>
                    {role.is_system && (
                      <span style={{ 
                        padding: '2px 8px',
                        background: '#ffc107',
                        color: '#212529',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        System
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                    {getPermissionCount(role)} of {permissions.length} permissions
                    {role.is_system && ' (All permissions granted)'}
                  </p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 12px',
                    background: role.is_system ? '#fff3cd' : '#e3f2fd',
                    color: role.is_system ? '#856404' : '#1565c0',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getPermissionCount(role)}/{permissions.length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => toggleRoleExpansion(role.id)}
                    style={{
                      padding: '6px 12px',
                      background: expandedRoles.has(role.id) ? '#6c757d' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {expandedRoles.has(role.id) ? 'Collapse' : 'Manage'}
                  </button>
                </div>
                
                <div>
                  <button 
                    onClick={() => handleDelete(role.id, role)}
                    disabled={role.is_system}
                    style={{
                      padding: '6px 12px',
                      background: role.is_system ? '#6c757d' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: role.is_system ? 'not-allowed' : 'pointer',
                      opacity: role.is_system ? 0.6 : 1
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded Permissions Panel */}
              {expandedRoles.has(role.id) && (
                <div style={{ 
                  backgroundColor: '#f8f9ff',
                  borderBottom: '1px solid #f1f3f4',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ 
                      margin: '0', 
                      color: '#2c3e50',
                      fontSize: '16px'
                    }}>
                      Permissions for "{role.name}"
                    </h4>
                    {role.is_system && (
                      <div style={{ 
                        padding: '8px 16px',
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#856404'
                      }}>
                        ⚠️ System Role - All permissions are automatically granted
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gap: '20px'
                  }}>
                    {Object.entries(groupPermissionsByCategory()).map(([category, categoryPermissions]) => {
                      const categoryGrantedCount = categoryPermissions.filter(p => roleHasPermission(role, p.id)).length;
                      
                      return (
                        <div key={category} style={{
                          background: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}>
                          <h5 style={{ 
                            margin: '0 0 12px 0', 
                            color: '#667eea', 
                            fontSize: '14px', 
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{category}</span>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                              {categoryGrantedCount}/{categoryPermissions.length}
                            </span>
                          </h5>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '12px' 
                          }}>
                            {categoryPermissions.map(permission => {
                              const hasPermission = roleHasPermission(role, permission.id);
                              const isUpdating = updatingPermissions.has(`${role.id}-${permission.id}`);
                              const isDisabled = role.is_system || isUpdating;
                              
                              return (
                                <label key={permission.id} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  backgroundColor: hasPermission ? '#e8f5e8' : '#f8f9fa',
                                  border: `1px solid ${hasPermission ? '#c3e6c3' : '#e9ecef'}`,
                                  opacity: isUpdating ? 0.6 : 1,
                                  transition: 'all 0.2s ease'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={hasPermission}
                                    disabled={isDisabled}
                                    onChange={() => handleRolePermissionToggle(role.id, permission.id, role)}
                                    style={{ 
                                      marginRight: '12px',
                                      transform: 'scale(1.2)'
                                    }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: '#2c3e50',
                                      fontWeight: '500',
                                      marginBottom: '2px'
                                    }}>
                                      {permission.description || permission.name}
                                    </div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: '#6c757d',
                                      fontFamily: 'monospace'
                                    }}>
                                      {permission.name}
                                    </div>
                                  </div>
                                  {isUpdating && (
                                    <div style={{ 
                                      fontSize: '12px',
                                      color: '#667eea',
                                      marginLeft: '8px'
                                    }}>
                                      Updating...
                                    </div>
                                  )}
                                  {role.is_system && (
                                    <div style={{ 
                                      fontSize: '12px',
                                      color: '#856404',
                                      marginLeft: '8px'
                                    }}>
                                      Auto-granted
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageRoles;