import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SavedSearchProject {
  id: string;
  name: string;
  category: string;
  location: string;
  locality?: string;
  radius?: number;
  limit: number;
  providerId: string;
  fieldsToCollect: string[];
  exportFormat: 'XLSX' | 'CSV';
  createdAt: string;
  lastRunAt?: string;
  organizationId: string;
}

export interface ExportHistoryRecord {
  id: string;
  fileName: string;
  format: 'XLSX' | 'CSV';
  rowCount: number;
  searchKeyword: string;
  searchLocation: string;
  providerUsed: string;
  exportedAt: string;
  organizationId: string;
}

interface StorageSchema {
  savedSearches: SavedSearchProject[];
  exportHistory: ExportHistoryRecord[];
}

const STORAGE_FILE = path.join(os.tmpdir(), 'getvisible_lead_extractor_storage_v1.json');

function readStorage(): StorageSchema {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        savedSearches: Array.isArray(parsed.savedSearches) ? parsed.savedSearches : [],
        exportHistory: Array.isArray(parsed.exportHistory) ? parsed.exportHistory : [],
      };
    }
  } catch {
    // ignore
  }
  return { savedSearches: [], exportHistory: [] };
}

function writeStorage(data: StorageSchema): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export class LeadExtractorStorage {
  // --- Saved Searches / Projects ---
  static listSavedSearches(orgId: string): SavedSearchProject[] {
    const data = readStorage();
    return data.savedSearches
      .filter((s) => !s.organizationId || s.organizationId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createSavedSearch(
    orgId: string,
    params: Omit<SavedSearchProject, 'id' | 'createdAt' | 'organizationId'>
  ): SavedSearchProject {
    const data = readStorage();
    const newProject: SavedSearchProject = {
      ...params,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };
    data.savedSearches.unshift(newProject);
    writeStorage(data);
    return newProject;
  }

  static updateSavedSearch(
    orgId: string,
    id: string,
    updates: Partial<Omit<SavedSearchProject, 'id' | 'organizationId' | 'createdAt'>>
  ): SavedSearchProject | null {
    const data = readStorage();
    const idx = data.savedSearches.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    data.savedSearches[idx] = {
      ...data.savedSearches[idx],
      ...updates,
    };
    writeStorage(data);
    return data.savedSearches[idx];
  }

  static deleteSavedSearch(orgId: string, id: string): boolean {
    const data = readStorage();
    const before = data.savedSearches.length;
    data.savedSearches = data.savedSearches.filter((s) => s.id !== id);
    if (data.savedSearches.length !== before) {
      writeStorage(data);
      return true;
    }
    return false;
  }

  // --- Export History ---
  static listExportHistory(orgId: string): ExportHistoryRecord[] {
    const data = readStorage();
    return data.exportHistory
      .filter((e) => !e.organizationId || e.organizationId === orgId)
      .sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
  }

  static recordExport(
    orgId: string,
    params: Omit<ExportHistoryRecord, 'id' | 'exportedAt' | 'organizationId'>
  ): ExportHistoryRecord {
    const data = readStorage();
    const record: ExportHistoryRecord = {
      ...params,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      exportedAt: new Date().toISOString(),
    };
    data.exportHistory.unshift(record);
    // Keep max 100 history items
    if (data.exportHistory.length > 100) {
      data.exportHistory = data.exportHistory.slice(0, 100);
    }
    writeStorage(data);
    return record;
  }

  static deleteExportHistory(orgId: string, id: string): boolean {
    const data = readStorage();
    const before = data.exportHistory.length;
    data.exportHistory = data.exportHistory.filter((e) => e.id !== id);
    if (data.exportHistory.length !== before) {
      writeStorage(data);
      return true;
    }
    return false;
  }
}
