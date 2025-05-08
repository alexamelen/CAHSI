import React from 'react';

const GridComponent = ({ width, height, cellSize = 20, color = '#e0e0e0' }) => {
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