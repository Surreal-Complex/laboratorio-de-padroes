'use strict';
const $ = id => document.getElementById(id);

const equations = [[2,6,14],[3,-9,12],[4,8,-4]];
let terms;
function renderBalance() {
  const [a,b,c] = terms;
  const leading = a === 1 ? 'x' : a === -1 ? '−x' : a + 'x';
  $('balance').textContent = leading + (b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : '') + ' = ' + c;
  return a === 1 && b === 0;
}
function resetBalance() {
  terms = [...equations[Number($('equation').value)]];
  renderBalance();
  $('equation-status').textContent = '';
}
for (const button of document.querySelectorAll('[data-op]')) {
  button.addEventListener('click', () => {
    const n = $('operand').valueAsNumber;
    if (!Number.isInteger(n) || n < -12 || n > 12) {
      $('equation-status').textContent = 'Escolha um inteiro de −12 a 12.';
      return;
    }
    const [a,b,c] = terms;
    const {op} = button.dataset;
    if (op === 'divide' && (n === 0 || terms.some(value => value % n))) {
      $('equation-status').textContent = n === 0 ? 'Divisão por zero é indefinida.' : 'Neste desafio, escolha um divisor comum dos três termos.';
      return;
    }
    if (op === 'divide') terms = terms.map(value => value / n);
    else {
      const shift = op === 'subtract' ? -n : n;
      terms = [a,b + shift,c + shift];
    }
    $('equation-status').textContent = renderBalance() ? 'Você isolou x!' : 'Os dois membros foram transformados.';
  });
}
$('equation').addEventListener('change', resetBalance);
$('reset-equation').addEventListener('click', resetBalance);
resetBalance();

let order = ['A','B','C'];
const seen = new Set();
const history = [];
function renderPermutation() {
  seen.add(order.join(''));
  $('permutation').textContent = order.join(' · ');
  const inversions = order.reduce((sum, value, index) => sum + order.slice(index + 1).filter(other => value > other).length, 0);
  $('group-status').textContent = seen.size + ' de 6 permutações encontradas. Paridade ' + (inversions % 2 ? 'ímpar.' : 'par.');
  $('undo-swap').disabled = !history.length;
}
function swap(index) {
  [order[index], order[index + 1]] = [order[index + 1], order[index]];
}
for (const [id,index] of [['swap12',0],['swap23',1]]) {
  $(id).addEventListener('click', () => {
    swap(index);
    history.push(index);
    renderPermutation();
  });
}
$('undo-swap').addEventListener('click', () => {
  swap(history.pop());
  renderPermutation();
});
$('reset-permutation').addEventListener('click', () => {
  order = ['A','B','C'];
  history.length = 0;
  renderPermutation();
});
renderPermutation();

let pair;
function startEuclid() {
  $('divisions').replaceChildren();
  const a = $('euclid-a').valueAsNumber;
  const b = $('euclid-b').valueAsNumber;
  const valid = [a,b].every(n => Number.isInteger(n) && n > 0 && n <= 9999);
  pair = valid ? [a,b] : null;
  $('step-euclid').disabled = !valid;
  $('euclid-status').textContent = valid ? 'Par inicial (' + a + ', ' + b + ')' : 'Informe dois inteiros de 1 a 9999.';
}
$('start-euclid').addEventListener('click', startEuclid);
for (const id of ['euclid-a','euclid-b']) $(id).addEventListener('input', startEuclid);
$('step-euclid').addEventListener('click', () => {
  const [a,b] = pair;
  const remainder = a % b;
  const line = document.createElement('li');
  line.textContent = a + ' = ' + Math.floor(a / b) + ' × ' + b + ' + ' + remainder;
  $('divisions').append(line);
  pair = [b,remainder];
  $('step-euclid').disabled = remainder === 0;
  $('euclid-status').textContent = remainder ? 'Próximo par (' + b + ', ' + remainder + ')' : 'MDC = ' + b;
});
startEuclid();

let remaining;
const takeButtons = [...document.querySelectorAll('[data-take]')];
function renderPile(message) {
  $('remaining').textContent = remaining + (remaining === 1 ? ' ficha' : ' fichas');
  $('pile-status').textContent = message;
  takeButtons.forEach(button => button.disabled = Number(button.dataset.take) > remaining);
}
function resetPile() {
  remaining = Number($('pile').value);
  renderPile('Sua vez.');
}
for (const button of takeButtons) {
  button.addEventListener('click', () => {
    const taken = Number(button.dataset.take);
    remaining -= taken;
    if (!remaining) {
      renderPile('Você retirou a última ficha e venceu.');
      return;
    }
    const reply = remaining % 4 || 1;
    remaining -= reply;
    renderPile('Você tirou ' + taken + '. O computador tirou ' + reply + '. ' + (remaining ? 'Sua vez.' : 'O computador venceu.'));
  });
}
$('pile').addEventListener('change',resetPile);
$('reset-pile').addEventListener('click',resetPile);
resetPile();

let width;
let removed;
let selected;
let dominoes;
let squares;
const dominoBoard = $('domino-board');
function renderDomino(message) {
  const covered = new Map(dominoes.flatMap((pair,i) => pair.map(cell => [cell,i+1])));
  squares.forEach((square,i) => {
    const absent = removed.includes(i);
    const domino = covered.get(i);
    square.disabled = absent || Boolean(domino);
    square.classList.toggle('covered', Boolean(domino));
    square.textContent = domino ?? '';
    square.setAttribute('aria-pressed', String(i === selected));
    const row = Math.floor(i / width) + 1;
    const column = i % width + 1;
    square.setAttribute('aria-label', 'Linha ' + row + ', coluna ' + column + (square.classList.contains('light') ? ', clara' : ', escura') + (domino ? ', dominó ' + domino : ''));
  });
  const uncovered = width ** 2 - removed.length - covered.size;
  $('undo-domino').disabled = !dominoes.length;
  $('domino-status').textContent = uncovered ? uncovered + ' casas livres. ' + message : 'Tabuleiro coberto!';
}
function selectSquare(i) {
  if (selected === null) {
    selected = i;
    renderDomino('Selecione uma casa vizinha.');
    return;
  }
  if (i === selected) {
    selected = null;
    renderDomino('Seleção cancelada.');
    return;
  }
  const distance = Math.abs(Math.floor(i / width) - Math.floor(selected / width)) + Math.abs(i % width - selected % width);
  if (distance !== 1) {
    selected = i;
    renderDomino('Nova casa selecionada. Escolha sua vizinha.');
    return;
  }
  dominoes.push([selected,i]);
  selected = null;
  renderDomino('Dominó colocado.');
}
function resetDomino() {
  const mode = $('domino-case').value;
  width = mode === 'large' ? 6 : 4;
  removed = mode === 'full' ? [] : [0,width ** 2 - 1];
  selected = null;
  dominoes = [];
  dominoBoard.style.gridTemplateColumns = 'repeat(' + width + ', 1fr)';
  squares = Array.from({length:width ** 2}, (_,i) => {
    const square = document.createElement('button');
    square.className = (Math.floor(i / width) + i % width) % 2 ? 'dark' : 'light';
    square.classList.toggle('removed', removed.includes(i));
    square.addEventListener('click', () => selectSquare(i));
    return square;
  });
  dominoBoard.replaceChildren(...squares);
  renderDomino('Selecione a primeira casa.');
}
$('domino-case').addEventListener('change',resetDomino);
$('reset-domino').addEventListener('click',resetDomino);
$('undo-domino').addEventListener('click',() => {
  dominoes.pop();
  selected = null;
  renderDomino('Último dominó retirado.');
});
resetDomino();
