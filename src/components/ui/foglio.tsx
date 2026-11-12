'use client';

import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components';

// Foglio dal basso (linee guida sezioni 3 e 10, tavole 08b, 18a–18b, 19a,
// 19d–19e): sale dal basso, opaco `superficie`, angoli in alto
// `rounded-foglio`, maniglia in alto, velo `velo` dietro. React Aria gestisce
// focus bloccato dentro, ritorno del focus, Esc, tocco sul velo e ruoli per
// i lettori di schermo (D22). Il trascinamento in giù per chiudere lo
// aggiungiamo noi, sulla maniglia e sul titolo, solo sotto i 768 px (sezione 10.3).
// Da 768 px diventa una finestra al centro, senza maniglia, che compare con
// una dissolvenza e un leggero ingrandimento (D21, sezione 9.4).

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
  /**
   * Larghezza della finestra da 768 px: `foglio` 480 px (F1, F4, F5, F6),
   * `modulo` 560 px (Nuova spesa e Modifica spesa).
   */
  larghezza?: 'foglio' | 'modulo';
  /** Sopra il titolo, per le conferme e gli avvisi (tavole 17 e 19d): `IconaFoglio`. */
  icona?: ReactNode;
};

const LARGHEZZA = { foglio: 'md:w-foglio', modulo: 'md:w-finestra' } as const;

/** Da 768 px il foglio è una finestra al centro e non si trascina. */
const QUERY_FINESTRA = '(min-width: 48rem)';

export function Foglio({ titolo, children, isOpen, onOpenChange, isDismissable = true, larghezza = 'foglio', icona }: PropsFoglio) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={
        'fixed inset-0 z-50 flex items-end bg-velo md:items-center md:justify-center md:p-6 ' +
        'transition-opacity duration-350 ease-out data-entering:opacity-0 data-exiting:opacity-0 md:duration-200'
      }
    >
      <Modal
        className={
          `w-full outline-hidden transition-foglio duration-350 ease-out ${LARGHEZZA[larghezza]} ` +
          'data-entering:translate-y-full data-exiting:translate-y-full ' +
          // Finestra al centro: dissolvenza e leggero ingrandimento in circa 200 ms (sezione 9.4)
          'md:duration-200 md:data-entering:translate-y-0 md:data-exiting:translate-y-0 ' +
          'md:data-entering:scale-95 md:data-exiting:scale-95 md:data-entering:opacity-0 md:data-exiting:opacity-0 ' +
          // Riduci movimento: niente scorrimento, solo una dissolvenza breve (sezione 5)
          'motion-reduce:data-entering:translate-y-0 motion-reduce:data-exiting:translate-y-0 ' +
          'motion-reduce:data-entering:opacity-0 motion-reduce:data-exiting:opacity-0'
        }
      >
        <Dialog className="outline-hidden">
          {({ close }) => (
            <CorpoFoglio titolo={titolo} icona={icona} chiudi={close} trascinabile={isDismissable}>
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
  icona,
  chiudi,
  trascinabile,
  children,
}: {
  titolo: string;
  icona?: ReactNode;
  chiudi: () => void;
  trascinabile: boolean;
  children: ReactNode;
}) {
  const [spostamento, setSpostamento] = useState(0);
  const [trascinando, setTrascinando] = useState(false);
  const inizio = useRef<number | null>(null);

  function giu(e: PointerEvent<HTMLDivElement>) {
    if (!trascinabile || window.matchMedia(QUERY_FINESTRA).matches) return;
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
        'flex max-h-foglio flex-col rounded-t-foglio bg-superficie shadow-2xl md:max-h-finestra md:rounded-card ' +
        (trascinando ? '' : 'transition-transform duration-200 ease-out')
      }
    >
      {/* Maniglia e titolo: la zona da cui si trascina */}
      <div
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={su}
        className={
          'shrink-0 px-5 pt-2 pb-3 md:px-6 md:pt-5 ' +
          (trascinabile ? 'cursor-grab touch-none active:cursor-grabbing md:cursor-auto md:touch-auto' : '')
        }
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-9 rounded-capsula bg-separatore md:hidden" />
        {icona && <div className="mb-3">{icona}</div>}
        <Heading slot="title" className="text-titolo-2 font-bold text-testo">
          {titolo}
        </Heading>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-sicuro-5 md:px-6 md:pb-6">
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

const TONO_ICONA = {
  pericolo: 'bg-pericolo/12 text-pericolo',
  attenzione: 'bg-budget-attenzione/15 text-budget-attenzione-testo',
} as const;

/**
 * Icona in un quadratino tenue sopra il titolo del foglio (tavole 17 e 19d):
 * rosso per le azioni distruttive (F5), arancione per gli avvisi (F3).
 */
export function IconaFoglio({ tono, children }: { tono: keyof typeof TONO_ICONA; children: ReactNode }) {
  return (
    <span aria-hidden className={`flex size-11 items-center justify-center rounded-campo ${TONO_ICONA[tono]}`}>
      {children}
    </span>
  );
}
