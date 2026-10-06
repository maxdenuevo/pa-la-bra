const PATRON = /^[a-záéíóúüñ]{2,20}$/;

export function normalizar(texto) {
  const palabra = String(texto ?? '').normalize('NFC').trim().toLowerCase();
  return PATRON.test(palabra) ? palabra : null;
}
