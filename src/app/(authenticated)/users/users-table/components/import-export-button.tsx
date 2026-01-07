'use client';

import { Download, Upload, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ImportExportButtonProps {
  label: string;
  onUpload: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  isUploading?: boolean;
  uploadTooltip?: string;
  downloadTooltip?: string;
}

export function ImportExportButton({
  label,
  onUpload,
  onDownload,
  isUploading = false,
  uploadTooltip,
  downloadTooltip,
}: ImportExportButtonProps) {
  const defaultUploadTooltip = uploadTooltip || `Upload ${label}`;
  const defaultDownloadTooltip =
    downloadTooltip || `Download ${label} template`;

  return (
    <div className="py-1">
      <div
        className="flex items-center justify-between px-2 py-1.5 rounded-md cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-normal">{label}</span>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onUpload}
                disabled={isUploading}
                className="cursor-pointer p-1 hover:bg-accent rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={defaultUploadTooltip}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{defaultUploadTooltip}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDownload}
                className="cursor-pointer p-1 hover:bg-accent rounded-sm transition-colors"
                aria-label={defaultDownloadTooltip}
              >
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{defaultDownloadTooltip}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
