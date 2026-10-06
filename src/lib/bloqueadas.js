const BLOQUEADAS = new Set([
  'weón', 'weon', 'huevón', 'huevon', 'hueón', 'hueon', 'aweonao', 'ahueonao',
  'culiao', 'culiado', 'conchetumare', 'conchesumare', 'ctm', 'csm', 'chucha',
  'puta', 'puto', 'putas', 'putos', 'maraco', 'maricón', 'maricon', 'fleto',
  'pico', 'pichula', 'raja', 'zorra', 'perra', 'tula', 'callampa', 'pajero',
  'mierda', 'idiota', 'imbécil', 'imbecil', 'retrasado', 'mongólico',
  'mongolico', 'nazi', 'facho', 'violar', 'violación', 'violacion',
]);

export const estaBloqueada = (texto) => BLOQUEADAS.has(texto);
