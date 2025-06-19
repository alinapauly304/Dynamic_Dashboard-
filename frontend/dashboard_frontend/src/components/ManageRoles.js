import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showPermissions, setShowPermissions] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Available permissions
  const availablePermissions = [
    { id: 'users.create', name: 'Create Users', category: 'User Management' },
    { id: 'users.read', name: 'View Users', category: 'User Management' },
    { id: 'users.update', name: 'Edit Users', category: 'User Management' },
    { id: 'users.delete', name: 'Delete Users', category: 'User Management' },
    { id: 'projects.create', name: 'Create Projects', category: 'Project Management' },
    { id: 'projects.read', name: 'View Projects', category: 'Project Management' },
    { id: 'projects.update', name: 'Edit Projects', category: 'Project Management' },
    { id: 'projects.delete', name: 'Delete Projects', category: 'Project Management' },
    { id: 'organizations.create', name: 'Create Organizations', category: 'Organization Management' },
    { id: 'organizations.read', name: 'View Organizations', category: 'Organization Management' },
    { id: 'organizations.update', name: 'Edit Organizations', category: 'Organization Management' },
    { id: 'organizations.delete', name: 'Delete Organizations', category: 'Organization Management' },
    { id: 'roles.create', name: 'Create Roles', category: 'Role Management' },
    { id: 'roles.read', name: 'View Roles', category: 'Role Management' },
    { id: 'roles.update', name: 'Edit Roles', category: 'Role Management' },
    { id: 'roles.delete', name: 'Delete Roles', category: 'Role Management' },
    { id: 'reports.view', name: 'View Reports', category: 'Reporting' },
    { id: 'reports.export', name: 'Export Reports', category: 'Reporting' },
    { id: 'system.admin', name: 'System Administration', category: 'System' },
    { id: 'settings.update', name: 'Update Settings', category: 'System' }
  ];

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      setRoles([
        {
          id: 1,
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: availablePermissions.map(p => p.id),
          userCount: 3,
          isSystem: true,
          createdAt: '2022-01-01',
          status: 'active'
        },
        {
          id: 2,
          name: 'Project Manager',
          description: 'Can manage projects and view user information',
          permissions: [
            'projects.create', 'projects.read', 'projects.update', 'projects.delete',
            'users.read', 'organizations.read', 'reports.view'
          ],
          userCount: 8,
          isSystem: false,
          createdAt: '2022-02-15',
          status: 'active'
        },
        {
          id: 3,
          name: 'Developer',
          description: 'Can view and update assigned projects',
          permissions: [
            'projects.read', 'projects.update', 'users.read'
          ],
          userCount: 15,
          isSystem: false,
          createdAt: '2022-03-10',
          status: 'active'
        },
        {
          id: 4,
          name: 'Viewer',
          description: 'Read-only access to projects and users',
          permissions: [
            'projects.read', 'users.read', 'organizations.read'
          ],
          userCount: 5,
          isSystem: false,
          createdAt: '2022-04-20',
          status: 'active'
        },
        {
          id: 5,
          name: 'Analyst',
          description: 'Can view reports and analyze data',
          permissions: [
            'projects.read', 'users.read', 'reports.view', 'reports.export'
          ],
          userCount: 2,
          isSystem: false,
          createdAt: '2022-05-30',
          status: 'inactive'
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

  const handlePermissionChange = (permissionId) => {
    const updatedPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData({
      ...formData,
      permissions: updatedPermissions
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRole) {
      // Update existing role
      setRoles(roles.map(role =>
        role.id === editingRole.id
          ? { ...role, ...formData }
          : role
      ));
      setEditingRole(null);
    } else {
      // Add new role
      const newRole = {
        id: Date.now(),
        ...formData,
        userCount: 0,
        isSystem: false,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      setRoles([...roles, newRole]);
    }
    setFormData({ name: '', description: '', permissions: [] });
    setShowAddForm(false);
  };

  const handleEdit = (role) => {
    if (role.isSystem) {
      alert('System roles cannot be edited');
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    const role = roles.find(r => r.id === id);
    if (role.isSystem) {
      alert('System roles cannot be deleted');
      return;
    }
    if (role.userCount > 0) {
      alert(`Cannot delete role "${role.name}" as it is assigned to ${role.userCount} users`);
      return;
    }
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== id));
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const role = roles.find(r => r.id === id);
    if (role.isSystem) {
      alert('System role status cannot be changed');
      return;
    }
    setRoles(roles.map(role =>
      role.id === id ? { ...role, status: newStatus } : role
    ));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const groupPermissionsByCategory = () => {
    const grouped = {};
    availablePermissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });
    return grouped;
  };

  const getPermissionName = (permissionId) => {
    const permission = availablePermissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
  };

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Roles</h2>
      
      <div className="projects-header">
        <p>Total roles: {roles.length} | Active: {roles.filter(r => r.status === 'active').length}</p>
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
              
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#495057' }}>
                  Permissions
                </label>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #e9ecef', 
                  borderRadius: '8px', 
                  padding: '16px' 
                }}>
                  {Object.entries(groupPermissionsByCategory()).map(([category, permissions]) => (
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
                        {permissions.map(permission => (
                          <label key={permission.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            backgroundColor: formData.permissions.includes(permission.id) ? '#f0f4ff' : 'transparent'
                          }}>
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionChange(permission.id)}
                              style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontSize: '13px', color: '#495057' }}>
                              {permission.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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

      {roles.length === 0 ? (
        <div className="no-projects">
          <p>No roles found. Create your first role to get started.</p>
        </div>
      ) : (
        <div className="projects-list">
          {roles.map(role => (
            <div key={role.id} className="project-card">
              <div className="project-header">
                <h3>
                  {role.name}
                  {role.isSystem && (
                    <span style={{ 
                      fontSize: '11px', 
                      background: '#6c757d', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '10px', 
                      marginLeft: '8px' 
                    }}>
                      SYSTEM
                    </span>
                  )}
                </h3>
                <span className={`status ${role.status}`}>
                  {role.status}
                </span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 12px 0', color: '#6c757d', fontSize: '14px' }}>
                  {role.description}
                </p>
                <p style={{ margin: '0', color: '#2c3e50', fontSize: '13px', fontWeight: '500' }}>
                  {role.permissions.length} permissions assigned
                </p>
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
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Users Assigned</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {role.userCount}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Created</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="project-details">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {!role.isSystem && (
                    <select
                      value={role.status}
                      onChange={(e) => handleStatusChange(role.id, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '11px',
                        border: '1px solid #e9ecef',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                  <button 
                    className="view-btn"
                    onClick={() => setShowPermissions(showPermissions === role.id ? null : role.id)}
                  >
                    {showPermissions === role.id ? 'Hide' : 'Show'} Permissions
                  </button>
                </div>
                <div className="project-actions">
                  <button className="view-btn">View Users</button>
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(role)}
                    disabled={role.isSystem}
                    style={{ opacity: role.isSystem ? 0.5 : 1 }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(role.id)}
                    disabled={role.isSystem}
                    style={{ opacity: role.isSystem ? 0.5 : 1 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {showPermissions === role.id && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50', fontSize: '14px' }}>
                    Assigned Permissions ({role.permissions.length})
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {role.permissions.map(permissionId => (
                      <div key={permissionId} style={{
                        padding: '6px 10px',
                        background: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#495057',
                        border: '1px solid #e9ecef'
                      }}>
                        {getPermissionName(permissionId)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageRoles;