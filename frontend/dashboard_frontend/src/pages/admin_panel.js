import React, { useState } from "react";
import './user_panel.css';
import { Link, Routes, Route, Outlet } from 'react-router-dom';
import ManageUsers from '../components/ManageUsers';
import ManageRoles from '../components/ManageRoles';
import ManageProjects from '../components/ManageProjects';
import ManageOrganization from '../components/ManageOrganizations';
import MyProfile from '../components/MyProfile';
import LogOut from '../components/LogOut';
import ProjectDashboard from "../components/ProjectDashboard";

function AdminHome({ userCount, orgCount, projectCount, roleCount }) {
  return (
    <div className="panel">
      <h2>Welcome Admin</h2>
      <div className="info-boxes">
        <div className="info-box"><h3>Total users</h3><p>{userCount}</p></div>
        <div className="info-box"><h3>Total Organization</h3><p>{orgCount}</p></div>
        <div className="info-box"><h3>Total Projects</h3><p>{projectCount}</p></div>
        <div className="info-box"><h3>Total Roles</h3><p>{roleCount}</p></div>
      </div>
    </div>
  );
}

function AdminPanel() {
  const [roleCount] = useState("2");
  const [orgCount] = useState("1");
  const [projectCount] = useState("1");
  const [userCount] = useState("5");

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
        <Routes>
          <Route index element={<AdminHome 
            userCount={userCount} 
            orgCount={orgCount} 
            projectCount={projectCount} 
            roleCount={roleCount} 
          />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="manageusers" element={<ManageUsers />} />
          <Route path="manageroles" element={<ManageRoles />} />
          <Route path="manageprojects" element={<ManageProjects />} />
          <Route path="manageorganizations" element={<ManageOrganization />} />
          <Route path="logout" element={<LogOut />} />
          <Route path="dashboard" element={<ProjectDashboard /> } />
        </Routes>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminPanel;
