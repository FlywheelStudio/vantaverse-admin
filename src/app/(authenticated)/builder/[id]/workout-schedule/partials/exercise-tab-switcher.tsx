'use client';

export type TabType = 'library' | 'templates' | 'groups' | 'default-values';

interface ExerciseTabSwitcherProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'templates', label: 'Templates' },
  { id: 'groups', label: 'Groups' },
  { id: 'default-values', label: 'Default Values' },
];

export function ExerciseTabSwitcher({
  activeTab,
  onTabChange,
}: ExerciseTabSwitcherProps): React.ReactElement {
  return (
    <div className="tabs" style={{ marginBottom: 14 }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'on' : undefined}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
