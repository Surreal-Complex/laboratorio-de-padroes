'use strict';

const installButton = document.getElementById('install-app');
const offlineStatus = document.getElementById('offline-status');
let installPrompt;

if (installButton) {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    prompt.prompt().catch(() => {
      offlineStatus.textContent = 'Você também pode instalar pelo menu do navegador.';
    });
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.hidden = true;
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(async () => {
    await navigator.serviceWorker.ready;
    if (offlineStatus) offlineStatus.textContent = 'Atividades disponíveis neste navegador mesmo sem internet.';
  }).catch(() => {
    if (offlineStatus) offlineStatus.textContent = 'O modo offline está indisponível neste navegador.';
  });
}
