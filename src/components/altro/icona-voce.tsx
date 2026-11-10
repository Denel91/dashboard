import { HandCoins, History, Settings, Trash2, Wallet, type LucideIcon } from 'lucide-react';
import type { PaginaAltro } from '@/lib/altro';

// Quadratino colorato con l'icona bianca, accanto alle voci di Altro
// (tavola 09). Stesse misure dell'icona di categoria nelle liste (28 px) e
// stesse icone della barra laterale (D23), così la voce si riconosce ovunque.

export type VoceAltro = PaginaAltro['slug'] | 'impostazioni';

const ICONE: Record<VoceAltro, LucideIcon> = {
  cronologia: History,
  cestino: Trash2,
  'da-riavere': HandCoins,
  categorie: Wallet,
  impostazioni: Settings,
};

export function IconaVoceAltro({ voce, colore }: { voce: VoceAltro; colore: 'accento' | 'neutro' | string }) {
  const Icona = ICONE[voce];
  const classe = colore === 'accento' ? 'bg-accento' : colore === 'neutro' ? 'bg-testo-secondario' : '';
  const stile = colore === 'accento' || colore === 'neutro' ? undefined : { backgroundColor: colore };
  return (
    <span aria-hidden="true" style={stile} className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-white ${classe}`}>
      <Icona strokeWidth={2} className="size-4" />
    </span>
  );
}
