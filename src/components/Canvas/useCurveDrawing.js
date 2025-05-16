import { useCallback, useEffect, useState, useRef } from 'react';
import { cubicBezierPoint, getFittedPoints, getCellsForLineSegment, getCellsForBezierCurve } from '../Utils/bezierUtils';
import { drawBezierCurve, plotBezierPoints } from './drawingUtils';

const useCurveDrawing = (canvasRef, gridDensity, curvesRef, closedCurvesRef,showOriginalLines) => {
  const [numPoints, setNumPoints] = useState(20);
  const [isStraightMode, setIsStraightMode] = useState(false);
  const [isDiscretized, setIsDiscretized] = useState(false);
  const [segmentLengthRatio, setSegmentLengthRatio] = useState(1.0);
  const [showNodesAndPoints, setShowNodesAndPoints] = useState(true);
  const [highlightedCells, setHighlightedCells] = useState([]);

  const draw = useCallback((context) => {
    // Clear the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  
    // Tracking cells
    const allCells = new Map();
  
    // Draw all curves - both discretized and original
    curvesRef.current.forEach((curve, curveIndex) => {
      // Draw control points (nodes) - only if showNodesAndPoints is true
      if (showNodesAndPoints) {
        curve.forEach(node => {
          context.beginPath();
          context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          context.fillStyle = node.selected ? node.selectedFill : node.fillStyle;
          context.fill();
          context.strokeStyle = node.strokeStyle;
          context.stroke();
          
          // Label straight segments
          if (node.isStraightSegment) {
            context.fillStyle = 'blue';
            context.font = '10px Arial';
            context.fillText('(straight)', node.x + 15, node.y - 15);
          }
        });
      }
  
      // Only draw curves if we have at least 2 points
      if (curve.length > 1) {
        const isClosed = closedCurvesRef.current.has(curveIndex);
        const fittedPoints = getFittedPoints(curve, curveIndex, numPoints,closedCurvesRef);

        if (!isDiscretized && !showOriginalLines) {
            // Still collect cells for highlighting
            for (let i = 0; i < fittedPoints.length - 1; i++) {
              const current = fittedPoints[i];
              const next = fittedPoints[i + 1];
              const segmentCells = getCellsForLineSegment(current, next, gridDensity);
              segmentCells.forEach(cell => {
                const cellKey = `${cell.x},${cell.y}`;
                if (!allCells.has(cellKey)) {
                  allCells.set(cellKey, cell);
                }
              });

if (isClosed) {
      const last = fittedPoints[fittedPoints.length - 1];
      const first = fittedPoints[0];
      const closingCells = getCellsForLineSegment(last, first, gridDensity);
      closingCells.forEach(cell => {
        const cellKey = `${cell.x},${cell.y}`;
        if (!allCells.has(cellKey)) {
          allCells.set(cellKey, cell);
        }
      });
    }
    
            }
          }
          
  
        if (isDiscretized) {
          // Draw discretized segments with gaps
          context.strokeStyle = '#000000';
          context.lineWidth = 1;
          
          for (let i = 0; i < fittedPoints.length; i++) {
            const current = fittedPoints[i];
            const next = fittedPoints[(i + 1) % fittedPoints.length];
            
            // Skip last segment for open curves
            if (!isClosed && i === fittedPoints.length - 1) break;
            
            // Calculate segment end point based on ratio
            const endX = current.x + (next.x - current.x) * segmentLengthRatio;
            const endY = current.y + (next.y - current.y) * segmentLengthRatio;
            
            // Draw the visible segment
            context.beginPath();
            context.moveTo(current.x, current.y);
            context.lineTo(endX, endY);
            context.stroke();
            
            // Always show blue dot at segment end (even when nodes are hidden)
            context.beginPath();
            context.arc(endX, endY, 2, 0, Math.PI * 2);
            context.fillStyle = 'rgba(0, 0, 255, 1)';
            context.fill();
  
            // Get cells for this segment
            const segmentCells = getCellsForLineSegment(
              { x: current.x, y: current.y },
              { x: endX, y: endY },
              gridDensity
            );
            segmentCells.forEach(cell => {
              const cellKey = `${cell.x},${cell.y}`;
              if (!allCells.has(cellKey)) {
                allCells.set(cellKey, cell);
              }
            });
          }
        } else if (showOriginalLines) {
          // Original smooth curve drawing (only if showOriginalLines is true)
          context.beginPath();
          context.moveTo(curve[0].x, curve[0].y);
          
          const numSegments = isClosed ? curve.length : curve.length - 1;
          for (let i = 0; i < numSegments; i++) {
            const p1 = curve[i % curve.length];
            const p2 = curve[(i + 1) % curve.length];
            
            if (p1.isStraightSegment) {
              context.lineTo(p2.x, p2.y);
              const cells = getCellsForLineSegment(p1, p2, gridDensity);
              cells.forEach(cell => {
                const cellKey = `${cell.x},${cell.y}`;
                if (!allCells.has(cellKey)) {
                  allCells.set(cellKey, cell);
                }
              });
            } else {
              const p0 = curve[(i - 1 + curve.length) % curve.length];
              const p3 = curve[(i + 2) % curve.length];
              let cp1x = p1.x + (p2.x - p0.x) / 6;
              let cp1y = p1.y + (p2.y - p0.y) / 6;
              let cp2x = p2.x - (p3.x - p1.x) / 6;
              let cp2y = p2.y - (p3.y - p1.y) / 6;
              
              if (!isClosed && i === curve.length - 2) {
                cp2x = (p1.x + p2.x) / 2;
                cp2y = (p1.y + p2.y) / 2;
              }
  
              const cells = getCellsForBezierCurve(
                curve, 
                curveIndex, 
                gridDensity,
                numPoints,
                closedCurvesRef
              );
              cells.forEach(cell => {
                const cellKey = `${cell.x},${cell.y}`;
                if (!allCells.has(cellKey)) {
                  allCells.set(cellKey, cell);
                }
              });
              
              context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
          }
          context.strokeStyle = '#000000';
          context.lineWidth = 1;
          context.stroke();
        }
        
        // Draw fitted points (red dots) - only if showNodesAndPoints is true
        if (showNodesAndPoints) {
          context.fillStyle = "red";
          fittedPoints.forEach(point => {
            context.beginPath();
            context.arc(point.x, point.y, 2, 0, Math.PI * 2);
            context.fill();
          });
        }
      }
    });
    
    setHighlightedCells(Array.from(allCells.values()));
  }, [showOriginalLines, gridDensity, numPoints, isDiscretized, segmentLengthRatio, showNodesAndPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw(context);
    };

    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [draw, canvasRef]);

  return {
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
    showOriginalLines,
    highlightedCells,
    setHighlightedCells,
    curvesRef,
    closedCurvesRef
  };
};

export default useCurveDrawing;