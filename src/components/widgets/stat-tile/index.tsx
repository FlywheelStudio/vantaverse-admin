import { Sparkline } from '../sparkline';
import { StatTileUi } from './ui';

function trendIconName(trend?: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return 'TrendingUp';
  if (trend === 'down') return 'TrendingDown';
  return 'Minus';
}

export function StatTile({
  label,
  value,
  delta,
  trend,
  icon,
  footer,
  spark,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: string;
  footer?: string;
  spark?: number[];
}): React.ReactElement {
  const sparkSlot =
    spark?.length ? (
      <div className="spk">
        <Sparkline values={spark} />
      </div>
    ) : null;

  return (
    <StatTileUi
      label={label}
      value={value}
      delta={delta}
      trendIcon={delta ? trendIconName(trend) : undefined}
      icon={icon}
      footer={footer}
      sparkSlot={sparkSlot}
    />
  );
}
