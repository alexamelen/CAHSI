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

// Automatically draws all nodes, edges, and the Bezier curve
function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw edges (polyline)
    for (let i = 0; i < edges.length; i++) {
        let fromNode = edges[i].from;
        let toNode = edges[i].to;
        context.beginPath();
        context.strokeStyle = fromNode.strokeStyle;
        context.moveTo(fromNode.x, fromNode.y);
        context.lineTo(toNode.x, toNode.y);
        context.stroke();
    }

    // Draw nodes
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
        drawBezierCurve(nodes);
    }
}

// Function to draw the Bezier curve from nodes
function drawBezierCurve(nodes) {
    if (nodes.length < 3) return;

    context.beginPath();
    context.moveTo(nodes[0].x, nodes[0].y);

    for (let i = 1; i < nodes.length - 1; i++) {
        let xc = (nodes[i].x + nodes[i + 1].x) / 2;
        let yc = (nodes[i].y + nodes[i + 1].y) / 2;
        context.quadraticCurveTo(nodes[i].x, nodes[i].y, xc, yc);
    }

    context.lineTo(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y);
    context.strokeStyle = '#ff0000';
    context.lineWidth = 2;
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
