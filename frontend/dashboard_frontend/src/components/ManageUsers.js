import React, { useState, useEffect } from 'react';
import './MyProjects.css'; // Reusing existing styles

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    phone: ''
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        {
          id: 1,
          firstName: 'John', 
          lastName: 'Doe',
          email: 'john.doe@company.com',
          role: 'Admin',
          department: 'IT',
          phone: '+1-555-0123',
          status: 'active',
          lastLogin: '2023-06-15',
          joinDate: '2022-01-15',
          projects: 8
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith', 
          email: 'jane.smith@company.com',
          role: 'Project Manager',
          department: 'Operations',
          phone: '+1-555-0124',
          status: 'active',
          lastLogin: '2023-06-14',
          joinDate: '2022-03-20',
          projects: 12
        },
        {
          id: 3,
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@company.com', 
          role: 'Developer',
          department: 'Engineering',
          phone: '+1-555-0125',
          status: 'inactive',
          lastLogin: '2023-05-20',
          joinDate: '2022-06-10',
          projects: 5
        },
        {
          id: 4,
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@company.com',
          role: 'Designer',
          department: 'Design',
          phone: '+1-555-0126',
          status: 'pending',
          lastLogin: null,
          joinDate: '2023-06-01',
          projects: 2
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
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      ));
      setEditingUser(null);
    } else {
      // Add new user
      const newUser = {
        id: Date.now(),
        ...formData,
        status: 'pending',
        lastLogin: null,
        joinDate: new Date().toISOString().split('T')[0],
        projects: 0
      };
      setUsers([...users, newUser]);
    }
    setFormData({ firstName: '', lastName: '', email: '', role: '', department: '', phone: '' });
    setShowAddForm(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, status: newStatus } : user
    ));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({ firstName: '', lastName: '', email: '', role: '', department: '', phone: '' });
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || user.role === filterRole;
    const matchesStatus = filterStatus === '' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>Manage Users</h2>
      
      <div className="projects-header">
        <p>Total users: {users.length} | Active: {users.filter(u => u.status === 'active').length}</p>
        <button 
          className="new-project-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add User
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="project-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
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
              Filter by Role
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
              <option value="Admin">Admin</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
              <option value="Analyst">Analyst</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #e9ecef', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
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
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
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
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
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
                    <option value="Admin">Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
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
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
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
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="edit-btn">
                {editingUser ? 'Update User' : 'Add User'}
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
                <h3>{user.firstName} {user.lastName}</h3>
                <span className={`status ${user.status}`}>
                  {user.status}
                </span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                  {user.email}
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#667eea', fontSize: '13px', fontWeight: '600' }}>
                  {user.role}
                </p>
                {user.phone && (
                  <p style={{ margin: '0', color: '#6c757d', fontSize: '13px' }}>
                    {user.phone}
                  </p>
                )}
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
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Department</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {user.department || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Projects</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {user.projects}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Joined</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {new Date(user.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Last Login</p>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="project-details">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={user.status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
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
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="project-actions">
                  <button className="view-btn">View</button>
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