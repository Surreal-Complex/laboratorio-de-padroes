'use strict';
const byId = id => document.getElementById(id);
const modules = ['numeros', 'simetrias', 'grafos'];
function navigate() {
  const hash = location.hash.slice(1);
  const active = modules.includes(hash) ? hash : modules[0];
  modules.forEach(id => {
    byId(id).hidden = id !== active;
    const link = document.querySelector('.modules a[href="#' + id + '"]');
    if (id === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = byId(active).querySelector('h1').textContent + ' · Laboratório de Padrões';
}
window.addEventListener('hashchange', navigate);
navigate();

for (const note of document.querySelectorAll('[data-note]')) {
  const key = 'laboratorio-' + note.id;
  try {
    note.value = localStorage.getItem(key) ?? '';
  } catch {}
  note.addEventListener('input', () => {
    try {
      localStorage.setItem(key, note.value);
    } catch {}
  });
}

const totalInput = byId('total');
const columnsInput = byId('columns');
function renderPoints() {
  const total = totalInput.valueAsNumber;
  const valid = Number.isInteger(total) && total >= 2 && total <= 60;
  columnsInput.disabled = !valid;
  const points = byId('points');
  points.hidden = !valid;
  if (!valid) {
    byId('division').textContent = 'Digite um inteiro de 2 a 60.';
    return;
  }
  if (columnsInput.options.length !== total) {
    const previous = Number(columnsInput.value) || 4;
    columnsInput.replaceChildren(...Array.from({length: total}, (_, i) => new Option(i + 1, i + 1)));
    columnsInput.value = Math.min(previous, total);
  }
  const columns = Number(columnsInput.value);
  const rows = Math.floor(total / columns);
  const remainder = total % columns;
  points.style.gridTemplateColumns = 'repeat(' + columns + ', minmax(0, 14px))';
  points.style.gap = columns > 25 ? '2px' : '5px';
  points.replaceChildren(...Array.from({length: total}, (_, i) => {
    const dot = document.createElement('span');
    dot.className = i >= rows * columns ? 'dot extra' : 'dot';
    return dot;
  }));
  byId('division').textContent = remainder
    ? total + ' = ' + rows + ' × ' + columns + ' + ' + remainder + (remainder === 1 ? '. Sobra 1 ponto.' : '. Sobram ' + remainder + ' pontos.')
    : total + ' = ' + rows + ' × ' + columns + '. Retângulo completo.';
}
totalInput.addEventListener('input', renderPoints);
columnsInput.addEventListener('change', renderPoints);
renderPoints();

function radialShape(count, radius, innerRadius = radius) {
  return Array.from({length:count}, (_, i) => {
    const theta = i * 2 * Math.PI / count - Math.PI / 2;
    const r = i % 2 ? innerRadius : radius;
    return [r * Math.cos(theta), r * Math.sin(theta)];
  });
}
const shapes = {
  square: [[-64,-64],[64,-64],[64,64],[-64,64]],
  rectangle: [[-77,-44],[77,-44],[77,44],[-77,44]],
  triangle: radialShape(3, 76),
  isosceles: [[0,-78],[57,39],[-57,39]],
  pentagon: radialShape(5, 76),
  hexagon: radialShape(6, 76),
  octagon: radialShape(8, 76),
  star: radialShape(10, 80, 34),
  parallelogram: [[-40,-40],[75,-40],[40,40],[-75,40]],
  flag: [[-68,-56],[69,-56],[39,-11],[6,-11],[6,64],[-68,64]]
};
let angle = 0;
let reflected = false;
function drawShape(canvas, vertices) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,240,240);
  ctx.save();
  ctx.translate(120,120);
  ctx.beginPath();
  vertices.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  ctx.fillStyle = '#cbf686';
  ctx.fill();
  ctx.setLineDash([5,5]);
  ctx.strokeStyle = '#729075';
  ctx.beginPath();
  ctx.moveTo(0,-108);
  ctx.lineTo(0,108);
  ctx.stroke();
  ctx.restore();
}
function transform([x,y]) {
  const radians = angle * Math.PI / 180;
  const dx = x * Math.cos(radians) - y * Math.sin(radians);
  const dy = x * Math.sin(radians) + y * Math.cos(radians);
  return [reflected ? -dx : dx, dy];
}
function renderSymmetry() {
  const vertices = shapes[byId('shape').value];
  const mapped = vertices.map(transform);
  drawShape(byId('original'), vertices);
  drawShape(byId('transformed'), mapped);
  const matches = mapped.every(([x,y]) => vertices.some(([a,b]) => Math.hypot(a - x, b - y) < 0.000001));
  const description = 'Giro de ' + angle + '°' + (reflected ? ' seguido de reflexão vertical' : '');
  byId('transformed').setAttribute('aria-label', 'Figura transformada. ' + description);
  byId('symmetry').textContent = description + (matches ? '. A figura coincide com a original.' : '. A figura ficou em uma posição diferente.');
}
function resetShape() {
  angle = 0;
  reflected = false;
  renderSymmetry();
}
byId('rotate').addEventListener('click', () => {
  const step = Number(byId('turn').value);
  angle = (angle + 360 + (reflected ? -step : step)) % 360;
  renderSymmetry();
});
byId('turn').addEventListener('change', () => {
  byId('rotate').textContent = 'Girar ' + byId('turn').value + '°';
});
byId('reflect').addEventListener('click', () => {
  reflected = !reflected;
  renderSymmetry();
});
byId('shape').addEventListener('change', resetShape);
byId('reset-shape').addEventListener('click', resetShape);
renderSymmetry();

const nodes = {A:[105,62], B:[375,62], C:[375,238], D:[105,238], E:[250,115]};
const cycle = ['AB','BC','CD','AD'];
const networks = [cycle, [...cycle,'AC'], [...cycle,'AC','BD'], [...cycle,'AE','BE'], [...cycle,'AE','CE','AC'], ['AB1','AB2','AC3','AC4','AD5','BD6','CD7']];
const canvas = byId('graph');
const context = canvas.getContext('2d');
let route = [];
let traversed = [];
const edge = (a,b) => [a,b].sort().join('');
const activeEdges = () => networks[Number(byId('network').value)];
const historical = () => byId('network').value === '5';
const bridgeNodes = {A:[200,150], B:[95,48], C:[95,252], D:[392,150]};
function cross(name) {
  const current = route.at(-1);
  const [a,b] = name;
  route.push(current === a ? b : a);
  traversed.push(name);
  renderGraph();
}
function drawGraph(available, used, current) {
  const positions = historical() ? bridgeNodes : nodes;
  context.clearRect(0,0,480,300);
  for (const name of available) {
    const [a,b] = name;
    context.beginPath();
    const [ax,ay] = positions[a];
    const [bx,by] = positions[b];
    const offset = {AB1:-42,AB2:42,AC3:-42,AC4:42}[name] ?? 0;
    const length = Math.hypot(bx-ax,by-ay);
    const mx = (ax+bx)/2 - (by-ay)/length * offset;
    const my = (ay+by)/2 + (bx-ax)/length * offset;
    context.moveTo(ax,ay);
    context.quadraticCurveTo(mx,my,bx,by);
    context.strokeStyle = used.includes(name) ? '#cbf686' : '#78998e';
    context.lineWidth = used.includes(name) ? 7 : 3;
    context.stroke();
    if (historical()) {
      context.fillStyle = '#f1fff4';
      context.font = 'bold 16px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(name[2],(ax+bx)/4+mx/2+5,(ay+by)/4+my/2-8);
    }
  }
  for (const [name,[x,y]] of Object.entries(positions)) {
    if (!available.some(edge => edge.includes(name))) continue;
    context.beginPath();
    context.arc(x,y,24,0,2*Math.PI);
    context.fillStyle = name === current ? '#cbf686' : '#ecf6ee';
    context.fill();
    context.fillStyle = '#102c28';
    context.font = 'bold 22px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name,x,y);
  }
}
const vertexButtons = Object.keys(nodes).map(node => {
  const button = document.createElement('button');
  button.textContent = node;
  button.setAttribute('aria-label','Ir para o vértice ' + node);
  button.addEventListener('click', () => {
    const current = route.at(-1);
    if (!current) {
      route.push(node);
      renderGraph();
      if (historical()) byId('bridges').querySelector('button')?.focus();
      return;
    }
    const next = edge(current,node);
    if (!activeEdges().includes(next) || traversed.includes(next)) {
      byId('route').textContent = current === node ? 'Você já está em ' + node + '.' :
        traversed.includes(next) ? 'Essa aresta já foi usada.' : 'Esses vértices não são vizinhos.';
      return;
    }
    cross(next);
  });
  byId('vertices').append(button);
  return button;
});
function renderGraph() {
  const available = activeEdges();
  const used = traversed;
  const current = route.at(-1);
  const degrees = Object.keys(nodes).map(node => [node, available.filter(name => name.includes(node)).length]).filter(([,degree]) => degree);
  drawGraph(available,used,current);
  byId('edges').textContent = (historical() ? 'Pontes: ' + available.map(([a,b,n]) => n + ' (' + a + '–' + b + ')').join(', ') : 'Arestas: ' + available.join(', ')) + (byId('network').value === '2' ? '. O cruzamento das diagonais não é um vértice.' : '.');
  byId('degrees').textContent = 'Graus: ' + degrees.map(([node,degree]) => node + ' ' + degree).join(' · ') + '. Soma: ' + (2 * available.length) + '.';
  let message = route.length ? 'Percurso: ' + route.join(' → ') + '. ' + used.length + ' de ' + available.length + ' arestas.' : 'Escolha o vértice inicial.';
  if (used.length === available.length) message += ' Você percorreu todas as arestas!';
  else if (current && !available.some(name => name.includes(current) && !used.includes(name))) message += ' Sem saída por arestas novas. Desfaça um passo ou reinicie.';
  byId('route').textContent = message;
  byId('undo').disabled = route.length === 0;
  const bridges = byId('bridges');
  bridges.replaceChildren();
  if (historical() && current) {
    for (const name of available.filter(name => name.includes(current))) {
      const [a,b,n] = name;
      const button = document.createElement('button');
      button.textContent = 'Ponte ' + n + ' para ' + (current === a ? b : a);
      button.disabled = used.includes(name);
      button.addEventListener('click', () => {
        cross(name);
        (bridges.querySelector('button:not(:disabled)') ?? byId('undo')).focus();
      });
      bridges.append(button);
    }
  }
  vertexButtons.forEach(button => {
    button.hidden = (historical() && Boolean(current)) || !degrees.some(([node]) => node === button.textContent);
    button.disabled = used.length === available.length;
  });
}
function resetGraph() {
  route = [];
  traversed = [];
  renderGraph();
}
byId('undo').addEventListener('click', () => {
  route.pop();
  traversed.pop();
  renderGraph();
});
byId('reset-graph').addEventListener('click', resetGraph);
byId('network').addEventListener('change', resetGraph);
renderGraph();
