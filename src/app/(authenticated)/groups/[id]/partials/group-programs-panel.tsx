'use client';

import { HtmlSearchField } from '../../partials/html-search-field';
import { HtmlTableFooter } from '../../partials/html-table-footer';
import { Icon } from '@/components/medvanta';
import { useMemo, useState } from 'react';

interface GroupProgramRow {
  name: string;
  memberCount: number;
}

interface GroupProgramsPanelProps {
  programs: GroupProgramRow[];
  groupName: string;
}

/** Programs tab — aggregates member program assignments (basics only). */
export function GroupProgramsPanel({
  programs,
  groupName,
}: GroupProgramsPanelProps): React.ReactElement {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(term));
  }, [programs, search]);

  return (
    <>
      <div className="tbar">
        <HtmlSearchField
          placeholder="Search programs in this group…"
          value={search}
          onChange={setSearch}
        />
        <button type="button" className="btn btn-sec" disabled title="Filters not available">
          <Icon name="Funnel" size={16} />
          Filters
        </button>
        <span className="sp">
          <button type="button" className="btn btn-pri" disabled title="Assign program not available">
            <Icon name="Plus" size={17} />
            Assign a program
          </button>
        </span>
      </div>

      <div className="tw">
        <table className="tbl">
          <thead>
            <tr>
              <th>Program</th>
              <th>Members on it</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((program) => (
                <tr key={program.name}>
                  <td>
                    <div className="cellp">
                      <span
                        className="thmb gr"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background:
                            'linear-gradient(140deg,var(--navy-800),var(--navy-600))',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: '0 0 auto',
                        }}
                      >
                        <Icon
                          name="ClipboardList"
                          size={17}
                          style={{ color: 'rgba(255,255,255,.9)' }}
                        />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="nm" style={{ display: 'block' }}>
                          {program.name}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {program.memberCount}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  No programs assigned in this group yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <HtmlTableFooter
          summary={
            <>
              {filtered.length} program{filtered.length === 1 ? '' : 's'} in {groupName}
            </>
          }
          page={1}
          pageCount={1}
          onPageChange={() => undefined}
        />
      </div>
    </>
  );
}
