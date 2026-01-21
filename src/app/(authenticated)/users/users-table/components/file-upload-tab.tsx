'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  getTemplateCSVUrl,
  getTemplateExcelUrl,
  type ImportUsersResult,
} from '../../actions';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import {
  useImportUsersCSV,
  useImportUsersExcel,
} from '../hooks/use-users-table-mutations';

interface FileUploadTabProps {
  fileType: 'csv' | 'excel';
  onImported: (result: ImportUsersResult) => void;
  onCancel: () => void;
  role: MemberRole;
}

export function FileUploadTab({
  fileType,
  onImported,
  onCancel,
  role = 'patient',
}: FileUploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const isCSV = fileType === 'csv';
  const acceptMime = isCSV ? '.csv' : '.xlsx,.xls';
  const templateFileName = isCSV
    ? 'Medvanta - Bulk User Template.csv'
    : 'Medvanta - Bulk User Template.xlsx';

  const importCSVMutation = useImportUsersCSV();
  const importExcelMutation = useImportUsersExcel();

  const isPending = isCSV ? importCSVMutation.isPending : importExcelMutation.isPending;

  const handleDownloadTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = isCSV
      ? await getTemplateCSVUrl()
      : await getTemplateExcelUrl();
    if (result.success) {
      const link = document.createElement('a');
      link.href = result.data;
      link.download = templateFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error(
        isCSV ? 'Please select a CSV file' : 'Please select an Excel file',
      );
      return;
    }

    try {
      let result: ImportUsersResult;
      if (isCSV) {
        const csvText = await file.text();
        result = await importCSVMutation.mutateAsync({
          csvText,
          role,
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        result = await importExcelMutation.mutateAsync({
          fileData: arrayBuffer,
          role,
        });
      }
      // Always call onImported with the result, even if arrays are empty
      // This ensures the pending view is shown
      onImported(result);
      // Reset file state after successful import
      setFile(null);
    } catch (error) {
      // Error handling is done in mutation hooks
      // Only handle file reading errors here
      if (error instanceof Error && !error.message.includes('Failed to import')) {
        toast.error(
          isCSV ? 'Failed to read CSV file' : 'Failed to read Excel file',
        );
      }
    }
  };

  const acceptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const name = droppedFile.name.toLowerCase();
    const ok = isCSV
      ? name.endsWith('.csv')
      : name.endsWith('.xlsx') || name.endsWith('.xls');

    if (!ok) {
      toast.error(
        isCSV ? 'Please drop a .csv file' : 'Please drop a .xlsx or .xls file',
      );
      return;
    }

    setFile(droppedFile);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptMime}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="text-sm text-muted-foreground">
          Upload {isCSV ? 'a CSV' : 'an Excel'} file to add multiple users at
          once.
        </div>

        <div className="flex-1 flex flex-col justify-center py-6">
          <button
            type="button"
            onClick={handleUpload}
            onDragOver={(e) => e.preventDefault()}
            onDrop={acceptDrop}
            className="w-full rounded-xl border border-dashed border-[#2454FF]/25 bg-[#F5F7FA]/50 px-6 py-10 text-center hover:bg-[#F5F7FA] transition-colors"
          >
            <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-[#64748B]" />
              <div className="text-base font-medium text-[#1E3A5F]">
                Upload {isCSV ? 'CSV' : 'Excel'} File
              </div>
              {(file && (
                <div className="mt-2 text-xs text-[#1E3A5F]">
                  Selected: {file.name}
                </div>
              )) || (
                <div className="text-sm text-[#64748B]">
                  Click to browse or drag and drop
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="space-y-3">
          <div
            style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#ad6800',
              lineHeight: '1.5',
            }}
          >
            <div>
              Your {isCSV ? 'CSV' : 'Excel'} should include columns:{' '}
              <span className="font-semibold">First Name</span>,{' '}
              <span className="font-semibold">Last Name</span>,{' '}
              <span className="font-semibold">Email</span> (required).
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-sm text-red-500 hover:text-red-600 hover:underline hover:underline-offset-2 text-left cursor-pointer"
            >
              Download {isCSV ? 'CSV' : 'Excel'} Template
            </button>
          </div>

          <div
            className="flex items-start gap-3"
            style={{
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#0050b3',
              lineHeight: '1.5',
            }}
          >
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              Users will be added as{' '}
              <span className="font-semibold">Pending</span>. Review the list
              before sending invitations.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-auto">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || isPending}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isPending ? 'Uploading...' : 'Upload & Add'}
          </Button>
        </div>
      </div>
    </>
  );
}
