import { K_SESSION, store, sstore } from './common.js';

// === CONFIGURACIÓN (ADMIN) ===
const ASSIGNED = {
  cliente: 'Cliente Biblioteca',
  username: 'Administrador',
  password_plain: 'ColegioCalasanzStock1234!', // <-- cambiala
  salt: 'demo-salt-1234',
  hash: null // si usás hash real, ponelo acá y deja password_plain:null
};

async function sha256Hex(str){
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

export function getAssignedUser(){ return { cliente: ASSIGNED.cliente, username: ASSIGNED.username }; }
export function getLastLogin(){ return store.get('auth.lastLogin', null); }

export async function loginIfValid(username, password){
  if (username !== ASSIGNED.username) return false;
  let ok = false;
  if (ASSIGNED.hash) {
    const calc = await sha256Hex(password + ':' + ASSIGNED.salt);
    ok = (calc === ASSIGNED.hash);
  } else {
    ok = (password === ASSIGNED.password_plain);
  }
  if (ok){
    sstore.set(K_SESSION, { username, at: Date.now() });
    store.set('auth.lastLogin', Date.now());
  }
  return ok;
}

export function requireAuth(){ const ses = sstore.get(K_SESSION); if (!ses) location.href = 'index.html'; }
export function onLogout(){ sstore.del(K_SESSION); location.href = 'index.html'; }
export function guardIfLogged(redirect){ const ses = sstore.get(K_SESSION); if (ses && redirect) location.href = redirect; }
