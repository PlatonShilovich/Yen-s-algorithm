const nodes = [
    { label: "0", x: 50, y: 50 },
    { label: "1", x: 150, y: 50 },
    { label: "2", x: 50, y: 150 },
    { label: "3", x: 150, y: 150 },
    { label: "4", x: 250, y: 50 },
    { label: "5", x: 250, y: 150 },
    { label: "6", x: 350, y: 50 },
    { label: "7", x: 350, y: 150 },
    { label: "8", x: 450, y: 150 }
];

const edges = [
    { source: nodes[6], target: nodes[0], cost: 3 },
    { source: nodes[1], target: nodes[0], cost: 2 },
    { source: nodes[2], target: nodes[0], cost: 6 },
    { source: nodes[6], target: nodes[1], cost: 9 },
    { source: nodes[2], target: nodes[1], cost: 9 },
    { source: nodes[3], target: nodes[1], cost: 3 },
    { source: nodes[2], target: nodes[3], cost: 7 },
    { source: nodes[4], target: nodes[3], cost: 5 },
    { source: nodes[4], target: nodes[6], cost: 8 },
    { source: nodes[7], target: nodes[4], cost: 9 },
    { source: nodes[5], target: nodes[1], cost: 4 },
    { source: nodes[7], target: nodes[5], cost: 6 },
    { source: nodes[8], target: nodes[5], cost: 4 },
    { source: nodes[8], target: nodes[7], cost: 1 },
    { source: nodes[3], target: nodes[0], cost: 8 },
    { source: nodes[5], target: nodes[3], cost: 5 },
];


document.getElementById('load-file').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const contents = event.target.result;
        parseGraphFile(contents);
        updateGraph();
    };
    reader.readAsText(file);
}

function parseGraphFile(contents) {
    const lines = contents.split('\n');
    let isNodeSection = false;
    let isEdgeSection = false;
    nodes.length = 0;
    edges.length = 0;

    lines.forEach(line => {
        line = line.trim();
        if (line === 'NODES') {
            isNodeSection = true;
            isEdgeSection = false;
        } else if (line === 'EDGES') {
            isNodeSection = false;
            isEdgeSection = true;
        } else if (isNodeSection) {
            const [label, x, y] = line.split(' ');
            if (label && !isNaN(x) && !isNaN(y)) {
                nodes.push({ label, x: parseFloat(x), y: parseFloat(y) });
            }
        } else if (isEdgeSection) {
            const [sourceLabel, targetLabel, cost] = line.split(' ');
            const sourceNode = nodes.find(node => node.label === sourceLabel);
            const targetNode = nodes.find(node => node.label === targetLabel);
            if (sourceNode && targetNode && !isNaN(cost)) {
                edges.push({ source: sourceNode, target: targetNode, cost: parseFloat(cost) });
            }
        }
    });
}



// const nodes = [];
// const edges = [];

// // Create 100 nodes
// for (let i = 0; i < 10; i++) {
//     nodes.push({ label: i.toString(), x: Math.random() * 1000, y: Math.random() * 1000 });
// }

// // Create edges with a pattern and some random variation
// for (let i = 0; i < 10; i++) {
//     for (let j = i + 1; j < 10; j++) {
//         if (Math.random() > 0.5) {
//             edges.push({ source: nodes[i], target: nodes[j], cost: Math.floor(Math.random() * 10) + 1 });
//         }
//     }
// }


const width = document.getElementById('graph').clientWidth;
const height = document.getElementById('graph').clientHeight;


const svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(edges).id(d => d.label).distance(150))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

function ticked() {
    nodes.forEach(d => {
        d.x = Math.max(10, Math.min(width - 10, d.x));
        d.y = Math.max(10, Math.min(height - 10, d.y));
    });
    svg.selectAll(".link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    svg.selectAll(".node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    svg.selectAll(".label")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);

    svg.selectAll(".node-label")
        .attr("x", d => d.x + 15)
        .attr("y", d => d.y + 3);
}


