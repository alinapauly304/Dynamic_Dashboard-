import React, { useEffect, useState } from "react";
import './user_panel.css';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import MyProfile from '../components/MyProfile';
import MyProjects from '../components/MyProjects';
import LogOut from '../components/LogOut';

function UserPanel() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [organization, setOrganization] = useState("");
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Add loading state
    setLoading(true);
    
    fetch("http://localhost:8000/user/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username);
        setRole("user"); 
        setOrganization("Org 1"); 
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setLoading(false);
      });
  }, []);

  // Function to render panel content based on current route
  const renderPanelContent = () => {
    const path = location.pathname;
    
    if (path.includes('/profile')) {
      return <MyProfile />;
    } else if (path.includes('/projects')) {
      return <MyProjects />;
    } else if (path.includes('/logout')) {
      return <LogOut />;
    } else {
      // Default home content
      return (
        <>
          <div className="welcome-section">
            <h2>Welcome back, {username}</h2>
          </div>
          <div className="info-boxes">
            <div className={`info-box ${loading ? 'loading' : ''}`}>
              <h3>Projects</h3>
              <p>{projectCount}</p>
              <div className="subtitle">Active projects</div>
            </div>
            <div className={`info-box ${loading ? 'loading' : ''}`}>
              <h3>Organization</h3>
              <p>{organization}</p>
              <div className="subtitle">Current workspace</div>
            </div>
            <div className={`info-box ${loading ? 'loading' : ''}`}>
              <h3>Role</h3>
              <p>{role}</p>
              <div className="subtitle">Access level</div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="user-panel-container">
      <div className="sidebar">
        <div className="logo">User Dashboard</div>
        <ul className="nav-links">
          <li><Link to="/userpanel">Home</Link></li>
          <li><Link to="/userpanel/projects">My Projects</Link></li>
          <li><Link to="/userpanel/profile">My Profile</Link></li>
          <li><Link to="/userpanel/logout">Logout</Link></li>
        </ul>
      </div>
      <div className="panel">
        {renderPanelContent()}
      </div>
    </div>
  );
}

export default UserPanel;