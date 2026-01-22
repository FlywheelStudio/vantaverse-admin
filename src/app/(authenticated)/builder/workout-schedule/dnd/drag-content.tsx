'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { SelectedItemComponent } from './selected-item';
import { TopLevelDroppable } from './top-level-droppable';
import {
  TemplateConfig,
  TemplateConfigOffsets,
} from '../../template-config/template-config';
import { useDragContext } from './drag-context';

interface DragContentProps {
  items: SelectedItem[];
  onRemove: (index: number) => void;
  onRemoveGroup?: (index: number) => void;
  onToggleSuperset?: (index: number) => void;
  modalState: {
    open: boolean;
    position: { x: number; y: number };
    item: Exclude<SelectedItem, { type: 'group' }> | null;
    itemIndex: number | null;
    groupIndex?: number | null;
    groupItemIndex?: number | null;
  };
  setModalState: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      position: { x: number; y: number };
      item: Exclude<SelectedItem, { type: 'group' }> | null;
      itemIndex: number | null;
      groupIndex?: number | null;
      groupItemIndex?: number | null;
    }>
  >;
  copiedTemplateData: Partial<ExerciseTemplate> | null;
  handleCloseModal: () => void;
  onUpdate: (index: number, item: SelectedItem) => void;
  handleCopy: (data: Partial<ExerciseTemplate>) => void;
  handleItemClick: (index: number, event: React.MouseEvent) => void;
}

export function DragContent({
  items,
  onRemove,
  onRemoveGroup,
  onToggleSuperset,
  modalState,
  setModalState,
  copiedTemplateData,
  handleCloseModal,
  onUpdate,
  handleCopy,
  handleItemClick,
}: DragContentProps) {
  const {
    activeId,
    activeItem,
    isDraggingFromGroup,
    topLevelIds,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useDragContext();

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="w-full">
          <TopLevelDroppable
          isDraggingFromGroup={isDraggingFromGroup}
          items={items}
          topLevelIds={topLevelIds}
          onRemove={onRemove}
          onRemoveGroup={onRemoveGroup}
          onToggleSuperset={onToggleSuperset}
          onItemsReorder={() => {}}
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
          handleItemClick={handleItemClick}
        />
        </div>

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeId && activeItem ? (
                <div className="opacity-80">
                  {activeItem.type === 'group' ? (
                    <div className="border rounded-lg p-3 border-purple-300 bg-purple-50/50 shadow-lg">
                      <div className="font-semibold text-sm">
                        {activeItem.data.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activeItem.data.items.length} items
                      </div>
                    </div>
                  ) : (
                    <SelectedItemComponent
                      item={activeItem}
                      onRemove={() => {}}
                      onClick={() => {}}
                    />
                  )}
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>

      {modalState.open && modalState.item && (
        <TemplateConfig
          item={modalState.item}
          position={modalState.position}
          onClose={handleCloseModal}
          copiedData={copiedTemplateData}
          onCopy={handleCopy}
          onUpdate={(templateData) => {
            if (modalState.itemIndex !== null && modalState.item) {
              const exerciseId =
                modalState.item.type === 'exercise'
                  ? modalState.item.data.id
                  : modalState.item.data.exercise_id;

              const optimisticTemplate: ExerciseTemplate = {
                ...(modalState.item.type === 'template'
                  ? modalState.item.data
                  : ({} as ExerciseTemplate)),
                id:
                  modalState.item.type === 'template'
                    ? modalState.item.data.id
                    : '',
                template_hash:
                  modalState.item.type === 'template'
                    ? modalState.item.data.template_hash
                    : '',
                exercise_id: exerciseId,
                exercise_name: modalState.item.data.exercise_name,
                video_type: modalState.item.data.video_type,
                video_url: modalState.item.data.video_url,
                ...templateData,
              } as ExerciseTemplate;

              const optimisticItem: SelectedItem = {
                type: 'template',
                data: optimisticTemplate,
              };

              onUpdate(modalState.itemIndex, optimisticItem);
            }
          }}
          onSuccessWithTemplate={(template) => {
            const gIdx = modalState.groupIndex;
            const iIdx = modalState.groupItemIndex;
            if (gIdx != null && iIdx != null) {
              const group = items[gIdx];
              if (group?.type === 'group') {
                const next = [...(group.data.items ?? [])];
                next[iIdx] = { type: 'template' as const, data: template };
                onUpdate(gIdx, {
                  ...group,
                  data: { ...group.data, items: next },
                });
              }
            } else if (modalState.itemIndex !== null) {
              onUpdate(modalState.itemIndex, {
                type: 'template',
                data: template,
              });
            }
          }}
        />
      )}
    </>
  );
}
