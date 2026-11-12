import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Definition of Done (linee guida, sezione 8): nei componenti niente valori
// scritti a mano. Colori, raggi, ombre, sfocature, larghezze e calcoli con
// i bordi sicuri stanno in src/app/globals.css come token (@theme) o come
// utility con un nome (@utility); i componenti usano solo i loro nomi.
// Questo test fa fallire la CI se un valore arbitrario torna nel codice.

const SRC = join(__dirname, '..');

// Gli unici file con colori scritti: la tavolozza delle categorie (la usa
// anche il database, D24) e i colori della barra di Safari, che il <meta>
// non può leggere dalle variabili CSS (un test li confronta con globals.css)
const ECCEZIONI_COLORI = ['lib/categorie.ts', 'lib/tema.ts'];

function fileSorgente(cartella: string): string[] {
  return readdirSync(cartella).flatMap((nome) => {
    const percorso = join(cartella, nome);
    if (statSync(percorso).isDirectory()) return fileSorgente(percorso);
    return /\.(tsx?|mts)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [percorso] : [];
  });
}

// Classe Tailwind con un valore tra parentesi quadre: w-[480px],
// md:shadow-[…], supports-[…]:, @min-[30rem]:, oppure una proprietà
// arbitraria come [field-sizing:content]
const CLASSE_ARBITRARIA = /(?<![\w$])(?:@?[a-z][\w-]*(?::[\w@-]+)*-\[[^\]\s'"`]+\]|\[[a-z-]+:[^\]\s'"`]+\])/g;
const COLORE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

/** Solo il testo tra virgolette: le classi stanno nelle stringhe, non nelle espressioni regolari. */
function stringhe(codice: string): string[] {
  return [...codice.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g)].map((m) => m[0]);
}

const tutti = fileSorgente(SRC);

describe('niente valori scritti a mano', () => {
  it('nessuna classe Tailwind con valori arbitrari', () => {
    const trovati = tutti.flatMap((f) =>
      stringhe(readFileSync(f, 'utf8')).flatMap((s) => (s.match(CLASSE_ARBITRARIA) ?? []).map((c) => `${relative(SRC, f)}: ${c}`)),
    );
    expect(trovati).toEqual([]);
  });

  it('nessun colore scritto fuori dalla tavolozza delle categorie e dal tema', () => {
    const trovati = tutti
      .filter((f) => !ECCEZIONI_COLORI.includes(relative(SRC, f).replaceAll('\\', '/')))
      .flatMap((f) => (readFileSync(f, 'utf8').match(COLORE) ?? []).map((c) => `${relative(SRC, f)}: ${c}`));
    expect(trovati).toEqual([]);
  });
});
