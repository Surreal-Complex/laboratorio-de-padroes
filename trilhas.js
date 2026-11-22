'use strict';

const byId = id => document.getElementById(id);
const keys = {
  progress: 'laboratorio-trilhas-v1',
  journal: 'laboratorio-caderno-v1',
  review: 'laboratorio-revisao-v1'
};

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    byId('journal-status').textContent = 'O navegador não conseguiu salvar os registros. Baixe o caderno antes de sair.';
  }
}

const progress = read(keys.progress, {});
const checkboxes = [...document.querySelectorAll('[data-progress]')];
function showProgress() {
  const count = checkboxes.filter(item => item.checked).length;
  byId('progress-summary').textContent = count + ' de ' + checkboxes.length + ' etapas marcadas nas duas trilhas.';
}
for (const item of checkboxes) {
  const name = item.dataset.progress;
  item.checked = progress[name] === true;
  item.addEventListener('change', () => {
    progress[name] = item.checked;
    persist(keys.progress, progress);
    showProgress();
  });
}
showProgress();

const journal = byId('journal');
journal.value = read(keys.journal, '');
journal.addEventListener('input', () => persist(keys.journal, journal.value));

const questions = [
  {
    prompt: 'Qual número admite um retângulo com mais de uma fileira e mais de uma coluna?',
    options: ['13', '16', '17'], correct: 1,
    explanation: '16 = 4 × 4. Os únicos divisores positivos de 13 e 17 são 1 e o próprio número.'
  },
  {
    prompt: 'Qual é o menor giro positivo que preserva um retângulo não quadrado?',
    options: ['90°', '180°', '270°'], correct: 1,
    explanation: 'Um giro de 90° ou 270° troca as direções dos lados longos e curtos. Uma meia-volta preserva essas direções.'
  },
  {
    prompt: 'Qual operação preserva as soluções de qualquer equação?',
    options: ['Somar 3 só ao primeiro membro', 'Multiplicar ambos os membros por 0', 'Subtrair 3 de ambos os membros'], correct: 2,
    explanation: 'Subtrair 3 dos dois lados é reversível. Multiplicar por zero perde informação e somar a um só membro altera a igualdade.'
  },
  {
    prompt: 'Em ABC, troque primeiro as posições 1 e 2 e depois as posições 2 e 3. Qual é o resultado?',
    options: ['BCA', 'CAB', 'ABC'], correct: 0,
    explanation: 'ABC vira BAC e depois BCA. Inverter a ordem das duas trocas leva a CAB.'
  },
  {
    prompt: 'Na primeira divisão de Euclides, 84 = 2 × 30 + 24. Que par mantém o mesmo MDC?',
    options: ['(84, 2)', '(24, 2)', '(30, 24)'], correct: 2,
    explanation: 'Os divisores comuns de 84 e 30 são os mesmos de 30 e 24, pois 24 = 84 − 2 × 30.'
  },
  {
    prompt: 'Uma rede conexa tem quatro vértices de grau ímpar. Dá para percorrer cada aresta exatamente uma vez?',
    options: ['Sim, se começar em um vértice par', 'Não, pois só duas extremidades podem ter grau ímpar', 'Sim, desde que termine onde começou'], correct: 1,
    explanation: 'Vértices intermediários emparelham chegadas e saídas. Um percurso aberto só pode ter duas extremidades ímpares e um fechado não tem nenhuma.'
  },
  {
    prompt: 'No jogo das fichas, com 17 fichas e retirada de 1 a 3, qual primeira jogada garante a vitória?',
    options: ['Tirar 1', 'Tirar 2', 'Tirar 3'], correct: 0,
    explanation: 'Deixe 16 fichas. Depois de cada jogada k do adversário, retire 4 − k. Assim você deixa 12, 8, 4 e, por fim, 0.'
  },
  {
    prompt: 'Qual paridade se conserva em todo movimento válido do tabuleiro 4 × 4?',
    options: ['A das inversões sozinhas', 'A da linha do vazio sozinha', 'A da soma das inversões com a linha do vazio contada de baixo'], correct: 2,
    explanation: 'Em um movimento vertical, a peça cruza três outras e a linha do vazio muda em uma unidade. As duas paridades mudam, portanto a da soma permanece.'
  },
  {
    prompt: 'Por que um tabuleiro 4 × 4 sem dois cantos diagonalmente opostos não pode ser coberto por dominós?',
    options: ['Os cantos retirados produzem um total ímpar de casas', 'Sobram quantidades diferentes de casas claras e escuras', 'Todo dominó cobre duas casas da mesma cor'], correct: 1,
    explanation: 'Os cantos opostos têm a mesma cor. Cada dominó cobre uma casa de cada cor, então uma cobertura exigiria quantidades iguais.'
  }
];

