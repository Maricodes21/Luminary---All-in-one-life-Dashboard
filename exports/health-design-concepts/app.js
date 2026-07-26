const concepts = {
  brief: { number: 'Direction 01', title: 'Daily brief', summary: 'A decisive first viewport: today’s session, weekly volume and the next three training moments.', best: 'Fast daily use', move: 'Editorial workout cover', tradeoff: 'Less plan detail up front' },
  atlas: { number: 'Direction 02', title: 'Week atlas', summary: 'The plan becomes the interface: one continuous training timeline with the selected day expanded in place.', best: 'Planning and review', move: 'Scrollable week timeline', tradeoff: 'Denser than the brief' },
  body: { number: 'Direction 03', title: 'Body & load', summary: 'Health signals and workout volume meet in one physical map, without pretending unconnected data exists.', best: 'Recovery-aware training', move: 'Body focus map', tradeoff: 'Needs careful data trust language' },
  coach: { number: 'Direction 04', title: 'Coach stream', summary: 'A conversational feed decides what matters now, then reveals the plan and connections progressively.', best: 'Adaptive guidance', move: 'One recommendation at a time', tradeoff: 'Less traditional dashboard scanning' },
};

const tabs = document.querySelectorAll('.concept-tab');
const screens = document.querySelectorAll('.concept');
const noteNumber = document.querySelector('#note-number');
const noteTitle = document.querySelector('#note-title');
const noteSummary = document.querySelector('#note-summary');
const noteList = document.querySelector('#note-list');

function selectConcept(key) {
  const tab = document.querySelector(`[data-concept="${key}"]`);
  if (!tab || !concepts[key]) return;
  tabs.forEach((item) => { item.classList.toggle('is-active', item === tab); item.setAttribute('aria-pressed', item === tab ? 'true' : 'false'); });
  screens.forEach((screen) => { const selected = screen.dataset.screen === key; screen.classList.toggle('is-active', selected); screen.hidden = !selected; });
  const copy = concepts[key];
  noteNumber.textContent = copy.number;
  noteTitle.textContent = copy.title;
  noteSummary.textContent = copy.summary;
  noteList.innerHTML = `<div><dt>Best for</dt><dd>${copy.best}</dd></div><div><dt>Signature move</dt><dd>${copy.move}</dd></div><div><dt>Trade-off</dt><dd>${copy.tradeoff}</dd></div>`;
}

tabs.forEach((tab) => tab.addEventListener('click', () => selectConcept(tab.dataset.concept)));

const requested = new URLSearchParams(window.location.search).get('concept');
if (requested) selectConcept(requested);
