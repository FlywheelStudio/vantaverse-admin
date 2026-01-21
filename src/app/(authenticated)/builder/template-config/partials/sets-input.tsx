import { Input } from '@/components/ui/input';

interface SetsInputProps {
  sets: number;
  onChange: (sets: number) => void;
  disabled?: boolean;
}

export function SetsInput({ sets, onChange, disabled }: SetsInputProps) {
  return (
    <div className="px-3 py-2 border-b border-gray-100 bg-blue-50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600 w-14 shrink-0">
          Sets
        </span>
        <Input
          className="flex-1 px-2 py-1 border rounded text-xs text-center"
          min="1"
          placeholder="0"
          type="number"
          value={sets}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
