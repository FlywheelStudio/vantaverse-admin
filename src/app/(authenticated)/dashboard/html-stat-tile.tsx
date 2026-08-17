import { Icon } from '@/components/medvanta';

export interface HtmlStatTileProps {
  label: string;
  value: string;
  icon: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  foot?: string;
}

/** HTML `.stat` KPI tile from `statTile()`. */
export function HtmlStatTile({
  label,
  value,
  icon,
  delta,
  trend,
  foot,
}: HtmlStatTileProps): React.ReactElement {
  const trendIcon =
    trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus';

  return (
    <div className="stat">
      <div className="top">
        <span className="lb">{label}</span>
        <span className="ic">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="mid">
        <span className="v">{value}</span>
        {delta ? (
          <span className="d">
            <Icon name={trendIcon} size={15} />
            {delta}
          </span>
        ) : null}
      </div>
      {foot ? <div className="foot">{foot}</div> : null}
    </div>
  );
}
