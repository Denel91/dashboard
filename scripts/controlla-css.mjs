#!/usr/bin/env node
// Controllo dopo `next build` (12 novembre 2026): il CSS prodotto deve
// contenere tutti i token e le utility di src/app/globals.css usati nei
// componenti. Se manca qualcosa la build fallisce e Vercel non pubblica.
//
// Perché: il 12 novembre la produzione è andata online con il CSS di un
// deploy precedente (cache di Turbopack ripristinata da Vercel): barra
// laterale senza larghezza e Nuova spesa grigia, con la build "riuscita".
// Da allora la cache di build è spenta (next.config.ts) e questo controllo
// impedisce che un CSS incompleto arrivi in produzione per qualunque motivo.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const radice = process.cwd();

function file(cartella, filtro) {
  return readdirSync(cartella).flatMap((nome) => {
    const percorso = join(cartella, nome);
    if (statSync(percorso).isDirectory()) return file(percorso, filtro);
    return filtro(nome) ? [percorso] : [];
  });
}

const globals = readFileSync(join(radice, 'src/app/globals.css'), 'utf8');
const css = file(join(radice, '.next/static'), (n) => n.endsWith('.css'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
const sorgenti = file(join(radice, 'src'), (n) => /\.(tsx?)$/.test(n) && !/\.test\.tsx?$/.test(n))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const mancanti = [];

// 1. Ogni token v3 (blocco @theme static) è definito nel CSS
const blocco = globals.match(/@theme static\s*\{([\s\S]*?)\n\}/);
if (!blocco) mancanti.push('blocco @theme static in globals.css');
for (const [, nome] of (blocco?.[1] ?? '').matchAll(/(--[a-z0-9-]+)\s*:/g)) {
  if (!css.includes(`${nome}:`)) mancanti.push(`variabile ${nome}`);
}

// 2. Ogni utility con nome (@utility) usata nei componenti ha la sua regola
for (const [, nome] of globals.matchAll(/@utility\s+([a-z0-9-]+)(-\*)?\s*\{/g)) {
  const usate = new Set(sorgenti.match(new RegExp(`(?<![\\w-])${nome}(?:-\\d+(?:\\.\\d+)?)?(?![\\w-])`, 'g')) ?? []);
  for (const classe of usate) {
    if (!css.includes(classe.replaceAll('.', '\\.'))) mancanti.push(`utility .${classe}`);
  }
}

// 3. Le classi con i token di larghezza e spazio usate nei componenti
for (const [, gruppo, nome] of globals.matchAll(/--(container|spacing)-([a-z0-9-]+)\s*:/g)) {
  const prefissi = gruppo === 'container' ? ['w', 'max-w', 'min-w', '@'] : ['pl', 'pr', 'px', 'left', 'right', 'ml', 'mr'];
  for (const p of prefissi) {
    const classe = p === '@' ? `@${nome}` : `${p}-${nome}`;
    if (new RegExp(`(?<![\\w-])(?:[a-z]+:)*${classe.replace('@', '\\@')}(?![\\w-])`).test(sorgenti) && !css.includes(classe.replace('@', '\\@'))) {
      mancanti.push(`classe ${classe}`);
    }
  }
}

// 4. Le classi CSS scritte in globals.css (macchie, vetro-card…)
for (const nome of ['macchia-accento', 'vetro-card', 'elenco-in-una-card']) {
  if (!css.includes(`.${nome}`)) mancanti.push(`classe .${nome}`);
}

const elenco = [...new Set(mancanti)];
if (elenco.length) {
  console.error('\n✗ Il CSS della build non contiene token o classi di globals.css:');
  for (const m of elenco) console.error(`  - ${m}`);
  console.error('Probabile CSS vecchio da una cache: rifai la build da zero (rm -rf .next).\n');
  process.exit(1);
}
console.log('✓ CSS della build completo: token e utility di globals.css presenti');
