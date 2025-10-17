import { getAllLogs } from './common.js';

// Devuelve filas planas para la tabla de logs
export function getLogsFlat(){
  const all = Array.isArray(getAllLogs()) ? getAllLogs() : [];
  const out = [];
  for (const l of all){
    if (l.action === 'UPDATE'){
      const changes = Array.isArray(l.details?.changes) ? l.details.changes : [];
      for (const c of changes){
        out.push({
          action: 'UPDATE',
          id: l.id || '',
          ts: Number(l.ts) || Date.now(),
          entity: l.entity || '',
          entityId: l.entityId || '',
          user: l.user || '',
          field: c.field,
          from: c.from,
          to: c.to
        });
      }
    } else if (l.action === 'CREATE'){
      out.push({
        action: 'CREATE',
        id: l.id || '',
        ts: Number(l.ts) || Date.now(),
        entity: l.entity || '',
        entityId: l.entityId || '',
        user: l.user || '',
        field: 'nuevo',
        from: '',
        to: (l.details?.titulo ?? '(libro)') + (l.details?.autor ? ` — ${l.details.autor}` : '')
      });
    } else if (l.action === 'DELETE'){
      out.push({
        action: 'DELETE',
        id: l.id || '',
        ts: Number(l.ts) || Date.now(),
        entity: l.entity || '',
        entityId: l.entityId || '',
        user: l.user || '',
        field: 'eliminado',
        from: (l.details?.titulo ?? '(libro)') + (l.details?.autor ? ` — ${l.details.autor}` : ''),
        to: ''
      });
    }
  }
  return out;
}
