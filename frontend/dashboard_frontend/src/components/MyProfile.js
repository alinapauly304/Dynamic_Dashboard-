import React, { useState, useEffect } from 'react';
import './MyProfile.css';

function MyProfile() {
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    organization: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile data
    setLoading(true);
    
    fetch("http://localhost:8000/user/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserInfo({
          username: data.username ,
          email: data.email ,
          organization: data.organization 
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        // Set default values on error
        setUserInfo({
          username: 'Alina',
          email: 'alina@example.com',
          username: 'alina',
          organization: 'Org 1'
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="profile-container">
        <h2>My Profile</h2>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-info">
        <div className="profile-field">
          <label>Name:</label>
          <span>{userInfo.username}</span>
        </div>
        <div className="profile-field">
          <label>Email:</label>
          <span>{userInfo.email}</span>
        </div>
        <div className="profile-field">
          <label>Organization:</label>
          <span>{userInfo.organization}</span>
        </div>
      </div>
      <button className="edit-profile-btn">Edit Profile</button>
    </div>
  );
}

export default MyProfile;