import React, { useState } from 'react';

const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        maxWidth: '500px', 
        width: '90%',
        margin: 0,
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6c757d'
          }}
        >
          ×
        </button>
        
        <h3 style={{ marginBottom: '24px', color: '#2c3e50' }}>Create New Project</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="profile-field">
            <label>Project Name *:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={isSubmitting}
              style={{ width: '100%' }}
              placeholder="Enter project name"
            />
          </div>
          
          <div className="profile-field">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="4"
              disabled={isSubmitting}
              style={{ width: '100%', minHeight: '80px' }}
              placeholder="Enter project description (optional)"
            />
          </div>
          
          <div style={{ 
            marginTop: '32px', 
            textAlign: 'center', 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center' 
          }}>
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;