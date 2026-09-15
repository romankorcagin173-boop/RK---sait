export function RemainingGauge({ volume, remaining }: { volume: number; remaining: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / volume) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.1em] text-ash mb-2">
        <span>Остаток на распив</span>
        <span>
          {remaining} / {volume} мл
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink-soft border hairline overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red to-red-bright transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
