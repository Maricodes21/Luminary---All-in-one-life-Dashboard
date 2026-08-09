const concepts = {
  brief: { number: 'Direction 01', title: 'Daily brief', summary: 'A decisive daily view that now opens into a five-choice setup and an editable generated week.', best: 'Daily use and simple planning', move: 'Brief to planner handoff', tradeoff: 'Planning lives one layer deeper' },
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
const briefViews = document.querySelectorAll('[data-brief-view]');
const briefScroller = document.querySelector('[data-screen="brief"] .scroll-screen');

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

function selectBriefView(key) {
  const selected = document.querySelector(`[data-brief-view="${key}"]`);
  if (!selected) return;
  briefViews.forEach((view) => {
    const active = view === selected;
    view.classList.toggle('is-active', active);
    view.hidden = !active;
  });
  briefScroller.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-brief-target]').forEach((button) => {
  button.addEventListener('click', () => selectBriefView(button.dataset.briefTarget));
});

function selectOne(button, selector) {
  button.closest(selector).querySelectorAll('button').forEach((item) => {
    const selected = item === button;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  refreshSetupSummary();
}

document.querySelectorAll('.choice-grid .choice').forEach((button) => button.addEventListener('click', () => selectOne(button, '.choice-grid')));
document.querySelectorAll('.segmented-choice button').forEach((button) => button.addEventListener('click', () => selectOne(button, '.segmented-choice')));
document.querySelectorAll('.time-options button').forEach((button) => button.addEventListener('click', () => selectOne(button, '.time-options')));

document.querySelectorAll('.day-picker button, .goal-picks button').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('is-selected');
  button.setAttribute('aria-pressed', button.classList.contains('is-selected') ? 'true' : 'false');
  refreshSetupSummary();
}));

function refreshSetupSummary() {
  const place = document.querySelector('.choice-grid .choice.is-selected b')?.textContent ?? 'Home';
  const level = document.querySelector('.segmented-choice .is-selected')?.textContent ?? 'Steady';
  const time = Number(document.querySelector('.time-options .is-selected')?.textContent ?? 40);
  const dayCount = document.querySelectorAll('.day-picker .is-selected').length;
  const countLabel = document.querySelector('.day-picker')?.closest('.setup-field')?.querySelector('legend em');
  const summaryTitle = document.querySelector('.setup-summary h3');
  const summaryMinutes = document.querySelector('.setup-summary > span');
  if (countLabel) countLabel.textContent = `${dayCount} selected`;
  if (summaryTitle) summaryTitle.textContent = `${place} · ${level.toLowerCase()} · ${dayCount} days`;
  if (summaryMinutes) summaryMinutes.innerHTML = `${dayCount * time}<br><small>min / week</small>`;
}

const requested = new URLSearchParams(window.location.search).get('concept');
if (requested) selectConcept(requested);
const requestedBriefView = new URLSearchParams(window.location.search).get('briefView');
if (requestedBriefView) selectBriefView(requestedBriefView);
