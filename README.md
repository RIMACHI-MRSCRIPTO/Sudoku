<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Sudoku - JavaScript</title>
  <style>
    :root{--cell-size:48px;--thick:3px;--thin:1px}
    body{font-family:system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;padding:18px;background:#f6f7f9}
    h1{font-size:20px;margin:0 0 12px}
    .container{display:flex;gap:18px;align-items:flex-start}
    .board{display:grid;grid-template-columns:repeat(9,var(--cell-size));grid-template-rows:repeat(9,var(--cell-size));background:#fff;padding:6px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.06)}
    .cell{width:var(--cell-size);height:var(--cell-size);display:flex;align-items:center;justify-content:center;position:relative}
    .cell input{width:100%;height:100%;text-align:center;border:none;font-size:20px;background:transparent}
    .cell input:focus{outline:2px solid #6ea8fe;border-radius:4px}
    .preset input{font-weight:700;color:#111}
    .user input{color:#024}
    .cell{border:var(--thin) solid rgba(0,0,0,0.08)}
    .cell[data-row="0"], .cell[data-row="3"], .cell[data-row="6"]{border-top:var(--thick) solid #222}
    .cell[data-row="8"]{border-bottom:var(--thick) solid #222}
    .cell[data-col="0"], .cell[data-col="3"], .cell[data-col="6"]{border-left:var(--thick) solid #222}
    .cell[data-col="8"]{border-right:var(--thick) solid #222}
    .controls{display:flex;flex-direction:column;gap:8px}
    .pad{display:grid;grid-template-columns:repeat(3,44px);gap:6px}
    button{padding:8px 10px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);background:#fff;cursor:pointer}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    .status{margin-top:8px;font-size:14px;color:#444}
    .highlight{background:rgba(255,0,0,0.12)}
    .ok{background:rgba(0,200,0,0.08)}
    .small{font-size:13px;color:#666}
    .footer{margin-top:12px;font-size:13px;color:#666}
  </style>
</head>
<body>
  <h1>Sudoku</h1>
  <div class="container">
    <div>
      <div id="board" class="board" aria-label="Tablero de Sudoku"></div>
      <div class="footer small"></div>
    </div>

    <div class="controls">
      <div class="actions">
        <button id="loadPreset">Cargar predeterminado</button>
        <button id="clear">Limpiar</button>
        <button id="erase">Borrar celda</button>
        <button id="check">Comprobar</button>
        <button id="solveSimple">Rellenar candidatos (sólo ayuda)</button>
      </div>

      <div style="margin-top:6px">Panel de números:</div>
      <div class="pad" id="numPad"></div>

      <div class="status" id="status">Estado: listo</div>
    </div>
  </div>

  <script>
    const boardEl = document.getElementById('board');
    const statusEl = document.getElementById('status');

    const preset = [
      5,3,0, 0,7,0, 0,0,0,
      6,0,0, 1,9,5, 0,0,0,
      0,9,8, 0,0,0, 0,6,0,

      8,0,0, 0,6,0, 0,0,3,
      4,0,0, 8,0,3, 0,0,1,
      7,0,0, 0,2,0, 0,0,6,

      0,6,0, 0,0,0, 2,8,0,
      0,0,0, 4,1,9, 0,0,5,
      0,0,0, 0,8,0, 0,7,9
    ];

    const cells = [];
    let selected = null;

    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        const idx = r*9 + c;
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
        input.addEventListener('focus', ()=>selectCell(idx));
        input.addEventListener('click', (e)=>{ e.stopPropagation(); selectCell(idx); });
        input.addEventListener('input', (e)=>{
          const v = input.value.replace(/[^1-9]/g,'');
          input.value = v;
          updateValue(idx, v ? Number(v) : 0);
        });
        input.addEventListener('keydown', (e)=>{
          if(e.key === 'Backspace' || e.key === 'Delete'){ e.preventDefault(); clearCell(idx); }
          if(e.key >= '1' && e.key <= '9'){ }
        });

        cell.appendChild(input);
        cells.push({el:cell,input, row:r, col:c, index:idx, readonly:false});
        boardEl.appendChild(cell);
      }
    }

    const pad = document.getElementById('numPad');
    for(let n=1;n<=9;n++){
      const b = document.createElement('button');
      b.textContent = n;
      b.addEventListener('click', ()=>{ insertNumber(n); });
      pad.appendChild(b);
    }
    const b0 = document.createElement('button'); b0.textContent='0/C'; b0.addEventListener('click', ()=>{ if(selected!==null) clearCell(selected); }); pad.appendChild(b0);

    function selectCell(idx){
      if(selected !== null){ cells[selected].el.classList.remove('selected'); }
      selected = idx;
      cells[idx].el.classList.add('selected');
      cells[idx].input.focus();
    }

    function insertNumber(n){
      if(selected === null) return; const it = cells[selected]; if(it.readonly) return;
      it.input.value = String(n);
      updateValue(selected,n);
    }

    function updateValue(idx, val){
      const it = cells[idx];
      it.value = val;
      it.input.value = val ? String(val) : '';
      validateAll();
    }

    function clearCell(idx){ const it=cells[idx]; if(it.readonly) return; it.value=0; it.input.value=''; validateAll(); }

    document.getElementById('loadPreset').addEventListener('click', ()=>{
      loadPreset(); status('Predeterminado cargado');
    });

    function loadPreset(){
      for(let i=0;i<81;i++){
        const v = preset[i];
        const it = cells[i];
        it.readonly = v !== 0;
        it.value = v;
        it.input.value = v ? String(v) : '';
        if(it.readonly){ it.el.classList.add('preset'); it.input.readOnly = true; } else { it.el.classList.remove('preset'); it.input.readOnly = false; }
      }
      validateAll();
    }

    document.getElementById('clear').addEventListener('click', ()=>{
      for(const it of cells){ it.readonly=false; it.value=0; it.input.value=''; it.input.readOnly=false; it.el.classList.remove('preset'); }
      status('Tablero limpio');
      validateAll();
    });

    document.getElementById('erase').addEventListener('click', ()=>{ if(selected!==null) clearCell(selected); });

    document.getElementById('check').addEventListener('click', ()=>{
      const res = checkSolution();
      if(res.complete && res.valid){ status('¡Correcto! Sudoku completado.'); markAll('ok'); }
      else if(!res.complete){ status('No está completo.'); markConflicts(res.conflicts); }
      else{ status('Hay errores en el tablero.'); markConflicts(res.conflicts); }
    });

    function status(msg){ statusEl.textContent = 'Estado: ' + msg; }

    function checkSolution(){
      const vals = cells.map(it=>it.value||0);
      const conflicts = new Set();

      for(let r=0;r<9;r++){
        const seen = {}; for(let c=0;c<9;c++){ const v = vals[r*9+c]; if(v===0) continue; if(seen[v]){ conflicts.add(r*9+c); conflicts.add(r*9+seen[v]-1); } else seen[v]=c+1; }
      }
      for(let c=0;c<9;c++){
        const seen = {}; for(let r=0;r<9;r++){ const v = vals[r*9+c]; if(v===0) continue; if(seen[v]){ conflicts.add(r*9+c); conflicts.add((seen[v]-1)*9+c); } else seen[v]=r+1; }
      }
      for(let br=0;br<3;br++) for(let bc=0;bc<3;bc++){
        const seen={};
        for(let r=0;r<3;r++) for(let c=0;c<3;c++){
          const rr = br*3 + r; const cc = bc*3 + c; const v = vals[rr*9+cc]; if(v===0) continue;
          if(seen[v]){ conflicts.add(rr*9+cc); conflicts.add(seen[v]); } else seen[v] = rr*9+cc;
        }
      }

      const complete = vals.every(v=>v!==0);
      const valid = conflicts.size === 0;
      return {complete, valid, conflicts: Array.from(conflicts)};
    }

    function markConflicts(indexes){
      for(const it of cells){ it.el.classList.remove('highlight'); it.el.classList.remove('ok'); }
      for(const i of indexes){ cells[i].el.classList.add('highlight'); }
    }
    function markAll(cls){ for(const it of cells){ it.el.classList.remove('highlight'); it.el.classList.add(cls); } }

    function validateAll(){
      const res = checkSolution();
      for(const it of cells){ it.el.classList.remove('highlight'); it.el.classList.remove('ok'); }
      if(!res.valid){ markConflicts(res.conflicts); }
    }

    document.getElementById('solveSimple').addEventListener('click', ()=>{
      const vals = cells.map(it=>it.value||0);
      for(let i=0;i<81;i++){
        if(vals[i]!==0) continue;
        const r = Math.floor(i/9), c = i%9;
        const used = new Set();
        for(let cc=0;cc<9;cc++) used.add(vals[r*9+cc]);
        for(let rr=0;rr<9;rr++) used.add(vals[rr*9+c]);
        const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
        for(let rr=br;rr<br+3;rr++) for(let cc=bc;cc<bc+3;cc++) used.add(vals[rr*9+cc]);
        const candidates = [];
        for(let n=1;n<=9;n++) if(!used.has(n)) candidates.push(n);
        if(candidates.length===1){ cells[i].input.value = String(candidates[0]); updateValue(i,candidates[0]); }
      }
      status('Rellenadas celdas con candidato único (si hubo).');
    });

    document.body.addEventListener('click', (e)=>{ if(!e.target.closest('.cell')){ if(selected!==null){ cells[selected].el.classList.remove('selected'); selected=null; } } });

    loadPreset();

    window.addEventListener('keydown', (e)=>{
      if(!selected) return;
      if(e.key >= '1' && e.key <= '9'){ insertNumber(Number(e.key)); e.preventDefault(); }
      if(e.key === 'Backspace' || e.key === 'Delete'){ clearCell(selected); e.preventDefault(); }
    });

  </script>
</body>
</html>
