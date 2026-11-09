'use client';

import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components';

// Foglio dal basso (linee guida sezioni 3 e 10, tavole 08b, 18a–18b, 19a,
// 19d–19e): sale dal basso, opaco `superficie`, angoli in alto
// `rounded-foglio`, maniglia in alto, velo `velo` dietro. React Aria gestisce
// focus bloccato dentro, ritorno del focus, Esc, tocco sul velo e ruoli per
// i lettori di schermo (D22). Il trascinamento in giù per chiudere lo
// aggiungiamo noi, sulla maniglia e sul titolo (sezione 10.3).
// Da 768 px diventerà una finestra al centro (D21, T-23).

/** Oltre questa distanza, lasciando il dito, il foglio si chiude. */
const SOGLIA_CHIUSURA_PX = 110;

type Contenuto = ReactNode | ((azioni: { chiudi: () => void }) => ReactNode);

type PropsFoglio = {
  /** Titolo del foglio: è anche il nome della finestra per i lettori di schermo. */
  titolo: string;
  children: Contenuto;
  /** Stato controllato dall'esterno. Senza, lo gestisce `ApriFoglio`. */
  isOpen?: boolean;
  onOpenChange?: (aperto: boolean) => void;
  /**
   * Chiusura con il tocco sul velo e il trascinamento (predefinito: sì).
   * `false` per i passi in cui bisogna scegliere (F6, cancellazione account).
   */
  isDismissable?: boolean;
};

export function Foglio({ titolo, children, isOpen, onOpenChange, isDismissable = true }: PropsFoglio) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={
        'fixed inset-0 z-50 flex items-end bg-velo ' +
        'transition-opacity duration-350 ease-out data-entering:opacity-0 data-exiting:opacity-0'
      }
    >
      <Modal
        className={
          'w-full outline-hidden transition-[translate,opacity] duration-350 ease-out ' +
          'data-entering:translate-y-full data-exiting:translate-y-full ' +
          // Riduci movimento: niente scorrimento, solo una dissolvenza breve (sezione 5)
          'motion-reduce:data-entering:translate-y-0 motion-reduce:data-exiting:translate-y-0 ' +
          'motion-reduce:data-entering:opacity-0 motion-reduce:data-exiting:opacity-0'
        }
      >
        <Dialog className="outline-hidden">
          {({ close }) => (
            <CorpoFoglio titolo={titolo} chiudi={close} trascinabile={isDismissable}>
              {typeof children === 'function' ? children({ chiudi: close }) : children}
            </CorpoFoglio>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function CorpoFoglio({
  titolo,
  chiudi,
  trascinabile,
  children,
}: {
  titolo: string;
  chiudi: () => void;
  trascinabile: boolean;
  children: ReactNode;
}) {
  const [spostamento, setSpostamento] = useState(0);
  const [trascinando, setTrascinando] = useState(false);
  const inizio = useRef<number | null>(null);

  function giu(e: PointerEvent<HTMLDivElement>) {
    if (!trascinabile) return;
    inizio.current = e.clientY;
    setTrascinando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function muovi(e: PointerEvent<HTMLDivElement>) {
    if (inizio.current === null) return;
    setSpostamento(Math.max(0, e.clientY - inizio.current));
  }
  function su() {
    if (inizio.current === null) return;
    inizio.current = null;
    setTrascinando(false);
    if (spostamento > SOGLIA_CHIUSURA_PX) chiudi();
    else setSpostamento(0);
  }

  return (
    <div
      style={spostamento ? { transform: `translateY(${spostamento}px)` } : undefined}
      className={
        'flex max-h-[92dvh] flex-col rounded-t-foglio bg-superficie shadow-2xl ' +
        (trascinando ? '' : 'transition-transform duration-200 ease-out')
      }
    >
      {/* Maniglia e titolo: la zona da cui si trascina */}
      <div
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={su}
        className={'shrink-0 px-5 pt-2 pb-3 ' + (trascinabile ? 'cursor-grab touch-none active:cursor-grabbing' : '')}
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-9 rounded-capsula bg-separatore" />
        <Heading slot="title" className="text-titolo-2 font-bold text-testo">
          {titolo}
        </Heading>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}

/**
 * Collega un pulsante al foglio senza stato da gestire:
 * <ApriFoglio><PulsantePrincipale>Segna come saldato</PulsantePrincipale><Foglio …/></ApriFoglio>
 */
export function ApriFoglio({ children }: { children: [ReactNode, ReactNode] }) {
  return <DialogTrigger>{children}</DialogTrigger>;
}
