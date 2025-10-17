// js/books.js
import { K_BOOKS, store, logUpdate, logCreate, logDelete } from './common.js';

function getBooks(){ return store.get(K_BOOKS, []); }
function setBooks(arr){ store.set(K_BOOKS, arr); }

function currency(n){
  if (n===null || n===undefined || n==='') return '';
  const v = Number(n);
  return Number.isFinite(v)
    ? new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(v)
    : '';
}
function parseNumberLike(str){
  if (str===null || str===undefined) return null;
  const s = String(str).trim();
  if (s==='') return null;
  // Normaliza: quita todo lo que no sea dígito, coma o punto; maneja miles/coma
  const cleaned = s.replace(/[^\d.,-]/g,'');         // deja 0-9 . , -
  const norm = cleaned.replace(/\./g,'').replace(/,/g,'.'); // “2.500,75” -> “2500.75”
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

let editingId = null;

function renderBooks(){
  const q = document.getElementById('qLibros').value.trim().toLowerCase();
  const tbody = document.getElementById('tblLibros');
  const rows = getBooks()
    .filter(b => {
      const s = [b.titulo,b.autor,b.editorial,b.ubicacion].map(x=>x||'').join(' ').toLowerCase();
      return !q || s.includes(q);
    })
    .map(b => `
      <tr data-id="${b.id}">
        <td data-k="titulo">${b.titulo||''}</td>
        <td data-k="autor">${b.autor||''}</td>
        <td data-k="editorial">${b.editorial||''}</td>
        <td data-k="anio">${b.anio??''}</td>
        <td data-k="ubicacion">${b.ubicacion||''}</td>
        <td data-k="precio" data-format="currency">${currency(b.precio)}</td>
        <td data-k="stock">${b.stock??0}</td>
        <td class="actions">
          <div class="btn-group">
            <button class="iconbtn icon-edit" data-act="edit" title="Editar">✏️</button>
            <button class="iconbtn icon-save" data-act="save" title="Guardar" style="display:none">💾</button>
            <button class="iconbtn icon-cancel" data-act="cancel" style="display:none" title="Cancelar">↩</button>
            <button class="iconbtn icon-del" data-act="del" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  tbody.innerHTML = rows || '<tr><td colspan="8" class="muted">Sin libros.</td></tr>';
}

function rowToEditable(tr){
  if (editingId && editingId !== tr.dataset.id){
    alert('Terminá de editar la fila actual antes de seguir.');
    return;
  }
  const id = tr.dataset.id;
  const b = getBooks().find(x=>x.id===id);
  if (!b) return;

  editingId = id;

  // **Clave del fix**: usamos el valor REAL del objeto b[k], no el texto formateado
  [...tr.querySelectorAll('td[data-k]')].forEach(td=>{
    const k = td.dataset.k;
    const realVal = b[k];                       // <- valor original del modelo
    const raw = (realVal ?? '').toString();     // lo guardamos como texto simple
    td.dataset.orig = raw;

    const attrs = [];
    if (k==='anio')   attrs.push('type="number" min="0" step="1"');
    if (k==='precio') attrs.push('type="number" step="0.01" min="0"');
    if (k==='stock')  attrs.push('type="number" step="1" min="0"');

    td.innerHTML = `<input ${attrs.join(' ')} value="${raw}">`;
  });

  tr.querySelector('[data-act="edit"]').style.display='none';
  tr.querySelector('[data-act="del"]').style.display='none';
  tr.querySelector('[data-act="save"]').style.display='';
  tr.querySelector('[data-act="cancel"]').style.display='';

  tr.querySelector('input')?.focus();
  tr.addEventListener('keydown', rowKeyHandler);
}

function rowKeyHandler(e){
  const tr = e.currentTarget;
  if (e.key==='Enter'){ e.preventDefault(); saveEdit(tr); }
  else if (e.key==='Escape'){ e.preventDefault(); cancelEdit(tr); }
}

function cancelEdit(tr){
  [...tr.querySelectorAll('td[data-k]')].forEach(td=>{
    const k = td.dataset.k;
    const was = td.dataset.orig ?? '';
    if (k==='precio'){
      td.innerHTML = `<span>${currency(parseNumberLike(was))}</span>`;
    } else {
      td.textContent = was;
    }
    delete td.dataset.orig;
  });
  tr.querySelector('[data-act="edit"]').style.display='';
  tr.querySelector('[data-act="del"]').style.display='';
  tr.querySelector('[data-act="save"]').style.display='none';
  tr.querySelector('[data-act="cancel"]').style.display='none';
  tr.removeEventListener('keydown', rowKeyHandler);
  editingId = null;
}

function saveEdit(tr){
  const id = tr.dataset.id;
  const books = getBooks();
  const b = books.find(x=>x.id===id);
  if (!b) return;

  const changes = [];
  let blocked = false;

  [...tr.querySelectorAll('td[data-k]')].forEach(td=>{
    const k = td.dataset.k;
    const input = td.querySelector('input');
    let val = input ? input.value.trim() : td.textContent.trim();
    let prev = b[k];

    if (['anio','precio','stock'].includes(k)){
      val = parseNumberLike(val);
      if (k==='anio'   && val!==null && (val<1000 || val>2100)){ alert('Año fuera de rango (1000–2100)'); blocked = true; return; }
      if (k==='precio' && val!==null && val<0){ alert('Precio inválido'); blocked = true; return; }
      if (k==='stock'  && val!==null && val<0){ alert('Stock inválido'); blocked = true; return; }
    }

    if (String(prev??'') !== String(val??'')){
      changes.push({ field:k, from: prev ?? null, to: val ?? null });
      b[k] = val;
    }
  });
  if (blocked) return;

  setBooks(books);

  // Re-armo la fila con formato
  tr.innerHTML = `
    <td data-k="titulo">${b.titulo||''}</td>
    <td data-k="autor">${b.autor||''}</td>
    <td data-k="editorial">${b.editorial||''}</td>
    <td data-k="anio">${b.anio??''}</td>
    <td data-k="ubicacion">${b.ubicacion||''}</td>
    <td data-k="precio" data-format="currency">${currency(b.precio)}</td>
    <td data-k="stock">${b.stock??0}</td>
    <td class="actions">
      <div class="btn-group">
        <button class="iconbtn icon-edit" data-act="edit" title="Editar">✏️</button>
        <button class="iconbtn icon-save" data-act="save" title="Guardar" style="display:none">💾</button>
        <button class="iconbtn icon-cancel" data-act="cancel" style="display:none" title="Cancelar">↩</button>
        <button class="iconbtn icon-del" data-act="del" title="Eliminar">🗑️</button>
      </div>
    </td>
  `;
  tr.removeEventListener('keydown', rowKeyHandler);
  editingId = null;

  if (changes.length){ logUpdate({ entity:'libros', entityId:id, changes }); }
}

export function initBooksUI(){
  // Alta
  document.getElementById('formLibro').addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const libro = Object.fromEntries(fd.entries());
    if (!libro.titulo || !libro.autor){ return alert('Campos obligatorios: Título y Autor'); }
    const b = {
      id: crypto.randomUUID(),
      titulo: libro.titulo.trim(),
      autor: libro.autor.trim(),
      editorial: (libro.editorial||'').trim(),
      anio: libro.anio ? Number(libro.anio) : null,
      ubicacion: (libro.ubicacion||'').trim(),
      precio: libro.precio ? Number(libro.precio) : null,
      stock: libro.stock ? Number(libro.stock) : 0
    };
    const books = getBooks(); books.push(b); setBooks(books);
    logCreate({ entity:'libros', entityId:b.id, details:{ titulo:b.titulo, autor:b.autor } });
    e.target.reset(); renderBooks();
  });

  // Filtro
  document.getElementById('qLibros').addEventListener('input', renderBooks);

  // Acciones por fila
  document.getElementById('tblLibros').addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    const act = btn.dataset.act; const tr = btn.closest('tr'); if (!act || !tr) return;
    const id = tr.dataset.id;

    if (act==='edit') return rowToEditable(tr);
    if (act==='cancel') return cancelEdit(tr);
    if (act==='save') return saveEdit(tr);
    if (act==='del'){
      if (!confirm('¿Eliminar libro?')) return;
      const before = getBooks();
      const item = before.find(x=>x.id===id);
      const after = before.filter(x=>x.id!==id);
      setBooks(after); renderBooks();
      if (item) logDelete({ entity:'libros', entityId:id, details:{ titulo:item.titulo, autor:item.autor } });
    }
  });

  // Export
  document.getElementById('btnExportJSON').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(getBooks(), null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'libros.json'; a.click(); URL.revokeObjectURL(a.href);
  });

  renderBooks();
}
