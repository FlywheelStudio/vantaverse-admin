'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/medvanta';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useExerciseTags,
  useSearchTags,
  useSetExerciseTags,
  useTagCategories,
  useUpsertTag,
  tagKeys,
} from '@/hooks/use-tags';
import type { Tag } from '@/lib/supabase/schemas/tags';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ExerciseTagsSectionProps {
  exerciseId: number;
}

/**
 * Category rows + immediate tag assign/remove for an exercise.
 */
export function ExerciseTagsSection({
  exerciseId,
}: ExerciseTagsSectionProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useTagCategories();
  const { data: serverTags = [], isSuccess } = useExerciseTags(exerciseId);
  const [localTags, setLocalTags] = useState<Tag[]>([]);
  const [prevServerTags, setPrevServerTags] = useState(serverTags);
  if (isSuccess && serverTags !== prevServerTags) {
    setPrevServerTags(serverTags);
    setLocalTags(serverTags);
  }
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const upsertTagMutation = useUpsertTag();
  const setTagsMutation = useSetExerciseTags(exerciseId);

  const latestIdsRef = useRef<number[]>([]);
  const latestTagsRef = useRef<Tag[]>([]);
  const rollbackRef = useRef<Tag[] | null>(null);
  const chainRef = useRef(Promise.resolve());

  const tagsByCategory = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const category of categories) {
      map.set(category, []);
    }
    for (const tag of localTags) {
      const list = map.get(tag.category) ?? [];
      list.push(tag);
      map.set(tag.category, list);
    }
    return map;
  }, [categories, localTags]);

  const queuePersist = (nextTags: Tag[], previousTags: Tag[]): void => {
    latestTagsRef.current = nextTags;
    latestIdsRef.current = nextTags.map((tag) => tag.id);
    if (!rollbackRef.current) {
      rollbackRef.current = previousTags;
    }

    chainRef.current = chainRef.current.then(async () => {
      const tagIds = latestIdsRef.current;
      const tagsSnapshot = latestTagsRef.current;
      const rollback = rollbackRef.current;
      rollbackRef.current = null;

      try {
        await setTagsMutation.mutateAsync(tagIds);
        queryClient.setQueryData(tagKeys.exercise(exerciseId), tagsSnapshot);
      } catch {
        if (rollback) {
          setLocalTags(rollback);
          queryClient.setQueryData(tagKeys.exercise(exerciseId), rollback);
        }
      }
    });
  };

  const handleAddTag = (tag: Tag): void => {
    if (localTags.some((existing) => existing.id === tag.id)) {
      setAddingCategory(null);
      return;
    }
    const previous = localTags;
    const next = [...localTags, tag];
    setLocalTags(next);
    setAddingCategory(null);
    queuePersist(next, previous);
  };

  const handleRemoveTag = (tagId: number): void => {
    const previous = localTags;
    const next = localTags.filter((tag) => tag.id !== tagId);
    setLocalTags(next);
    queuePersist(next, previous);
  };

  const handleCreateTag = async (
    category: string,
    name: string,
  ): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'empty') {
      toast.error('Reserved tag name');
      return;
    }

    try {
      const result = await upsertTagMutation.mutateAsync({
        category,
        name: trimmed,
      });
      if (result.is_empty_category) {
        toast.error('Cannot assign empty-category sentinel');
        return;
      }
      handleAddTag({
        id: result.id,
        category: result.category,
        name: result.name,
        created_at: null,
        updated_at: null,
      });
    } catch {
      // toast handled by mutation
    }
  };

  const rows = categories.length > 0 ? categories : Array.from(tagsByCategory.keys());

  return (
    <div>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 4 }}
      >
        <label className="lbl" style={{ margin: 0 }}>
          Tags
        </label>
        <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
          Used for filtering and for building programs
        </span>
      </div>
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 14px',
          background: 'var(--surface-card)',
          marginBottom: 10,
        }}
      >
        {rows.length === 0 ? (
          <div className="mut" style={{ padding: '8px 0', fontSize: 'var(--text-sm)' }}>
            No tag categories yet
          </div>
        ) : (
          rows.map((category) => (
            <CategoryTagRow
              key={category}
              category={category}
              tags={tagsByCategory.get(category) ?? []}
              isAdding={addingCategory === category}
              onStartAdd={() => setAddingCategory(category)}
              onCancelAdd={() => setAddingCategory(null)}
              onSelectTag={handleAddTag}
              onCreateTag={(name) => handleCreateTag(category, name)}
              onRemoveTag={handleRemoveTag}
              excludeIds={localTags.map((tag) => tag.id)}
            />
          ))
        )}
      </div>
      <div className="hint">
        Tags are saved as soon as you add or remove them.
      </div>
    </div>
  );
}

