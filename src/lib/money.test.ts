import { describe, expect, it } from 'vitest';
import {
  IMPORTO_MASSIMO_CENTESIMI,
  centesimiPerCampo,
  euroInCentesimi,
  formattaEuro,
  quotaAltraPersona,
} from './money';

// Intl usa lo spazio non separabile prima di €: lo rendiamo visibile nei test
const spazi = (s: string) => s.replace(/[  ]/g, ' ');

describe('euroInCentesimi: dal testo del form ai centesimi', () => {
  it.each([
    ['47,30', 4730],
    ['47,3', 4730],
    ['47', 4700],
    ['0,05', 5],
    ['10,01', 1001],
    ['1.234,56', 123456],
    ['1.234', 123400],
    ['1234.56', 123456],
    ['47.3', 4730],
    [' 47,30 € ', 4730],
    ['-10,01', -1001],
    ['−10,01', -1001],
    ['0,1', 10],
    ['0,29', 29], // 0.29 * 100 in virgola mobile darebbe 28.999…
    ['1.000.000,00', IMPORTO_MASSIMO_CENTESIMI],
  ])('"%s" → %i', (testo, atteso) => {
    expect(euroInCentesimi(testo)).toBe(atteso);
  });

  it.each([
    '',
    '   ',
    'abc',
    '47,305', // più di 2 decimali
    '47,30,1',
    '1,234.56', // formato inglese
    '12.34,56', // migliaia sbagliate
    ',50',
    '47,',
    '1.000.000,01', // oltre il massimo
  ])('"%s" non è un importo valido', (testo) => {
    expect(euroInCentesimi(testo)).toBeNull();
  });

  it('lo zero è accettato qui (lo rifiuta la validazione del form)', () => {
    expect(euroInCentesimi('0')).toBe(0);
  });
});

describe('formattaEuro: formato it-IT (NF-03)', () => {
  it.each([
    [4730, '47,30 €'],
    [5, '0,05 €'],
    [123456, '1.234,56 €'],
    [100000000, '1.000.000,00 €'],
    [-1001, '-10,01 €'],
    [0, '0,00 €'],
  ])('%i → "%s"', (centesimi, atteso) => {
    expect(spazi(formattaEuro(centesimi))).toBe(atteso);
  });

  it('rifiuta i numeri non interi', () => {
    expect(() => formattaEuro(47.3)).toThrow(RangeError);
  });
});

describe('centesimiPerCampo: il valore da rimettere nel form', () => {
  it.each([
    [4730, '47,30'],
    [5, '0,05'],
    [123456, '1234,56'],
    [-1001, '-10,01'],
  ])('%i → "%s"', (centesimi, atteso) => {
    expect(centesimiPerCampo(centesimi)).toBe(atteso);
  });

  it('andata e ritorno: il testo rimesso nel campo dà gli stessi centesimi', () => {
    for (const c of [1, 99, 100, 1001, 4730, 123456, -1001]) {
      expect(euroInCentesimi(centesimiPerCampo(c))).toBe(c);
    }
  });
});

// Stessi casi del test pgTAP 02_conti: anteprima e database non possono divergere
describe('quotaAltraPersona: stessa regola della vista quote_spese', () => {
  it.each([
    [1001, 'a_meta', 500], // il centesimo dispari resta a chi ha pagato (R4)
    [1000, 'a_meta', 500],
    [4730, 'a_meta', 2365],
    [1, 'a_meta', 0],
    [-1001, 'a_meta', -500], // reso: troncato verso lo zero, come in SQL
    [5000, 'a_meta', 2500],
    [2000, 'per_altra_persona', 2000], // R3
    [-2000, 'per_altra_persona', -2000],
  ] as const)('%i, %s → %i', (importo, divisione, attesa) => {
    expect(quotaAltraPersona(importo, divisione)).toBe(attesa);
  });

  it('spesa e reso uguali si annullano esattamente', () => {
    expect(quotaAltraPersona(1001, 'a_meta') + quotaAltraPersona(-1001, 'a_meta')).toBe(0);
  });

  it('rifiuta i numeri non interi', () => {
    expect(() => quotaAltraPersona(10.01, 'a_meta')).toThrow(RangeError);
  });
});
