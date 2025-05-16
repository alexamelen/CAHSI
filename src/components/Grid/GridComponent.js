import React from 'react';


export const getGridCell = (point, cellSize) => {
  return {
    x: Math.floor(point.x / cellSize),
    y: Math.floor(point.y / cellSize)
  };
};


const GridComponent = ({ width, height, cellSize = 20, color = '#e0e0e0', highlightedCells = [], showSegments=true }) => {
  const verticalLines = Math.ceil(width / cellSize);
  const horizontalLines = Math.ceil(height / cellSize);
  
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
        backgroundColor: 'white'
      }}
    >
       {highlightedCells.map((cell, index) => {
        const centerX = (cell.x + 0.5) * cellSize;
        const centerY = (cell.y + 0.5) * cellSize;
        
        // Only show orientation if angle is defined and showSegments is true
        const showOrientation = showSegments && typeof cell.angle !== 'undefined';
        const endX = showOrientation 
          ? centerX + Math.cos(cell.angle) * cellSize * 0.4 
          : centerX;
        const endY = showOrientation 
          ? centerY + Math.sin(cell.angle) * cellSize * 0.4 
          : centerY;

        return (
          <g key={`cell-${index}`}>
            {/* Highlighted cell background */}
            <rect
              x={cell.x * cellSize}
              y={cell.y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="rgba(255, 0, 0, 0.1)"
            />
            
            {/* Only show orientation line if angle exists and showSegments is true */}
            {showOrientation && (
              <>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={endX}
                  y2={endY}
                  stroke="blue"
                  strokeWidth={2}
                />
                <circle
                  cx={endX}
                  cy={endY}
                  r={3}
                  fill="purple"
                />
              </>
            )}
          </g>
        );
      })}
      
      {/* Vertical lines */}
      {Array.from({ length: verticalLines + 1 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * cellSize}
          y1={0}
          x2={i * cellSize}
          y2={height}
          stroke={color}
          strokeWidth={1}
        />
      ))}
      
      {/* Horizontal lines */}
      {Array.from({ length: horizontalLines + 1 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * cellSize}
          x2={width}
          y2={i * cellSize}
          stroke={color}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};

export default GridComponent;