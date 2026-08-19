import { Icon } from '@/components/medvanta';

/** Disabled filter selects matching HTML `selEl()` placeholders. */
export function DashboardAppBarActionsUi(): React.ReactElement {
  return (
    <>
      <span className="sel">
        <select disabled defaultValue="All groups" aria-label="Group filter">
          <option>All groups</option>
        </select>
        <span className="ci">
          <Icon name="ChevronDown" size={16} />
        </span>
      </span>
      <span className="sel">
        <select disabled defaultValue="Last 30 days" aria-label="Date range">
          <option>Last 30 days</option>
        </select>
        <span className="ci">
          <Icon name="ChevronDown" size={16} />
        </span>
      </span>
    </>
  );
}
