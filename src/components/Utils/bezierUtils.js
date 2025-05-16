// src/utils/bezierUtils.js
import { getGridCell } from '../Grid/GridComponent';

export const cubicBezierPoint = (t, p0, cp1, cp2, p3) => {
  const x = Math.pow(1 - t, 3) * p0.x +
            3 * Math.pow(1 - t, 2) * t * cp1.x +
            3 * (1 - t) * Math.pow(t, 2) * cp2.x +
            Math.pow(t, 3) * p3.x;
  const y = Math.pow(1 - t, 3) * p0.y +
            3 * Math.pow(1 - t, 2) * t * cp1.y +
            3 * (1 - t) * Math.pow(t, 2) * cp2.y +
            Math.pow(t, 3) * p3.y;
  return { x, y };
};

export const getFittedPoints = (nodes, curveIndex, points = 20, closedCurvesRef) => {
    if (nodes.length < 2) return [];
  
    const fittedPoints = [];
    const isClosed = closedCurvesRef?.current?.has(curveIndex);
    const numSegments = isClosed ? nodes.length : nodes.length - 1;
  
    const segments = [];
    const segmentLengths = [];
    let totalLength = 0;

  
    for (let i = 0; i < numSegments; i++) {
      const p0 = nodes[(i - 1 + nodes.length) % nodes.length];
      const p1 = nodes[i % nodes.length];
      const p2 = nodes[(i + 1) % nodes.length];
      const p3 = nodes[(i + 2) % nodes.length];
      const isStraight = p1.isStraightSegment;
      segments.push({ p1, p2, isStraight });
  
      let segmentLength = 0;
  
      if (isStraight) {
        segmentLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      } else {
        let cp1x = p1.x + (p2.x - p0.x) / 6;
        let cp1y = p1.y + (p2.y - p0.y) / 6;
        let cp2x = p2.x - (p3.x - p1.x) / 6;
        let cp2y = p2.y - (p3.y - p1.y) / 6;
  
        if (!isClosed && i === nodes.length - 2) {
          cp2x = (p1.x + p2.x) / 2;
          cp2y = (p1.y + p2.y) / 2;
        }
  
        let prevPoint = p1;
        const steps = 10;
        for (let j = 1; j <= steps; j++) {
          const t = j / steps;
          const point = cubicBezierPoint(t, p1, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, p2);
          segmentLength += Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
          prevPoint = point;
        }
  
        segments[i].cp1 = { x: cp1x, y: cp1y };
        segments[i].cp2 = { x: cp2x, y: cp2y };
      }
  
      segmentLengths.push(segmentLength);
      totalLength += segmentLength;
    }
  
    fittedPoints.push({ x: nodes[0].x, y: nodes[0].y });
  
    const spacing = totalLength / (points - 1);
    let accumulatedLength = 0;
    let currentSegment = 0;
  
    for (let i = 1; i < points - 1; i++) {
      const targetLength = i * spacing;
  
      while (
        currentSegment < segmentLengths.length &&
        accumulatedLength + segmentLengths[currentSegment] < targetLength
      ) {
        accumulatedLength += segmentLengths[currentSegment];
        currentSegment++;
      }
  
      if (currentSegment >= segments.length) break;
  
      const segment = segments[currentSegment];
      const segmentT = (targetLength - accumulatedLength) / segmentLengths[currentSegment];
  
      let point;
      if (segment.isStraight) {
        point = {
          x: segment.p1.x + (segment.p2.x - segment.p1.x) * segmentT,
          y: segment.p1.y + (segment.p2.y - segment.p1.y) * segmentT,
        };
      } else {
        point = cubicBezierPoint(segmentT, segment.p1, segment.cp1, segment.cp2, segment.p2);
      }
  
      fittedPoints.push(point);
    }
  
    if (!isClosed) {
      fittedPoints.push({ x: nodes[nodes.length - 1].x, y: nodes[nodes.length - 1].y });
    }
  
    return fittedPoints;
  };

  
export const getCellsForLineSegment = (start, end, cellSize) => {
    const cells = new Map();
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
  
    // Sample points along the line
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = {
        x: start.x + dx * t,
        y: start.y + dy * t
      };
      const cell = getGridCell(point, cellSize);
      const cellKey = `${cell.x},${cell.y}`;
      
      if (!cells.has(cellKey)) {
        cells.set(cellKey, {
          x: cell.x,
          y: cell.y,
          angle
        });
      }
    }
    
    return Array.from(cells.values());
  };

export const getCellsForBezierCurve = (nodes, curveIndex, cellSize, numPoints, closedCurvesRef) => {
    const cells = new Map();
    const fittedPoints = getFittedPoints(nodes, curveIndex, numPoints, closedCurvesRef);
    const isClosed = closedCurvesRef?.current?.has(curveIndex) || false;
  
    // We need at least 2 points to form segments
    if (fittedPoints.length < 2) return Array.from(cells.values());
  
    for (let i = 0; i < fittedPoints.length - 1; i++) {
        const current = fittedPoints[i];
        const next = fittedPoints[i + 1];
      
        // Calculate direction (angle) of this segment
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const angle = Math.atan2(dy, dx);
      
        const segmentCells = getCellsForLineSegment(current, next, cellSize);
      
        segmentCells.forEach(cell => {
          const cellKey = `${cell.x},${cell.y}`;
          if (!cells.has(cellKey)) {
            cells.set(cellKey, {
              x: cell.x,
              y: cell.y,
              angle: cell.angle
            });
          }
        });
      }
      
      // Handle the closing segment if the curve is closed
      if (isClosed) {
        const current = fittedPoints[fittedPoints.length - 1];
        const next = fittedPoints[0];
      
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const angle = Math.atan2(dy, dx);
      
        const segmentCells = getCellsForLineSegment(current, next, cellSize);
      
        segmentCells.forEach(cell => {
          const cellKey = `${cell.x},${cell.y}`;
          if (!cells.has(cellKey)) {
            cells.set(cellKey, {
              x: cell.x,
              y: cell.y,
              angle: cell.angle
            });
          }
        });
      }
      
  
    return Array.from(cells.values());
  };