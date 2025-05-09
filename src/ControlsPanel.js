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
  onGridDensityChange,
  showOriginalLines,
  onToggleOriginalLines,
  showGridSegments,
  onToggleGridSegments
}) => {
  const [isStraightMode, setIsStraightMode] = useState(false);

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

      {/* Grid Density Control */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Grid Cell Dimension</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#555' }}>
            {gridDensity}x{gridDensity} px
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
      
      {/*Grid discretization visibilty */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#555' }}>Grid Discretization</h4>
      <div style={{ display: 'flex', gap: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="radio"
            name="gridSegmentsVisibility"
            checked={showGridSegments}
            onChange={() => onToggleGridSegments(true)}
            style={{ marginRight: '6px' }}
          />
          On
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="radio"
            name="gridSegmentsVisibility"
            checked={!showGridSegments}
            onChange={() => onToggleGridSegments(false)}
            style={{ marginRight: '6px' }}
          />
          Off
        </label>
      </div>
    </div>
    

      {/* Visualization Mode - Radio Buttons */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Visualization Mode</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: !isDiscretized ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="visualizationMode"
              checked={!isDiscretized}
              onChange={() => onToggleDiscretization(false)}
              style={{ marginRight: '8px' }}
            />
            <div>
              <div style={{ fontWeight: '500', color: '#333' }}>Smooth Mode</div>
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                Showing smooth Bézier curves
              </div>
            </div>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: isDiscretized ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="visualizationMode"
              checked={isDiscretized}
              onChange={() => onToggleDiscretization(true)}
              style={{ marginRight: '8px' }}
            />
            <div>
              <div style={{ fontWeight: '500', color: '#333' }}>Discretized Mode</div>
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                Showing segmented approximation with gaps
              </div>
            </div>
          </label>
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

      {/* Drawing Mode - Radio Buttons */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Drawing Mode</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: !isStraightMode ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="drawingMode"
              checked={!isStraightMode}
              onChange={() => {
                setIsStraightMode(false);
                onToggleMode(false);
              }}
              style={{ marginRight: '8px' }}
            />
            <div>
              <div style={{ fontWeight: '500', color: '#333' }}>Curved Mode</div>
            </div>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: isStraightMode ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="drawingMode"
              checked={isStraightMode}
              onChange={() => {
                setIsStraightMode(true);
                onToggleMode(true);
              }}
              style={{ marginRight: '8px' }}
            />
            <div>
              <div style={{ fontWeight: '500', color: '#333' }}>Straight Line Mode</div>
            </div>
          </label>
        </div>
      </div>

      {/* Showing/Hiding*/}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1em', color: '#555' }}>Showing/Hiding</h3>
        
        {/* Original Lines Visibility */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#555' }}>Original Lines</h4>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="originalLinesVisibility"
                checked={showOriginalLines}
                onChange={() => onToggleOriginalLines(true)}
                style={{ marginRight: '6px' }}
              />
              Show
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="originalLinesVisibility"
                checked={!showOriginalLines}
                onChange={() => onToggleOriginalLines(false)}
                style={{ marginRight: '6px' }}
              />
              Hide
            </label>
          </div>
        </div>

        {/* Nodes/Points Visibility */}
        {showOriginalLines && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#555' }}>Nodes & Points</h4>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="nodesVisibility"
                  checked={showNodesAndPoints}
                  onChange={() => onToggleNodesAndPoints(true)}
                  style={{ marginRight: '6px' }}
                />
                Show
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="nodesVisibility"
                  checked={!showNodesAndPoints}
                  onChange={() => onToggleNodesAndPoints(false)}
                  style={{ marginRight: '6px' }}
                />
                Hide
              </label>
            </div>
          </div>
        )}
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
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;