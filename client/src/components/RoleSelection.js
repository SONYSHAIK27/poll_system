import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RoleSelection.css';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigate('/student');
    } else if (selectedRole === 'teacher') {
      navigate('/teacher');
    }
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-header">
        <span className="logo-badge">Intervue Poll</span>
        <h1>Welcome to the Live Polling System</h1>
        <p>Please select the role that best describes you to begin using the live polling system</p>
      </div>
      <div className="role-selection-cards">
        <div 
          className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('student')}
        >
          <h3>I'm a Student</h3>
          <p>Submit answers and view live poll results in real-time.</p>
        </div>
        <div 
          className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('teacher')}
        >
          <h3>I'm a Teacher</h3>
          <p>Submit answers and view live poll results in real-time.</p>
        </div>
      </div>
      <button 
        className="continue-button"
        onClick={handleContinue}
        disabled={!selectedRole}
      >
        Continue
      </button>
    </div>
  );
};

export default RoleSelection;