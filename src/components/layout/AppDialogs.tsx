import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getSettings } from "@/lib/storage";

interface AppDialogsContextValue {
  /** Open Settings dialog. */
  openSettings: () => void;
  /** Open Settings, optionally first showing the "needs key" prompt. */
  openSettingsForKey: () => void;
  /**
   * Returns true if an API key is present. If not, opens the
   * "Pop in your API key" modal and returns false.
   */
  ensureApiKey: () => boolean;
}

const AppDialogsContext = createContext<AppDialogsContextValue | null>(null);

interface AppDialogsProviderProps {
  children: ReactNode;
  /** Wired by AppLayout — opens the actual Settings dialog. */
  onOpenSettings: () => void;
  /** Wired by AppLayout — opens the "needs key" modal. */
  onOpenKeyPrompt: () => void;
}

export function AppDialogsProvider({
  children,
  onOpenSettings,
  onOpenKeyPrompt,
}: AppDialogsProviderProps) {
  const ensureApiKey = useCallback(() => {
    const key = getSettings().anthropic_api_key?.trim();
    if (!key) {
      onOpenKeyPrompt();
      return false;
    }
    return true;
  }, [onOpenKeyPrompt]);

  const value: AppDialogsContextValue = {
    openSettings: onOpenSettings,
    openSettingsForKey: onOpenSettings,
    ensureApiKey,
  };

  return <AppDialogsContext.Provider value={value}>{children}</AppDialogsContext.Provider>;
}

export function useAppDialogs(): AppDialogsContextValue {
  const ctx = useContext(AppDialogsContext);
  if (!ctx) throw new Error("useAppDialogs must be used inside AppDialogsProvider");
  return ctx;
}

// Helper hook for components that only need the key check.
export function useRequireApiKey() {
  const { ensureApiKey } = useAppDialogs();
  return ensureApiKey;
}

// Re-export a no-op typing helper for other modules.
export type { AppDialogsContextValue };

// Note: provider also tracks an internal "just opened from key prompt" flag
// indirectly — handled by AppLayout via setShowKeyPrompt(false) on Settings open.
export function _internalUnused() {
  // satisfy ts noUnusedLocals if any
  return useState;
}