interface TagAddPillProps {
  category: string;
  excludeIds: number[];
  onSelectTag: (tag: Tag) => void;
  onCreateTag: (name: string) => void;
  onClose: () => void;
}

function TagAddPill({
  category,
  excludeIds,
  onSelectTag,
  onCreateTag,
  onClose,
}: TagAddPillProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isFetching } = useSearchTags({
    q: debouncedQuery,
    category,
    limit: 10,
    enabled: true,
  });

  const availableOptions = useMemo(
    () => searchResults.filter((tag) => !excludeIds.includes(tag.id)),
    [searchResults, excludeIds],
  );

  const trimmedQuery = query.trim();
  const exactMatchExists = availableOptions.some(
    (tag) => tag.name.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const showCreateOption =
    trimmedQuery.length > 0 &&
    trimmedQuery.toLowerCase() !== 'empty' &&
    !exactMatchExists;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSelect = (tag: Tag) => {
    onSelectTag(tag);
    onClose();
  };

  const handleCreate = () => {
    if (!trimmedQuery) return;
    if (trimmedQuery.toLowerCase() === 'empty') {
      toast.error('Reserved tag name');
      return;
    }
    onCreateTag(trimmedQuery);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (availableOptions.length > 0) {
        handleSelect(availableOptions[0]);
      } else if (showCreateOption) {
        handleCreate();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 26,
          padding: '0 8px 0 10px',
          background: 'var(--surface-card, #ffffff)',
          border: '1.5px solid var(--accent, #2454ff)',
          borderRadius: 'var(--radius-pill, 9999px)',
          boxShadow: '0 0 0 2px rgba(36,84,255,0.12)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Type tag..."
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 'var(--text-xs, 12px)',
            fontFamily: 'inherit',
            color: 'var(--text-strong)',
            width: 110,
            padding: 0,
          }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Icon name="X" size={12} strokeWidth={2.5} />
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: 180,
            maxWidth: 240,
            background: 'var(--surface-card, #ffffff)',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow:
              '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              padding: '4px',
            }}
          >
            {isFetching && availableOptions.length === 0 && (
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: 'var(--text-xs, 12px)',
                  color: 'var(--text-muted)',
                }}
              >
                Searching...
              </div>
            )}

            {availableOptions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(tag);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  fontSize: 'var(--text-xs, 12px)',
                  color: 'var(--text-strong)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 4px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'var(--slate-100, #f1f5f9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{tag.name}</span>
              </button>
            ))}

            {showCreateOption && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  fontSize: 'var(--text-xs, 12px)',
                  fontWeight: 'var(--fw-medium, 500)',
                  color: 'var(--accent, #2454ff)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 4px)',
                  cursor: 'pointer',
                  borderTop:
                    availableOptions.length > 0
                      ? '1px solid var(--border-subtle, #e2e8f0)'
                      : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'var(--cyan-50, #f0fdfa)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                + Create &quot;{trimmedQuery}&quot;
              </button>
            )}

            {!isFetching &&
              availableOptions.length === 0 &&
              !showCreateOption && (
                <div
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--text-xs, 12px)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {trimmedQuery ? 'No tags found' : 'Type to search or create'}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CategoryTagRowProps {
  category: string;
  tags: Tag[];
  isAdding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onSelectTag: (tag: Tag) => void;
  onCreateTag: (name: string) => void;
  onRemoveTag: (tagId: number) => void;
  excludeIds: number[];
}

function CategoryTagRow({
  category,
  tags,
  isAdding,
  onStartAdd,
  onCancelAdd,
  onSelectTag,
  onCreateTag,
  onRemoveTag,
  excludeIds,
}: CategoryTagRowProps): React.ReactElement {
  return (
    <div className="tagrow">
      <span className="tl">{category}</span>
      <span className="tc">
        {tags.map((tag) => (
          <span key={tag.id} className="tag tag-b">
            {tag.name}
            <button
              type="button"
              aria-label={`Remove ${tag.name}`}
              onClick={() => onRemoveTag(tag.id)}
            >
              <Icon name="X" size={13} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        {isAdding ? (
          <TagAddPill
            category={category}
            excludeIds={excludeIds}
            onSelectTag={onSelectTag}
            onCreateTag={onCreateTag}
            onClose={onCancelAdd}
          />
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              height: 26,
              padding: '0 9px',
              fontSize: 'var(--text-xs)',
            }}
            onClick={onStartAdd}
          >
            <Icon name="Plus" size={13} />
            Add
          </button>
        )}
      </span>
    </div>
  );
}