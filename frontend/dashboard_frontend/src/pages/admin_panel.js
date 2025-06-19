import React, { useEffect, useState } from "react";
import './user_panel.css';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import ManageUsers from '../components/ManageUsers';
import ManageRoles from '../components/ManageRoles';
import ManageProjects from '../components/ManageProjects';
import ManageOrganization from '../components/ManageOrganizations';
import MyProfile from '../components/MyProfile';
import LogOut from '../components/LogOut';

function AdminPanel() {
  const [roleCount, setRolecount] = useState("2");
  const [orgCount, setOrgcount] = useState("1");
  const [projectCount, setProjectcount] = useState("1");
  const [userCount, setUsercount] = useState("5");
  
  // Get current location
  const location = useLocation();

  // Function to render panel content based on current route
  const renderPanelContent = () => {
    const path = location.pathname;
    
    if (path.includes('/profile')) {
      return <MyProfile />;
    } else if (path.includes('/manageusers')) {
      return <ManageUsers />;
    } else if (path.includes('/manageroles')) {
      return <ManageRoles />;
    } else if (path.includes('/manageprojects')) {
      return <ManageProjects />;
    } else if (path.includes('/manageorganizations')) {
      return <ManageOrganization />;
    } else if (path.includes('/logout')) {
      return <LogOut />;
    } else {
      return (
        <div className="panel">
          <h2>Welcome Admin</h2>
          <div className="info-boxes">
            <div className="info-box">
              <h3>Total users</h3>
              <p>{userCount}</p>
            </div>
            <div className="info-box">
              <h3>Total Organization</h3>
              <p>{orgCount}</p>
            </div>
            <div className="info-box">
              <h3>Total Projects</h3>
              <p>{projectCount}</p>
            </div>
            <div className="info-box">
              <h3>Total Roles</h3>
              <p>{roleCount}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="user-panel-container">
      <div className="sidebar">
        <div className="logo">Admin Dashboard</div>
        <ul className="nav-links">
          <li><Link to="/adminpanel">Home</Link></li>
          <li><Link to="/adminpanel/profile">My Profile</Link></li>
          <li><Link to="/adminpanel/manageusers">Manage Users</Link></li>
          <li><Link to="/adminpanel/manageroles">Manage Roles</Link></li>
          <li><Link to="/adminpanel/manageprojects">Manage Projects</Link></li>
          <li><Link to="/adminpanel/manageorganizations">Manage Organizations</Link></li>
          <li><Link to="/adminpanel/logout">Logout</Link></li>
        </ul>
      </div>
      <div className="panel">
        {renderPanelContent()}
      </div>
    </div>
  );
}

export default AdminPanel;