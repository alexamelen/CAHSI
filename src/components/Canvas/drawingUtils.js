// src/components/Canvas/drawingUtils.js
export const drawBezierCurve = (
    context,
    nodes,
    curveIndex,
    isDiscretized,
    segmentLengthRatio,
    numPoints,
    getFittedPoints,
    closedCurvesRef
  ) => {
    if (nodes.length < 2) return;
    
    const isClosed = closedCurvesRef.current.has(curveIndex);
    const fittedPoints = getFittedPoints(nodes, curveIndex, numPoints, closedCurvesRef);
    
    if (isDiscretized) {
      // Draw segmented lines with gaps
      context.strokeStyle = '#000000';
      context.lineWidth = 1;
      
      for (let i = 0; i < fittedPoints.length; i++) {
        const current = fittedPoints[i];
        const next = fittedPoints[(i + 1) % fittedPoints.length];
        
        if (!isClosed && i === fittedPoints.length - 1) break;
        
        // Calculate segment start and end points with gap
        const segmentLength = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
        const gapLength = segmentLength * (1 - segmentLengthRatio);
        const segmentEndRatio = segmentLengthRatio;
        
        const startX = current.x;
        const startY = current.y;
        const endX = current.x + (next.x - current.x) * segmentEndRatio;
        const endY = current.y + (next.y - current.y) * segmentEndRatio;
        
        // Draw the visible segment
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
        
        // Always show blue dot at segment end (even when nodes are hidden)
        context.beginPath();
        context.arc(endX, endY, 2, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 0, 255, 1)';
        context.fill();
      }
    } else {
      // Original smooth curve drawing
      context.beginPath();
      context.moveTo(nodes[0].x, nodes[0].y);
      
      const numSegments = isClosed ? nodes.length : nodes.length - 1;
      for (let i = 0; i < numSegments; i++) {
        const p1 = nodes[i % nodes.length];
        const p2 = nodes[(i + 1) % nodes.length];
        
        if (p1.isStraightSegment) {
          context.lineTo(p2.x, p2.y);
        } else {
          const p0 = nodes[(i - 1 + nodes.length) % nodes.length];
          const p3 = nodes[(i + 2) % nodes.length];
          let cp1x = p1.x + (p2.x - p0.x) / 6;
          let cp1y = p1.y + (p2.y - p0.y) / 6;
          let cp2x = p2.x - (p3.x - p1.x) / 6;
          let cp2y = p2.y - (p3.y - p1.y) / 6;
          
          if (!isClosed && i === nodes.length - 2) {
            cp2x = (p1.x + p2.x) / 2;
            cp2y = (p1.y + p2.y) / 2;
          }
          
          context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      }
      context.stroke();
    }
  };
  
  export const plotBezierPoints = (
    context,
    nodes,
    curveIndex,
    showNodesAndPoints,
    points,
    getFittedPoints,
    closedCurvesRef
  ) => {
    if (!showNodesAndPoints) return;
    
    const fittedPoints = getFittedPoints(nodes, curveIndex, points, closedCurvesRef);
    
    context.fillStyle = "red";
    fittedPoints.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, 2, 0, Math.PI * 2);
      context.fill();
    });
  };
