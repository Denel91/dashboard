import { describe, expect, it } from 'vitest';
import { destinazioneSicura } from './destinazione';

describe('destinazioneSicura: dopo l\'accesso si resta dentro l\'app', () => {
  it.each([
    ['/', '/'],
    ['/spese', '/spese'],
    ['/spese?mese=2026-11&categoria=spesa', '/spese?mese=2026-11&categoria=spesa'],
    ['/invito/3f9c2a', '/invito/3f9c2a'],
  ])('"%s" → "%s"', (next, atteso) => {
    expect(destinazioneSicura(next)).toBe(atteso);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['https://sito-falso.it'],
    ['//sito-falso.it'],
    ['/\\sito-falso.it'],
    ['spese'],
    ['javascript:alert(1)'],
    ['/accesso'],
    ['/accesso?next=/spese'],
    ['/auth/callback'],
  ])('"%s" → "/"', (next) => {
    expect(destinazioneSicura(next)).toBe('/');
  });
});
