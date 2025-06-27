import React, { useState, useEffect } from 'react';
import './MyProjects.css'; 

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password_hash: '',
    role_id: '',
    organization_id: '',
  });

  // API base URL - adjust this to match your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

 // Get auth token from localStorage
const getAuthToken = () => {
  const userObj = localStorage.getItem('user_obj');
  if (userObj) {
    try {
      const parsed = JSON.parse(userObj);
      return parsed.access_token;
    } catch (error) {
      console.error('Error parsing user_obj from localStorage:', error);
      return null;
    }
  }
  return null;
};

  // API headers with authorization
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      console.log('No token found, redirecting to login');
      setError('Authentication required. Please log in.');
      return {};
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // Fetch all users using the admin endpoint
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required. You need role_id = 2 to manage users.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
      }
      
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingUser) {
        // Update existing user
        const updateData = {};
        
        // Only include fields that have values and are different from original
        if (formData.username && formData.username !== editingUser.username) {
          updateData.username = formData.username;
        }
        if (formData.email && formData.email !== editingUser.email) {
          updateData.email = formData.email;
        }
        if (formData.role_id && parseInt(formData.role_id) !== editingUser.role_id) {
          updateData.role_id = parseInt(formData.role_id);
        }
        if (formData.organization_id && parseInt(formData.organization_id) !== editingUser.organization_id) {
          updateData.organization_id = parseInt(formData.organization_id);
        }

        if (Object.keys(updateData).length === 0) {
          setError('No changes detected to update.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Admin access required to update users.');
          } else if (response.status === 404) {
            throw new Error('User not found.');
          } else {
            throw new Error(`Failed to update user: ${response.status}`);
          }
        }

        setEditingUser(null);
      } else {
        // Add new user
        const createData = {
          username: formData.username,
          email: formData.email,
          password_hash: formData.password_hash,
          role_id: parseInt(formData.role_id),
          organization_id: parseInt(formData.organization_id),
        };

        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Admin access required to create users.');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to create user: ${response.status}`);
          }
        }
      }

      // Reset form and refresh users
      setFormData({ 
        username: '', 
        email: '', 
        password_hash: '', 
        role_id: '', 
        organization_id: '' 
      });
      setShowAddForm(false);
      await fetchUsers();
      setError(null);
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password_hash: '', // Don't populate password for security
      role_id: user.role_id.toString(),
      organization_id: user.organization_id.toString(),
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Admin access required to delete users.');
          } else if (response.status === 404) {
            throw new Error('User not found.');
          } else {
            throw new Error(`Failed to delete user: ${response.status}`);
          }
        }

        await fetchUsers();
        setError(null);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({ 
      username: '', 
      email: '', 
      password_hash: '', 
      role_id: '', 
      organization_id: '' 
    });
    setError(null);
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.username} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || user.role_id.toString() === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading && users.length === 0) {
    return (
      <div className="projects-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Users</h2>
      
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #f5c6cb'
        }}>
          Error: {error}
        </div>
      )}
      
      <div className="projects-header">
        <p>Total users: {users.length}</p>
        <button 
          className="new-project-btn"
          onClick={() => setShowAddForm(true)}
          disabled={loading}
        >
          + Add User
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="project-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              Filter by Role ID
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #e9ecef', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Roles</option>
              <option value="1">Role 1</option>
              <option value="2">Role 2 (Admin)</option>
              
            </select>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="project-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
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
              
              {!editingUser && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password_hash"
                    value={formData.password_hash}
                    onChange={handleInputChange}
                    required={!editingUser}
                    placeholder="Enter password for new user"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Role ID *
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Role</option>
                    <option value="1">Role 1 - User</option>
                    <option value="2">Role 2 - Admin</option>
                    <option value="4">Role 4 - Developer</option>
                    <option value="5">Role 5 - Manager</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Organization ID *
                  </label>
                  <input
                    type="number"
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter organization ID"
                    min="1"
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
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="edit-btn" disabled={loading}>
                {loading ? 'Processing...' : (editingUser ? 'Update User' : 'Add User')}
              </button>
              <button type="button" onClick={handleCancel} className="view-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="no-projects">
          <p>No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="projects-list">
          {filteredUsers.map(user => (
            <div key={user.id} className="project-card">
              <div className="project-header">
                <h3>{user.username}</h3>
                <span className={`status ${user.role_id === 2 ? 'active' : user.is_active ? 'active' : 'inactive'}`}>
                  {user.role_id === 2 ? 'Admin' : `Role ${user.role_id}`}
                </span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                  {user.email}
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#667eea', fontSize: '13px', fontWeight: '600' }}>
                  ID: {user.id}
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
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Organization ID</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {user.organization_id}
                  </p>
                </div>
                <div>
                  
                </div>
              </div>
              
              <div className="project-details">
                <div></div>
                <div className="project-actions">
        
                  <button className="edit-btn" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(user.id)}>
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

export default ManageUsers;