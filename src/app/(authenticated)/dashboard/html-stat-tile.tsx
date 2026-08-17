import { Icon } from '@/components/medvanta';
import { HtmlSparkline } from './html-sparkline';

export function HtmlStatTile({
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
            <Icon
              name={
                trend === 'up'
                  ? 'TrendingUp'
                  : trend === 'down'
                    ? 'TrendingDown'
                    : 'Minus'
              }
              size={15}
            />
            {delta}
          </span>
        ) : null}
      </div>
      {footer ? <div className="foot">{footer}</div> : null}
      {spark?.length ? (
        <div className="spk">
          <HtmlSparkline values={spark} />
        </div>
      ) : null}
    </div>
  );
}
