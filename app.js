// Completion flags and answers stay on this device; nothing is sent to a server.
const checks = [...document.querySelectorAll('[data-step]')];
const storageKey = 'dane-hr-2026-progress-v1';
let completed = [];
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) completed = stored.filter(x => typeof x === 'string');
} catch { /* Storage may be unavailable when opening an offline file. */ }
function updateProgress() {
  document.getElementById('progress').textContent = `Ukończono: ${checks.filter(x => x.checked).length} z ${checks.length} kroków`;
}
checks.forEach(check => {
  check.checked = completed.includes(check.dataset.step);
  check.addEventListener('change', () => {
    try { localStorage.setItem(storageKey, JSON.stringify(checks.filter(x => x.checked).map(x => x.dataset.step))); }
    catch { /* Completion remains visible for this page session. */ }
    updateProgress();
  });
});
updateProgress();
// Save plain text as participants type; blocked storage must not prevent the exercise.
const answers = [...document.querySelectorAll('[data-answer]')];
const answersKey = 'dane-hr-2026-answers-v1';
const answersStatus = document.getElementById('answers-status');
let previousAnswers = {};
try {
  const saved = JSON.parse(localStorage.getItem(answersKey) || '{}');
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    previousAnswers = Object.fromEntries(Object.entries(saved).filter(([, value]) => typeof value === 'string'));
    answers.forEach(field => {
      if (typeof saved[field.dataset.answer] === 'string') field.value = saved[field.dataset.answer];
    });
  }
} catch {
  answersStatus.textContent = 'Nie można odczytać zapisu. Możesz pracować na stronie; na koniec pobierz odpowiedzi.';
}
answers.forEach(field => {
  field.addEventListener('input', () => {
    try {
      const current = Object.fromEntries(answers.map(item => [item.dataset.answer, item.value]));
      localStorage.setItem(answersKey, JSON.stringify({...previousAnswers, ...current}));
      answersStatus.textContent = 'Odpowiedzi zapisane w tej przeglądarce.';
    } catch {
      answersStatus.textContent = 'Przeglądarka nie pozwala zapisać odpowiedzi. Przed zamknięciem strony pobierz odpowiedzi.';
    }
  });
});
// A text download is optional and can be attached to an email by the participant.
document.getElementById('export-answers').addEventListener('click', () => {
  try {
    const progress = `${checks.filter(item => item.checked).length} z ${checks.length}`;
    const oldNotes = Object.entries(previousAnswers).filter(([key, value]) => value.trim() && !answers.some(field => field.dataset.answer === key));
    const content = ['DANE HR Z AI — MOJE ODPOWIEDZI', `Ukończone kroki: ${progress}`, '',
      ...answers.flatMap(field => [field.dataset.label, field.value.trim() || '(brak odpowiedzi)', '']),
      ...oldNotes.flatMap(([key,value]) => [`Wcześniejsze notatki (${key})`,value,''])].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', content], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'moje-odpowiedzi-dane-hr.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    answersStatus.textContent = 'Przygotowano plik odpowiedzi do pobrania. Możesz go zachować lub samodzielnie wysłać.';
  } catch {
    answersStatus.textContent = 'Nie udało się pobrać pliku. Skopiuj odpowiedzi z pól przed zamknięciem strony.';
  }
});
// Clipboard access can fail offline; leave the full text selected for manual copying.
document.querySelectorAll('button.copy').forEach(button => {
  button.addEventListener('click', async () => {
    const pre = button.parentElement.querySelector('pre');
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(pre.textContent);
      button.textContent = 'Skopiowano';
      status.textContent = 'Polecenie skopiowane do schowka.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pre);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Tekst zaznaczony. Użyj Ctrl+C lub Cmd+C, aby skopiować.';
      button.textContent = 'Zaznaczono — użyj Ctrl+C / Cmd+C';
    }
  });
});
