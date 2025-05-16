// src/components/Canvas/useCanvasInteractions.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { doLinesIntersect } from '../Utils/intersectionUtils';

const useCanvasInteractions = (
  canvasRef,
  gridDensity,
  draw,
  isStraightMode,
  setShowNodesAndPoints,
  setHighlightedCells,
  curvesRef,
  closedCurvesRef
) => {
  const isDrawingNewCurveRef = useRef(false);
  const selectionRef = useRef(null);
  const [highlightedCells] = useState([]);

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

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    
    // Store the current state of curves before making changes
    const previousCurves = JSON.parse(JSON.stringify(curvesRef.current));
    const previousClosedCurves = new Set(closedCurvesRef.current);
  
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
  
    // Check for intersections
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
        // Revert to previous state
        curvesRef.current = previousCurves;
        closedCurvesRef.current = previousClosedCurves;
        draw(context);
        toast.error(`Intersection detected! ${intersectionMessage} Please place the node elsewhere.`);
      }
    }
  }, [draw, isStraightMode]);

  const handleMouseUp = useCallback((e) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    const isClick = !selectionRef.current?.isDragging;
  
    if (selectionRef.current && selectionRef.current.isDragging) {
      const movedNode = selectionRef.current;
      movedNode.selected = false;
      movedNode.isDragging = false;
      
      // Store new position
      const newX = movedNode.x;
      const newY = movedNode.y;
      
      // Revert to original position for intersection check
      movedNode.x = movedNode.originalX;
      movedNode.y = movedNode.originalY;
      
      const currentCurveIndex = curvesRef.current.findIndex(curve => curve.includes(movedNode));
      if (currentCurveIndex === -1) {
        selectionRef.current = null;
        return;
      }
  
      const currentCurve = curvesRef.current[currentCurveIndex];
      const nodeIndex = currentCurve.indexOf(movedNode);
      const isClosed = closedCurvesRef.current.has(currentCurveIndex);
  
      // Move to new position for intersection check
      movedNode.x = newX;
      movedNode.y = newY;
  
      let intersects = false;
      let intersectionMessage = '';
  
      // Get all segments that might be affected by this move
      const affectedSegments = [];
      
      // Previous segment (if exists)
      if (nodeIndex > 0 || isClosed) {
        const prevIndex = (nodeIndex - 1 + currentCurve.length) % currentCurve.length;
        affectedSegments.push({
          start: currentCurve[prevIndex],
          end: movedNode
        });
      }
      
      // Next segment (if exists)
      if (nodeIndex < currentCurve.length - 1 || isClosed) {
        const nextIndex = (nodeIndex + 1) % currentCurve.length;
        affectedSegments.push({
          start: movedNode,
          end: currentCurve[nextIndex]
        });
      }
  
      // Check all segments in current curve against all other segments
      for (let i = 0; i < currentCurve.length && !intersects; i++) {
        const seg1Start = currentCurve[i];
        const seg1End = currentCurve[(i + 1) % currentCurve.length];
        
        // Skip segments connected to the moved node
        if (i === nodeIndex || 
            (i + 1) % currentCurve.length === nodeIndex ||
            (isClosed && i === (nodeIndex - 1 + currentCurve.length) % currentCurve.length)) {
          continue;
        }
  
        for (const affectedSegment of affectedSegments) {
          if (doLinesIntersect(
            { start: seg1Start, end: seg1End },
            affectedSegment
          )) {
            intersects = true;
            intersectionMessage = 'Intersection detected within the same curve.';
            break;
          }
        }
      }
  
      // Check against other curves if no intersection found yet
      if (!intersects) {
        for (let otherCurveIndex = 0; otherCurveIndex < curvesRef.current.length && !intersects; otherCurveIndex++) {
          if (otherCurveIndex === currentCurveIndex) continue;
  
          const otherCurve = curvesRef.current[otherCurveIndex];
          const isOtherClosed = closedCurvesRef.current.has(otherCurveIndex);
          const numSegments = isOtherClosed ? otherCurve.length : otherCurve.length - 1;
  
          for (let i = 0; i < numSegments && !intersects; i++) {
            const otherSegment = {
              start: otherCurve[i],
              end: otherCurve[(i + 1) % otherCurve.length]
            };
  
            for (const affectedSegment of affectedSegments) {
              if (doLinesIntersect(affectedSegment, otherSegment)) {
                intersects = true;
                intersectionMessage = 'Intersection detected with another curve.';
                break;
              }
            }
          }
        }
      }
  
      if (intersects) {
        // Revert to original position
        movedNode.x = movedNode.originalX;
        movedNode.y = movedNode.originalY;
        toast.error(`Intersection detected! ${intersectionMessage} The node has been reverted to its original position.`);
      } else {
        // Update original position to new valid position
        movedNode.originalX = newX;
        movedNode.originalY = newY;
      }
  
      selectionRef.current = null;
      draw(context);
    } else if (isClick) {
      const target = within(x, y);
      if (!target) {
        handleClick({ clientX: e.clientX, clientY: e.clientY, target: { getBoundingClientRect: () => rect } });
      }
    }
  }, [draw, handleClick, within]);

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
        toast.error('Closing the curve would cause an intersection with another curve or itself. Please reconfigure the nodes before proceeding.');
      }
    }
  }, [draw]);

  const toggleNodesAndPointsVisibility = useCallback(() => {
    setShowNodesAndPoints(prev => !prev);
  }, [setShowNodesAndPoints]);

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

  return {
    curvesRef,
    closedCurvesRef,
    isDrawingNewCurveRef,
    selectionRef,
    highlightedCells,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    deleteNode,
    closeCurrentCurve,
    toggleNodesAndPointsVisibility
  };
};

export default useCanvasInteractions;