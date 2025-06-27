import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backend_url } from '../config';

const ProjectDetailModal = ({ project, onClose, isAssigned = false, permissions = [], onRefresh }) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasPermission = (permName) => permissions.includes(permName);

  const getAuthToken = () => {
    try {
      let token = localStorage.getItem('token');
      
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

  // Fetch team members and available users when modal opens
  useEffect(() => {
    if (project && project.id) {
      fetchTeamMembers();
      if (hasPermission('manage team members') && !isAssigned) {
        fetchAvailableUsers();
      }
    }
  }, [project]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      // Use the team data from project if available, otherwise fetch from API
      if (project.team && Array.isArray(project.team)) {
        setTeamMembers(project.team);
      } else {
        // Fallback to API call if team data not available
        const response = await axios.get(`${backend_url}projects/${project.id}/team`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setTeamMembers(response.data);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${backend_url}projects/${project.id}/available-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Filter out users who are already team members
      const currentTeamIds = teamMembers.map(member => member.id);
      const filtered = response.data.filter(user => !currentTeamIds.includes(user.id));
      setAvailableUsers(filtered);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const handleAddTeamMemberByEmail = async () => {
    if (!newMemberEmail.trim()) {
      alert('Please enter a valid email address');
      return;
    }

    setIsAddingMember(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      
      const userResponse = await axios.get(`${backend_url}user/${newMemberEmail}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const user = userResponse.data;
      
      // Add team member using the projects endpoint
      await axios.post(`${backend_url}projects/${project.id}/team`, {
        user_id: user.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh data
      await fetchTeamMembers();
      await fetchAvailableUsers();
      if (onRefresh) {
        await onRefresh();
      }
      
      setNewMemberEmail('');
      setShowAddMember(false);
      alert('Team member added successfully!');
      
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(err.response?.data?.detail || 'Failed to add team member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleAddTeamMemberBySelect = async () => {
    if (!selectedUserId) {
      alert('Please select a user to add');
      return;
    }

    setIsAddingMember(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      // Add team member using the projects endpoint
      await axios.post(`${backend_url}projects/${project.id}/team`, {
        user_id: parseInt(selectedUserId)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh data
      await fetchTeamMembers();
      await fetchAvailableUsers();
      if (onRefresh) {
        await onRefresh();
      }
      
      setSelectedUserId('');
      setShowAddMember(false);
      alert('Team member added successfully!');
      
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(err.response?.data?.detail || 'Failed to add team member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      // Use the projects endpoint for removing team members
      await axios.delete(`${backend_url}projects/${project.id}/team/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh data
      await fetchTeamMembers();
      await fetchAvailableUsers();
      if (onRefresh) {
        await onRefresh();
      }
      
      alert('Team member removed successfully!');
      
    } catch (err) {
      console.error('Error removing team member:', err);
      setError(err.response?.data?.detail || 'Failed to remove team member');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (!project) return null;

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
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: 0,
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>Project Details</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '16px', 
            padding: '12px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
            border: '1px solid #ff9999'
          }}>
            {error}
          </div>
        )}

        {/* Project Information */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Project Information</h3>
          
          <div className="profile-field">
            <label>Project Name:</label>
            <span>{project.name}</span>
          </div>

          <div className="profile-field">
            <label>Description:</label>
            <span>{project.description || 'No description provided'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="profile-field">
              <label>Owner:</label>
              <span>{project.owner}</span>
            </div>

            <div className="profile-field">
              <label>Organization:</label>
              <span>{project.organization || 'N/A'}</span>
            </div>

            <div className="profile-field">
              <label>Status:</label>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: project.status === 'Active' ? '#d4edda' : '#fff3cd',
                color: project.status === 'Active' ? '#155724' : '#856404'
              }}>
                {project.status || 'Active'}
              </span>
            </div>

            <div className="profile-field">
              <label>Created Date:</label>
              <span>{formatDate(project.created || project.createdDate)}</span>
            </div>
          </div>
        </div>

        {/* Team Management Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>Team Members ({teamMembers.length})</h3>
            
            {/* Add Team Member Button - Only show if user has permission and it's not an assigned project */}
            {hasPermission('correct add team member') && !isAssigned && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showAddMember ? 'Cancel' : 'Add Member'}
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ marginBottom: '12px' }}>Add Team Member</h4>
              
              {/* Add by Email */}
              <div style={{ marginBottom: '16px' }}>
                {/*<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Add by Email:
                </label>*/}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    onClick={handleAddTeamMemberByEmail}
                    disabled={isAddingMember}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isAddingMember ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isAddingMember ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Add by Selection */}
              {availableUsers.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    select from organization:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="">Select a user...</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddTeamMemberBySelect}
                      disabled={isAddingMember || !selectedUserId}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (isAddingMember || !selectedUserId) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isAddingMember ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Members List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>
              No team members assigned to this project yet.
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '12px'
            }}>
              {teamMembers.map(member => (
                <div key={member.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <strong>{member.username}</strong>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {member.email}
                    </div>
                    {member.role && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        marginTop: '4px'
                      }}>
                        Role: {member.role}
                      </div>
                    )}
                    {member.is_current_user && (
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        You
                      </span>
                    )}
                  </div>

                  {/* Remove button - Only show if user has permission and it's not an assigned project */}
                  {hasPermission('manage team members') && !isAssigned && (
                    <button
                      onClick={() => handleRemoveTeamMember(member.id)}
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
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

export default ProjectDetailModal;