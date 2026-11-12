// Sfondo del computer (D23, linee guida sezione 9.8): tre macchie morbide e
// sfocate dei nostri colori (accento, persona-b, persona-a) al 30%, dietro a
// tutto. Solo da 1024 px: sul telefono e nella fascia md lo sfondo resta
// `sfondo` piatto. Niente foto. Elemento decorativo, nascosto ai lettori di
// schermo e ai clic. Posizioni, misure e sfocatura: classi .macchia in
// globals.css.

export function SfondoSfumato() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden lg:block">
      <div className="macchia macchia-accento" />
      <div className="macchia macchia-persona-b" />
      <div className="macchia macchia-persona-a" />
    </div>
  );
}