function removeNode() {
    const label = document.getElementById('remove-node-label').value;
    const nodeIndex = nodes.findIndex(node => node.label === label);

    if (nodeIndex === -1) {
        alert("Node not found.");
        return;
    }

    // Remove the node
    nodes.splice(nodeIndex, 1);

    // Remove associated edges
    for (let i = edges.length - 1; i >= 0; i--) {
        if (edges[i].source.label === label || edges[i].target.label === label) {
            edges.splice(i, 1);
        }
    }

    // Restart the simulation
    simulation.nodes(nodes);
    simulation.force("link").links(edges);
    simulation.alpha(1).restart();

    // Update the graph
    updateGraph();
}


function removeEdge() {
    const sourceLabel = document.getElementById('remove-edge-source').value;
    const targetLabel = document.getElementById('remove-edge-target').value;

    // Найти индекс ребра
    const edgeIndex = edges.findIndex(edge => 
        (edge.source.label === sourceLabel && edge.target.label === targetLabel) ||
        (edge.source.label === targetLabel && edge.target.label === sourceLabel)
    );

    if (edgeIndex !== -1) {
        // Удалить ребро из массива ребер
        edges.splice(edgeIndex, 1);
        updateGraph();
    } else {
        alert('Ребро с такими узлами не существует.');
    }
}

function updateGraph() {
    // Update links
    const link = svg.selectAll(".link")
        .data(edges, d => `${d.source.label}-${d.target.label}`);

    link.exit().remove();
    link.enter().append("line")
        .attr("class", "link")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    // Update link labels
    const linkLabels = svg.selectAll(".label")
        .data(edges, d => `${d.source.label}-${d.target.label}`);

    linkLabels.exit().remove();
    linkLabels.enter().append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .merge(linkLabels) // Объединить новые и существующие метки
        .text(d => d.cost);

    // Удаляем все узлы и перерисовываем их заново, чтобы они всегда были поверх ребер
    svg.selectAll(".node").remove();
    svg.selectAll(".node-label").remove();

    // Update nodes
    const node = svg.selectAll(".node")
        .data(nodes, d => d.label);

    node.exit().remove();
    node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 10)
        .attr("fill", "steelblue")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Update node labels
    const nodeLabels = svg.selectAll(".node-label")
        .data(nodes, d => d.label);

    nodeLabels.exit().remove();
    nodeLabels.enter().append("text")
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(d => d.label);

    simulation.nodes(nodes);
    simulation.force("link").links(edges);
    simulation.alpha(1).restart();
}



document.getElementById('clear-graph-button').addEventListener('click', clearGraph);
function clearGraph() {
    // Очищаем массивы узлов и связей
    nodes.length = 0;
    edges.length = 0;

    // Останавливаем симуляцию
    simulation.stop();

    // Обновляем графическое представление
    updateGraph();
}

function addNode() {
    const label = document.getElementById('node-label').value;

    // Проверка на существование узла с таким же label
    const nodeExists = nodes.some(node => node.label === label);

    if (nodeExists) {
        alert('Узел с такой меткой уже существует.');
        return;
    }

    const x = width / 2;  // Центрируем новый узел
    const y = height / 2; // Центрируем новый узел

    nodes.push({ label: label, x: x, y: y });
    updateGraph();
}





function addEdge() {
    const sourceLabel = document.getElementById('edge-source').value;
    const targetLabel = document.getElementById('edge-target').value;
    const cost = parseInt(document.getElementById('edge-cost').value, 10);

    // Найти узлы источника и цели
    let sourceNode = nodes.find(node => node.label === sourceLabel);
    let targetNode = nodes.find(node => node.label === targetLabel);

    if (!sourceNode || !targetNode) {
        alert('Узел источника или цели не существует.');
        return;
    }

    // Найти, существует ли уже такое ребро
    let existingEdge = edges.find(edge => 
        (edge.source.label === sourceLabel && edge.target.label === targetLabel) ||
        (edge.source.label === targetLabel && edge.target.label === sourceLabel)
    );

    if (existingEdge) {
        // Обновить стоимость существующего ребра
        existingEdge.cost = cost;
    } else {
        // Добавить новое ребро
        edges.push({ source: sourceNode, target: targetNode, cost: cost });
    }

    // Перерисовать граф
    updateGraph();
}


