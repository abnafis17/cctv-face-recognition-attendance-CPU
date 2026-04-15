type RelayStatCard = {
  label: string;
  value: string | number;
  tone: string;
};

type RelayStatCardsProps = {
  statCards: RelayStatCard[];
};

export function RelayStatCards({ statCards }: RelayStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border bg-white px-4 py-3 shadow-sm"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {card.label}
          </div>
          <div className={`mt-1 text-2xl font-bold ${card.tone}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
