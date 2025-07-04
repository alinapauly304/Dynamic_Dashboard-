import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { backend_url } from '../config';
import './MyProjects.css';
import './MyProfile.css';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import ProjectDetailModal from './ProjectDetailModal';

const UserMyProjects = () => {
  const navigate = useNavigate();
  const [organizationProjects, setOrganizationProjects] = useState([]);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [organizationStats, setOrganizationStats] = useState(null);
  const [assignedStats, setAssignedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('organization');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const hasPermission = (permName) => permissions.includes(permName);
const [userRole, setUserRole] = useState(null);

const isOrg_admin = () => {
  return userRole === 6; 
};
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

  useEffect(() => {
    fetchAllData();
  }, []);


  const getFilteredProjects = (projects) => {
    return projects.filter(project => {
      const matchesSearch = !searchTerm || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.owner.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        project.status.toLowerCase().replace(' ', '-') === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

const fetchAllData = async () => {
  try {
    setLoading(true);
    const token = getAuthToken();
    
    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Fetch permissions first
    const permissionResponse = await axios.get(`${backend_url}user/permissions`, { headers });
    setPermissions(permissionResponse.data.permissions || []);

    // Fetch user role information
    const userResponse = await axios.get(`${backend_url}user/me`, { headers });
    console.log('User response:', userResponse.data); // Debug log
    setUserRole(userResponse.data.role_id); // Set role_id directly

    // Only fetch projects if user has view permission
    if (permissionResponse.data.permissions?.includes('view projects')) {
      // Fetch assigned projects (for all users)
      const assignedProjectsResponse = await axios.get(`${backend_url}user/assigned-projects`, { headers });
      setAssignedProjects(assignedProjectsResponse.data.projects);
      
      // Fetch assigned stats
      const assignedStatsResponse = await axios.get(`${backend_url}user/team-projects/stats`, { headers });
      setAssignedStats(assignedStatsResponse.data);

      // Only fetch organization projects if user is Org_admin (role_id === 6)
      if (userResponse.data.role_id === 6) {
        console.log('Fetching org projects for Org_admin'); // Debug log
        const orgProjectsResponse = await axios.get(`${backend_url}user/projects`, { headers });
        setOrganizationProjects(orgProjectsResponse.data.projects);

        const orgStatsResponse = await axios.get(`${backend_url}user/projects/stats/summary`, { headers });
        setOrganizationStats(orgStatsResponse.data);
      } else {
        console.log('User is not Org_admin, role_id:', userResponse.data.role_id); // Debug log
      }
    }

    setError('');
  } catch (err) {
    console.error('Error fetching data:', err);
    if (err.response?.status === 401) {
      setError('Authentication failed. Please login again.');
    } else {
      setError(err.response?.data?.detail || 'Failed to fetch data');
    }
  } finally {
    setLoading(false);
  }
};
  const handleCreateProject = async (projectData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await axios.post(`${backend_url}projects/`, projectData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh projects list
      await fetchAllData();
      setShowCreateModal(false);
      setError('');
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleEditProject = async (projectData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await axios.put(`${backend_url}projects/${editingProject.id}`, projectData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh projects list
      await fetchAllData();
      setShowEditModal(false);
      setEditingProject(null);
      setError('');
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.detail || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      await axios.delete(`${backend_url}user/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh projects list
      await fetchAllData();
      setError('');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.detail || 'Failed to delete project');
    }
  };
  
  const handleViewDashboard = async (project) => {
  navigate('/userpanel/dashboard', { state: { project } });
};
  const handleViewProject = async (project) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const endpoint = activeTab === 'organization' 
        ? `${backend_url}user/projects/${project.id}`
        : `${backend_url}user/assigned-projects/${project.id}`;

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSelectedProject(response.data);
    } catch (err) {
      console.error('Error fetching project details:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to fetch project details');
      }
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const currentProjects = activeTab === 'organization' ? organizationProjects : assignedProjects;
  const filteredProjects = getFilteredProjects(currentProjects);

  // Show permission denied message if user doesn't have view permission
  if (!hasPermission('view projects')) {
    return (
      <div className="projects-container">
        <h2>My Projects</h2>
        <div className="no-projects">
          <p>You don't have permission to view projects. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h2>My Projects</h2>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #e9ecef' }}>
          {isOrg_admin()&&(
          <button
            onClick={() => setActiveTab('organization')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'organization' ? '2px solid #007bff' : '2px solid transparent',
              color: activeTab === 'organization' ? '#007bff' : '#6c757d',
              fontWeight: activeTab === 'organization' ? 'bold' : 'normal'
            }}
          >
            Organization Projects ({organizationProjects.length})
          </button>)}
          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'assigned' ? '2px solid #007bff' : '2px solid transparent',
              color: activeTab === 'assigned' ? '#007bff' : '#6c757d',
              fontWeight: activeTab === 'assigned' ? 'bold' : 'normal'
            }}
          >
            Assigned Projects ({assignedProjects.length})
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="profile-info" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              background: '#f8f9fa',
              fontSize: '14px',
              flex: '1',
              minWidth: '200px'
            }}
          />
        </div>
      </div>

      {/* Create Project Button - Only show if user has create permission */}
      {hasPermission('create project') && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              borderRadius: '8px',
              padding: '12px 16px',
              border: '1px solid rgb(93, 68, 144)',
              backgroundColor: 'white',
              color: 'rgb(93, 68, 144)',
              cursor: 'pointer',
            }}
          >
            Create New Project
          </button>
        </div>
      )}

      {/* Projects Header */}
      <div className="projects-header">
        <p>
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          {activeTab === 'assigned' && ' (where you are a team member)'}
        </p>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="no-projects">
          <p>
            {currentProjects.length === 0 
              ? `No ${activeTab === 'organization' ? 'organization' : 'assigned'} projects found.`
              : 'No projects match your search criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="projects-list">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
              </div>
              
              <p style={{ color: '#6c757d', marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                {project.description || 'No description provided'}
              </p>

              {/* Project Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Owner:</label>
                  <span style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                    {project.owner}
                  </span>
                </div>
                <div className="profile-field" style={{ margin: 0, padding: '8px 0', borderBottom: 'none' }}>
                  <label style={{ width: 'auto', marginRight: '8px', fontSize: '12px' }}>Created:</label>
                  <span style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                    {new Date(project.created).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="project-details">
                <div className="project-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="view-btn" onClick={() => handleViewProject(project)}>
                    View Details
                  </button>

                   <button className="view-btn" onClick={() => handleViewDashboard(project)}>
                    View Dashboard
                  </button>
                  
                  {/* Edit button - Only show if user has update permission and it's organization tab */}
                  {hasPermission('update project details') && activeTab === 'organization' && (
                    <button 
                      onClick={() => openEditModal(project)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                  )}
                  
                  {/* Delete button - Only show if user has delete permission and it's organization tab */}
                  {hasPermission('delete project') && activeTab === 'organization' && (
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
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
                      Delete
                    </button>
                  )}
                  
                  {activeTab === 'assigned' && (
                    <span style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#17a2b8', 
                      color: 'white', 
                      borderRadius: '4px', 
                      fontSize: '12px'
                    }}>
                      Team Member
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {showEditModal && editingProject && (
        <EditProjectModal 
          project={editingProject}
          onClose={() => {
            setShowEditModal(false);
            setEditingProject(null);
          }}
          onSubmit={handleEditProject}
        />
      )}

      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)}
          isAssigned={activeTab === 'assigned'}
          permissions={permissions}
          onRefresh={fetchAllData}
        />
      )}
    </div>
  );
};

export default UserMyProjects;