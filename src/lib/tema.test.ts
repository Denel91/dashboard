import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLORE_SFONDO } from './tema';

const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');

describe('colori della barra di Safari', () => {
  it('sono quelli di --sfondo in globals.css, nei due temi', () => {
    const valori = [...css.matchAll(/--sfondo:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase());
    expect(valori).toEqual([COLORE_SFONDO.chiaro, COLORE_SFONDO.scuro]);
  });
});
