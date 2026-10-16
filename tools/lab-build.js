
/* =====================================================================
   LAB: turns COURSE into handbook parts and sections, then wires up the
   runnable editors, quizzes, visualizers and practice problems.
   ===================================================================== */
const content = $('#content');
const LESSONS = [];
COURSE.modules.forEach(m => m.lessons.forEach((l, i) => LESSONS.push(Object.assign(l, {mod: m, idx: i}))));
const lessonById = id => LESSONS.find(l => l.id === id);
const setById = id => COURSE.practice.find(p => p.id === id);
const trackOf = x => x.track || 'core';
const TRACKS = [
  {id:'core', title:'Python Core', blurb:'The language from zero to interview-ready: syntax, collections, OOP, files, plus a deep dive into how Python really works.'},
  {id:'dsa', title:'DSA with Python', blurb:'Data structures & algorithms: complexity, patterns, trees, graphs, DP, with auto-checked problems.'}
];

/* ---------- state (quiz answers, solved problems, edited code) ---------- */
const KEY = 'pyh-lab-v1';
let S = {quiz:{}, asg:{}, code:{}};
try {
  const raw = localStorage.getItem(KEY);
  if (raw) S = Object.assign(S, JSON.parse(raw));
  else {
    // one-time import from the original PyPrime Lab, if it was used in this browser
    const old = JSON.parse(localStorage.getItem('pyprime-lab-v1') || 'null');
    if (old) {
      S.quiz = old.quiz || {}; S.asg = old.asg || {}; S.code = old.code || {};
      if (localStorage.getItem('pyh-done') === null && old.done) localStorage.setItem('pyh-done', JSON.stringify(Object.keys(old.done).filter(k => old.done[k]).map(k => 's-' + k)));
    }
  }
} catch (e) {}
['quiz','asg','code'].forEach(k => { S[k] = Object.assign(Object.create(null), S[k] || {}); });
function save(){ try { localStorage.setItem(KEY, JSON.stringify({quiz:S.quiz, asg:S.asg, code:S.code})); } catch (e) {} }
save();

