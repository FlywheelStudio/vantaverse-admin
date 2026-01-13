'use client';

import { useTemplateForm } from './hooks/use-template-form';
import { useModalDrag } from './hooks/use-modal-drag';
import { TemplateConfigHeader } from './components/template-config-header';
import { SetsInput } from './components/sets-input';
import { TemplateConfigTabs } from './components/template-config-tabs';
import { TemplateConfigForm } from './components/template-config-form';
import { TemplateConfigActions } from './components/template-config-actions';
import type { TemplateConfigProps } from './types';

export const TemplateConfigOffsets = {
  x: 200,
  y: 80,
};

export const TemplateConfigDefaultValues = {
  sets: 3,
  rep: 10,
  time: 60,
  rest_time: 10,
};

export function TemplateConfig({
  item,
  position,
  onClose,
  onSave,
  copiedData,
  onCopy,
}: TemplateConfigProps) {
  const { modalRef, modalPosition, handleMouseDown } = useModalDrag(position);

  const {
    formData,
    setFormData,
    activeTab,
    setActiveTab,
    currentSetIndex,
    setCurrentSetIndex,
    handleSetsChange,
    setCurrentValue,
    handleBlur,
    handleCopy,
    handlePaste,
    handleSave,
  } = useTemplateForm(item, onSave, onClose, copiedData);

  if (!item) return null;

  const exerciseName =
    item.type === 'exercise'
      ? item.data.exercise_name
      : item.data.exercise_name || 'Unnamed Exercise';

  return (
    <div
      ref={modalRef}
      className="bg-white rounded-lg shadow-2xl border border-gray-300"
      style={{
        position: 'fixed',
        left: `${modalPosition.x}px`,
        top: `${modalPosition.y}px`,
        width: '280px',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <TemplateConfigHeader
        exerciseName={exerciseName}
        onClose={onClose}
        onMouseDown={handleMouseDown}
      />

      <SetsInput sets={formData.sets} onChange={handleSetsChange} />

      <TemplateConfigTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentSetIndex={currentSetIndex}
        sets={formData.sets}
        onSetIndexChange={setCurrentSetIndex}
      />

      <TemplateConfigForm
        formData={formData}
        activeTab={activeTab}
        currentSetIndex={currentSetIndex}
        setFormData={setFormData}
        onValueChange={setCurrentValue}
        onBlur={() => handleBlur(modalRef)}
      />

      <TemplateConfigActions
        onCopy={() => handleCopy(onCopy)}
        onPaste={handlePaste}
        canPaste={!!copiedData}
        onSave={handleSave}
      />
    </div>
  );
}
