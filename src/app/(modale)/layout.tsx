import { RegioneAvvisi, SfondoSfumato } from '@/components/ui';

// Schermate modali (Nuova spesa 06; poi Modifica spesa 07 sotto 1024 px):
// - telefono: a tutto schermo, opache, senza barra in basso (linee guida 3);
// - da 768 px: finestra al centro larga 560 px e alta al massimo l'85% della
//   finestra, col contenuto che scorre dentro, sopra lo sfondo con il velo
//   (sezione 9.4, tavola C3).
export default function LayoutModale({ children }: LayoutProps<'/'>) {
  return (
    <>
      <div className="hidden md:block">
        <SfondoSfumato />
      </div>
      <main className="min-h-dvh bg-superficie md:flex md:items-center md:justify-center md:bg-velo md:p-8">
        <div className="md:max-h-finestra md:w-finestra md:overflow-y-auto md:rounded-card md:bg-superficie md:shadow-2xl">
          {children}
        </div>
      </main>
      <RegioneAvvisi />
    </>
  );
}