function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = Math.max(10, Math.min(width - 10, event.x));
    d.fy = Math.max(10, Math.min(height - 10, event.y));
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function dijkstra(graph, startNode, endNode) {
    let distances = {};
    let prev = {};
    let pq = new PriorityQueue();

    distances[startNode.label] = 0;
    pq.enqueue(startNode.label, 0);

    graph.nodes.forEach(node => {
        if (node.label !== startNode.label) {
            distances[node.label] = Infinity;
        }
        prev[node.label] = null;
    });

    while (!pq.isEmpty()) {
        let minNode = pq.dequeue().element;
        if (minNode === endNode.label) {
            let path = [];
            let current = endNode.label;
            while (current) {
                path.unshift(current);
                current = prev[current];
            }
            return { path, distance: distances[endNode.label] };
        }

        graph.edges.forEach(edge => {
            if (edge.source.label === minNode || edge.target.label === minNode) {
                let neighbor = edge.source.label === minNode ? edge.target.label : edge.source.label;
                let newDist = distances[minNode] + edge.cost;
                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    prev[neighbor] = minNode;
                    pq.enqueue(neighbor, newDist);
                }
            }
        });
    }
    return { path: [], distance: Infinity };
}

function yenKSP(graph, startNode, endNode, K) {
    let A = [];
    let B = [];

    let { path, distance } = dijkstra(graph, startNode, endNode);
    if (path.length === 0) {
        return [];
    }
    A.push({ path, distance });

    for (let k = 1; k < K; k++) {
        for (let i = 0; i < A[k - 1].path.length - 1; i++) {
            let spurNode = A[k - 1].path[i];
            let rootPath = A[k - 1].path.slice(0, i + 1);
            let removedEdges = [];
            let removedNodes = new Set();

            A.forEach(p => {
                let pRootPath = p.path.slice(0, i + 1);
                if (JSON.stringify(rootPath) === JSON.stringify(pRootPath)) {
                    let edgeToRemove = graph.edges.find(e => (e.source.label === p.path[i] && e.target.label === p.path[i + 1]) ||
                        (e.target.label === p.path[i] && e.source.label === p.path[i + 1]));
                    if (edgeToRemove) {
                        removedEdges.push(edgeToRemove);
                        graph.edges = graph.edges.filter(e => e !== edgeToRemove);
                    }
                }
            });

            rootPath.forEach(node => removedNodes.add(node));

            let spurPath = [];
            let spurDistance = 0;
            let spurGraph = {
                nodes: graph.nodes.filter(n => !removedNodes.has(n.label)),
                edges: graph.edges.filter(e => !removedEdges.includes(e))
            };

            let result = dijkstra(spurGraph, graph.nodes.find(n => n.label === spurNode), endNode);
            if (result.path.length > 0) {
                spurPath = result.path;
                spurDistance = result.distance;
            }

            if (spurPath.length > 0) {
                let totalPath = rootPath.slice(0, -1).concat(spurPath);
                let totalDistance = calculatePathDistance(totalPath, edges);

                if (!B.some(p => JSON.stringify(p.path) === JSON.stringify(totalPath))) {
                    B.push({ path: totalPath, distance: totalDistance });
                }
            }

            removedEdges.forEach(e => graph.edges.push(e));
        }

        if (B.length === 0) {
            break;
        }
        B.sort((a, b) => a.distance - b.distance);
        A.push(B[0]);
        B.shift();
    }
    return A.slice(0, K);
}

function calculatePathDistance(path, edges) {
    return path.reduce((acc, node, idx, arr) => {
        if (idx < arr.length - 1) {
            let edge = edges.find(e =>
                (e.source.label === arr[idx] && e.target.label === arr[idx + 1]) ||
                (e.target.label === arr[idx] && e.source.label === arr[idx + 1])
            );
            return acc + (edge ? edge.cost : 0);
        }
        return acc;
    }, 0);
}

