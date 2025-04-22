import React, { useState } from 'react';
const ControlsPanel = ({
  numPoints,
  onNumPointsChange,
  onNewCurve,
  onCloseCurve,
  onDeletePoint,
  onToggleMode,
}) => {
  const [isStraightMode, setIsStraightMode] = useState(false);

  const handleModeToggle = () => {
    const newMode = !isStraightMode;
    setIsStraightMode(newMode);
    onToggleMode(newMode);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '25vw',
      height: '100vh',
      background: 'rgba(128, 125, 126, 0.43)',
      padding: '20px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      zIndex: 100,
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ marginTop: 0 }}>Controls</h2>
      
      {/* Mode Toggle Button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleModeToggle}
          style={{
            padding: '8px',
            fontSize: '14px',
            width: '100%',
            backgroundColor: isStraightMode ? '#3498db' : '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {isStraightMode ? 'Straight Line Mode' : 'Curve Mode'}
        </button>
        <div style={{
          marginTop: '5px',
          fontSize: '0.8em',
          color: '#333',
          textAlign: 'center'
        }}>
          {isStraightMode 
            ? 'Click to place straight segments' 
            : 'Click to place curved segments'}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Fitted Points: {numPoints}
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={numPoints}
          onChange={(e) => onNumPointsChange(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          onClick={onNewCurve}
          style={{ padding: '8px', fontSize: '14px' }}
        >
          New Curve (N)
        </button>
        <button 
          onClick={onCloseCurve}
          style={{ padding: '8px', fontSize: '14px' }}
        >
          Close Curve (C)
        </button>
        <button 
          onClick={onDeletePoint}
          style={{ padding: '8px', fontSize: '14px' }}
        >
          Delete Point (Del)
        </button>
      </div>

      {/* Intersection Note */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '5px',
        borderLeft: '4px solid #e74c3c',
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#e74c3c' }}>
          Note About Intersections
        </h4>
        <p style={{ 
          margin: 0,
          fontSize: '0.9em',
          lineHeight: '1.5',
          color: '#333'
        }}>
          Make sure your drawing does not include intersections. If an intersection is detected, you will be prompted to reconfigure your nodes!
        </p>
      </div>
    </div>
  );
};

export default ControlsPanel;