'use client';

import { Download, Upload, FileSpreadsheet } from 'lucide-react';
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
  downloadTemplateExcel,
  uploadUsersCSV,
  uploadUsersExcel,
} from './actions';
import toast from 'react-hot-toast';
import { useRef } from 'react';

export function ImportMenu() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadCSV = async () => {
    const result = await downloadTemplateCSV();
    if (!result.success) {
      toast.error(result.error || 'Template download not implemented');
    }
  };

  const handleDownloadExcel = async () => {
    const result = await downloadTemplateExcel();
    if (!result.success) {
      toast.error(result.error || 'Template download not implemented');
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

    const result = await uploadUsersExcel(file);
    if (!result.success) {
      toast.error(result.error || 'Excel upload not implemented');
    }
    e.target.value = '';
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-white border-[#2454FF]/20 rounded-xl text-[#1E3A5F] hover:bg-[#F5F7FA]"
          >
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
          <DropdownMenuItem onClick={handleUploadExcel}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
