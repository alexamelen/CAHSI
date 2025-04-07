import React, { useEffect, useRef } from 'react';

const CanvasComponent = () => {
  const canvasRef = useRef(null);
  const curvesRef = useRef([[]]);
  const selectionRef = useRef(null);
  const isDrawingNewCurveRef = useRef(false);
  const closedCurvesRef = useRef(new Set());

  // Initialize and resize canvas
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
  }, []);

  // Draw functions
  const draw = (context) => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Draw all curves
    curvesRef.current.forEach((curve, curveIndex) => {
      // Draw nodes for this curve
      for (let i = 0; i < curve.length; i++) {
        const node = curve[i];
        context.beginPath();
        context.fillStyle = node.selected ? node.selectedFill : node.fillStyle;
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2, true);
        context.strokeStyle = node.strokeStyle;
        context.fill();
        context.stroke();
      }
      
      // Draw Bezier curve if it has enough points
      if (curve.length > 1) {
        drawBezierCurve(context, curve, curveIndex);
        plotBezierPoints(context, curve, curveIndex);
      }
    });
  };

  const drawBezierCurve = (context, nodes, curveIndex) => {
    if (nodes.length < 2) return;

    context.beginPath();
    context.moveTo(nodes[0].x, nodes[0].y);

    const isClosed = closedCurvesRef.current.has(curveIndex);
    const numSegments = isClosed ? nodes.length : nodes.length - 1;

    for (let i = 0; i < numSegments; i++) {
      const p0 = nodes[(i - 1 + nodes.length) % nodes.length];
      const p1 = nodes[i % nodes.length];
      const p2 = nodes[(i + 1) % nodes.length];
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

    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.stroke();
  };

  const plotBezierPoints = (context, nodes, curveIndex, steps = 10) => {
    if (nodes.length < 2) return;

    const isClosed = closedCurvesRef.current.has(curveIndex);
    const numSegments = isClosed ? nodes.length : nodes.length - 1;
    context.fillStyle = "red";

    for (let i = 0; i < numSegments; i++) {
      const p0 = nodes[(i - 1 + nodes.length) % nodes.length];
      const p1 = nodes[i % nodes.length];
      const p2 = nodes[(i + 1) % nodes.length];
      const p3 = nodes[(i + 2) % nodes.length];

      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      if (!isClosed && i === nodes.length - 2) {
        cp2x = (p1.x + p2.x) / 2;
        cp2y = (p1.y + p2.y) / 2;
      }

      for (let t = 0; t <= 1; t += 1 / steps) {
        const point = cubicBezierPoint(t, p1, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, p2);
        context.beginPath();
        context.arc(point.x, point.y, 2, 0, Math.PI * 2);
        context.fill();
      }
    }
  };

  const cubicBezierPoint = (t, p0, cp1, cp2, p3) => {
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

  const lineSegmentsIntersect = (p1, p2, p3, p4) => {
    // Calculate the direction of the segments
    const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    
    // Check if the segments intersect
    const intersect = ccw(p1, p3, p4) !== ccw(p2, p3, p4) && 
                     ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    
    // If they don't intersect in the general case, return false
    if (!intersect) return false;
    
    // Special case: check if the segments are collinear and overlapping
    const onSegment = (p, q, r) => {
      return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
             q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    };
    
    const orientation = (p, q, r) => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val === 0) return 0;  // colinear
      return (val > 0) ? 1 : 2; // clock or counterclock wise
    };
    
    const o1 = orientation(p1, p2, p3);
    const o2 = orientation(p1, p2, p4);
    const o3 = orientation(p3, p4, p1);
    const o4 = orientation(p3, p4, p2);
    
    // General case
    if (o1 !== o2 && o3 !== o4) return true;
    
    // Special cases
    if (o1 === 0 && onSegment(p1, p3, p2)) return true;
    if (o2 === 0 && onSegment(p1, p4, p2)) return true;
    if (o3 === 0 && onSegment(p3, p1, p4)) return true;
    if (o4 === 0 && onSegment(p3, p2, p4)) return true;
    
    return false;
  };

  const checkIntersections = (curveIndex, newSegmentStart, newSegmentEnd) => {
    const allSegments = [];
    
    // Add segments from other curves
    curvesRef.current.forEach((curve, idx) => {
      if (idx === curveIndex || curve.length < 2) return;
      
      const isClosed = closedCurvesRef.current.has(idx);
      const numPoints = curve.length;
      
      for (let i = 0; i < (isClosed ? numPoints : numPoints - 1); i++) {
        const p1 = curve[i % numPoints];
        const p2 = curve[(i + 1) % numPoints];
        allSegments.push({ p1, p2 });
      }
    });
    
    // Add segments from the current curve (for self-intersection check)
    const currentCurve = curvesRef.current[curveIndex];
    if (currentCurve && currentCurve.length > 2) {
      for (let i = 0; i < currentCurve.length - 2; i++) {
        const p1 = currentCurve[i];
        const p2 = currentCurve[i + 1];
        if (p1 === newSegmentStart || p2 === newSegmentStart) continue;
        allSegments.push({ p1, p2 });
      }
    }
    
    // Check new segment against all relevant segments
    for (const segment of allSegments) {
      if (lineSegmentsIntersect(
        newSegmentStart, newSegmentEnd,
        segment.p1, segment.p2
      )) {
        return true;
      }
    }
    
    return false;
  };

  const handleClick = (e) => {
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
      selected: false
    };
  
    if (isDrawingNewCurveRef.current || curvesRef.current.length === 0) {
      curvesRef.current.push([node]);
      isDrawingNewCurveRef.current = false;
    } else {
      const currentCurveIndex = curvesRef.current.length - 1;
      const lastCurve = curvesRef.current[currentCurveIndex];
      
      if (lastCurve.length > 0) {
        const lastNode = lastCurve[lastCurve.length - 1];
        
        if (checkIntersections(currentCurveIndex, lastNode, node)) {
          alert("This would create an invalid intersection! Try a different position.");
          return;
        }
      }
      
      lastCurve.push(node);
    }
  
    draw(context);
  };

  const handleMouseMove = (e) => {
    if (selectionRef.current && e.buttons) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      const context = canvas.getContext('2d');
      
      let curveIndex = -1;
      let nodeIndex = -1;
      for (let i = 0; i < curvesRef.current.length; i++) {
        const index = curvesRef.current[i].indexOf(selectionRef.current);
        if (index !== -1) {
          curveIndex = i;
          nodeIndex = index;
          break;
        }
      }
      
      if (curveIndex !== -1 && nodeIndex !== -1) {
        const curve = curvesRef.current[curveIndex];
        const isClosed = closedCurvesRef.current.has(curveIndex);
        const oldPosition = { x: selectionRef.current.x, y: selectionRef.current.y };
        
        selectionRef.current.x = newX;
        selectionRef.current.y = newY;
        
        let hasIntersection = false;
        
        if (curve.length > 1) {
          const prevIndex = (nodeIndex - 1 + curve.length) % curve.length;
          const nextIndex = (nodeIndex + 1) % curve.length;
          
          if (nodeIndex > 0 || isClosed) {
            const prevNode = curve[prevIndex];
            if (checkIntersections(curveIndex, prevNode, selectionRef.current)) {
              hasIntersection = true;
            }
          }
          
          if ((nodeIndex < curve.length - 1 || isClosed) && !hasIntersection) {
            const nextNode = curve[nextIndex];
            if (checkIntersections(curveIndex, selectionRef.current, nextNode)) {
              hasIntersection = true;
            }
          }
        }
        
        if (hasIntersection) {
          selectionRef.current.x = oldPosition.x;
          selectionRef.current.y = oldPosition.y;
        }
        
        draw(context);
      }
    }
  };

  const within = (x, y) => {
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
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');

    const target = within(x, y);
    if (selectionRef.current && selectionRef.current.selected) {
      selectionRef.current.selected = false;
    }
    if (target) {
      selectionRef.current = target;
      selectionRef.current.selected = true;
      draw(context);
    }
  };

  const handleMouseUp = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');

    if (!selectionRef.current) {
      handleClick({ clientX: e.clientX, clientY: e.clientY });
    }
    if (selectionRef.current && !selectionRef.current.selected) {
      selectionRef.current = null;
    }
    draw(context);
  };

  const deleteNode = (target) => {
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
  };

  const closeCurrentCurve = () => {
    const currentCurveIndex = curvesRef.current.length - 1;
    if (currentCurveIndex >= 0 && curvesRef.current[currentCurveIndex].length >= 3) {
      const curve = curvesRef.current[currentCurveIndex];
      const lastNode = curve[curve.length - 1];
      const firstNode = curve[0];
      
      // Only check segments that would be adjacent to the new closing segment
      const problematicSegments = [];
      
      // Check against other curves
      curvesRef.current.forEach((otherCurve, idx) => {
        if (idx === currentCurveIndex || otherCurve.length < 2) return;
        
        const isClosed = closedCurvesRef.current.has(idx);
        const numPoints = otherCurve.length;
        
        for (let i = 0; i < (isClosed ? numPoints : numPoints - 1); i++) {
          const p1 = otherCurve[i % numPoints];
          const p2 = otherCurve[(i + 1) % numPoints];
          problematicSegments.push({ p1, p2 });
        }
      });
      
      // Check against non-adjacent segments in the same curve
      for (let i = 1; i < curve.length - 2; i++) {
        problematicSegments.push({ p1: curve[i], p2: curve[i + 1] });
      }
      
      // Check the closing segment against all problematic segments
      let hasIntersection = false;
      for (const segment of problematicSegments) {
        if (lineSegmentsIntersect(lastNode, firstNode, segment.p1, segment.p2)) {
          hasIntersection = true;
          break;
        }
      }
      
      if (hasIntersection) {
        alert("Closing this curve would create an intersection!");
        return;
      }
      
      closedCurvesRef.current.add(currentCurveIndex);
      draw(canvasRef.current.getContext('2d'));
    }
  };

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
  }, []);

  return (
    <div style={{ position: 'relative' }}>
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