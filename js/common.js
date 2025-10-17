// js/common.js
export const K_SESSION = 'auth.session';
export const K_BOOKS   = 'books.v2';
export const K_LOGS    = 'audit.v2';

export const store = {
  get(k, def){ try{ const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : (def ?? null); }catch{ return def ?? null; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); },
  del(k){ localStorage.removeItem(k); }
};
export const sstore = {
  get(k, def){ try{ const raw = sessionStorage.getItem(k); return raw ? JSON.parse(raw) : (def ?? null); }catch{ return def ?? null; } },
  set(k, v){ sessionStorage.setItem(k, JSON.stringify(v)); },
  del(k){ sessionStorage.removeItem(k); }
};

function pushLog(entry){
  const logs = store.get(K_LOGS, []);
  logs.push(entry);
  store.set(K_LOGS, logs);
}
export function currentUser(){ return sstore.get(K_SESSION)?.username || null; }

export function logCreate({ entity, entityId, details, user }){
  pushLog({ id: crypto.randomUUID(), ts: Date.now(), action:'CREATE', entity, entityId, user: user ?? currentUser(), details: details ?? {} });
}
export function logUpdate({ entity, entityId, changes, user }){
  pushLog({ id: crypto.randomUUID(), ts: Date.now(), action:'UPDATE', entity, entityId, user: user ?? currentUser(), details:{ changes } });
}
export function logDelete({ entity, entityId, details, user }){
  pushLog({ id: crypto.randomUUID(), ts: Date.now(), action:'DELETE', entity, entityId, user: user ?? currentUser(), details: details ?? {} });
}

export function getAllLogs(){ return store.get(K_LOGS, []); }
export function clearAllLogs(){ store.set(K_LOGS, []); }

export function requireAuth(){ const ses = sstore.get(K_SESSION); if (!ses) location.href = 'index.html'; }
export function guardIfLogged(redirect){ const ses = sstore.get(K_SESSION); if (ses && redirect) location.href = redirect; }
