import React, { useEffect, useRef, useState, useCallback } from 'react';
import ControlsPanel from './ControlsPanel';

const CanvasComponent = () => {
  const canvasRef = useRef(null);
  const curvesRef = useRef([[]]);
  const selectionRef = useRef(null);
  const isDrawingNewCurveRef = useRef(false);
  const closedCurvesRef = useRef(new Set());
  const [numPoints, setNumPoints] = useState(20);
  const [isStraightMode, setIsStraightMode] = useState(false);
  const [isDiscretized, setIsDiscretized] = useState(false);
  const [segmentLengthRatio, setSegmentLengthRatio] = useState(1.0);

  // Utility functions
  const cubicBezierPoint = useCallback((t, p0, cp1, cp2, p3) => {
    const x = Math.pow(1 - t, 3) * p0.x +
              3 * Math.pow(1 - t, 2) * t * cp1.x +
              3 * (1 - t) * Math.pow(t, 2) * cp2.x +
              Math.pow(t, 3) * p3.x;
    const y = Math.pow(1 - t, 3) * p0.y +
              3 * Math.pow(1 - t, 2) * t * cp1.y +
              3 * (1 - t) * Math.pow(t, 2) * cp2.y +
              Math.pow(t, 3) * p3.y;
    return { x, y };
  }, []);

  const doLinesIntersect = (line1, line2) => {
    const { x: x1, y: y1 } = line1.start;
    const { x: x2, y: y2 } = line1.end;
    const { x: x3, y: y3 } = line2.start;
    const { x: x4, y: y4 } = line2.end;
  
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) return false;
  
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
  
    return t > 0 && t < 1 && u > 0 && u < 1;
  };
  

  // Get fitted points for discretization
  const getFittedPoints = useCallback((nodes, curveIndex, points = 20) => {
    if (nodes.length < 2) return [];
    
    const fittedPoints = [];
    const isClosed = closedCurvesRef.current.has(curveIndex);
    const numSegments = isClosed ? nodes.length : nodes.length - 1;
    
    let totalLength = 0;
    const segmentLengths = [];
    const segments = [];
    
    for (let i = 0; i < numSegments; i++) {
      const p0 = nodes[(i - 1 + nodes.length) % nodes.length];
      const p1 = nodes[i % nodes.length];
      const p2 = nodes[(i + 1) % nodes.length];
      const p3 = nodes[(i + 2) % nodes.length];
      const isStraight = p1.isStraightSegment;
      segments.push({ p1, p2, isStraight });
      let segmentLength = 0;
      
      if (isStraight) {
        segmentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
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
          segmentLength += Math.sqrt(
            Math.pow(point.x - prevPoint.x, 2) + 
            Math.pow(point.y - prevPoint.y, 2)
          );
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
      
      while (currentSegment < segmentLengths.length && 
             accumulatedLength + segmentLengths[currentSegment] < targetLength) {
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
          y: segment.p1.y + (segment.p2.y - segment.p1.y) * segmentT
        };
      } else {
        point = cubicBezierPoint(
          segmentT,
          segment.p1,
          segment.cp1,
          segment.cp2,
          segment.p2
        );
      }
      
      fittedPoints.push(point);
    }
    
    if (!isClosed) {
      fittedPoints.push({ x: nodes[nodes.length - 1].x, y: nodes[nodes.length - 1].y });
    }
    
    return fittedPoints;
  }, [cubicBezierPoint]);

  // Drawing functions
  const drawBezierCurve = useCallback((context, nodes, curveIndex) => {
    if (nodes.length < 2) return;
    
    const isClosed = closedCurvesRef.current.has(curveIndex);
    const fittedPoints = getFittedPoints(nodes, curveIndex, numPoints);
    
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
        
        // Visual marker at segment end (optional)
        context.beginPath();
        context.arc(endX, endY, 2, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 0, 255, 0.5)';
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
  }, [isDiscretized, numPoints, segmentLengthRatio, getFittedPoints]);

  const plotBezierPoints = useCallback((context, nodes, curveIndex, points = 20) => {
    const fittedPoints = getFittedPoints(nodes, curveIndex, points);
    
    context.fillStyle = "red";
    fittedPoints.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, 2, 0, Math.PI * 2);
      context.fill();
    });
  }, [getFittedPoints]);

  const draw = useCallback((context) => {
    // Clear the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    
    // Draw all curves
    curvesRef.current.forEach((curve, curveIndex) => {
      // Draw control points (nodes)
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
  
      // Only draw curves if we have at least 2 points
      if (curve.length > 1) {
        const isClosed = closedCurvesRef.current.has(curveIndex);
        const fittedPoints = getFittedPoints(curve, curveIndex, numPoints);
  
        if (isDiscretized) {
          // DISCRETIZED MODE WITH GAPS
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
            
            // Visualize gap (optional)
            if (segmentLengthRatio < 1) {
              context.beginPath();
              context.arc(endX, endY, 2, 0, Math.PI * 2);
              context.fillStyle = 'rgba(0, 0, 255, 1)';
              context.fill();
            }
          }
        } else {
          // SMOOTH CURVE MODE
          context.beginPath();
          context.moveTo(curve[0].x, curve[0].y);
          
          const numSegments = isClosed ? curve.length : curve.length - 1;
          for (let i = 0; i < numSegments; i++) {
            const p1 = curve[i % curve.length];
            const p2 = curve[(i + 1) % curve.length];
            
            if (p1.isStraightSegment) {
              context.lineTo(p2.x, p2.y);
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
              
              context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
          }
          context.strokeStyle = '#000000';
          context.lineWidth = 1;
          context.stroke();
        }
        
        // Draw fitted points (red dots)
        context.fillStyle = "red";
        fittedPoints.forEach(point => {
          context.beginPath();
          context.arc(point.x, point.y, 2, 0, Math.PI * 2);
          context.fill();
        });
      }
    });
    
    // Draw faint connection lines in gaps (optional visual guide)
    if (isDiscretized && segmentLengthRatio < 1) {
      context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      context.setLineDash([2, 2]);
      curvesRef.current.forEach((curve, curveIndex) => {
        if (curve.length > 1) {
          const isClosed = closedCurvesRef.current.has(curveIndex);
          const fittedPoints = getFittedPoints(curve, curveIndex, numPoints);
          
          for (let i = 0; i < fittedPoints.length; i++) {
            const current = fittedPoints[i];
            const next = fittedPoints[(i + 1) % fittedPoints.length];
            
            if (!isClosed && i === fittedPoints.length - 1) continue;
            
            const gapStartX = current.x + (next.x - current.x) * segmentLengthRatio;
            const gapStartY = current.y + (next.y - current.y) * segmentLengthRatio;
            
            context.beginPath();
            context.moveTo(gapStartX, gapStartY);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }
      });
      context.setLineDash([]);
    }
  }, [numPoints, isDiscretized, segmentLengthRatio, getFittedPoints]);

  // Canvas setup
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
  }, [draw]);

  // Interaction handlers
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    const node = {
      x,
      y,
      radius: 10,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      selectedFill: '#bdc1c9',
      selected: false,
      isStraightSegment: isStraightMode
    };
  
    if (isDrawingNewCurveRef.current || curvesRef.current.length === 0) {
      curvesRef.current.push([node]);
      isDrawingNewCurveRef.current = false;
    } else {
      curvesRef.current[curvesRef.current.length - 1].push(node);
    }
  
    draw(context);
  
    // Check for intersections AFTER drawing the node
    setTimeout(() => {
      const currentCurve = curvesRef.current[curvesRef.current.length - 1];
      if (currentCurve.length >= 2) {
        const newSegment = {
          start: currentCurve[currentCurve.length - 2],
          end: currentCurve[currentCurve.length - 1]
        };
  
        let intersects = false;
        let intersectionMessage = '';
  
        // Check against other segments in same curve
        for (let i = 0; i < currentCurve.length - 2; i++) {
          const segment = {
            start: currentCurve[i],
            end: currentCurve[i + 1]
          };
  
          if (doLinesIntersect(newSegment, segment)) {
            intersects = true;
            intersectionMessage = 'Intersection detected within the same curve.';
            break;
          }
        }
  
        // Check against segments in other curves
        if (!intersects) {
          for (let otherCurveIndex = 0; otherCurveIndex < curvesRef.current.length - 1; otherCurveIndex++) {
            const otherCurve = curvesRef.current[otherCurveIndex];
            const isOtherClosed = closedCurvesRef.current.has(otherCurveIndex);
            const numSegments = isOtherClosed ? otherCurve.length : otherCurve.length - 1;
  
            for (let i = 0; i < numSegments; i++) {
              const segment = {
                start: otherCurve[i],
                end: otherCurve[(i + 1) % otherCurve.length]
              };
  
              if (doLinesIntersect(newSegment, segment)) {
                intersects = true;
                intersectionMessage = 'Intersection detected with another curve.';
                break;
              }
            }
            if (intersects) break;
          }
        }
  
        if (intersects) {
          alert(`Intersection detected! ${intersectionMessage} Please reconfigure the nodes.`);
        }
      }
    }, 0);
  }, [draw, isStraightMode, doLinesIntersect]);
  

  const within = useCallback((x, y) => {
    for (const curve of curvesRef.current) {
      for (const node of curve) {
        if (x > (node.x - node.radius) && 
            y > (node.y - node.radius) &&
            x < (node.x + node.radius) &&
            y < (node.y + node.radius)) {
          return node;
        }
      }
    }
    return null;
  }, []);

  const handleMouseUp = useCallback((e) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    const isClick = !selectionRef.current?.isDragging;
  
    if (selectionRef.current && selectionRef.current.isDragging) {
      selectionRef.current.selected = false;
      selectionRef.current.isDragging = false;
      const movedNode = selectionRef.current;
      selectionRef.current = null;
      draw(context);
  
      // Immediate intersection check
      const currentCurveIndex = curvesRef.current.findIndex(curve => curve.includes(movedNode));
      if (currentCurveIndex === -1) return;
  
      const currentCurve = curvesRef.current[currentCurveIndex];
      const nodeIndex = currentCurve.indexOf(movedNode);
      const isClosed = closedCurvesRef.current.has(currentCurveIndex);
  
      let intersects = false;
      let intersectionMessage = '';
  
      // Check connected segments in current curve
      const connectedSegments = [];
  
      // Previous segment
      if (nodeIndex > 0 || isClosed) {
        const prevIndex = (nodeIndex - 1 + currentCurve.length) % currentCurve.length;
        connectedSegments.push({ start: currentCurve[prevIndex], end: movedNode });
      }
  
      // Next segment
      if (nodeIndex < currentCurve.length - 1 || isClosed) {
        const nextIndex = (nodeIndex + 1) % currentCurve.length;
        connectedSegments.push({ start: movedNode, end: currentCurve[nextIndex] });
      }
  
      // Check against other segments in same curve
      for (const segment of connectedSegments) {
        for (let i = 0; i < currentCurve.length; i++) {
          // Skip adjacent segments
          if (i === nodeIndex || i === (nodeIndex - 1 + currentCurve.length) % currentCurve.length || i === (nodeIndex + 1) % currentCurve.length) {
            continue;
          }
  
          const otherSegment = { start: currentCurve[i], end: currentCurve[(i + 1) % currentCurve.length] };
  
          if (doLinesIntersect(segment, otherSegment)) {
            intersects = true;
            intersectionMessage = 'Intersection detected within the same curve.';
            break;
          }
        }
        if (intersects) break;
      }
  
      // Check against segments in other curves
      if (!intersects) {
        for (let otherCurveIndex = 0; otherCurveIndex < curvesRef.current.length; otherCurveIndex++) {
          if (otherCurveIndex === currentCurveIndex) continue;
  
          const otherCurve = curvesRef.current[otherCurveIndex];
          const isOtherClosed = closedCurvesRef.current.has(otherCurveIndex);
          const numSegments = isOtherClosed ? otherCurve.length : otherCurve.length - 1;
  
          for (let i = 0; i < numSegments; i++) {
            const otherSegment = { start: otherCurve[i], end: otherCurve[(i + 1) % otherCurve.length] };
  
            for (const segment of connectedSegments) {
              if (doLinesIntersect(segment, otherSegment)) {
                intersects = true;
                intersectionMessage = 'Intersection detected with another curve.';
                break;
              }
            }
            if (intersects) break;
          }
          if (intersects) break;
        }
      }
  
      if (intersects) {
        // Revert the node position
        movedNode.x = movedNode.originalX;
        movedNode.y = movedNode.originalY;
        draw(context);
        alert(`Intersection detected! ${intersectionMessage} The node has been reverted to its original position.`);
      }
    } else if (isClick) {
      const target = within(x, y);
      if (!target) {
        handleClick({ clientX: e.clientX, clientY: e.clientY, target: { getBoundingClientRect: () => rect } });
      }
    }
  }, [draw, handleClick, doLinesIntersect, within]);
  
  
  
  
  // Update handleMouseDown to store original position
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
  
    const target = within(x, y);
    
    // Clear previous selection
    if (selectionRef.current) {
      selectionRef.current.selected = false;
      selectionRef.current = null;
    }
    
    if (target) {
      // Select the node
      target.selected = true;
      selectionRef.current = target;
      
      // Store original position for potential move
      target.originalX = target.x;
      target.originalY = target.y;
    }
    
    draw(context);
  }, [draw, within]);

  const handleMouseMove = useCallback((e) => {
    if (selectionRef.current && e.buttons) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      const context = canvas.getContext('2d');
  
      // Mark that we're dragging
      selectionRef.current.isDragging = true;
      
      selectionRef.current.x = newX;
      selectionRef.current.y = newY;
  
      draw(context);
    }
  }, [draw]);
  
  
  
  const deleteNode = useCallback((target) => {
    if (!target) return;
    
    for (let i = 0; i < curvesRef.current.length; i++) {
      const curve = curvesRef.current[i];
      const index = curve.indexOf(target);
      if (index !== -1) {
        curve.splice(index, 1);
        
        if (curve.length === 0) {
          curvesRef.current.splice(i, 1);
          closedCurvesRef.current.delete(i);
        }
        break;
      }
    }
    
    if (selectionRef.current === target) {
      selectionRef.current = null;
    }
    draw(canvasRef.current.getContext('2d'));
  }, [draw]);

  const closeCurrentCurve = useCallback(() => {
    const currentCurveIndex = curvesRef.current.length - 1;
    if (currentCurveIndex >= 0 && curvesRef.current[currentCurveIndex].length >= 3) {
      const curve = curvesRef.current[currentCurveIndex];
      const lastNode = curve[curve.length - 1];
      const firstNode = curve[0];
      const closingSegment = { start: lastNode, end: firstNode };
  
      let intersects = false;
  
      // 1. Check if closing segment intersects with any existing segment in THIS curve
      for (let i = 0; i < curve.length - 1; i++) {
        const segment = { start: curve[i], end: curve[i + 1] };
        if (doLinesIntersect(closingSegment, segment)) {
          intersects = true;
          break;
        }
      }
  
      // 2. Check for self-intersections in THIS curve (including the new closing segment)
      if (!intersects) {
        const tempCurve = [...curve];
        for (let i = 0; i < tempCurve.length; i++) {
          for (let j = i + 1; j < tempCurve.length; j++) {
            // Skip adjacent segments
            if (Math.abs(i - j) === 1 || (i === 0 && j === tempCurve.length - 1)) continue;
            
            const segment1 = { 
              start: tempCurve[i], 
              end: tempCurve[(i + 1) % tempCurve.length] 
            };
            const segment2 = { 
              start: tempCurve[j], 
              end: tempCurve[(j + 1) % tempCurve.length] 
            };
            
            if (doLinesIntersect(segment1, segment2)) {
              intersects = true;
              break;
            }
          }
          if (intersects) break;
        }
      }
  
      // 3. Check if closing segment intersects with ANY segment in OTHER curves
      if (!intersects) {
        for (let otherCurveIndex = 0; otherCurveIndex < curvesRef.current.length; otherCurveIndex++) {
          if (otherCurveIndex === currentCurveIndex) continue;
          
          const otherCurve = curvesRef.current[otherCurveIndex];
          const isOtherClosed = closedCurvesRef.current.has(otherCurveIndex);
          const numSegments = isOtherClosed ? otherCurve.length : otherCurve.length - 1;
          
          for (let i = 0; i < numSegments; i++) {
            const segment = { 
              start: otherCurve[i], 
              end: otherCurve[(i + 1) % otherCurve.length] 
            };
            if (doLinesIntersect(closingSegment, segment)) {
              intersects = true;
              break;
            }
          }
          if (intersects) break;
        }
      }
  
      // 4. Check if any existing segments in THIS curve intersect with ANY segments in OTHER curves
      if (!intersects) {
        for (let otherCurveIndex = 0; otherCurveIndex < curvesRef.current.length; otherCurveIndex++) {
          if (otherCurveIndex === currentCurveIndex) continue;
          
          const otherCurve = curvesRef.current[otherCurveIndex];
          const isOtherClosed = closedCurvesRef.current.has(otherCurveIndex);
          const otherNumSegments = isOtherClosed ? otherCurve.length : otherCurve.length - 1;
          const thisNumSegments = curve.length; // Now closed, so all segments count
          
          for (let i = 0; i < thisNumSegments; i++) {
            const thisSegment = { 
              start: curve[i], 
              end: curve[(i + 1) % curve.length] 
            };
            
            for (let j = 0; j < otherNumSegments; j++) {
              const otherSegment = { 
                start: otherCurve[j], 
                end: otherCurve[(j + 1) % otherCurve.length] 
              };
              
              if (doLinesIntersect(thisSegment, otherSegment)) {
                intersects = true;
                break;
              }
            }
            if (intersects) break;
          }
          if (intersects) break;
        }
      }
  
      if (!intersects) {
        closedCurvesRef.current.add(currentCurveIndex);
        draw(canvasRef.current.getContext('2d'));
      } else {
        alert('Closing the curve would cause an intersection with another curve or itself. Please adjust the nodes.');
      }
    }
  }, [draw, doLinesIntersect]);
  
  

  // Keyboard event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Backspace" && selectionRef.current) {
        deleteNode(selectionRef.current);
      } else if (e.key === "n" || e.key === "N") {
        isDrawingNewCurveRef.current = true;
      } else if (e.key === "c" || e.key === "C") {
        closeCurrentCurve();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeCurrentCurve, deleteNode]);

  const handleToggleMode = useCallback((newMode) => {
    setIsStraightMode(newMode);
  }, []);

  const handleToggleDiscretization = useCallback(() => {
    setIsDiscretized(prev => !prev);
  }, []);

  const handleSegmentLengthChange = useCallback((ratio) => {
    setSegmentLengthRatio(ratio);
  }, []);

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
        onToggleMode={handleToggleMode}
        onToggleDiscretization={handleToggleDiscretization}
        isDiscretized={isDiscretized}
        segmentLengthRatio={segmentLengthRatio}
        onSegmentLengthChange={handleSegmentLengthChange}
      />
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default CanvasComponent;