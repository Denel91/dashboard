// Classi di spazio per il layout, lette anche dai Server Components.
// Stanno qui e non nei file "use client" delle barre: una costante esportata
// da un file client, letta sul server, diventa un riferimento e non il testo
// della classe.

/**
 * Spazio in fondo alle pagine con la barra in basso (sotto i 768 px), perché
 * l'ultimo contenuto non finisca sotto il vetro: 60 px di barra + 12 px di
 * margine + 16 px di respiro, più il bordo sicuro dell'iPhone.
 */
export const SPAZIO_BARRA_IN_BASSO = 'pb-sopra-barra md:pb-8';

/** Spazio a sinistra per la barra laterale: 88 px compatta (md), 260 + 16 + 16 px galleggiante (lg). */
export const SPAZIO_BARRA_LATERALE = 'md:pl-22 lg:pl-accanto-barra';
