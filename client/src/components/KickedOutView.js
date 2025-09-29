import React from 'react';
import '../styles/KickedOutView.css';

const KickedOutView = () => {
  return (
    <div className="kicked-out-container">
      <div className="kicked-out-card">
        <span className="logo-badge">Intervue Poll</span>
        <h1>You've been Kicked out!</h1>
        <p>Looks like the teacher removed you from the poll system. Please try again sometime.</p>
      </div>
    </div>
  );
};

export default KickedOutView;
