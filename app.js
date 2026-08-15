const app = document.querySelector('#app');
const detail = document.querySelector('#detail');
const object = document.querySelector('#object');
const modules = {
  payload: ['SYS 01', 'Payload bay', 'Mission payload', 'A future Boom Supersonic research concept begins here: define the measurement goal, protect the evidence chain, and keep the mission reviewable.'],
  propulsion: ['SYS 02', 'Pusher system', 'Propulsion envelope', 'Performance comes after constraints. This system map is a safe, high-level exploration of readiness, power budgeting, and controlled test gates.'],
  flight: ['SYS 03', 'Control surfaces', 'Flight controls', 'Operator authority, staged validation, and traceable changes are the principles behind a responsible flight-test workflow.'],
  data: ['SYS 04', 'Data link', 'Telemetry spine', 'Telemetry turns experiments into learning: collect what matters, retain context, and translate observations into the next engineering iteration.']
};
const close = (target) => { target.classList.remove('open'); target.innerHTML = ''; };
function blueprint(){
  if(app.classList.contains('blueprint-on')) return;
  close(detail); close(object);
  const transition = document.querySelector('#viewTransition');
  transition.classList.add('active');
  window.setTimeout(() => { app.classList.add('blueprint-on'); window.scrollTo({top:0, behavior:'instant'}); }, 580);
  window.setTimeout(() => transition.classList.remove('active'), 1240);
}
function showModule(key){ const [id,label,title,text] = modules[key]; close(object); detail.innerHTML = `<div class="panel-top"><p class="eyebrow">${id} / ${label}</p><button data-close="detail">Close <span>×</span></button></div><div class="module-copy"><div><h2>${title}</h2><p>${text}</p></div><div><p class="concept-disclaimer panel-disclaimer">The UAV visual on this site is a conceptual interface and is not an accurate representation of the drone being constructed for the Boom Supersonic Prize Challenge.</p><div class="team-card"><p class="eyebrow">Boom Supersonic / Engineers</p><p>Wilson Tom · Carter Pfaff · Andrii Tashchuk · Elliot Shull · Ibrahim Chowdhary</p></div><a href="https://github.com/william-thompsonthe1st" target="_blank" rel="noreferrer">Follow the future project on GitHub ↗</a><small>When the Boom Supersonic repository is public, this module will link directly to its documentation.</small></div></div>`; detail.classList.add('open'); detail.scrollIntoView({behavior:'smooth',block:'nearest'}); }
function showPanel(type){ close(detail); const social = type === 'social'; object.innerHTML = social ? `<div class="panel-top"><p class="eyebrow">Computer / professional terminal</p><button data-close="object">Close <span>×</span></button></div><div class="object-copy"><h2>Find the engineer behind the work.</h2><p>Use the professional profile for the current timeline, background, and direct contact points.</p><div class="object-links"><a href="https://www.linkedin.com/in/wilson-tom/" target="_blank" rel="noreferrer"><span>01</span> LinkedIn profile ↗</a><a href="https://github.com/william-thompsonthe1st" target="_blank" rel="noreferrer"><span>02</span> GitHub profile ↗</a></div></div>` : `<div class="panel-top"><p class="eyebrow">Drafting table / source archive</p><button data-close="object">Close <span>×</span></button></div><div class="object-copy"><div><h2>Research lives in the drawings.</h2><p>Explore the STEM Research Academy archive for 3TSAHUR + LARP: a Raspberry Pi hub coordinating lightweight scouts, camera feeds, and optional advisory perception.</p></div><div><div class="team-card"><p class="eyebrow">STEM Research Academy / 3TSAHUR</p><p><strong>Location</strong> New York City College of Technology, Department of Mechanical Engineering Technologies</p><p><strong>Professor</strong> Andy Zhang</p><p><strong>Mentors</strong> Angelo Demetroulakos · Mark Salib · Abdullah Luna · Gabriela Bernales</p><p><strong>Students / Researchers</strong> Wilson Tom · Kaitlin Lam</p></div><div class="object-links"><a href="https://github.com/william-thompsonthe1st/STEM-Research-Academy" target="_blank" rel="noreferrer"><span>01</span> STEM Research Academy ↗</a><a href="https://github.com/william-thompsonthe1st" target="_blank" rel="noreferrer"><span>02</span> Full GitHub archive ↗</a></div></div></div>`; object.classList.add('open'); object.scrollIntoView({behavior:'smooth',block:'nearest'}); }
document.querySelectorAll('[data-blueprint]').forEach(button => button.addEventListener('click', blueprint));
document.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () => showModule(button.dataset.module)));
document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
document.addEventListener('click', (event) => { const target = event.target.closest('[data-close]'); if(target) close(document.querySelector(`#${target.dataset.close}`)); });
document.querySelector('#returnHangar').addEventListener('click', () => { app.classList.remove('blueprint-on'); close(detail); document.querySelector('#hangar').scrollIntoView({behavior:'smooth'}); });
const arrival = document.querySelector('#arrival');
const endArrival = () => { if(arrival.classList.contains('opening')) return; arrival.classList.add('opening'); window.setTimeout(() => arrival.classList.add('done'), 1250); };
window.setTimeout(endArrival, 350);
document.querySelector('#skipArrival').addEventListener('click', () => arrival.classList.add('done'));
