export const doLinesIntersect = (line1, line2) => {
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
  
  