function toast(msg){ const t = $('#labToast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800); }

/* ---------- HTML helpers ---------- */
const codebox = (code, lang) => `<div class="codebox"><span class="lang">${lang || 'python'}</span><pre><code data-lang="py">${code}</code></pre></div>`;
// lesson bodies come with PyPrime markup: turn it into handbook markup
const fixBody = h => String(h || '')
  .replace(/<pre class="code">([\s\S]*?)<\/pre>/g, (m, c) => codebox(c))
  .replace(/<div class="tablewrap">/g, '<div class="tbl">');

function quizHTML(l){
  return l.quiz.map((q, i) => `<div class="qz" data-i="${i}"><div class="qq"><span class="qn">Q${i + 1}.</span>${esc(q.q)}</div>${q.c ? codebox(esc(q.c)) : ''}<div class="opts">${q.o.map((o, j) => `<button class="opt" type="button" data-j="${j}"><span class="k">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="whybox"></div></div>`).join('');
}

function practiceHTML(p, mod){
  const auto = p.questions.some(q => q.tests);
  return `<section class="topic practice" id="s-set-${p.id}" data-part="p-${mod.id}" data-src="practice" data-set="${p.id}">
<h2>${esc(p.title)}: ${esc(p.topic)}</h2>
<div class="tldr"><b>${p.questions.length} problems on ${esc(p.topic)}.</b> Try each one yourself first. Stuck for 5+ minutes? Open the hint. Still stuck? Read the solution, close it, and write it again from memory.${auto ? ' <b>Check</b> runs your code against test cases and marks the problem solved when every test passes. Think about the time complexity before you check.' : ''}</div>
<div class="setbar"><span>Solved <b class="pcount">0/${p.questions.length}</b></span><div class="pbar"><i></i></div></div>
${p.questions.map((q, i) => `<div class="lab qcard" id="q-${p.id}-${i + 1}" data-set="${p.id}" data-i="${i}">
  <div class="qhead"><span class="qnum">Q${i + 1}</span><span class="tag">${esc(q.tag)}</span><label class="solved-lbl"><input type="checkbox"> Solved</label></div>
  <div class="qtext">${fixBody(q.t)}</div>
  <div class="edh" data-mount="practice"><div class="lab-ph"></div></div>
  <details class="q"><summary>Hint</summary><div class="a"><p>${fixBody(q.hint)}</p></div></details>
  <details class="q"><summary>Solution</summary><div class="a">${codebox(esc(q.sol))}<button class="btn ghost lb" type="button">Load solution into the editor</button></div></details>
</div>`).join('\n')}
</section>`;
}

/* ---------- build the handbook DOM ---------- */
const startPart = `<header class="part-head" id="p-start" data-short="Start here">
  <span class="k">Part</span>
  <h2>Start here</h2>
  <p>How this lab works, the two tracks, and how to get the most out of every lesson.</p>
</header>
<section class="topic" id="s-howto" data-part="p-start" data-src="start">
<h2>How this lab works</h2>
<div class="tldr"><b>Real Python, right in your browser.</b> Every lesson has a short explanation, an editor you can run, and a quick check. Each part ends with a practice set. Nothing to install.</div>
<h3>What's in every lesson</h3>
<ol>
<li><b>Read</b> the short explanation. Gotchas and tips are called out in boxes.</li>
<li><b>Run</b> the example in the editor under <i>Try it yourself</i>. Change it, break it, run it again.</li>
<li><b>Answer the quick check.</b> Each answer explains why it's right or wrong.</li>
<li><b>Mark it as done</b> with the button next to the title. Your progress shows in the sidebar.</li>
</ol>
<h3>Good to know</h3>
<div class="tbl"><table>
<tr><th>Feature</th><th>How it works</th></tr>
<tr><td>Running code</td><td>Python runs in your browser (Pyodide). The first <b>Run</b> downloads Python once, about 10 MB, so it needs internet.</td></tr>
<tr><td>Shortcuts</td><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs code · <kbd>Tab</kbd> indents · auto-indent after <code>:</code> · <kbd>/</kbd> opens search</td></tr>
<tr><td><code>input()</code></td><td>Opens a small popup. Cancel it to stop the program.</td></tr>
<tr><td>Practice problems</td><td>Hints and solutions are folded away. DSA problems have a <b>Check</b> button that runs test cases.</td></tr>
<tr><td>Saving</td><td>Progress, quiz answers and code edits are saved in this browser automatically.</td></tr>
</table></div>
<div class="note tip"><p>The visual playgrounds (string slicing, <code>range()</code>, logic tables, references, Big-O, binary search, sorting, stacks, BSTs and grid BFS) sit right inside the lessons they explain. Play with them before you read the code.</p></div>
</section>
<section class="topic" id="s-path" data-part="p-start" data-src="start">
<h2>The learning path</h2>
<div class="tldr"><b>Two tracks, in order.</b> Python Core takes you from <code>print()</code> to how Python works under the hood. DSA with Python then covers the data structures and algorithms that coding interviews test.</div>
${TRACKS.map(tr => `<h3>${esc(tr.title)}</h3><p>${esc(tr.blurb)}</p><div class="tbl"><table><tr><th>Part</th><th>What you'll learn</th><th>Lessons</th></tr>${COURSE.modules.filter(m => trackOf(m) === tr.id).map(m => `<tr><td><a href="#p-${m.id}">${esc(m.title)}</a></td><td>${esc(m.blurb)}</td><td>${m.lessons.length}${m.practice ? ' + practice' : ''}</td></tr>`).join('')}</table></div>`).join('')}
</section>`;

let html = startPart;
const usedSets = new Set();
COURSE.modules.forEach(m => {
  html += `<header class="part-head" id="p-${m.id}" data-short="${esc(m.title)}"><span class="k">Part</span><h2>${esc(m.title)}</h2><p>${esc(m.blurb)}</p></header>`;
  m.lessons.forEach(l => {
    html += `<section class="topic" id="s-${l.id}" data-part="p-${m.id}" data-src="${trackOf(m)}" data-mins="${l.mins || ''}">
<h2>${esc(l.title)}</h2>
<div class="lesson">${fixBody(l.body)}</div>
${l.widget && WIDGETS[l.widget] ? `<div class="lab" data-mount="widget" data-widget="${l.widget}"></div>` : ''}
<h3>Try it yourself</h3>
<p class="lab-hint">Edit anything and press <b>Run</b> (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>). Breaking things is how you learn.</p>
<div class="lab" data-mount="lesson" data-lesson="${l.id}"><div class="lab-ph"></div></div>
${l.quiz && l.quiz.length ? `<h3>Quick check <span class="qscore"></span></h3><div class="lab quiz" data-quiz="${l.id}">${quizHTML(l)}</div>` : ''}
</section>`;
  });
  const p = m.practice && setById(m.practice);
  if (p) { html += practiceHTML(p, m); usedSets.add(p.id); }
});
// practice sets not attached to a module get a part of their own
const orphans = COURSE.practice.filter(p => !usedSets.has(p.id));
if (orphans.length) {
  html += `<header class="part-head" id="p-morepractice" data-short="More practice"><span class="k">Part</span><h2>More practice</h2><p>Extra problem sets.</p></header>`;
  orphans.forEach(p => { html += practiceHTML(p, {id:'morepractice'}); });
}
content.innerHTML = html;

/* ---------- quizzes ---------- */
function wireQuiz(host, l){
  const sec = host.closest('section');
  const upd = () => {
    const n = l.quiz.length; let a = 0, ok = 0;
    l.quiz.forEach((q, i) => { const v = S.quiz[l.id + ':' + i]; if (v !== undefined) { a++; if (v === q.a) ok++; } });
    const el = $('.qscore', sec); if (el) { el.textContent = a ? `${ok}/${n} correct` : `${n} questions`; el.className = 'qscore' + (a && ok === n ? ' full' : ''); }
  };
  const show = (card, i) => {
    const q = l.quiz[i], v = S.quiz[l.id + ':' + i];
    card.querySelectorAll('.opt').forEach((b, j) => {
      b.classList.remove('correct', 'wrong'); b.disabled = v !== undefined;
      if (v !== undefined) { if (j === q.a) b.classList.add('correct'); else if (j === v) b.classList.add('wrong'); }
    });
    $('.whybox', card).innerHTML = v === undefined ? '' : `<div class="why ${v === q.a ? 'good' : 'bad'}"><span><b>${v === q.a ? 'Correct.' : 'Not quite.'}</b> ${esc(q.w)}</span><button type="button" data-retry>Retry</button></div>`;
  };
  host.querySelectorAll('.qz').forEach(card => {
    const i = +card.dataset.i; show(card, i);
    card.addEventListener('click', e => {
      const o = e.target.closest('.opt');
      if (e.target.closest('[data-retry]')) { delete S.quiz[l.id + ':' + i]; save(); show(card, i); upd(); return; }
      if (!o || o.disabled) return;
      S.quiz[l.id + ':' + i] = +o.dataset.j; save(); show(card, i); upd();
    });
  });
  upd();
}
content.querySelectorAll('[data-quiz]').forEach(h => wireQuiz(h, lessonById(h.dataset.quiz)));

/* ---------- practice sets ---------- */
const setProg = p => [p.questions.filter((_, i) => S.asg[p.id + ':' + i]).length, p.questions.length];
function refreshSet(p){
  const sec = document.getElementById('s-set-' + p.id); if (!sec) return;
  const [d, t] = setProg(p);
  $('.pcount', sec).textContent = `${d}/${t}`; $('.setbar .pbar i', sec).style.width = d / t * 100 + '%';
  return [d, t];
}
content.querySelectorAll('.qcard').forEach(card => {
  const p = setById(card.dataset.set), i = +card.dataset.i, key = p.id + ':' + i;
  const cb = $('input[type=checkbox]', card);
  cb.checked = !!S.asg[key]; card.classList.toggle('solved', cb.checked);
  cb.onchange = () => {
    if (cb.checked) S.asg[key] = true; else delete S.asg[key];
    save(); card.classList.toggle('solved', cb.checked);
    const [d, t] = refreshSet(p);
    if (cb.checked) {
      toast(d === t ? 'Problem set complete!' : 'Marked as solved');
      if (d === t) { const b = card.closest('section').querySelector('.done-btn'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }
    }
  };
  $('.lb', card).onclick = () => {
    const h = $('.edh', card); mount(h);
    if (confirm('Replace your editor code with the solution?')) h._ed.set(p.questions[i].sol);
  };
});
COURSE.practice.forEach(refreshSet);

/* ---------- lazy mounting of editors and visualizers ---------- */
let warmed = false;
function mount(h){
  if (h._mounted) return; h._mounted = true;
  const kind = h.dataset.mount;
  if (kind === 'widget') WIDGETS[h.dataset.widget](h);
  else if (kind === 'lesson') { const l = lessonById(h.dataset.lesson); h._ed = makeEditor(h, 'L:' + l.id, l.code); }
  else if (kind === 'practice') {
    const card = h.closest('.qcard'), p = setById(card.dataset.set), i = +card.dataset.i, q = p.questions[i];
    h._ed = makeEditor(h, 'A:' + p.id + ':' + i, q.starter || `# Q${i + 1}: write your solution here\n\n`, `q${i + 1}.py`, {
      tests: q.tests, pre: q.pre,
      onPass: () => { const cb = $('input[type=checkbox]', card); if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); } }
    });
  }
  if (!warmed && kind !== 'widget') { warmed = true; preloadPy(); }
}
const mountIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { mount(e.target); mountIO.unobserve(e.target); } }), {rootMargin: '600px 0px'});
content.querySelectorAll('[data-mount]').forEach(h => mountIO.observe(h));

/* ---------- shared with the handbook script ---------- */
window.__pyHL = hl;
window.PY_TRACKS = [
  {name:'Start', desc:'How the lab works and the learning path.', ids:['p-start']},
  ...TRACKS.map((tr, k) => ({name:`${k + 1} · ${tr.title}`, desc:tr.blurb, ids:COURSE.modules.filter(m => trackOf(m) === tr.id).map(m => 'p-' + m.id)}))
];
if (orphans.length) window.PY_TRACKS.push({name:'More practice', desc:'', ids:['p-morepractice']});
