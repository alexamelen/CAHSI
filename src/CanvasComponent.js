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

  // Drawing functions
  const plotBezierPoints = useCallback((context, nodes, curveIndex, points = 20) => {
    if (nodes.length < 2) return;
  
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
  
    context.fillStyle = "red";
    const spacing = totalLength / (points - 1);
    let accumulatedLength = 0;
    let currentSegment = 0;
  
    context.beginPath();
    context.arc(nodes[0].x, nodes[0].y, 2, 0, Math.PI * 2);
    context.fill();
  
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
      
      context.beginPath();
      context.arc(point.x, point.y, 2, 0, Math.PI * 2);
      context.fill();
    }
  
    if (!isClosed) {
      context.beginPath();
      context.arc(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y, 2, 0, Math.PI * 2);
      context.fill();
    }
  }, [cubicBezierPoint]);

  const drawBezierCurve = useCallback((context, nodes, curveIndex) => {
    if (nodes.length < 2) return;

    context.beginPath();
    context.moveTo(nodes[0].x, nodes[0].y);

    const isClosed = closedCurvesRef.current.has(curveIndex);
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

    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.stroke();
  }, []);

  const draw = useCallback((context) => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    curvesRef.current.forEach((curve, curveIndex) => {
      for (let i = 0; i < curve.length; i++) {
        const node = curve[i];
        context.beginPath();
        context.fillStyle = node.selected ? node.selectedFill : node.fillStyle;
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2, true);
        context.strokeStyle = node.strokeStyle;
        context.fill();
        context.stroke();
        
        if (i > 0 && node.isStraightSegment) {
          context.fillStyle = 'blue';
          context.font = '10px Arial';
          context.fillText('(straight)', node.x + 15, node.y - 15);
        }
      }
      
      if (curve.length > 1) {
        drawBezierCurve(context, curve, curveIndex);
        plotBezierPoints(context, curve, curveIndex, numPoints);
      }
    });
  }, [numPoints, drawBezierCurve, plotBezierPoints]);

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
      const currentCurveIndex = curvesRef.current.length - 1;
      const lastCurve = curvesRef.current[currentCurveIndex];
      lastCurve.push(node);
    }

    draw(context);
  }, [draw, isStraightMode]);

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

  const handleMouseDown = useCallback((e) => {
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
  }, [draw, within]);

  const handleMouseMove = useCallback((e) => {
    if (selectionRef.current && e.buttons) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      const context = canvas.getContext('2d');
      
      selectionRef.current.x = newX;
      selectionRef.current.y = newY;
      draw(context);
    }
  }, [draw]);

  const handleMouseUp = useCallback((e) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!selectionRef.current) {
      const rect = canvas.getBoundingClientRect();
      handleClick({ 
        clientX: e.clientX, 
        clientY: e.clientY,
        target: { getBoundingClientRect: () => rect }
      });
    }
    if (selectionRef.current && !selectionRef.current.selected) {
      selectionRef.current = null;
    }
    draw(context);
  }, [draw, handleClick]);

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
      closedCurvesRef.current.add(currentCurveIndex);
      draw(canvasRef.current.getContext('2d'));
    }
  }, [draw]);

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