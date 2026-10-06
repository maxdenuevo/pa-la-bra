const VOCALES = 'aeiouáéíóúü';
const FUERTES = 'aeoáéó';
const DEBILES_TILDE = 'íú';
const INSEPARABLES = ['pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'pl', 'bl', 'cl', 'gl', 'fl'];

const esVocal = (c) => c !== undefined && VOCALES.includes(c);
const rompeDiptongo = (a, b) =>
  (FUERTES.includes(a) && FUERTES.includes(b)) || DEBILES_TILDE.includes(a) || DEBILES_TILDE.includes(b);

function unidades(palabra) {
  const u = [];
  let i = 0;
  while (i < palabra.length) {
    const c = palabra[i];
    const par = palabra.slice(i, i + 2);
    if (par === 'ch' || par === 'll' || par === 'rr') {
      u.push({ t: par, v: false });
      i += 2;
    } else if ((par === 'qu' || par === 'gu') && 'eéií'.includes(palabra[i + 2] ?? '-')) {
      u.push({ t: par, v: false });
      i += 2;
    } else if (c === 'y') {
      u.push({ t: c, v: i > 0 && !esVocal(palabra[i + 1]) });
      i += 1;
    } else {
      u.push({ t: c, v: esVocal(c) });
      i += 1;
    }
  }
  return u;
}

function repartir(grupo) {
  const n = grupo.length;
  const insep = (a, b) => INSEPARABLES.includes(a + b);
  if (n <= 1) return [[], grupo];
  if (n === 2) return insep(grupo[0], grupo[1]) ? [[], grupo] : [[grupo[0]], [grupo[1]]];
  if (n === 3) return insep(grupo[1], grupo[2]) ? [[grupo[0]], grupo.slice(1)] : [grupo.slice(0, 2), [grupo[2]]];
  return [grupo.slice(0, n - 2), grupo.slice(n - 2)];
}

export function silabear(palabra) {
  const u = unidades(palabra.toLowerCase());

  // núcleos: secuencias de vocales, cortadas en hiato
  const nucleos = [];
  const consonantes = [[]];
  let previa = null;
  for (const x of u) {
    if (x.v) {
      const letra = x.t === 'y' ? 'i' : x.t;
      if (previa !== null && !rompeDiptongo(previa, letra)) {
        nucleos[nucleos.length - 1] += x.t;
      } else {
        nucleos.push(x.t);
        consonantes.push([]);
      }
      previa = letra;
    } else {
      consonantes[consonantes.length - 1].push(x.t);
      previa = null;
    }
  }

  if (nucleos.length === 0) return [palabra];

  const silabas = nucleos.map(() => '');
  silabas[0] = consonantes[0].join('');
  for (let k = 0; k < nucleos.length; k++) {
    silabas[k] += nucleos[k];
    const grupo = consonantes[k + 1];
    if (k === nucleos.length - 1) {
      silabas[k] += grupo.join('');
    } else {
      const [coda, ataque] = repartir(grupo);
      silabas[k] += coda.join('');
      silabas[k + 1] = ataque.join('');
    }
  }
  return silabas;
}

export function familia(silaba) {
  const s = silaba.toLowerCase();
  let i = 0;
  while (i < s.length && !esVocal(s[i])) i++;
  let ataque = s.slice(0, i);
  const resto = s.slice(i);

  if (ataque === 'q') ataque = 'c';
  else if (ataque === 'g' && /^[uü][eéií]/.test(resto)) ataque = 'g';
  else if (ataque === 'g' && /^[eéií]/.test(resto)) ataque = 'j';
  else if (ataque === 'c' && /^[eéií]/.test(resto)) ataque = 'z';

  if (ataque === 'c') return ['ca', 'que', 'qui', 'co', 'cu'];
  if (ataque === 'g') return ['ga', 'gue', 'gui', 'go', 'gu'];
  if (ataque === 'z') return ['za', 'ce', 'ci', 'zo', 'zu'];
  if (ataque === 'j') return ['ja', 'ge', 'gi', 'jo', 'ju'];
  return ['a', 'e', 'i', 'o', 'u'].map((v) => ataque + v);
}