function countAllPaths(graph, startNode, endNode) {
    let count = 0;

    function dfs(currentNode, visited) {
        if (currentNode === endNode.label) {
            count++;
            return;
        }
        visited.add(currentNode);
        graph.edges.forEach(edge => {
            let neighbor = null;
            if (edge.source.label === currentNode && !visited.has(edge.target.label)) {
                neighbor = edge.target.label;
            } else if (edge.target.label === currentNode && !visited.has(edge.source.label)) {
                neighbor = edge.source.label;
            }
            if (neighbor) {
                dfs(neighbor, new Set(visited));
            }
        });
    }

    dfs(startNode.label, new Set());
    return count;
}

function validateAndSearchNewPaths(graph, startNode, endNode, K, paths) {
    let validPaths = paths.filter(pathObj => {
        let calculatedDistance = calculatePathDistance(pathObj.path, edges);
        return calculatedDistance === pathObj.distance;
    });

    let invalidPaths = paths.filter(pathObj => {
        let calculatedDistance = calculatePathDistance(pathObj.path, edges);
        return calculatedDistance !== pathObj.distance;
    });

    if (invalidPaths.length > 0) {
        invalidPaths.forEach(pathObj => {
            let newPaths = yenKSP(graph, startNode, endNode, 1);
            validPaths = validPaths.concat(newPaths);
        });
    }

    if (validPaths.length < K) {
        let newPaths = yenKSP(graph, startNode, endNode, K - validPaths.length);
        validPaths = validPaths.concat(newPaths);
    }

    return validPaths.slice(0, K);
}

function findKOptimalPaths() {
    const sourceLabel = document.getElementById("yen-source").value;
    const targetLabel = document.getElementById("yen-target").value;
    let k = +document.getElementById("yen-k").value;

    const source = nodes.find(node => node.label === sourceLabel);
    const target = nodes.find(node => node.label === targetLabel);

    if (!source || !target) {
        alert("Both source and target nodes must exist.");
        return;
    }

    const maxPaths = countAllPaths({ nodes, edges }, source, target);
    if (k > maxPaths) {
        alert(`k превышает количество возможных путей. Установлено k = ${maxPaths}`);
        k = maxPaths;
    }

    const initialPaths = yenKSP({ nodes, edges }, source, target, k);
    const validPaths = validateAndSearchNewPaths({ nodes, edges }, source, target, k, initialPaths);
    displayPaths(validPaths);
}

function highlightPath(path) {
    // Сначала сбрасываем цвета всех рёбер на стандартные
    svg.selectAll(".link")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    // Подсвечиваем рёбра, входящие в путь
    path.forEach((nodeLabel, index) => {
        if (index < path.length - 1) {
            svg.selectAll(".link")
                .filter(d => (d.source.label === nodeLabel && d.target.label === path[index + 1]) ||
                             (d.target.label === nodeLabel && d.source.label === path[index + 1]))
                .attr("stroke", "red")
                .attr("stroke-width", 4);
        }
    });
}

function displayPaths(paths) {
    const tableBody = document.getElementById("paths-table").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = "";

    paths.forEach((pathObj, index) => {
        const row = tableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);

        cell1.innerHTML = index + 1;
        cell2.innerHTML = pathObj.path.join("-");
        cell3.innerHTML = pathObj.distance;

        // Добавляем обработчик событий для подсветки пути при клике
        row.addEventListener("click", () => {
            highlightPath(pathObj.path);
        });
    });
}


class PriorityQueue {
    constructor() {
        this.items = [];
    }
    enqueue(element, priority) {
        let contain = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > priority) {
                this.items.splice(i, 0, { element, priority });
                contain = true;
                break;
            }
        }
        if (!contain) {
            this.items.push({ element, priority });
        }
    }
    dequeue() {
        if (this.isEmpty()) {
            return "Underflow";
        }
        return this.items.shift();
    }
    isEmpty() {
        return this.items.length === 0;
    }
}

updateGraph();