const answers = read(keys.review, {});
const feedback = [];
questions.forEach(({prompt,options}, i) => {
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = (i + 1) + '. ' + prompt;
  fieldset.append(legend);
  options.forEach((option,j) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'q' + i;
    input.value = j;
    input.checked = answers[i] === j;
    input.addEventListener('change', () => {
      answers[i] = j;
      persist(keys.review, answers);
      feedback[i].textContent = '';
      byId('review-result').textContent = '';
    });
    label.append(input, option);
    fieldset.append(label);
  });
  const message = document.createElement('p');
  message.className = 'feedback';
  feedback.push(message);
  fieldset.append(message);
  byId('questions').append(fieldset);
});
byId('review').addEventListener('submit', event => {
  event.preventDefault();
  let correct = 0;
  let answered = 0;
  questions.forEach((question,i) => {
    if (answers[i] === undefined) {
      feedback[i].textContent = 'Escolha uma alternativa para conferir.';
      return;
    }
    answered++;
    const matches = answers[i] === question.correct;
    correct += Number(matches);
    feedback[i].textContent = (matches ? 'Correto. ' : 'Revise sua resposta. ') + question.explanation;
  });
  const result = byId('review-result');
  result.textContent = correct + ' de ' + answered + ' respostas corretas. ' + (questions.length - answered) + ' sem resposta.';
  result.focus();
});

function exportJournal() {
  const lines = ['Laboratório de Padrões · Caderno de investigação', '', 'Etapas concluídas'];
  const completed = checkboxes.filter(item => item.checked);
  lines.push(...completed.map(item => '• ' + item.parentElement.textContent.trim()));
  if (!completed.length) lines.push('Nenhuma etapa marcada.');
  lines.push('', 'Registro livre', journal.value.trim() || 'Sem anotações.');
  for (const [name,title] of Object.entries({numeros:'Divisibilidade',simetrias:'Simetrias',grafos:'Grafos'})) {
    try {
      const note = localStorage.getItem('laboratorio-note-' + name);
      if (note?.trim()) lines.push('', title, note.trim());
    } catch {}
  }
  const boards = read('laboratorio-padroes-v2', {});
  const legacy = read('laboratorio-padroes-v1', {});
  for (const n of [3,4,5,6,7,8,9]) {
    const note = boards.notes?.[n] ?? (n === 3 ? legacy.notes : '');
    const samples = boards.samples?.[n] ?? [];
    if (typeof note === 'string' && note.trim()) lines.push('', 'Tabuleiro ' + n + ' × ' + n, note.trim());
    if (samples.length) {
      lines.push('', 'Posições investigadas · ' + n + ' × ' + n);
      for (const sample of samples) {
        lines.push(sample.summary);
        for (let i = 0; i < sample.initial.length; i += n) {
          lines.push(sample.initial.slice(i,i+n).map(value => value || '□').join(' · '));
        }
      }
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], {type:'text/plain;charset=utf-8'}));
  link.download = 'caderno-laboratorio-de-padroes.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

byId('download-notes').addEventListener('click', exportJournal);
byId('print-guide').addEventListener('click', () => {
  const closed = [...document.querySelectorAll('#professor details:not([open])')];
  closed.forEach(item => item.open = true);
  window.addEventListener('afterprint', () => closed.forEach(item => item.open = false), {once:true});
  window.print();
});
