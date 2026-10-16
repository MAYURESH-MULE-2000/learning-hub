
// Assembles python/index.html from the Data Analyst handbook shell + PyPrime Lab content/engine.
const fs = require('fs');
const OUT = process.argv[2];
const da = fs.readFileSync('da.html', 'utf8').split('\n');
const py = fs.readFileSync('py.html', 'utf8');
const lines = (a, b) => da.slice(a - 1, b).join('\n'); // 1-based inclusive
const must = (s, from, to) => { if (!s.includes(from)) throw new Error('missing: ' + from.slice(0, 80)); return s.split(from).join(to); };

/* ---------- PyPrime pieces ---------- */
const pyLines = py.split('\n');
const pyCssRaw = pyLines.slice(123, 322).join('\n'); // static code .. toast (lines 124-322)
// scope PyPrime CSS under .lab so it can't clash with handbook classes (.btn, .num, .card ...)
function scope(css){
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '', i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i); if (open < 0) break;
    const sel = css.slice(i, open).trim();
    if (sel.startsWith('@keyframes')) { let d = 0, j = open; do { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; } while (d); out += css.slice(i, j).trim() + '\n'; i = j; continue; }
    if (sel.startsWith('@media')) { let d = 0, j = open; do { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; } while (d); out += sel + '{' + scope(css.slice(open + 1, j - 1)) + '}\n'; i = j; continue; }
    const close = css.indexOf('}', open);
    const body = css.slice(open + 1, close);
    const skip = /^\.(toast|tk|ts|tc|tn|tb|td)\b/.test(sel) || /^(\.hero|\.stats|\.stat|\.grid|\.card|\.tips|\.foot|\.cta|\.lesson-nav|\.track-head|\.track-ic|\.sub-sec|\.nav-track)/.test(sel);
    if (!skip && sel) out += sel.split(',').map(s => '.lab ' + s.trim()).join(',') + '{' + body + '}\n';
    i = close + 1;
  }
  return out;
}
const pyCss = scope(pyCssRaw);
const courseSrc = py.slice(py.indexOf('const R = String.raw;'), py.indexOf('/* =====================================================================\n   APP'));
const engStart = py.indexOf("const PYODIDE_URL");
const engHead = py.slice(engStart, py.indexOf('const LESSONS = [];'));                         // URL, $, esc, main
const engCore = py.slice(py.indexOf('/* ---------- syntax highlight'), py.indexOf('/* ---------- quiz ----------'));
const labBuild = fs.readFileSync('lab-build.js', 'utf8');
const labCss = fs.readFileSync('lab-extra.css', 'utf8');

/* ---------- handbook head ---------- */
let head = lines(1, 217);
head = must(head, '<title>Data Analyst Handbook: SQL, Excel, Power BI</title>', '<title>Python Handbook: Core &amp; DSA</title>');
head = must(head, '</style>', pyCss + labCss + '</style>');

/* ---------- body shell ---------- */
let shell = lines(218, 260);
shell = must(shell, '<span class="ttl" id="topTitle">Data Analyst Handbook</span>', '<span class="ttl" id="topTitle">Python Handbook</span>');
shell = must(shell, '<aside id="side" aria-label="Navigation">', '<aside id="side" aria-label="Navigation">\n  <a class="hubback" href="../index.html">← All learning tracks</a>');
shell = must(shell, '<span class="logo">DA</span><span><b>Data Analyst Handbook</b><small>SQL · Excel · Power BI</small></span>', '<span class="logo">PY</span><span><b>Python Handbook</b><small>Python Core · DSA</small></span>');
shell = must(shell, '<kbd>/</kbd></button>', '<kbd>/</kbd></button>\n  <span class="pystat" id="pystat" title="Python engine status"><i></i><span>Python: idle</span></span>');
shell = must(shell, 'From zero to <span class="mark">job-ready data analyst.</span>', 'From zero to <span class="mark">interview-ready Python.</span>');
shell = shell.replace(/<p class="lede">[\s\S]*?<\/p>/, '<p class="lede">Python from your first <code>print()</code> to data structures and algorithms. Short lessons, live code you run right here in the browser, visual playgrounds, a quick check after every lesson, and practice problems that check your code automatically. Python Core comes first, then DSA with Python for coding interviews.</p>');
shell = shell.replace(/<div class="legend">[\s\S]*?<\/div>/, '<div class="legend"><span><span class="src">Python</span> <span class="src">DSA</span> <span class="src">Practice</span> tags name the track</span><span>Every editor runs real Python: press <b>Run</b> or <kbd>Ctrl</kbd>+<kbd>Enter</kbd></span></div>');
if (!shell.trim().endsWith('<div id="content">')) throw new Error('shell end: ' + shell.slice(-80));
// content is empty: built at runtime from COURSE
let tail = lines(3615, 3632);
tail = must(tail, 'Search, e.g. XLOOKUP, window function, CALCULATE', 'Search, e.g. list comprehension, dict, recursion, BFS');
tail += '\n<div class="toast" id="labToast"></div>';

