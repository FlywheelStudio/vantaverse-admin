'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getTemplateCSVUrl,
  getTemplateExcelUrl,
  uploadUsersCSV,
  uploadUsersExcel,
  bulkImportUsers,
  type ImportValidationResult,
} from '../../actions';
import { ImportValidationModal } from './import-validation-modal';
import { ImportExportButton } from './import-export-button';
import toast from 'react-hot-toast';
import { useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';

interface AddUserMenuProps {
  onQuickAdd?: () => void;
}

export function AddUserMenu({ onQuickAdd }: AddUserMenuProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [isValidatingCSV, setIsValidatingCSV] = useState(false);
  const [isValidatingExcel, setIsValidatingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadCSV = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await getTemplateCSVUrl();
    if (result.success) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = result.data;
      link.download = 'Medvanta - Bulk User Template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadExcel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await getTemplateExcelUrl();
    if (result.success) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = result.data;
      link.download = 'Medvanta - Bulk User Template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUploadCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    csvInputRef.current?.click();
  };

  const handleUploadExcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    excelInputRef.current?.click();
  };

  const handleCSVFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidatingCSV(true);
    try {
      // Read file as text
      const csvText = await file.text();
      const result = await uploadUsersCSV(csvText);

      if (result.success) {
        setValidationResult(result.data);
        setValidationModalOpen(true);
      } else {
        toast.error(result.error || 'Failed to validate CSV file');
      }
    } catch {
      toast.error('Failed to read CSV file');
    } finally {
      setIsValidatingCSV(false);
    }
    e.target.value = '';
  };

  const handleExcelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidatingExcel(true);
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const result = await uploadUsersExcel(arrayBuffer);

      if (result.success) {
        setValidationResult(result.data);
        setValidationModalOpen(true);
      } else {
        toast.error(result.error || 'Failed to validate Excel file');
      }
    } catch {
      toast.error('Failed to read Excel file');
    } finally {
      setIsValidatingExcel(false);
    }
    e.target.value = '';
  };

  const handleAcceptImport = async (): Promise<void> => {
    if (!validationResult) return;

    setIsImporting(true);
    try {
      const result = await bulkImportUsers(validationResult);

      if (result.success) {
        const { created, updated, errors } = result.data;

        // Build success message
        const parts: string[] = [];
        if (created.organizations > 0) {
          parts.push(
            `${created.organizations} org${created.organizations > 1 ? 's' : ''}`,
          );
        }
        if (created.teams > 0) {
          parts.push(`${created.teams} team${created.teams > 1 ? 's' : ''}`);
        }
        if (created.users > 0) {
          parts.push(
            `${created.users} user${created.users > 1 ? 's' : ''} created`,
          );
        }
        if (updated.users > 0) {
          parts.push(
            `${updated.users} user${updated.users > 1 ? 's' : ''} updated`,
          );
        }

        if (parts.length > 0) {
          toast.success(`Import complete: ${parts.join(', ')}`);
        } else {
          toast.success('Import complete (no changes made)');
        }

        // Show warning if there were errors
        if (errors.length > 0) {
          toast.error(
            `${errors.length} error${errors.length > 1 ? 's' : ''} during import. Check console for details.`,
          );
          console.error('Import errors:', errors);
        }

        // Invalidate users query to refresh the table
        await queryClient.invalidateQueries({ queryKey: ['users'] });

        // Close modal
        setValidationModalOpen(false);
        setValidationResult(null);
      } else {
        toast.error(result.error || 'Failed to import users');
      }
    } catch {
      toast.error('An unexpected error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleQuickAdd = () => {
    setOpen(false);
    onQuickAdd?.();
  };

  return (
    <>
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={handleCSVFileChange}
        className="hidden"
      />
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelFileChange}
        className="hidden"
      />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold px-6 rounded-xl shadow-lg cursor-pointer">
            {isMobile ? <Plus className="h-4 w-4" /> : 'Add User'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onClick={handleQuickAdd}>
            Quick add
            <Plus className="h-4 w-4 ml-4" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ImportExportButton
            label="CSV"
            onUpload={handleUploadCSV}
            onDownload={handleDownloadCSV}
            isUploading={isValidatingCSV}
          />
          <DropdownMenuSeparator />
          <ImportExportButton
            label="Excel"
            onUpload={handleUploadExcel}
            onDownload={handleDownloadExcel}
            isUploading={isValidatingExcel}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportValidationModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        validationResult={validationResult}
        onAccept={handleAcceptImport}
        isImporting={isImporting}
      />
    </>
  );
}
