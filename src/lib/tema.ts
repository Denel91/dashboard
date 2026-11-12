// Colori della barra di Safari (<meta name="theme-color">): il <meta> non
// legge le variabili CSS, quindi qui ci sono i valori di --sfondo nei due
// temi. Il test tema.test.ts controlla che coincidano con globals.css.
export const COLORE_SFONDO = { chiaro: '#f2f2f7', scuro: '#000000' } as const;
