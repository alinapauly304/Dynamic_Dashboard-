import React, { useState, useEffect } from 'react';
import './MyProfile.css';
import { myProfile_endpoint } from '../config';

function MyProfile() {
  const [userInfo, setUserInfo] = useState({
    id: '',
    username: '',
    email: '',
    role_id: '',
    organization_id: '',
    role_name: '',
    organization_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    role_id: '',
    organization_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = () => {
    setLoading(true);
    setError(null);
    const userObj = JSON.parse(localStorage.getItem("user_obj"));
    const token = userObj?.access_token;
    console.log("Token exists:", !!token);
    console.log("Token (first 20 chars):", token ? token.substring(0, 20) + "..." : "No token");
    
    fetch(myProfile_endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then((res) => {
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API Response:", data); 
        
        setUserInfo({
          id: data.id || '',
          username: data.username || '',
          email: data.email || '',
          role_id: data.role_id || '',
          organization_id: data.organization_id || '',
          role_name: data.role_name || '',
          organization_name: data.organization_name || ''
        });
        setEditData({
          username: data.username || '',
          email: data.email || '',
          role_id: data.role_id || '',
          organization_id: data.organization_id || ''
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        setError(err.message);
        setLoading(false);
        
      });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      username: userInfo.username,
      email: userInfo.email,
      role_id: userInfo.role_id,
      organization_id: userInfo.organization_id
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSaveProfile = async () => {
  setSaving(true);
  
  try {
    const userObj = JSON.parse(localStorage.getItem("user_obj"));
    const token = userObj?.access_token;
    const response = await fetch(myProfile_endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedUser = await response.json();
    console.log("Update response:", updatedUser);
    

    setUserInfo({
      id: updatedUser.id || userInfo.id,
      username: updatedUser.username || '',
      email: updatedUser.email || '',
      role_id: updatedUser.role_id || '',
      organization_id: updatedUser.organization_id || '',
      role_name: updatedUser.role_name || userInfo.role_name,
      organization_name: updatedUser.organization_name || userInfo.organization_name
    });
    
    setIsEditing(false);
    alert('Profile updated successfully!');
    
  } catch (err) {
    console.error("Error updating profile:", err);
    alert('Failed to update profile. Please try again.');
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="profile-container">
        <h2>My Profile</h2>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <h2>My Profile</h2>
        <div className="error">
          <p>Error loading profile: {error}</p>
          <button onClick={fetchUserProfile}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      
   
      
      <div className="profile-info">
        <div className="profile-field">
          <label>Name:</label>
          {isEditing ? (
            <input
              type="text"
              name="username"
              value={editData.username}
              onChange={handleInputChange}
              className="edit-input"
            />
          ) : (
            <span>{userInfo.username || 'No username'}</span>
          )}
        </div>
        
        <div className="profile-field">
          <label>Email:</label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={editData.email}
              onChange={handleInputChange}
              className="edit-input"
            />
          ) : (
            <span>{userInfo.email || 'No email'}</span>
          )}
        </div>
        
        <div className="profile-field">
          <label>Role:</label>
          <span>{userInfo.role_name || `Role ID: ${userInfo.role_id}` || 'No role'}</span>
        </div>
        
        <div className="profile-field">
          <label>Organization:</label>
          <span>{userInfo.organization_name || `Org ID: ${userInfo.organization_id}` || 'No organization'}</span>
        </div>
      </div>
      
      <div className="profile-actions">
        {isEditing ? (
          <>
            <button 
              className="edit-profile-btn" 
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="edit-profile-btn" 
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </>
        ) : (
          <button className="edit-profile-btn" onClick={handleEditClick}>
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

export default MyProfile;