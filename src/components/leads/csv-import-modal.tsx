'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Info,
} from 'lucide-react';
import { DiscoveryItemResult } from '@/lib/discovery/job-runner';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

const SAMPLE_CSV_CONTENT = `business_name,profession,city,address,website,business_email,business_phone,source
"Gupta & Partners Chartered Accountants","Chartered Accountant","Gurgaon","Sector 29 Commercial Market, Gurgaon 122001","https://gupta-ca.example","contact@gupta-ca.example","+91-124-5550201","Official MCA Registry"
"Modern Advisory & Audit LLP","Chartered Accountant","Gurgaon","Golf Course Road, Sector 54, Gurgaon 122003","","office@modern-audit.example","+91-124-5550202","Local Business Directory"
"Verma Tax Associates","Chartered Accountant","Delhi NCR","Connaught Place, New Delhi 110001","https://vermatax.example","info@vermatax.example","+91-11-5550203","Trade Chamber Listing"
"Apex Financial & Corporate Advisory","Chartered Accountant","Gurgaon","Cyber City Phase 3, Gurgaon 122002","","advisory@apex-corp.example","+91-124-5550204","Chamber of Commerce"`;

export function CsvImportModal({ isOpen, onClose, onImportComplete }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    found: number;
    valid: number;
    duplicates: number;
    imported: number;
    errors: number;
    results: DiscoveryItemResult[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseAndSetCsv = (text: string, selectedFile?: File) => {
    setError(null);
    setResult(null);
    setCsvContent(text);
    if (selectedFile) setFile(selectedFile);

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setError('The CSV file does not contain enough rows. Ensure it has a header row and at least one data row.');
      setPreviewHeaders([]);
      setPreviewRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
    const sampleRows = lines.slice(1, 6).map((line) => {
      // Basic split with quote support
      const row: string[] = [];
      let inQuote = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      return row;
    });

    setPreviewHeaders(headers);
    setPreviewRows(sampleRows);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv') && selected.type !== 'text/csv') {
      setError('Please select a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndSetCsv(text, selected);
    };
    reader.onerror = () => {
      setError('Failed to read the selected CSV file.');
    };
    reader.readAsText(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!dropped.name.toLowerCase().endsWith('.csv') && dropped.type !== 'text/csv') {
      setError('Please drop a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndSetCsv(text, dropped);
    };
    reader.onerror = () => {
      setError('Failed to read the dropped CSV file.');
    };
    reader.readAsText(dropped);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'getvisible_leads_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please select or upload a CSV file first.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const res = await fetch('/api/discovery/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CSV leads');
      }

      setResult(data);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error importing CSV leads');
    } finally {
      setImporting(false);
    }
  };

  const resetSelection = () => {
    setFile(null);
    setCsvContent('');
    setPreviewHeaders([]);
    setPreviewRows([]);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Import Leads via CSV
              </h3>
              <p className="text-xs text-slate-500">
                Upload legitimate business records into your GetVisible CRM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Top Bar: Template Download */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">
                Expected columns: <code className="font-semibold text-foreground">business_name, profession, city, address, website, business_email, business_phone</code>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 h-7 text-[11px] shrink-0"
            >
              <Download className="h-3 w-3" />
              <span>Download Sample CSV</span>
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          {!result && (
            <>
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">
                      Click to browse or drag & drop a .csv file
                    </span>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Supports comma-separated UTF-8 CSV files up to 5MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground text-xs">{file.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB • {previewRows.length > 0 ? `${previewRows.length}+ rows detected` : 'Parsing file'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetSelection}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </Button>
                  </div>

                  {/* Preview Table */}
                  {previewHeaders.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>Data Preview (first {previewRows.length} rows):</span>
                        <span>{previewHeaders.length} columns identified</span>
                      </div>
                      <div className="overflow-x-auto rounded border border-border/80 max-h-44">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead className="bg-muted/50 font-bold border-b border-border">
                            <tr>
                              {previewHeaders.slice(0, 5).map((h, idx) => (
                                <th key={idx} className="p-2 truncate max-w-[120px]">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {previewRows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-muted/20">
                                {row.slice(0, 5).map((val, cellIdx) => (
                                  <td key={cellIdx} className="p-2 truncate max-w-[120px]">
                                    {val || '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Execution Result Report */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground font-semibold">Total Rows</div>
                  <div className="text-base font-bold text-foreground mt-0.5">{result.found}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground font-semibold">Valid</div>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">{result.valid}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground font-semibold">Duplicates</div>
                  <div className="text-base font-bold text-amber-600 mt-0.5">{result.duplicates}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Imported</div>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{result.imported}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground font-semibold">Errors</div>
                  <div className="text-base font-bold text-destructive mt-0.5">{result.errors}</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-border max-h-48">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2">Business Name</th>
                      <th className="p-2">Location</th>
                      <th className="p-2">Website</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.results.slice(0, 10).map((r, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2 font-medium">{r.businessName}</td>
                        <td className="p-2 text-muted-foreground">{r.city}</td>
                        <td className="p-2">{r.website || 'No website'}</td>
                        <td className="p-2">
                          {r.importStatus === 'IMPORTED' ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Imported
                            </span>
                          ) : r.importStatus === 'DUPLICATE_SKIPPED' ? (
                            <span className="text-muted-foreground italic">Skipped Dup</span>
                          ) : (
                            <span className="text-destructive font-semibold">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {result ? 'Close' : 'Cancel'}
          </Button>

          {result ? (
            <Button
              size="sm"
              onClick={() => {
                resetSelection();
                onClose();
              }}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Done & Refresh Leads</span>
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={importing || !csvContent.trim()}
              onClick={handleImport}
              className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Upload className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
              <span>{importing ? 'Importing CSV Records...' : 'Import Leads into CRM'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
