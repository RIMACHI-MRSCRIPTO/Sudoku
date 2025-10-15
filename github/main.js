const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');

const preset = [
    5, 3, 0, 0, 7, 0, 0, 0, 0,
    6, 0, 0, 1, 9, 5, 0, 0, 0,
    0, 9, 8, 0, 0, 0, 0, 6, 0,

    8, 0, 0, 0, 6, 0, 0, 0, 3,
    4, 0, 0, 8, 0, 3, 0, 0, 1,
    7, 0, 0, 0, 2, 0, 0, 0, 6,

    0, 6, 0, 0, 0, 0, 2, 8, 0,
    0, 0, 0, 4, 1, 9, 0, 0, 5,
    0, 0, 0, 0, 8, 0, 0, 7, 9
];

const cells = [];
let selected = null;

for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const cell = document.createElement('div');
        cell.className = 'cell user';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.index = idx;

        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.addEventListener('focus', () => selectCell(idx));
        input.addEventListener('click', (e) => { e.stopPropagation(); selectCell(idx); });
        input.addEventListener('input', (e) => {
            const v = input.value.replace(/[^1-9]/g, '');
            input.value = v;
            updateValue(idx, v ? Number(v) : 0);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); clearCell(idx); }
            if (e.key >= '1' && e.key <= '9') { }
        });

        cell.appendChild(input);
        cells.push({ el: cell, input, row: r, col: c, index: idx, readonly: false });
        boardEl.appendChild(cell);
    }
}

const pad = document.getElementById('numPad');
for (let n = 1; n <= 9; n++) {
    const b = document.createElement('button');
    b.textContent = n;
    b.addEventListener('click', () => { insertNumber(n); });
    pad.appendChild(b);
}
const b0 = document.createElement('button'); b0.textContent = '0/C'; b0.addEventListener('click', () => { if (selected !== null) clearCell(selected); }); pad.appendChild(b0);

function selectCell(idx) {
    if (selected !== null) { cells[selected].el.classList.remove('selected'); }
    selected = idx;
    cells[idx].el.classList.add('selected');
    cells[idx].input.focus();
}

function insertNumber(n) {
    if (selected === null) return; const it = cells[selected]; if (it.readonly) return;
    it.input.value = String(n);
    updateValue(selected, n);
}

function updateValue(idx, val) {
    const it = cells[idx];
    it.value = val;
    it.input.value = val ? String(val) : '';
    validateAll();
}

function clearCell(idx) { const it = cells[idx]; if (it.readonly) return; it.value = 0; it.input.value = ''; validateAll(); }

document.getElementById('loadPreset').addEventListener('click', () => {
    loadPreset(); status('Predeterminado cargado');
});

function loadPreset() {
    for (let i = 0; i < 81; i++) {
        const v = preset[i];
        const it = cells[i];
        it.readonly = v !== 0;
        it.value = v;
        it.input.value = v ? String(v) : '';
        if (it.readonly) { it.el.classList.add('preset'); it.input.readOnly = true; } else { it.el.classList.remove('preset'); it.input.readOnly = false; }
    }
    validateAll();
}

document.getElementById('clear').addEventListener('click', () => {
    for (const it of cells) { it.readonly = false; it.value = 0; it.input.value = ''; it.input.readOnly = false; it.el.classList.remove('preset'); }
    status('Tablero limpio');
    validateAll();
});

document.getElementById('erase').addEventListener('click', () => { if (selected !== null) clearCell(selected); });

document.getElementById('check').addEventListener('click', () => {
    const res = checkSolution();
    if (res.complete && res.valid) { status('¡Correcto! Sudoku completado.'); markAll('ok'); }
    else if (!res.complete) { status('No está completo.'); markConflicts(res.conflicts); }
    else { status('Hay errores en el tablero.'); markConflicts(res.conflicts); }
});

function status(msg) { statusEl.textContent = 'Estado: ' + msg; }

function checkSolution() {
    const vals = cells.map(it => it.value || 0);
    const conflicts = new Set();

    for (let r = 0; r < 9; r++) {
        const seen = {}; for (let c = 0; c < 9; c++) { const v = vals[r * 9 + c]; if (v === 0) continue; if (seen[v]) { conflicts.add(r * 9 + c); conflicts.add(r * 9 + seen[v] - 1); } else seen[v] = c + 1; }
    }
    for (let c = 0; c < 9; c++) {
        const seen = {}; for (let r = 0; r < 9; r++) { const v = vals[r * 9 + c]; if (v === 0) continue; if (seen[v]) { conflicts.add(r * 9 + c); conflicts.add((seen[v] - 1) * 9 + c); } else seen[v] = r + 1; }
    }
    for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
        const seen = {};
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
            const rr = br * 3 + r; const cc = bc * 3 + c; const v = vals[rr * 9 + cc]; if (v === 0) continue;
            if (seen[v]) { conflicts.add(rr * 9 + cc); conflicts.add(seen[v]); } else seen[v] = rr * 9 + cc;
        }
    }

    const complete = vals.every(v => v !== 0);
    const valid = conflicts.size === 0;
    return { complete, valid, conflicts: Array.from(conflicts) };
}

function markConflicts(indexes) {
    for (const it of cells) { it.el.classList.remove('highlight'); it.el.classList.remove('ok'); }
    for (const i of indexes) { cells[i].el.classList.add('highlight'); }
}
function markAll(cls) { for (const it of cells) { it.el.classList.remove('highlight'); it.el.classList.add(cls); } }

function validateAll() {
    const res = checkSolution();
    for (const it of cells) { it.el.classList.remove('highlight'); it.el.classList.remove('ok'); }
    if (!res.valid) { markConflicts(res.conflicts); }
}

document.getElementById('solveSimple').addEventListener('click', () => {
    const vals = cells.map(it => it.value || 0);
    for (let i = 0; i < 81; i++) {
        if (vals[i] !== 0) continue;
        const r = Math.floor(i / 9), c = i % 9;
        const used = new Set();
        for (let cc = 0; cc < 9; cc++) used.add(vals[r * 9 + cc]);
        for (let rr = 0; rr < 9; rr++) used.add(vals[rr * 9 + c]);
        const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) used.add(vals[rr * 9 + cc]);
        const candidates = [];
        for (let n = 1; n <= 9; n++) if (!used.has(n)) candidates.push(n);
        if (candidates.length === 1) { cells[i].input.value = String(candidates[0]); updateValue(i, candidates[0]); }
    }
    status('Rellenadas celdas con candidato único (si hubo).');
});

document.body.addEventListener('click', (e) => { if (!e.target.closest('.cell')) { if (selected !== null) { cells[selected].el.classList.remove('selected'); selected = null; } } });

loadPreset();

window.addEventListener('keydown', (e) => {
    if (!selected) return;
    if (e.key >= '1' && e.key <= '9') { insertNumber(Number(e.key)); e.preventDefault(); }
    if (e.key === 'Backspace' || e.key === 'Delete') { clearCell(selected); e.preventDefault(); }
});
