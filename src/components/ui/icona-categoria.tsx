import {
  Bandage,
  Building2,
  BusFront,
  CircleParking,
  Droplet,
  Flame,
  Fuel,
  Gift,
  KeyRound,
  Lightbulb,
  Plane,
  Shirt,
  ShoppingCart,
  Sofa,
  Tag,
  Ticket,
  Tv,
  Utensils,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { iconaCategoria, type IconaCategoria as NomeIcona } from '@/lib/categorie';

// Icona di categoria (linee guida sezioni 3 e 3.1, D24): icona a linea
// bianca dentro un quadratino arrotondato pieno del colore della categoria.
// Il colore viene dal database (tavolozza delle categorie, contrasto con
// l'icona bianca ≥ 3:1), per questo è uno stile e non una classe.
// Un nome fuori elenco mostra `tag`. Il bianco dell'icona è voluto e uguale
// nei due temi: i contrasti della tavolozza sono calcolati su quello.

const ICONE: Record<NomeIcona, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'key-round': KeyRound,
  'building-2': Building2,
  sofa: Sofa,
  lightbulb: Lightbulb,
  flame: Flame,
  droplet: Droplet,
  wifi: Wifi,
  utensils: Utensils,
  fuel: Fuel,
  'bus-front': BusFront,
  'circle-parking': CircleParking,
  wrench: Wrench,
  plane: Plane,
  ticket: Ticket,
  tv: Tv,
  bandage: Bandage,
  shirt: Shirt,
  gift: Gift,
  tag: Tag,
};

/** Solo il disegno dell'icona, per esempio dentro i chip. */
export function SimboloCategoria({ icona, className }: { icona: string; className?: string }) {
  const Icona = ICONE[iconaCategoria(icona)];
  return <Icona aria-hidden strokeWidth={2} className={className ?? 'size-4'} />;
}

const DIMENSIONE = {
  lista: { box: 'size-7 rounded-lg', icona: 'size-4' }, // 28 px nelle liste
  selettore: { box: 'size-8.5 rounded-lg', icona: 'size-5' }, // 34 px nel selettore di 13b
} as const;

export function IconaCategoria({
  icona,
  colore,
  dimensione = 'lista',
}: {
  icona: string;
  colore: string;
  dimensione?: keyof typeof DIMENSIONE;
}) {
  const d = DIMENSIONE[dimensione];
  return (
    <span
      aria-hidden
      style={{ backgroundColor: colore }}
      className={`inline-flex shrink-0 items-center justify-center text-white ${d.box}`}
    >
      <SimboloCategoria icona={icona} className={d.icona} />
    </span>
  );
}
