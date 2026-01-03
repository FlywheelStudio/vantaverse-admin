'use client';

import { Download, Upload, FileSpreadsheet, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  downloadTemplateCSV,
  getTemplateExcelUrl,
  uploadUsersCSV,
  uploadUsersExcel,
  type ImportValidationResult,
} from './actions';
import { ImportValidationModal } from './users-table/components/import-validation-modal';
import toast from 'react-hot-toast';
import { useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddUserMenuProps {
  onQuickAdd?: () => void;
}

export function AddUserMenu({ onQuickAdd }: AddUserMenuProps) {
  const isMobile = useIsMobile();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleDownloadCSV = async () => {
    const result = await downloadTemplateCSV();
    if (!result.success) {
      toast.error(result.error || 'Template download not implemented');
    }
  };

  const handleDownloadExcel = async () => {
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

  const handleUploadCSV = () => {
    csvInputRef.current?.click();
  };

  const handleUploadExcel = () => {
    excelInputRef.current?.click();
  };

  const handleCSVFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadUsersCSV(file);
    if (!result.success) {
      toast.error(result.error || 'CSV upload not implemented');
    }
    e.target.value = '';
  };

  const handleExcelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
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
      setIsValidating(false);
    }
    e.target.value = '';
  };

  const handleAcceptImport = () => {
    // Placeholder: Close modal for now
    setValidationModalOpen(false);
    setValidationResult(null);
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
          <DropdownMenuItem onClick={handleQuickAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Quick add
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Template CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUploadCSV}>
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Template Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUploadExcel} disabled={isValidating}>
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isValidating ? 'Validating...' : 'Upload Excel'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportValidationModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        validationResult={validationResult}
        onAccept={handleAcceptImport}
      />
    </>
  );
}
