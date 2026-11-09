import { z } from 'zod';

// Icone e colori ammessi per le categorie (linee guida, sezione 3.1; D18, D24).
// Il database controlla solo la forma del nome dell'icona e del colore:
// l'elenco vero è questo. Aggiungere un'icona non richiede una migrazione.
//
// D24: il COLORE dice la famiglia (casa, utenze, trasporti…), l'ICONA la voce.

/** Le 8 famiglie e il loro colore (tavolozza delle categorie, contrasto verificato). */
export const FAMIGLIE = {
  spesa: { nome: 'Spesa', colore: '#299f47' }, // verde
  casa: { nome: 'Casa', colore: '#a2845e' }, // marrone
  utenze: { nome: 'Utenze', colore: '#af8404' }, // giallo
  ristoranti: { nome: 'Ristoranti', colore: '#cc7700' }, // arancione
  trasporti: { nome: 'Trasporti', colore: '#2a98ac' }, // azzurro
  tempoLibero: { nome: 'Tempo libero', colore: '#009c93' }, // menta
  persona: { nome: 'Persona', colore: '#ff4838' }, // corallo
  altro: { nome: 'Altro', colore: '#8b8b91' }, // grigio, anche il predefinito del database
} as const;

export type Famiglia = keyof typeof FAMIGLIE;

/** Colori ammessi, nell'ordine del selettore della tavola 13b. */
export const COLORI_CATEGORIA = Object.values(FAMIGLIE).map((f) => f.colore);

/**
 * Icone ammesse (nomi della libreria Lucide), nell'ordine del selettore.
 * `tag` è anche l'icona di riserva per un nome che non è in elenco.
 */
export const ICONE_CATEGORIA = [
  'shopping-cart',
  'key-round',
  'building-2',
  'sofa',
  'lightbulb',
  'flame',
  'droplet',
  'wifi',
  'utensils',
  'fuel',
  'bus-front',
  'circle-parking',
  'wrench',
  'plane',
  'ticket',
  'tv',
  'bandage',
  'shirt',
  'gift',
  'tag',
] as const;

export type IconaCategoria = (typeof ICONE_CATEGORIA)[number];

export const ICONA_DI_RISERVA: IconaCategoria = 'tag';

/** Le 20 categorie predefinite (T-21), nello stesso ordine della migrazione. */
export const CATEGORIE_PREDEFINITE: ReadonlyArray<{
  nome: string;
  icona: IconaCategoria;
  famiglia: Famiglia;
}> = [
  { nome: 'Spesa', icona: 'shopping-cart', famiglia: 'spesa' },
  { nome: 'Ristoranti e bar', icona: 'utensils', famiglia: 'ristoranti' },
  { nome: 'Mezzi pubblici', icona: 'bus-front', famiglia: 'trasporti' },
  { nome: 'Carburante', icona: 'fuel', famiglia: 'trasporti' },
  { nome: 'Arredamento', icona: 'sofa', famiglia: 'casa' },
  { nome: 'Svago', icona: 'ticket', famiglia: 'tempoLibero' },
  { nome: 'Salute', icona: 'bandage', famiglia: 'persona' },
  { nome: 'Abbigliamento', icona: 'shirt', famiglia: 'persona' },
  { nome: 'Affitto', icona: 'key-round', famiglia: 'casa' },
  { nome: 'Condominio', icona: 'building-2', famiglia: 'casa' },
  { nome: 'Luce', icona: 'lightbulb', famiglia: 'utenze' },
  { nome: 'Gas', icona: 'flame', famiglia: 'utenze' },
  { nome: 'Acqua', icona: 'droplet', famiglia: 'utenze' },
  { nome: 'Internet e telefono', icona: 'wifi', famiglia: 'utenze' },
  { nome: 'Pedaggi e parcheggi', icona: 'circle-parking', famiglia: 'trasporti' },
  { nome: 'Auto', icona: 'wrench', famiglia: 'trasporti' },
  { nome: 'Viaggi', icona: 'plane', famiglia: 'tempoLibero' },
  { nome: 'Abbonamenti', icona: 'tv', famiglia: 'tempoLibero' },
  { nome: 'Regali', icona: 'gift', famiglia: 'persona' },
  { nome: 'Altro', icona: 'tag', famiglia: 'altro' },
];

/** Quante categorie mostra Nuova spesa prima di "Altre categorie" (usabilità, K1). */
export const CATEGORIE_IN_EVIDENZA = 8;

/** Icona da mostrare: quella salvata se è in elenco, altrimenti `tag`. */
export function iconaCategoria(nome: string): IconaCategoria {
  return (ICONE_CATEGORIA as readonly string[]).includes(nome) ? (nome as IconaCategoria) : ICONA_DI_RISERVA;
}

/** Validazione di una categoria creata o modificata dall'app (US-19). */
export const schemaCategoria = z.object({
  nome: z.string().trim().min(1, 'Scrivi un nome.').max(40, 'Al massimo 40 caratteri.'),
  icona: z.enum(ICONE_CATEGORIA, { error: 'Scegli un’icona dall’elenco.' }),
  colore: z
    .string()
    .transform((c) => c.toLowerCase())
    .refine((c) => (COLORI_CATEGORIA as readonly string[]).includes(c), 'Scegli un colore dall’elenco.'),
});
