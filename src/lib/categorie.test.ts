import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATEGORIE_PREDEFINITE,
  COLORI_CATEGORIA,
  FAMIGLIE,
  ICONE_CATEGORIA,
  iconaCategoria,
  schemaCategoria,
} from './categorie';

// La migrazione è la fonte delle categorie predefinite: qui si controlla
// che l'elenco dell'app sia lo stesso (nome, icona, colore, ordine)
const migrazione = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261109210000_categorie_predefinite.sql'),
  'utf8',
);
const righe = [...migrazione.matchAll(/\('([^']+)',\s*'([a-z0-9-]+)',\s*'(#[0-9a-f]{6})',\s*(\d+)\)/g)].map(
  ([, nome, icona, colore, ordine]) => ({ nome, icona, colore, ordine: Number(ordine) }),
);

describe('categorie predefinite (T-21, D24)', () => {
  it('sono 20, come nella migrazione e nello stesso ordine', () => {
    expect(CATEGORIE_PREDEFINITE).toHaveLength(20);
    expect(righe).toHaveLength(20);
    CATEGORIE_PREDEFINITE.forEach((c, i) => {
      expect(righe[i]).toEqual({ nome: c.nome, icona: c.icona, colore: FAMIGLIE[c.famiglia].colore, ordine: i + 1 });
    });
  });

  it('usano solo icone e colori ammessi, con nomi diversi', () => {
    const nomi = new Set(CATEGORIE_PREDEFINITE.map((c) => c.nome.toLowerCase()));
    expect(nomi.size).toBe(20);
    CATEGORIE_PREDEFINITE.forEach((c) => expect(ICONE_CATEGORIA).toContain(c.icona));
  });

  it('hanno un colore per famiglia, 8 in tutto (mai blu o rosa delle persone)', () => {
    expect(new Set(COLORI_CATEGORIA).size).toBe(8);
    expect(COLORI_CATEGORIA).not.toContain('#1d63d8');
    expect(COLORI_CATEGORIA).not.toContain('#cc1c78');
  });

  it('mettono Spesa per prima e Altro per ultima', () => {
    expect(CATEGORIE_PREDEFINITE[0].nome).toBe('Spesa');
    expect(CATEGORIE_PREDEFINITE.at(-1)?.nome).toBe('Altro');
  });
});

describe('iconaCategoria', () => {
  it('restituisce l’icona salvata se è in elenco, altrimenti tag', () => {
    expect(iconaCategoria('sofa')).toBe('sofa');
    expect(iconaCategoria('rocket')).toBe('tag');
    expect(iconaCategoria('🛒')).toBe('tag');
  });
});

describe('schemaCategoria', () => {
  it('accetta una categoria valida e porta il colore in minuscolo', () => {
    const r = schemaCategoria.safeParse({ nome: ' Palestra ', icona: 'ticket', colore: '#009C93' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ nome: 'Palestra', icona: 'ticket', colore: '#009c93' });
  });

  it('rifiuta icone e colori fuori elenco e nomi vuoti', () => {
    expect(schemaCategoria.safeParse({ nome: 'X', icona: 'rocket', colore: '#009c93' }).success).toBe(false);
    expect(schemaCategoria.safeParse({ nome: 'X', icona: 'tag', colore: '#1d63d8' }).success).toBe(false);
    expect(schemaCategoria.safeParse({ nome: '  ', icona: 'tag', colore: '#8b8b91' }).success).toBe(false);
  });
});

describe('icone ammesse', () => {
  it('esistono tutte in lucide-react', async () => {
    const lucide = (await import('lucide-react')) as Record<string, unknown>;
    const pascal = (n: string) => n.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
    ICONE_CATEGORIA.forEach((nome) => expect(lucide[pascal(nome)], nome).toBeDefined());
  });
});
