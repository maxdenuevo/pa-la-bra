import { test } from 'node:test';
import assert from 'node:assert/strict';
import { silabear, familia } from '../src/lib/silabas.js';
import { normalizar } from '../src/lib/validar.js';

const CASOS = {
  deuda: 'deu-da', pega: 'pe-ga', arriendo: 'a-rrien-do',
  micro: 'mi-cro', cae: 'ca-e', trabajo: 'tra-ba-jo',
  ambulancia: 'am-bu-lan-cia', tierra: 'tie-rra',
  patrón: 'pa-trón', campesino: 'cam-pe-si-no',
  llave: 'lla-ve', país: 'pa-ís', poeta: 'po-e-ta',
  ahorro: 'a-ho-rro', instituto: 'ins-ti-tu-to',
  transporte: 'trans-por-te', sueldo: 'suel-do',
  guerra: 'gue-rra', examen: 'e-xa-men', estrés: 'es-trés',
  huelga: 'huel-ga', reforma: 're-for-ma', chile: 'chi-le',
  lluvia: 'llu-via', río: 'rí-o', ciudad: 'ciu-dad',
  agua: 'a-gua', leer: 'le-er', hambre: 'ham-bre',
  cansancio: 'can-san-cio', pan: 'pan', queso: 'que-so',
  // extra
  rey: 'rey', ayer: 'a-yer', pingüino: 'pin-güi-no', guitarra: 'gui-ta-rra',
};

for (const [palabra, esperado] of Object.entries(CASOS)) {
  test(`silabear ${palabra}`, () => {
    assert.equal(silabear(palabra).join('-'), esperado);
  });
}

const FAMILIAS = {
  deu: 'da de di do du',
  da: 'da de di do du',
  tra: 'tra tre tri tro tru',
  cam: 'ca que qui co cu',
  que: 'ca que qui co cu',
  gue: 'ga gue gui go gu',
  gua: 'ga gue gui go gu',
  ciu: 'za ce ci zo zu',
  zo: 'za ce ci zo zu',
  lla: 'lla lle lli llo llu',
  rrien: 'rra rre rri rro rru',
  a: 'a e i o u',
  ins: 'a e i o u',
  ham: 'ha he hi ho hu',
  ge: 'ja ge gi jo ju',
  trón: 'tra tre tri tro tru',
};

for (const [silaba, esperado] of Object.entries(FAMILIAS)) {
  test(`familia ${silaba}`, () => {
    assert.equal(familia(silaba).join(' '), esperado);
  });
}

test('normalizar', () => {
  assert.equal(normalizar('  Deuda '), 'deuda');
  assert.equal(normalizar('PATRÓN'), 'patrón');
  assert.equal(normalizar('ñandú'), 'ñandú');
  assert.equal(normalizar('pingüino'), 'pingüino');
  assert.equal(normalizar('a'), null);
  assert.equal(normalizar('dos palabras'), null);
  assert.equal(normalizar('abc1'), null);
  assert.equal(normalizar('a'.repeat(21)), null);
  assert.equal(normalizar(''), null);
});
