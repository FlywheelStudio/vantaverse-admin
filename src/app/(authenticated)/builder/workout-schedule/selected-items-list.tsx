'use client';

import { useState, useCallback } from 'react';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type {
  ExerciseTemplate,
  Group,
} from '@/lib/supabase/schemas/exercise-templates';
import { cn } from '@/lib/utils';
import { SelectedItemComponent } from './selected-item';
import { SelectedGroupComponent } from './selected-group';
import {
  TemplateConfig,
  TemplateConfigOffsets,
} from '../template-config/template-config';
import { upsertExerciseTemplate } from '@/app/(authenticated)/builder/actions';
import toast from 'react-hot-toast';

type SelectedItem =
  | { type: 'exercise'; data: Exercise }
  | { type: 'template'; data: ExerciseTemplate }
  | {
      type: 'group';
      data: Group;
    };

interface SelectedItemsListProps {
  items: SelectedItem[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: SelectedItem) => void;
  onItemsReorder: (items: SelectedItem[]) => void;
  onRemoveGroup?: (index: number) => void;
  onToggleSuperset?: (index: number) => void;
}

export function SelectedItemsList({
  items,
  onRemove,
  onUpdate,
  onItemsReorder,
  onRemoveGroup,
  onToggleSuperset,
}: SelectedItemsListProps) {
  const [modalState, setModalState] = useState<{
    open: boolean;
    position: { x: number; y: number };
    item: Exclude<SelectedItem, { type: 'group' }> | null;
    itemIndex: number | null;
    groupIndex?: number | null;
    groupItemIndex?: number | null;
  }>({
    open: false,
    position: { x: 0, y: 0 },
    item: null,
    itemIndex: null,
    groupIndex: null,
    groupItemIndex: null,
  });

  const [copiedTemplateData, setCopiedTemplateData] =
    useState<Partial<ExerciseTemplate> | null>(null);

  const handleItemClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      const item = items[index];
      if (!item || item.type === 'group') return;

      setModalState({
        open: true,
        position: {
          x: event.clientX - TemplateConfigOffsets.x,
          y: event.clientY - TemplateConfigOffsets.y,
        },
        item,
        itemIndex: index,
      });
    },
    [items],
  );

  const handleCloseModal = useCallback(() => {
    setModalState({
      open: false,
      position: { x: 0, y: 0 },
      item: null,
      itemIndex: null,
      groupIndex: null,
      groupItemIndex: null,
    });
  }, []);

  const handleSave = useCallback(
    async (templateData: Partial<ExerciseTemplate>) => {
      if (
        (modalState.itemIndex === null && modalState.groupIndex === null) ||
        !modalState.item
      )
        return;

      const currentItem = modalState.item;

      // Handle group item update
      if (
        modalState.groupIndex !== null &&
        modalState.groupIndex !== undefined &&
        modalState.groupItemIndex !== null &&
        modalState.groupItemIndex !== undefined
      ) {
        const group = items[modalState.groupIndex];
        if (group && group.type === 'group') {
          const groupItem = group.data.items[modalState.groupItemIndex];
          if (groupItem && groupItem.type === 'template') {
            const exerciseId = groupItem.data.exercise_id;
            const optimisticTemplate: ExerciseTemplate = {
              ...groupItem.data,
              ...templateData,
            } as ExerciseTemplate;

            // Update group item
            const updatedGroupItems = [...group.data.items];
            updatedGroupItems[modalState.groupItemIndex] = {
              type: 'template',
              data: optimisticTemplate,
            };

            const updatedGroup: SelectedItem = {
              type: 'group',
              data: {
                ...group.data,
                items: updatedGroupItems,
              },
            };

            // Optimistic update
            const newItems = [...items];
            newItems[modalState.groupIndex] = updatedGroup;
            onItemsReorder(newItems);

            try {
              const rpcParams: Parameters<typeof upsertExerciseTemplate>[0] = {
                p_exercise_id: exerciseId,
                p_sets: templateData.sets ?? undefined,
                p_rep: templateData.rep ?? undefined,
                p_time: templateData.time ?? undefined,
                p_distance: templateData.distance ?? undefined,
                p_weight: templateData.weight ?? undefined,
                p_rest_time: templateData.rest_time ?? undefined,
                p_rep_override: templateData.rep_override ?? undefined,
                p_time_override: templateData.time_override ?? undefined,
                p_distance_override:
                  templateData.distance_override ?? undefined,
                p_weight_override: templateData.weight_override ?? undefined,
                p_rest_time_override:
                  templateData.rest_time_override ?? undefined,
                p_equipment_ids: templateData.equipment_ids ?? undefined,
                p_notes: templateData.notes ?? undefined,
              };

              const result = await upsertExerciseTemplate(rpcParams);

              if (!result.success) {
                // Revert on error
                onItemsReorder(items);
                toast.error(result.error || 'Failed to save exercise template');
                return;
              }

              const responseData = result.data as {
                id: string;
                template_hash: string;
              };

              const finalTemplate: ExerciseTemplate = {
                ...optimisticTemplate,
                id: responseData.id,
                template_hash: responseData.template_hash,
              };

              const finalGroupItems = [...updatedGroupItems];
              finalGroupItems[modalState.groupItemIndex] = {
                type: 'template',
                data: finalTemplate,
              };

              const finalGroup: SelectedItem = {
                type: 'group',
                data: {
                  ...group.data,
                  items: finalGroupItems,
                },
              };

              const finalItems = [...items];
              finalItems[modalState.groupIndex] = finalGroup;
              onItemsReorder(finalItems);
            } catch (error) {
              onItemsReorder(items);
              console.error('Error saving exercise template:', error);
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Failed to save exercise template',
              );
            }
          }
        }
        return;
      }

      // Handle regular item update
      if (modalState.itemIndex === null) return;

      const exerciseId =
        currentItem.type === 'exercise'
          ? currentItem.data.id
          : currentItem.data.exercise_id;

      // Optimistically update the item
      const optimisticTemplate: ExerciseTemplate = {
        ...(currentItem.type === 'template'
          ? currentItem.data
          : ({} as ExerciseTemplate)),
        id: currentItem.type === 'template' ? currentItem.data.id : '',
        template_hash:
          currentItem.type === 'template' ? currentItem.data.template_hash : '',
        exercise_id: exerciseId,
        exercise_name: currentItem.data.exercise_name,
        video_type: currentItem.data.video_type,
        video_url: currentItem.data.video_url,
        ...templateData,
      } as ExerciseTemplate;

      const previousItem = currentItem;
      const optimisticItem: SelectedItem = {
        type: 'template',
        data: optimisticTemplate,
      };

      // Optimistic update
      onUpdate(modalState.itemIndex, optimisticItem);

      try {
        // Prepare RPC parameters
        const rpcParams: Parameters<typeof upsertExerciseTemplate>[0] = {
          p_exercise_id: exerciseId,
          p_sets: templateData.sets ?? undefined,
          p_rep: templateData.rep ?? undefined,
          p_time: templateData.time ?? undefined,
          p_distance: templateData.distance ?? undefined,
          p_weight: templateData.weight ?? undefined,
          p_rest_time: templateData.rest_time ?? undefined,
          p_rep_override: templateData.rep_override ?? undefined,
          p_time_override: templateData.time_override ?? undefined,
          p_distance_override: templateData.distance_override ?? undefined,
          p_weight_override: templateData.weight_override ?? undefined,
          p_rest_time_override: templateData.rest_time_override ?? undefined,
          p_equipment_ids: templateData.equipment_ids ?? undefined,
          p_notes: templateData.notes ?? undefined,
        };

        // Call server action
        const result = await upsertExerciseTemplate(rpcParams);

        if (!result.success) {
          // Revert optimistic update on error
          onUpdate(modalState.itemIndex, previousItem);
          toast.error(result.error || 'Failed to save exercise template');
          return;
        }

        // Extract ID and template_hash from the SQL function response
        // The response structure is: { success: true, id: UUID, template_hash: TEXT, ... }
        const responseData = result.data as {
          id: string;
          template_hash: string;
          cloned?: boolean;
          original_id?: string;
          reference_count?: number;
        };

        // Update with the returned template data (includes ID from database)
        const updatedTemplate: ExerciseTemplate = {
          ...optimisticTemplate,
          id: responseData.id,
          template_hash: responseData.template_hash,
        };

        const updatedItem: SelectedItem = {
          type: 'template',
          data: updatedTemplate,
        };

        // Update with the actual saved template (with correct ID)
        onUpdate(modalState.itemIndex, updatedItem);
      } catch (error) {
        // Revert optimistic update on exception
        onUpdate(modalState.itemIndex, previousItem);
        console.error('Error saving exercise template:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to save exercise template',
        );
      }
    },
    [modalState, items, onUpdate, onItemsReorder],
  );

  const handleCopy = useCallback((data: Partial<ExerciseTemplate>) => {
    setCopiedTemplateData(data);
  }, []);

  const handlePaste = useCallback(() => {
    // Paste is handled in TemplateConfig component
  }, []);

  return (
    <>
      <div
        className={cn(
          'h-full border-2 border-dashed rounded-lg p-4 transition-colors border-gray-300 bg-gray-50',
        )}
      >
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No items selected</p>
            <p className="text-sm mt-2">Click cards to add items</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {items.map((item, index) => {
              if (item.type === 'group') {
                return (
                  <SelectedGroupComponent
                    key={`group-${index}`}
                    group={item.data}
                    index={index}
                    onRemove={() => onRemoveGroup?.(index) ?? onRemove(index)}
                    onToggleSuperset={() => onToggleSuperset?.(index)}
                    onUpdateGroup={(updatedGroup) => {
                      const newItems = [...items];
                      newItems[index] = {
                        type: 'group',
                        data: updatedGroup,
                      };
                      onItemsReorder(newItems);
                    }}
                    onGroupItemClick={(groupItem, groupIdx, itemIdx, event) => {
                      if (groupItem.type === 'template') {
                        setModalState({
                          open: true,
                          position: {
                            x: event.clientX - TemplateConfigOffsets.x,
                            y: event.clientY - TemplateConfigOffsets.y,
                          },
                          item: groupItem,
                          itemIndex: null,
                          groupIndex: groupIdx,
                          groupItemIndex: itemIdx,
                        });
                      }
                    }}
                  />
                );
              }
              return (
                <SelectedItemComponent
                  key={`${item.type}-${item.data.id}-${index}`}
                  item={item}
                  index={index}
                  onRemove={() => onRemove(index)}
                  onClick={(e) => handleItemClick(index, e)}
                />
              );
            })}
          </div>
        )}
      </div>

      {modalState.open && modalState.item && (
        <TemplateConfig
          item={modalState.item}
          position={modalState.position}
          onClose={handleCloseModal}
          onSave={handleSave}
          copiedData={copiedTemplateData}
          onCopy={handleCopy}
          onPaste={handlePaste}
        />
      )}
    </>
  );
}
