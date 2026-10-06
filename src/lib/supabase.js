const URL_BASE = import.meta.env.PUBLIC_SUPABASE_URL;
const CLAVE = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const SESION_DEFECTO = import.meta.env.PUBLIC_SESION || 'expo-1910';

export function sesionActual() {
  const s = new URLSearchParams(location.search).get('s')?.toLowerCase();
  return s && /^[a-z0-9-]{1,40}$/.test(s) ? s : SESION_DEFECTO;
}

export const esSesionDefecto = (sesion) => sesion === SESION_DEFECTO;

export async function enviarPalabra(sesion, texto, fase) {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/palabras`, {
      method: 'POST',
      headers: { apikey: CLAVE, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ sesion, texto, fase }),
      signal: ctrl.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(reloj);
  }
}

export async function cargarPalabras(sesion) {
  const q = `sesion=eq.${encodeURIComponent(sesion)}&select=id,texto,fase,created_at&order=created_at`;
  const r = await fetch(`${URL_BASE}/rest/v1/palabras?${q}`, { headers: { apikey: CLAVE } });
  return r.ok ? r.json() : [];
}

let cliente;
function conectar() {
  cliente ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_BASE, CLAVE, { auth: { persistSession: false } }),
  );
  return cliente;
}

export async function escucharPalabras(sesion, alLlegar, alFallar) {
  const sb = await conectar();
  sb.channel(`palabras:${sesion}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'palabras', filter: `sesion=eq.${sesion}` },
      (cambio) => alLlegar(cambio.new),
    )
    .subscribe((estado) => {
      if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') alFallar?.();
    });
}

export async function canalFase(sesion, alCambiar) {
  const sb = await conectar();
  const canal = sb.channel(`fase:${sesion}`);
  if (alCambiar) canal.on('broadcast', { event: 'fase' }, ({ payload }) => alCambiar(payload.fase));
  canal.subscribe();
  return {
    emitir: (fase) => canal.send({ type: 'broadcast', event: 'fase', payload: { fase } }),
  };
}
