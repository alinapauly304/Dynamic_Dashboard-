import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backend_url } from '../config';
import './ProjectDashboard.css';
import { useLocation } from 'react-router-dom';


const ProjectDashboard = ({ project: propProject}) => {
  // State management
    const location = useLocation();
  const project = propProject || location.state?.project;
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [tableSchema, setTableSchema] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [showAddDbModal, setShowAddDbModal] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  const [permissions, setPermissions] = useState([]);
  const hasPermission = (permName) => permissions.includes(permName);
  const [userRole, setUserRole] = useState(null);

   useEffect(() => {
      fetchAllData();
    }, []);

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
    console.log('User response:', userResponse.data); 
  } finally {
    setLoading(false);
  }
};
  // Form states
  const [newDbForm, setNewDbForm] = useState({
    host: '',
    port: 5432,
    user: '',
    password: '',
    dbname: ''
  });
  
  const [newTableForm, setNewTableForm] = useState({
    tablename: '',
    columns: [{ name: '', type: 'VARCHAR(255)', nullable: true, primary: false, auto_increment: false }]
  });
  
  const [insertForm, setInsertForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Helper function to get auth token
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

  // Fetch project databases on component mount
  useEffect(() => {
    if (project?.id) {
      fetchProjectDatabases();
    }
  }, [project]);

  // Fetch tables when database is selected
  useEffect(() => {
    if (selectedDatabase) {
      fetchTables();
    }
  }, [selectedDatabase]);

  // Fetch table data when table is selected
  useEffect(() => {
    if (selectedTable && selectedDatabase) {
      fetchTableData();
      fetchTableSchema();
    }
  }, [selectedTable, selectedDatabase, currentPage]);

  const fetchProjectDatabases = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await axios.get(`${backend_url}Dynamic_db/projects/${project.id}/databases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
          if (response.data.success) {
      setDatabases(response.data.data.databases);
      if (response.data.data.databases.length === 1) {
        setSelectedDatabase(response.data.data.databases[0]);
      }
    }
    setError('');
  } catch (err) {
    console.error('Error fetching databases:', err);
    setError('Failed to fetch project databases');
  } finally {
    setLoading(false);
  }
};

  const fetchTables = async () => {
    if (!selectedDatabase) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${backend_url}Dynamic_db/tablelist`, {
        host: selectedDatabase.host,
        port: selectedDatabase.port,
        user: selectedDatabase.user,
        password: selectedDatabase.password,
        database: selectedDatabase.dbname
      });
      
      if (response.data.success) {
        setTables(response.data.data.tables);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching tables:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable || !selectedDatabase) return;
    
    try {
      setLoading(true);
      const offset = (currentPage - 1) * recordsPerPage;
      
      const response = await axios.post(`${backend_url}Dynamic_db/dbfetch`, {
        host: selectedDatabase.host,
        port: selectedDatabase.port,
        user: selectedDatabase.user,
        password: selectedDatabase.password,
        database: selectedDatabase.dbname,
        tablename: selectedTable,
        limit: recordsPerPage,
        offset: offset
      });
      
      if (response.data.success) {
        setTableData(response.data.data.records);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError('Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

const fetchTableSchema = async () => {
  if (!selectedTable || !selectedDatabase) return;
  
  try {
    const response = await axios.post(`${backend_url}Dynamic_db/tableschema`, {
      host: selectedDatabase.host,
      port: selectedDatabase.port,
      user: selectedDatabase.user,
      password: selectedDatabase.password,
      database: selectedDatabase.dbname,
      tablename: selectedTable
    });
    
    if (response.data.success) {
      setTableSchema(response.data.data.schema);
      // Initialize insert form with empty values based on schema
      const emptyForm = {};
      response.data.data.schema.forEach(col => {
        // Don't include auto-increment columns in the form
        if (!col.column_name.toLowerCase().includes('id') || col.column_default === null) {
          emptyForm[col.column_name] = '';
        }
      });
      setInsertForm(emptyForm);
    }
  } catch (err) {
    console.error('Error fetching table schema:', err);
  }
};

  const handleAddDatabase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // First create the database
      const createDbResponse = await axios.post(`${backend_url}Dynamic_db/dbcreate`, newDbForm);
      
      if (createDbResponse.data.success) {
        // Then save to project-db-detail table
         const saveDbResponse = await axios.post(`${backend_url}Dynamic_db/projects/${project.id}/databases`, {
          host: newDbForm.host,
          port: newDbForm.port,
          user: newDbForm.user,
          password: newDbForm.password,
          dbname: newDbForm.dbname
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      // Check if both operations succeeded
      if (saveDbResponse.data.success) {
        setShowAddDbModal(false);
        setNewDbForm({ host: '', port: 5432, user: '', password: '', dbname: '' });
        fetchProjectDatabases();
        setError(''); // Clear any previous errors
      }
    } else {
      setError('Failed to create database');
    }
  } catch (err) {
    console.error('Error adding database:', err);
    
    // More detailed error handling
    if (err.response) {
      // Server responded with error status
      setError(`Failed to add database: ${err.response.data.detail || err.response.statusText}`);
    } else if (err.request) {
      // Request was made but no response received
      setError('Failed to add database: No response from server');
    } else {
      // Something else happened
      setError(`Failed to add database: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};
  const handleCreateTable = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    
    // Debug: Log the data being sent
    const requestData = {
      host: selectedDatabase.host,
      port: selectedDatabase.port,
      user: selectedDatabase.user,
      password: selectedDatabase.password,
      database: selectedDatabase.dbname,  // Make sure this matches backend expectation
      tablename: newTableForm.tablename,
      columns: newTableForm.columns
    };
    
    console.log('Creating table with data:', requestData);
    
    const response = await axios.post(`${backend_url}Dynamic_db/tablecreate`, requestData);
    
    console.log('Response:', response.data);
    
    if (response.data.success) {
      setShowCreateTableModal(false);
      setNewTableForm({
        tablename: '',
        columns: [{ name: '', type: 'VARCHAR(255)', nullable: true, primary: false, auto_increment: false }]
      });
      fetchTables();
      setError(''); // Clear any previous errors
    } else {
      setError(response.data.message || 'Failed to create table');
    }
  } catch (err) {
    console.error('Error creating table:', err);
    console.error('Error response:', err.response?.data);
    
    // More detailed error handling
    if (err.response?.data?.detail?.error) {
      setError(`Failed to create table: ${err.response.data.detail.error}`);
    } else if (err.response?.data?.message) {
      setError(`Failed to create table: ${err.response.data.message}`);
    } else if (err.response?.data?.detail) {
      setError(`Failed to create table: ${err.response.data.detail}`);
    } else {
      setError('Failed to create table. Please check your input and try again.');
    }
  } finally {
    setLoading(false);
  }
};
const handleInsertRecord = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    
    // Filter out empty values and convert data types
    const cleanData = {};
    Object.keys(insertForm).forEach(key => {
      const value = insertForm[key];
      const column = tableSchema.find(col => col.column_name === key);
      
      // Skip auto-increment columns
      if (column && !column.column_default?.includes('nextval')) {
        if (value !== '' || column.is_nullable === 'NO') {
          // Convert data types based on column type
          let convertedValue = value;
          
          if (value !== '' && value !== null) {
            const dataType = column.data_type.toLowerCase();
            
            if (dataType.includes('int') || dataType.includes('serial')) {
              convertedValue = parseInt(value, 10);
              if (isNaN(convertedValue)) {
                convertedValue = null;
              }
            } else if (dataType.includes('numeric') || dataType.includes('decimal') || dataType.includes('real') || dataType.includes('double')) {
              convertedValue = parseFloat(value);
              if (isNaN(convertedValue)) {
                convertedValue = null;
              }
            } else if (dataType.includes('bool')) {
              convertedValue = value === 'true' || value === true || value === '1';
            }
          } else {
            convertedValue = null;
          }
          
          cleanData[key] = convertedValue;
        }
      }
    });
    
    // Rest of your existing code...
    
    console.log('Sending data:', cleanData); // Debug log
    
    const response = await axios.post(`${backend_url}Dynamic_db/dbinsert`, {
      host: selectedDatabase.host,
      port: selectedDatabase.port,
      user: selectedDatabase.user,
      password: selectedDatabase.password,
      database: selectedDatabase.dbname,
      tablename: selectedTable,
      data: cleanData
    });
    
    if (response.data.success) {
      setShowInsertModal(false);
      fetchTableData();
      // Reset form
      const emptyForm = {};
      tableSchema.forEach(col => {
        if (!col.column_name.toLowerCase().includes('id') || col.column_default === null) {
          emptyForm[col.column_name] = '';
        }
      });
      setInsertForm(emptyForm);
      setError(''); // Clear any previous errors
    } else {
      setError(response.data.message || 'Failed to insert record');
    }
  } catch (err) {
    console.error('Error inserting record:', err);
    console.error('Error response:', err.response?.data);
    
    // More detailed error handling
    if (err.response?.data?.detail?.error) {
      setError(`Failed to insert record: ${err.response.data.detail.error}`);
    } else if (err.response?.data?.message) {
      setError(`Failed to insert record: ${err.response.data.message}`);
    } else {
      setError('Failed to insert record. Please check your data and try again.');
    }
  } finally {
    setLoading(false);
  }
};
 // Updated handleUpdateRecord function for better error handling
const handleUpdateRecord = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    
    // Find primary key column
    const primaryKey = tableSchema.find(col => 
      col.column_name.toLowerCase().includes('id') || 
      col.column_name === 'id'
    );
    
    if (!primaryKey) {
      setError('No primary key found for update operation');
      return;
    }
    
    // Convert data types based on schema
    const processedRecord = { ...editingRecord };
    tableSchema.forEach(col => {
      const value = processedRecord[col.column_name];
      if (value !== null && value !== undefined && value !== '') {
        // Convert numeric types
        if (col.data_type.toLowerCase().includes('int') || 
            col.data_type.toLowerCase().includes('numeric') || 
            col.data_type.toLowerCase().includes('decimal')) {
          processedRecord[col.column_name] = parseInt(value) || parseFloat(value);
        }
        // Convert boolean types
        else if (col.data_type.toLowerCase().includes('bool')) {
          processedRecord[col.column_name] = value === 'true' || value === true;
        }
      }
    });
    
    const whereClause = { [primaryKey.column_name]: processedRecord[primaryKey.column_name] };
    
    // Prepare update data (exclude the primary key from data being updated)
    const updateData = { ...processedRecord };
    delete updateData[primaryKey.column_name];
    
    const response = await axios.post(`${backend_url}Dynamic_db/dbupdate`, {
      host: selectedDatabase.host,
      port: selectedDatabase.port,
      user: selectedDatabase.user,
      password: selectedDatabase.password,
      database: selectedDatabase.dbname,
      tablename: selectedTable,
      data: updateData,
      where: whereClause
    });
    
    if (response.data.success) {
      setShowEditModal(false);
      setEditingRecord(null);
      fetchTableData();
      setError('');
    } else {
      setError(response.data.message || 'Failed to update record');
    }
  } catch (err) {
    console.error('Error updating record:', err);
    setError('Failed to update record');
  } finally {
    setLoading(false);
  }
};
  const handleDeleteRecord = async (record) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      setLoading(true);
      const primaryKey = tableSchema.find(col => col.column_name.includes('id') || col.column_name === 'id');
      const whereClause = primaryKey ? { [primaryKey.column_name]: record[primaryKey.column_name] } : record;
      
      const response = await axios.post(`${backend_url}Dynamic_db/dbdelete`, {
        host: selectedDatabase.host,
        port: selectedDatabase.port,
        user: selectedDatabase.user,
        password: selectedDatabase.password,
        database: selectedDatabase.dbname,
        tablename: selectedTable,
        where: whereClause
      });
      
      if (response.data.success) {
        fetchTableData();
      }
      setError('');
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const handleDropTable = async () => {
    if (!window.confirm(`Are you sure you want to drop table "${selectedTable}"? This action cannot be undone.`)) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${backend_url}Dynamic_db/tabledrop`, {
        host: selectedDatabase.host,
        port: selectedDatabase.port,
        user: selectedDatabase.user,
        password: selectedDatabase.password,
        database: selectedDatabase.dbname,
        tablename: selectedTable
      });
      
      if (response.data.success) {
        setSelectedTable('');
        setTableData([]);
        setTableSchema([]);
        fetchTables();
      }
      setError('');
    } catch (err) {
      console.error('Error dropping table:', err);
      setError('Failed to drop table');
    } finally {
      setLoading(false);
    }
  };

  const addTableColumn = () => {
    setNewTableForm({
      ...newTableForm,
      columns: [...newTableForm.columns, { name: '', type: 'VARCHAR(255)', nullable: true, primary: false, auto_increment: false }]
    });
  };

  const removeTableColumn = (index) => {
    const newColumns = newTableForm.columns.filter((_, i) => i !== index);
    setNewTableForm({ ...newTableForm, columns: newColumns });
  };

  const updateTableColumn = (index, field, value) => {
    const newColumns = [...newTableForm.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setNewTableForm({ ...newTableForm, columns: newColumns });
  };
  // Helper function to determine input type based on data type
const getInputType = (dataType) => {
  const type = dataType.toLowerCase();
  if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
    return 'number';
  } else if (type.includes('date') && !type.includes('time')) {
    return 'date';
  } else if (type.includes('time') && !type.includes('stamp')) {
    return 'time';
  } else if (type.includes('timestamp') || type.includes('datetime')) {
    return 'datetime-local';
  } else if (type.includes('bool')) {
    return 'checkbox';
  }
  return 'text';
};

  if (!project) {
    return (
      <div className="dashboard-container">
        <h2>Project Dashboard</h2>
        <p>No project selected</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Project Dashboard: {project.name}</h2>
        <p className="project-description">{project.description}</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Database Selection Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Database Management</h3> 
          { hasPermission('create database')&&(
          <button className="btn-primary" onClick={() => setShowAddDbModal(true)}>
            + Add Database
          </button>)}
        </div>

        {databases.length === 0 ? (
          <div className="empty-state">
            <p>No databases configured for this project.</p>
            <button className="btn-primary" onClick={() => setShowAddDbModal(true)}>
              Add Your First Database
            </button>
          </div>
        ) : (
          <div className="database-grid">
            {databases.map((db, index) => (
              <div 
                key={index} 
                className={`database-card ${selectedDatabase === db ? 'selected' : ''}`}
                onClick={() => setSelectedDatabase(db)}
              >
                <h4>{db.dbname}</h4>
                <div className="db-details">
                  <p><strong>Host:</strong> {db.host}</p>
                  <p><strong>Port:</strong> {db.port}</p>
                  <p><strong>User:</strong> {db.user}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Management Section */}
      {selectedDatabase && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Tables in {selectedDatabase.dbname}</h3>
            { hasPermission('create table')&&(
            <button className="btn-primary" onClick={() => setShowCreateTableModal(true)}>
              + Create Table
            </button>)}
          </div>

          {tables.length === 0 ? (
            <div className="empty-state">
              <p>No tables found in this database.</p>
            
            </div>
          ) : (
            <div className="table-selector">
              <select 
                value={selectedTable} 
                onChange={(e) => setSelectedTable(e.target.value)}
                className="form-select"
              >
                <option value="">Select a table...</option>
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Table Data Management Section */}
      {selectedTable && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Table: {selectedTable}</h3>
            <div className="table-actions">
              { hasPermission('insert record')&&(
              <button className="btn-success" onClick={() => setShowInsertModal(true)}>
                + Insert Record
              </button>)}
              {hasPermission('drop table')&&(<button className="btn-danger" onClick={handleDropTable}>
                Drop Table
              </button>)}
            </div>
          </div>

          {loading && <div className="loading">Loading...</div>}

          {tableData.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {tableSchema.map(col => (
                      <th key={col.column_name}>{col.column_name}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((record, index) => (
                    <tr key={index}>
                      {tableSchema.map(col => (
                        <td key={col.column_name}>
                          {String(record[col.column_name] || '')}
                        </td>
                      ))}
                      <td>
                        <div className="record-actions">
                          { hasPermission('update record')&&(<button 
                            className="btn-edit"
                            onClick={() => {
                              setEditingRecord({ ...record });
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </button>)}
                          { hasPermission('delete record')&&(<button 
                            className="btn-delete"
                            onClick={() => handleDeleteRecord(record)}
                          >
                            Delete
                          </button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-pagination"
                >
                  Previous
                </button>
                <span>Page {currentPage}</span>
                <button 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={tableData.length < recordsPerPage}
                  className="btn-pagination"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {tableData.length === 0 && !loading && (
            <div className="empty-state">
              <p>No records found in this table.</p>
              
            </div>
          )}
        </div>
      )}

      {/* Add Database Modal */}
      {showAddDbModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Database</h3>
              <button onClick={() => setShowAddDbModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddDatabase}>
              <div className="form-group">
                <label>Database Name:</label>
                <input
                  type="text"
                  value={newDbForm.dbname}
                  onChange={(e) => setNewDbForm({ ...newDbForm, dbname: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Host:</label>
                <input
                  type="text"
                  value={newDbForm.host}
                  onChange={(e) => setNewDbForm({ ...newDbForm, host: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Port:</label>
                <input
                  type="number"
                  value={newDbForm.port}
                  onChange={(e) => setNewDbForm({ ...newDbForm, port: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={newDbForm.user}
                  onChange={(e) => setNewDbForm({ ...newDbForm, user: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newDbForm.password}
                  onChange={(e) => setNewDbForm({ ...newDbForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Database'}
                </button>
                <button type="button" onClick={() => setShowAddDbModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>Create New Table</h3>
              <button onClick={() => setShowCreateTableModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTable}>
              <div className="form-group">
                <label>Table Name:</label>
                <input
                  type="text"
                  value={newTableForm.tablename}
                  onChange={(e) => setNewTableForm({ ...newTableForm, tablename: e.target.value })}
                  required
                />
              </div>
              
              <div className="columns-section">
                <h4>Columns:</h4>
                {newTableForm.columns.map((column, index) => (
                  <div key={index} className="column-row">
                    <input
                      type="text"
                      placeholder="Column name"
                      value={column.name}
                      onChange={(e) => updateTableColumn(index, 'name', e.target.value)}
                      required
                    />
                    <select
                      value={column.type}
                      onChange={(e) => updateTableColumn(index, 'type', e.target.value)}
                    >
                      <option value="VARCHAR(255)">VARCHAR(255)</option>
                      <option value="TEXT">TEXT</option>
                      <option value="INT">INTEGER</option>
                      <option value="BIGINT">BIGINT</option>
                      <option value="DECIMAL">DECIMAL</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                      <option value="TIMESTAMP">TIMESTAMP</option>
                      <option value="DATE">DATE</option>
                    </select>
                    <label>
                      <input
                        type="checkbox"
                        checked={column.primary}
                        onChange={(e) => updateTableColumn(index, 'primary', e.target.checked)}
                      />
                      Primary Key
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={!column.nullable}
                        onChange={(e) => updateTableColumn(index, 'nullable', !e.target.checked)}
                      />
                      NOT NULL
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={column.auto_increment}
                        onChange={(e) => updateTableColumn(index, 'auto_increment', e.target.checked)}
                      />
                      Auto Increment
                    </label>
                    {newTableForm.columns.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeTableColumn(index)}
                        className="btn-delete-small"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTableColumn} className="btn-secondary">
                  + Add Column
                </button>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Table'}
                </button>
                <button type="button" onClick={() => setShowCreateTableModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{showInsertModal && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>Insert New Record</h3>
        <button onClick={() => setShowInsertModal(false)}>×</button>
      </div>
      <form onSubmit={handleInsertRecord}>
        {tableSchema
          .filter(col => {
            // Filter out auto-increment ID columns
            return !(col.column_name.toLowerCase().includes('id') && 
                    col.column_default && 
                    col.column_default.includes('nextval'));
          })
          .map(col => (
          <div key={col.column_name} className="form-group">
            <label>
              {col.column_name} ({col.data_type})
              {col.is_nullable === 'NO' && <span style={{color: 'red'}}> *</span>}
            </label>
            <input
              type={getInputType(col.data_type)}
              value={insertForm[col.column_name] || ''}
              onChange={(e) => setInsertForm({ 
                ...insertForm, 
                [col.column_name]: e.target.value 
              })}
              required={col.is_nullable === 'NO'}
              placeholder={col.is_nullable === 'YES' ? 'Optional' : 'Required'}
            />
            {col.column_default && (
              <small style={{color: '#666'}}>
                Default: {col.column_default}
              </small>
            )}
          </div>
        ))}
        <div className="modal-actions">
          <button type="submit" className="btn-success" disabled={loading}>
            {loading ? 'Inserting...' : 'Insert Record'}
          </button>
          <button type="button" onClick={() => setShowInsertModal(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Edit Record Modal */}
      {showEditModal && editingRecord && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>Edit Record</h3>
        <button onClick={() => setShowEditModal(false)}>×</button>
      </div>
      <form onSubmit={handleUpdateRecord}>
        {tableSchema.map(col => (
          <div key={col.column_name} className="form-group">
            <label>{col.column_name} ({col.data_type}):</label>
            <input
              type={getInputType(col.data_type)} // Use your existing getInputType function
              value={editingRecord[col.column_name] || ''}
              onChange={(e) => setEditingRecord({ 
                ...editingRecord, 
                [col.column_name]: e.target.value 
              })}
              required={col.is_nullable === 'NO'}
              disabled={col.column_name.toLowerCase().includes('id') && col.column_default?.includes('nextval')} // Disable auto-increment fields
            />
          </div>
        ))}
        <div className="modal-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Record'}
          </button>
          <button type="button" onClick={() => setShowEditModal(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default ProjectDashboard;