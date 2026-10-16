# Learning Hub

A static learning site with three tracks. Open `index.html`, pick a track and continue from there.

| Track | Page | Contents |
|---|---|---|
| Frontend | `frontend/index.html` | 24 parts, 215 topics: HTML & CSS, JavaScript, TypeScript, Vue, React, Next.js, testing, tooling, system design, projects |
| Data Analyst | `data-analyst/index.html` | 15 parts, 92 topics: SQL, Excel, Power Query, Power BI, DAX, projects, interviews |
| Python | `python/index.html` | 14 parts, 95 topics: Python Core and DSA with Python, runnable editors, quizzes, visualizers, 104 practice problems |

All three handbooks share the same layout: a sidebar with parts and topics, search (`/` or `Ctrl+K`), "Mark as done" progress, light/dark theme and the study companion. Every handbook links back to the hub ("← All learning tracks").

## Running it

No build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

It also works on GitHub Pages (Settings → Pages → deploy from branch, root folder).

Progress is stored in the browser's `localStorage`, with separate keys for each track (`feb-*`, `dab-*`, `pyh-*`). The Python editors download Pyodide from jsDelivr the first time you press **Run**, so that part needs internet access.

## Editing the Python track

Python content lives in the `COURSE` object inside `python/index.html` (modules → lessons, plus practice sets), in the format described in the comment at the top of the original PyPrime Lab. At page load, `COURSE` is rendered into handbook parts and sections. `tools/build-python.js` is the script that originally put the page together from the Data Analyst handbook shell and PyPrime Lab. You don't need it for content edits.
