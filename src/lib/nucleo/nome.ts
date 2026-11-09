/** Nome dell'account Google, per precompilare "Il tuo nome" (tavole 02a e 03b). */
export function nomeDaAccountGoogle(metadati: Record<string, unknown> | undefined): string {
  const nome = metadati?.full_name ?? metadati?.name;
  if (typeof nome !== 'string') return '';
  // Solo il nome di battesimo: "Daniele Di Salvo" → "Daniele" (si può cambiare)
  return nome.trim().split(/\s+/)[0]?.slice(0, 40) ?? '';
}
