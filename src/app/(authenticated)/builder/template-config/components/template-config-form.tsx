import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TempoInput } from './tempo-input';
import type { TemplateFormData, TabType } from '../types';

interface TemplateConfigFormProps {
  formData: TemplateFormData;
  activeTab: TabType;
  currentSetIndex: number;
  setFormData: React.Dispatch<React.SetStateAction<TemplateFormData>>;
  onValueChange: (
    field: 'rep' | 'time' | 'rest_time' | 'distance' | 'weight',
    value: number | string | null,
  ) => void;
  onBlur: () => void;
}

export function TemplateConfigForm({
  formData,
  activeTab,
  currentSetIndex,
  setFormData,
  onValueChange,
  onBlur,
}: TemplateConfigFormProps) {
  const currentRep =
    activeTab === 'all' ? formData.rep : formData.rep_override[currentSetIndex];
  const currentTime =
    activeTab === 'all'
      ? formData.time
      : formData.time_override[currentSetIndex];
  const currentRest =
    activeTab === 'all'
      ? formData.rest_time
      : formData.rest_time_override[currentSetIndex];
  const currentDistance =
    activeTab === 'all'
      ? formData.distance
      : formData.distance_override[currentSetIndex];
  const currentDistanceUnit =
    activeTab === 'all'
      ? formData.distanceUnit
      : formData.distance_override_units[currentSetIndex] || 'm';
  const currentWeight =
    activeTab === 'all'
      ? formData.weight
      : formData.weight_override[currentSetIndex];
  const currentWeightUnit =
    activeTab === 'all'
      ? formData.weightUnit
      : formData.weight_override_units[currentSetIndex] || 'kg';
  const currentTempo =
    activeTab === 'all' ? formData.tempo : formData.tempo;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-14 shrink-0">Reps</span>
        <Input
          className="flex-1 px-2 py-1 border rounded text-xs"
          min="0"
          placeholder={
            activeTab === 'set' && formData.rep ? String(formData.rep) : ''
          }
          type="number"
          value={currentRep ?? ''}
          onChange={(e) =>
            onValueChange(
              'rep',
              e.target.value ? parseInt(e.target.value) : null,
            )
          }
          onBlur={onBlur}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).focus();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-14 shrink-0">Distance</span>
        <Input
          className="flex-3 min-w-0 px-2 py-1 border rounded text-xs"
          min="0"
          step="0.1"
          placeholder={
            activeTab === 'set' && formData.distance
              ? String(formData.distance)
              : ''
          }
          type="number"
          value={currentDistance ?? ''}
          onChange={(e) => {
            if (activeTab === 'all') {
              setFormData((prev) => ({
                ...prev,
                distance: e.target.value || null,
              }));
            } else {
              setFormData((prev) => {
                const updated = [...prev.distance_override];
                updated[currentSetIndex] = e.target.value || null;
                return { ...prev, distance_override: updated };
              });
            }
          }}
          onBlur={onBlur}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).focus();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
        <Select
          className="flex-1 min-w-0 px-1 py-1 border rounded text-xs bg-gray-50"
          value={currentDistanceUnit}
          onChange={(e) => {
            if (activeTab === 'all') {
              setFormData((prev) => ({
                ...prev,
                distanceUnit: e.target.value,
              }));
            } else {
              setFormData((prev) => {
                const updated = [...prev.distance_override_units];
                updated[currentSetIndex] = e.target.value;
                return { ...prev, distance_override_units: updated };
              });
            }
          }}
        >
          <option value="m">m</option>
          <option value="km">km</option>
          <option value="mi">mi</option>
          <option value="ft">ft</option>
          <option value="yd">yd</option>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-14 shrink-0">Weight</span>
        <Input
          className="flex-3 min-w-0 px-2 py-1 border rounded text-xs"
          min="0"
          step="0.1"
          placeholder={
            activeTab === 'set' && formData.weight
              ? String(formData.weight)
              : ''
          }
          type="number"
          value={currentWeight ?? ''}
          onChange={(e) => {
            if (activeTab === 'all') {
              setFormData((prev) => ({
                ...prev,
                weight: e.target.value || null,
              }));
            } else {
              setFormData((prev) => {
                const updated = [...prev.weight_override];
                updated[currentSetIndex] = e.target.value || null;
                return { ...prev, weight_override: updated };
              });
            }
          }}
          onBlur={onBlur}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).focus();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
        <Select
          className="flex-1 min-w-0 px-1 py-1 border rounded text-xs bg-gray-50"
          value={currentWeightUnit}
          onChange={(e) => {
            if (activeTab === 'all') {
              setFormData((prev) => ({
                ...prev,
                weightUnit: e.target.value,
              }));
            } else {
              setFormData((prev) => {
                const updated = [...prev.weight_override_units];
                updated[currentSetIndex] = e.target.value;
                return { ...prev, weight_override_units: updated };
              });
            }
          }}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
          <option value="oz">oz</option>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-14 shrink-0">Time (s)</span>
        <Input
          className="flex-1 px-2 py-1 border rounded text-xs"
          min="0"
          placeholder={
            activeTab === 'set' && formData.time ? String(formData.time) : ''
          }
          type="number"
          value={currentTime ?? ''}
          onChange={(e) =>
            onValueChange(
              'time',
              e.target.value ? parseInt(e.target.value) : null,
            )
          }
          onBlur={onBlur}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).focus();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-14 shrink-0">Rest (s)</span>
        <Input
          className="flex-1 px-2 py-1 border rounded text-xs"
          min="0"
          placeholder={
            activeTab === 'set' && formData.rest_time
              ? String(formData.rest_time)
              : ''
          }
          type="number"
          value={currentRest ?? ''}
          onChange={(e) =>
            onValueChange(
              'rest_time',
              e.target.value ? parseInt(e.target.value) : null,
            )
          }
          onBlur={onBlur}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).focus();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-14 shrink-0">Tempo</span>
        <TempoInput
          value={currentTempo}
          onChange={(value: (string | null)[]) => {
            setFormData((prev) => ({ ...prev, tempo: value }));
          }}
          disabled={activeTab === 'set'}
        />
      </div>
    </div>
  );
}