/* ---------- handbook script ---------- */
let core = lines(3633, 3915);
core = core.split("'dab-").join("'pyh-");
core = must(core, "c.innerHTML=(lang==='excel'", "c.innerHTML=lang==='py'?window.__pyHL(src):(lang==='excel'");
core = core.replace(/const LABELS=\{[^}]*\};/, "const LABELS={start:'Start',core:'Python',dsa:'DSA',practice:'Practice'};");
core = must(core, 'meta.innerHTML=`<span class="src ${kind}">${LABELS[kind]||kind}</span>`;', 'meta.innerHTML=`<span class="src ${kind}">${LABELS[kind]||kind}</span>`+(s.dataset.mins?`<span class="src">~${s.dataset.mins} min</span>`:\'\');');
core = core.replace(/const TRACKS=\[[\s\S]*?\n\];/, 'const TRACKS=window.PY_TRACKS.slice();');
core = core.split('Data Analyst Handbook').join('Python Handbook');
core = must(core, 'Try “LEFT JOIN”, “DENSE_RANK”, “SUMIFS”, “XLOOKUP”, “Power Query”, “CALCULATE”, “date table”.', 'Try “f-string”, “slicing”, “dict”, “class”, “generator”, “binary search”, “BFS”, “dynamic programming”.');
if (/SQL|Excel|Power BI|ShopKart/.test(core.replace(/function hlSQL[\s\S]*?\n(?=function hlFx)/, ''))) console.warn('core still mentions DA terms');

/* ---------- study companion ---------- */
let coach = lines(3923, 4592);
coach = coach.split("'dacoach-").join("'pycoach-").split("'dab-done'").join("'pyh-done'");
coach = must(coach, '"SQL, Excel and Power BI together cover most analyst job descriptions. You\'re building exactly that."', '"Python plus solid DSA covers most junior developer and data job interviews. You\'re building exactly that."');
coach = must(coach, 'Lessons unlock one at a time: SQL first, then Excel, then Power BI, so nothing gets skipped.', 'Lessons unlock one at a time: Python Core first, then DSA, so nothing gets skipped.');
coach = coach.split('Every dashboard you build from here is portfolio proof. Keep going.').join('Every problem you solve here is interview practice. Keep going.');
for (const w of ['SQL', 'Excel', 'Power BI', 'dashboard', 'analyst', 'ShopKart', 'DAX']) if (coach.includes(w)) console.warn('coach mentions', w, coach.split('\n').filter(l => l.includes(w)).map(l => l.slice(0, 160)));

const lab = `<script>
(function(){
${courseSrc}
/* =====================================================================
   ENGINE (from PyPrime Lab: Pyodide runner, editor, auto-checker, visualizers)
   ===================================================================== */
${engHead.replace("const main = $('#main');", '')}
${engCore}
${labBuild}
})();
</script>`;

const outHtml = [head, shell, tail, lab, core, coach, '', '</body>', '</html>', ''].join('\n');
fs.writeFileSync(OUT, outHtml);
console.log('wrote', OUT, outHtml.length);
