// Schermate di ingresso (US-02: crea nucleo, link d'invito, invito ricevuto).
// Come la pagina di accesso: sfondo sfumato e niente barre di navigazione.
// Sul telefono il contenuto occupa lo schermo, con i pulsanti nella metà
// bassa; da 768 px sta in una card larga 440 px al centro (linee guida 9.3).
export default function LayoutIngresso({ children }: LayoutProps<'/'>) {
  return (
    <main className="flex min-h-dvh flex-col bg-linear-to-b from-accento-tenue/60 via-sfondo to-persona-b-tenue/50 px-4 pt-sicuro-12 pb-sicuro-6 md:items-center md:justify-center md:py-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-ingresso md:flex-none md:rounded-card md:bg-superficie md:p-8 md:shadow-galleggiante">
        {children}
      </div>
    </main>
  );
}
