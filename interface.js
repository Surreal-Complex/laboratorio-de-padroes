'use strict';

const drawer = document.querySelector('#menu-lateral');
const menuButton = document.querySelector('#abrir-menu');
const nav = document.querySelector('#navegacao');
const navHome = nav.parentElement;
const narrow = window.matchMedia('(max-width: 840px)');
if (drawer.showModal) {
  document.documentElement.classList.add('com-menu');
  menuButton.addEventListener('click', () => {
    drawer.querySelector('.destino-menu').append(nav);
    drawer.showModal();
    menuButton.setAttribute('aria-expanded', 'true');
  });
  drawer.addEventListener('close', () => {
    navHome.append(nav);
    menuButton.setAttribute('aria-expanded', 'false');
    if (narrow.matches) menuButton.focus();
  });
  drawer.addEventListener('click', event => {
    if (event.target === drawer || event.target.closest('a')) drawer.close();
  });
  narrow.addEventListener('change', () => {
    if (!narrow.matches && drawer.open) drawer.close();
  });
}

function openDisclosure() {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.tagName === 'DETAILS' && target.classList.contains('home-panel')) target.open = true;
}
window.addEventListener('hashchange', openDisclosure);
openDisclosure();

const animations = window.animacoesMatematicas;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const observed = new Set();
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) observed.add(entry.target);
    else observed.delete(entry.target);
  }
}) : null;
const palettes = {line:'#719a92', bright:'#cbf686', pale:'#f3fff8', muted:'#385b54'};

function draw(figure, step) {
  const kind = figure.dataset.animation;
  const data = animations[kind];
  const ctx = figure.querySelector('canvas').getContext('2d');
  if (!ctx) return;
  const {line, bright, pale, muted} = palettes;
  const path = (points, color, close = false) => {
    ctx.beginPath();
    for (const [i,[x,y]] of points.entries()) {
      if (i) ctx.lineTo(x,y);
      else ctx.moveTo(x,y);
    }
    if (close) ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  const dot = (x,y,r,color) => {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  const label = (text,x,y,color=pale) => {
    ctx.fillStyle = color;
    ctx.fillText(text,x,y);
  };
  ctx.clearRect(0,0,320,158);
  ctx.lineWidth = 1;
  for (let x = 16; x < 320; x += 16) path([[x,0],[x,158]],muted);
  for (let y = 15; y < 158; y += 16) path([[0,y],[320,y]],muted);
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 14px system-ui';

  switch (kind) {
    case 'inicio': {
      path([[20,79],[300,79]],line);
      path([[160,10],[160,148]],line);
      const count = Math.min(data.length, 2 + step % (data.length + 18));
      path(data.slice(0,count),bright);
      dot(...data[count-1],4,pale);
      break;
    }
    case 'numeros':
      for (const [x,y] of data[Math.floor(step/10)%data.length]) dot(x,y,4,bright);
      break;
    case 'simetrias': {
      const i = Math.floor(step/2) % (data.length+10);
      path([[160,9],[160,149]],line);
      path(data[0],line,true);
      path(data[Math.min(i,data.length-1)],bright,true);
      dot(...data[Math.min(i,data.length-1)][0],4,pale);
      break;
    }
    case 'grafos': {
      const i = Math.min(data.edges.length,Math.floor(step/8)%(data.edges.length+2));
      data.edges.forEach(([a,b],j) => path([data.nodes[a],data.nodes[b]],j<i?bright:line));
      data.nodes.forEach(([x,y],j) => {
        dot(x,y,12,data.route[i]===j?bright:muted);
        label('ABCD'[j],x,y,data.route[i]===j?'#102c28':pale);
      });
      break;
    }
    case 'fundamentos': {
      const word = data[Math.floor(step/9)%data.length];
      for (const [i,letter] of [...word].entries()) {
        const x = 104 + i*56;
        dot(x,78,19,i===1?bright:muted);
        label(letter,x,78,i===1?'#102c28':pale);
      }
      break;
    }
    case 'jogos': {
      const board = data[Math.floor(step/7)%data.length];
      board.forEach((value,i) => {
        const x = 109+(i%3)*35;
        const y = 28+Math.floor(i/3)*35;
        ctx.fillStyle = value ? (value >= 7 ? bright : pale) : muted;
        ctx.fillRect(x,y,31,31);
        if (value) label(value,x+15.5,y+15.5,'#102c28');
      });
      break;
    }
    case 'trilhas': {
      const points = data.map(([x,y]) => [63+x*29,134-y*4]);
      path([[43,134],[279,134]],line);
      path([[63,148],[63,16]],line);
      const count = 1 + Math.min(points.length-1, Math.floor(step/5)%(points.length+2));
      path(points.slice(0,count),bright);
      for (const point of points.slice(0,count)) dot(...point,4,bright);
      break;
    }
  }
}

const states = new Map();
for (const figure of document.querySelectorAll('[data-animation]')) {
  const button = figure.querySelector('button');
  const state = {paused:reduced.matches,frame:figure.dataset.animation === 'inicio' ? 28 : 0};
  states.set(figure,state);
  const caption = figure.querySelector('figcaption span').textContent;
  const reflect = () => {
    button.textContent = state.paused ? 'Animar' : 'Pausar';
    button.setAttribute('aria-label', button.textContent + ' · ' + caption);
  };
  button.addEventListener('click', () => {
    state.paused = !state.paused;
    reflect();
  });
  reduced.addEventListener('change', () => {
    state.paused = reduced.matches;
    reflect();
  });
  reflect();
  if (animations) draw(figure,state.frame);
  if (observer) observer.observe(figure);
  else observed.add(figure);
}
if (animations && states.size) {
  setInterval(() => {
    if (document.hidden) return;
    for (const figure of observed) {
      const state = states.get(figure);
      if (!state.paused) draw(figure,++state.frame);
    }
  },80);
}
