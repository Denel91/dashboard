'use client';

import { PulsantePrincipale } from '@/components/ui';

// Errore imprevisto in una pagina (per esempio il database non risponde).
// Il dettaglio va nei log del server; qui solo un messaggio e "Riprova".
export default function Errore({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-titolo-1 text-testo">Qualcosa non ha funzionato</h1>
        <p className="mt-2 text-corpo text-testo-secondario">
          Non riesco a caricare questa pagina. Controlla la connessione e riprova tra poco.
        </p>
      </div>
      <PulsantePrincipale onPress={() => reset()}>Riprova</PulsantePrincipale>
    </main>
  );
}
