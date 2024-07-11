let graph = {
    nodes: [],
    links: []
};

const svg = d3.select('svg');
const width = +svg.attr('width');
const height = +svg.attr('height');

let simulation;
let link;
let node;
let text;

function initializeGraph() {
    simulation = d3.forceSimulation(graph.nodes)
        .force('link', d3.forceLink(graph.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);

    link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.links)
        .enter().append('line')
        .attr('class', 'link');

    node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', 15)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    text = svg.append('g')
        .attr('class', 'texts')
        .selectAll('text')
        .data(graph.nodes)
        .enter().append('text')
        .attr('class', 'node-text')
        .text(d => d.id);
}

function ticked() {
    link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

    text
        .attr('x', d => d.x)
        .attr('y', d => d.y);
}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

async function dfs(graph, startNodeId) {
    const visited = new Set();
    const order = [];
    const edges = [];

    async function dfsRecursive(nodeId) {
        visited.add(nodeId);
        order.push(nodeId);
        console.log(`Visitando vértice: ${nodeId}`);
        pintaVertice(nodeId);
        await sleep(500);

        for (const link of graph.links) {
            if (link.source.id === nodeId && !visited.has(link.target.id)) {
                edges.push({ source: nodeId, target: link.target.id });
                console.log(`Visitando aresta: ${nodeId} -> ${link.target.id}`);
                pintaAresta({ source: nodeId, target: link.target.id });
                await sleep(500);
                await dfsRecursive(link.target.id);
            } else if (link.target.id === nodeId && !visited.has(link.source.id)) {
                edges.push({ source: link.source.id, target: nodeId });
                console.log(`Visitando aresta: ${link.source.id} -> ${nodeId}`);
                pintaAresta({ source: link.source.id, target: nodeId });
                await sleep(500);
                await dfsRecursive(link.source.id);
            }
        }
    }

    await dfsRecursive(startNodeId);
}

function pintaVertice(nodeId) {
    node.filter(d => d.id === nodeId).classed('visited', true);
}

function pintaAresta(aresta) {
    link.filter(d => 
        (d.source.id === aresta.source && d.target.id === aresta.target) ||
        (d.source.id === aresta.target && d.target.id === aresta.source))
        .classed('highlighted-link', true);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDFS() {
    const startNodeId = document.getElementById('start-node').value;
    const result = await dfs(graph, startNodeId);
    console.log('Ordem de visita:', result.order);
}

function updateGraph() {
    const vertexCount = document.getElementById('vertex-count').value;
    const edgesInput = document.getElementById('edges-input').value;

    const nodes = [];
    for (let i = 0; i < vertexCount; i++) {
        nodes.push({ id: String(i) });
    }

    const links = edgesInput.trim().split('\n').map(line => {
        const [source, target] = line.split(' ');
        return { source, target };
    });

    graph = { nodes, links };

    svg.selectAll('*').remove(); // Limpa o SVG

    initializeGraph();
    simulation.nodes(graph.nodes);
    simulation.force('link').links(graph.links);
    simulation.alpha(1).restart();
}

document.getElementById('vertex-count').addEventListener('input', updateGraph);
document.getElementById('edges-input').addEventListener('input', updateGraph);

updateGraph();

const codeElement = document.getElementById('java-code');
const codeLines = codeElement.textContent.split('\n');
codeElement.innerHTML = codeLines.map(line => `<span>${line}</span>`).join('\n');
