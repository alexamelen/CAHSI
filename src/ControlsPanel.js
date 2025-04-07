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
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(255, 255, 255, 0.8)',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 100,
    }}>
      <div>
        <label>Fitted Points: {numPoints}</label>
        <input
          type="range"
          min="5"
          max="50"
          value={numPoints}
          onChange={(e) => onNumPointsChange(parseInt(e.target.value))}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={onNewCurve}>New Curve (N)</button>
        <button onClick={onCloseCurve}>Close Curve (C)</button>
        <button onClick={onDeletePoint}>Delete Point (Del)</button>
      </div>
    </div>
  );
};

export default ControlsPanel;