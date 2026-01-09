import { Button } from '@/components/ui/button';

interface TemplateConfigActionsProps {
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
}

export function TemplateConfigActions({
  onCopy,
  onPaste,
  canPaste,
}: TemplateConfigActionsProps) {
  return (
    <div className="flex gap-2 px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
      <Button
        className="flex-1 px-2 py-1.5 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={onCopy}
      >
        Copy
      </Button>
      <Button
        className="flex-1 px-2 py-1.5 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        onClick={onPaste}
        disabled={!canPaste}
      >
        Paste
      </Button>
    </div>
  );
}
