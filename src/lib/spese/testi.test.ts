import { describe, expect, it } from 'vitest';
import { anteprimaSpesa, testoSaldo, testoSpesaSalvata } from './testi';

// Gli spazi prima di € sono non separabili (formattaEuro)
const n = (s: string) => s.replace(/ /g, ' ');

describe('testoSaldo', () => {
  it('dice chi deve a chi, sempre con il nome', () => {
    expect(n(testoSaldo(2340, 'Simona'))).toBe('Simona ti deve 23,40 €');
    expect(n(testoSaldo(-2340, 'Simona'))).toBe('Devi a Simona 23,40 €');
    expect(testoSaldo(0, 'Simona')).toBe('Siete in pari');
  });
});

describe('testoSpesaSalvata (F7)', () => {
  it('aggiunge il saldo, o dice solo "Spesa salvata" se manca', () => {
    expect(n(testoSpesaSalvata(4705, 'Simona'))).toBe('Spesa salvata · Simona ti deve 47,05 €');
    expect(testoSpesaSalvata(null, 'Simona')).toBe('Spesa salvata');
    expect(testoSpesaSalvata(100, null)).toBe('Spesa salvata');
  });
});

describe('anteprimaSpesa (tavola 06)', () => {
  it('a metà: il centesimo dispari resta a chi ha pagato (R4)', () => {
    expect(n(anteprimaSpesa(4730, true, 'a_meta', 'Simona')!.testo)).toBe('Simona ti dovrà 23,65 €');
    expect(n(anteprimaSpesa(1001, true, 'a_meta', 'Simona')!.testo)).toBe('Simona ti dovrà 5,00 €');
  });

  it('pagata dall’altra persona: "Dovrai a…", e il debitore sono io', () => {
    const a = anteprimaSpesa(3800, false, 'a_meta', 'Simona')!;
    expect(n(a.testo)).toBe('Dovrai a Simona 19,00 €');
    expect(a.debitore).toBe('io');
  });

  it('"per l’altra persona": l’intero importo (R3)', () => {
    expect(n(anteprimaSpesa(2000, true, 'per_altra_persona', 'Simona')!.testo)).toBe('Simona ti dovrà 20,00 €');
  });

  it('niente anteprima senza un importo valido e positivo', () => {
    expect(anteprimaSpesa(null, true, 'a_meta', 'Simona')).toBeNull();
    expect(anteprimaSpesa(0, true, 'a_meta', 'Simona')).toBeNull();
    expect(anteprimaSpesa(-450, true, 'a_meta', 'Simona')).toBeNull();
  });
});
