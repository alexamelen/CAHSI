const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

var nodes = [];
var edges = [];
var selection = undefined;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.onresize = resize;
resize();

// Draws a node
function drawNode(node) {
    context.beginPath();
    context.fillStyle = node.fillStyle;
    context.arc(node.x, node.y, node.radius, 0, Math.PI * 2, true);
    context.strokeStyle = node.strokeStyle;
    context.stroke();
    context.fill();
}

// Automatically draw an edge from the previous node to the new one
function click(e) {
    let node = {
        x: e.x,
        y: e.y,
        radius: 10,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        selectedFill: '#bdc1c9',
        selected: false
    };

    nodes.push(node);

    // Automatically connect the previous node to the new one
    if (nodes.length > 1) {
        let previousNode = nodes[nodes.length - 2];
        edges.push({ from: previousNode, to: node });
    }

    draw();
}

// Function to move the node
function move(e) {
    if (selection && e.buttons) {
        selection.x = e.x;
        selection.y = e.y;
        draw();
    }
}

// Check if the click is inside a node
function within(x, y) {
    return nodes.find(n => {
        return x > (n.x - n.radius) && 
            y > (n.y - n.radius) &&
            x < (n.x + n.radius) &&
            y < (n.y + n.radius);
    });
}

// Handles mouse down (selects a node)
function down(e) {
    let target = within(e.x, e.y);
    if (selection && selection.selected) {
        selection.selected = false;
    }
    if (target) {
        selection = target;
        selection.selected = true;
        draw();
    }
}

// Handles mouse up (resets selection)
function up(e) {
    if (!selection) {
        click(e);
    }
    if (selection && !selection.selected) {
        selection = undefined;
    }
    draw();
}

// Deletes a node and its edges
function deleteNode(target) {
    if (!target) return;
    nodes = nodes.filter(n => n !== target);
    edges = edges.filter(edge => edge.from !== target && edge.to !== target);
    if (selection === target) {
        selection = undefined;
    }
    draw();
}

// Automatically draws all nodes, and the Bezier curve
function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        context.beginPath();
        context.fillStyle = node.selected ? node.selectedFill : node.fillStyle;
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2, true);
        context.strokeStyle = node.strokeStyle;
        context.fill();
        context.stroke();
    }

    // Draw Bezier curve
    if (nodes.length > 1) {
        drawBezierCurve(context,nodes);
    }
}

// Function to draw the Bezier curve from nodes
function drawBezierCurve(context, nodes) {
    if (nodes.length < 2) return;

    context.beginPath();
    context.moveTo(nodes[0].x, nodes[0].y);


    for(let i=0; i <= nodes.length-1;i++){
        let p0 = nodes[i-1] || nodes[i];
        let p1 = nodes[i];
        let p2 = nodes[i+1] || p1;
        let p3 = nodes[i+2] || p2;

        let cp1x= p1.x+(p2.x-p0.x) /6;
        let cp1y = p1.y + (p2.y - p0.y) / 6;
        let cp2x = p2.x - (p3.x - p1.x) / 6;
        let cp2y = p2.y - (p3.y - p1.y) / 6;

        context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    context.stroke();
}

// Event Listeners
window.onmousemove = move;
window.onmousedown = down;
window.onmouseup = up;
window.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && selection) {
        deleteNode(selection);
    }
});