import React from 'react';

const ControlsPanel = ({
  numPoints,
  onNumPointsChange,
  onNewCurve,
  onCloseCurve,
  onDeletePoint,
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '25vw',  // 25% of viewport width
      height: '100vh', // full viewport height
      background: 'rgba(128, 125, 126, 0.43)',
      padding: '20px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      zIndex: 100,
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ marginTop: 0 }}>Controls</h2>
      
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
    </div>
  );
};

export default ControlsPanel;