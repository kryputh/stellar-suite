/**
 * useDiagnosticsStore.ts
 *
 * Global Zustand store for compiler diagnostics.
 * Populated by cargoParser and consumed by the editor (Monaco markers)
 * and the terminal panel.
 */
import { create } from "zustand";
import { Diagnostic } from "@/utils/cargoParser";

interface DiagnosticsStore {
  /** All current diagnostics, keyed by virtual file ID */
  diagnostics: Diagnostic[];

  /** Replace the full diagnostics list (called after each build) */
  setDiagnostics: (items: Diagnostic[]) => void;

  /** Clear all diagnostics (e.g. on new build start) */
  clearDiagnostics: () => void;

  /** Get diagnostics for a specific virtual file ID */
  getDiagnosticsForFile: (fileId: string) => Diagnostic[];

  /** Count of errors (severity === "error") */
  errorCount: number;

  /** Count of warnings (severity === "warning") */
  warningCount: number;
}

export const useDiagnosticsStore = create<DiagnosticsStore>((set, get) => ({
  diagnostics: [],
  errorCount: 0,
  warningCount: 0,

  setDiagnostics: (items) => {
    set({
      diagnostics: items,
      errorCount: items.filter((d) => d.severity === "error").length,
      warningCount: items.filter((d) => d.severity === "warning").length,
    });
  },

  clearDiagnostics: () => set({ diagnostics: [], errorCount: 0, warningCount: 0 }),

  getDiagnosticsForFile: (fileId) =>
    get().diagnostics.filter((d) => d.fileId === fileId),
}));
