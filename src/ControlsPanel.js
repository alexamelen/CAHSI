import React, { useState } from 'react';

const ControlsPanel = ({
  numPoints,
  onNumPointsChange,
  onNewCurve,
  onCloseCurve,
  onDeletePoint,
  onToggleMode,
  onToggleDiscretization,
  isDiscretized,
  segmentLengthRatio,
  onSegmentLengthChange,
  showNodesAndPoints,
  onToggleNodesAndPoints,
  gridDensity,
  onGridDensityChange
}) => {
  const [isStraightMode, setIsStraightMode] = useState(false);

  const handleModeToggle = () => {
    const newMode = !isStraightMode;
    setIsStraightMode(newMode);
    onToggleMode(newMode);
  };

  const handleDiscretizationToggle = () => {
    onToggleDiscretization();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '25vw',
      height: '100vh',
      background: 'rgba(240, 240, 240, 0.9)',
      padding: '20px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      zIndex: 100,
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Curve Controls</h2>
      {/*Grid density toggle*/}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Grid Density</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#555' }}>
            Grid Cell Dimension: {gridDensity}x{gridDensity} px
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={gridDensity}
            onChange={(e) => onGridDensityChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      
      {/* Visualization Mode Toggle */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Visualization Mode</h3>
        <button 
          onClick={handleDiscretizationToggle}
          style={{
            padding: '10px',
            fontSize: '14px',
            width: '100%',
            backgroundColor: isDiscretized ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            marginBottom: '8px'
          }}
        >
          {isDiscretized ? 'Discretized Mode' : 'Smooth Mode'}
        </button>
        <div style={{
          fontSize: '0.85em',
          color: '#666',
          textAlign: 'center'
        }}>
          {isDiscretized 
            ? 'Showing segmented approximation with gaps' 
            : 'Showing smooth Bézier curves'}
        </div>
      </div>

      {/* Segment Controls (only visible in discretized mode) */}
      {isDiscretized && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Segment Settings</h3>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.9em', color: '#555' }}>
                Segment Length: {Math.round(segmentLengthRatio * 100)}%
              </label>
              <span style={{ fontSize: '0.85em', color: '#888' }}>
                Gap: {Math.round((1 - segmentLengthRatio) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={segmentLengthRatio * 100}
              onChange={(e) => onSegmentLengthChange(parseInt(e.target.value) / 100)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{
            fontSize: '0.8em',
            color: '#666',
            textAlign: 'center',
            padding: '5px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '4px'
          }}>
            {segmentLengthRatio === 1 
              ? 'Continuous line (no gaps)' 
              : `Each segment covers ${Math.round(segmentLengthRatio * 100)}% of the distance`}
          </div>
        </div>
      )}

      {/* Drawing Mode */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Drawing Mode</h3>
        <button 
          onClick={handleModeToggle}
          style={{
            padding: '10px',
            fontSize: '14px',
            width: '100%',
            backgroundColor: isStraightMode ? '#FF9800' : '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            marginBottom: '8px'
          }}
        >
          {isStraightMode ? 'Straight Line Mode' : 'Curved Mode'}
        </button>
        <div style={{
          fontSize: '0.85em',
          color: '#666',
          textAlign: 'center'
        }}>
          {isStraightMode 
            ? 'New segments will be straight lines' 
            : 'New segments will be smooth curves'}
        </div>
      </div>

      {/* Curve Settings */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Curve Settings</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#555' }}>
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
          <div style={{ fontSize: '0.8em', color: '#888', textAlign: 'center', marginTop: '5px' }}>
            Controls the number of red sampling points
          </div>
        </div>
      </div>

      {/* Curve Actions */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button 
            onClick={onNewCurve}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            New Curve (N)
          </button>
          <button 
            onClick={onCloseCurve}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close Curve (C)
          </button>
          <button 
            onClick={onDeletePoint}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete Point (Del)
          </button>
          <button 
            onClick={onToggleNodesAndPoints}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showNodesAndPoints ? 'Hide Nodes/Points' : 'Show Nodes/Points'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;