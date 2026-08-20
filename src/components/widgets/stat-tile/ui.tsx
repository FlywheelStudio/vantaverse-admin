import { Icon } from '@/components/medvanta';

interface StatTileUiProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trendIcon?: string;
  icon: string;
  footer?: string;
  sparkSlot?: React.ReactNode;
}

/** HTML `.stat` KPI tile used on the dashboard grid. */
export function StatTileUi({
  label,
  value,
  delta,
  trendIcon,
  icon,
  footer,
  sparkSlot,
}: StatTileUiProps): React.ReactElement {
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
            {trendIcon ? <Icon name={trendIcon} size={15} /> : null}
            {delta}
          </span>
        ) : null}
      </div>
      {footer ? <div className="foot">{footer}</div> : null}
      {sparkSlot}
    </div>
  );
}
