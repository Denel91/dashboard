// Sfondo del computer (D23, linee guida sezione 9.8): tre macchie morbide e
// sfocate dei nostri colori (accento, persona-b, persona-a) al 30%, dietro a
// tutto. Solo da 1024 px: sul telefono e nella fascia md lo sfondo resta
// `sfondo` piatto. Niente foto. Elemento decorativo, nascosto ai lettori di
// schermo e ai clic.

export function SfondoSfumato() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden lg:block">
      <div className="absolute -top-40 left-[18%] size-[640px] rounded-full bg-accento/30 blur-[120px]" />
      <div className="absolute top-[30%] -right-40 size-[600px] rounded-full bg-persona-b/30 blur-[120px]" />
      <div className="absolute -bottom-48 left-[40%] size-[560px] rounded-full bg-persona-a/30 blur-[120px]" />
    </div>
  );
}
