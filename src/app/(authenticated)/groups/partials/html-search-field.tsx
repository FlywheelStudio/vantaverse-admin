'use client';

import { Icon } from '@/components/medvanta';

interface HtmlSearchFieldProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** HTML `.fld.grow` search input matching scGroups/scGroupDetail toolbar. */
export function HtmlSearchField({
  placeholder,
  value,
  onChange,
  className,
}: HtmlSearchFieldProps): React.ReactElement {
  return (
    <span className={className ?? 'fld grow'}>
      <Icon name="Search" size={16} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}
