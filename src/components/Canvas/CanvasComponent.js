import React, { useRef, useState } from 'react';
import ControlsPanel from '../Controls/ControlsPanel';
import GridComponent from '../Grid/GridComponent';
import useCanvasInteractions from './useCanvasInteractions';
import useCurveDrawing from './useCurveDrawing';

const CanvasComponent = () => {
  const canvasRef = useRef(null);
  const [gridDensity, setGridDensity] = useState(20);
  const [showOriginalLines, setShowOriginalLines] = useState(true);
  const [showGridSegments, setShowGridSegments] = useState(false);
  const curvesRef = useRef([[]]);
  const closedCurvesRef = useRef(new Set());

  // First call useCurveDrawing to get the draw function
  const {
    draw,
    numPoints,
    setNumPoints,
    isStraightMode,
    setIsStraightMode,
    isDiscretized,
    setIsDiscretized,
    segmentLengthRatio,
    setSegmentLengthRatio,
    showNodesAndPoints,
    setShowNodesAndPoints,
    highlightedCells,
    setHighlightedCells
  } = useCurveDrawing(canvasRef, gridDensity, curvesRef, closedCurvesRef, showOriginalLines);

  // Then call useCanvasInteractions with the required values
  const {
    isDrawingNewCurveRef,
    selectionRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    deleteNode,
    closeCurrentCurve,
    toggleNodesAndPointsVisibility
  } = useCanvasInteractions(
    canvasRef,
    gridDensity,
    draw,
    isStraightMode,
    setShowNodesAndPoints,
    setHighlightedCells,
    curvesRef,
    closedCurvesRef
  );

  return (
    <div style={{ position: 'relative' }}>
      <ControlsPanel
        numPoints={numPoints}
        onNumPointsChange={setNumPoints}
        onNewCurve={() => (isDrawingNewCurveRef.current = true)}
        onCloseCurve={closeCurrentCurve}
        onDeletePoint={() => {
          if (selectionRef.current) deleteNode(selectionRef.current);
        }}
        onToggleMode={setIsStraightMode}
        onToggleDiscretization={() => setIsDiscretized(prev => !prev)}
        isDiscretized={isDiscretized}
        segmentLengthRatio={segmentLengthRatio}
        onSegmentLengthChange={setSegmentLengthRatio}
        showNodesAndPoints={showNodesAndPoints}
        onToggleNodesAndPoints={toggleNodesAndPointsVisibility}
        gridDensity={gridDensity}
        onGridDensityChange={setGridDensity}
        showOriginalLines={showOriginalLines}
        onToggleOriginalLines={() => setShowOriginalLines(!showOriginalLines)}
        showGridSegments={showGridSegments}
        onToggleGridSegments={() => setShowGridSegments(!showGridSegments)}
      />
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ display: 'block', position: 'relative', zIndex: 2, backgroundColor: 'transparent' }}
      />
      <GridComponent
        width={canvasRef.current?.width || window.innerWidth}
        height={canvasRef.current?.height || window.innerHeight}
        cellSize={gridDensity}
        highlightedCells={highlightedCells}
        showSegments={showGridSegments}
      />
      
    </div>
  );
};

export default CanvasComponent;