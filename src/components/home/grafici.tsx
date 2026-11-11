// Piccoli grafici della Home sul computer (tavola C1 v2): l'anello "pagato
// da te" nella card del saldo e il mini grafico dei riquadri numerici.
// SVG senza librerie, colorati con currentColor: il colore lo dà chi li usa
// (`su-persona` sulla card piena, `accento` nei riquadri). Mai verde o
// rosso: sono del budget (D17). Sono decorativi: i numeri sono scritti
// accanto, e i lettori di schermo leggono quelli.

/** Anello con la percentuale in mezzo: "57% · pagato da te". */
export function Anello({ percentuale, etichetta }: { percentuale: number; etichetta: string }) {
  const r = 40;
  const giro = 2 * Math.PI * r;
  return (
    <div className="relative size-44 shrink-0">
      <svg viewBox="0 0 100 100" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(giro * percentuale) / 100} ${giro}`}
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="importo text-titolo-2 font-bold">{percentuale}%</span>
        <span className="text-nota">{etichetta}</span>
      </p>
    </div>
  );
}

/** Mini grafico a linea, con un punto sull'ultimo valore. */
export function MiniGrafico({ valori }: { valori: number[] }) {
  if (valori.length < 2) return null;
  const min = Math.min(...valori);
  const max = Math.max(...valori);
  const salto = max - min || 1;
  const punti = valori.map((v, i) => [(i / (valori.length - 1)) * 92 + 4, 28 - ((v - min) / salto) * 24] as const);
  const [ux, uy] = punti[punti.length - 1];
  return (
    <svg viewBox="0 0 100 32" aria-hidden="true" className="h-8 w-24 shrink-0 text-accento">
      <polyline
        points={punti.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={ux} cy={uy} r="2.5" fill="currentColor" />
    </svg>
  );
}
