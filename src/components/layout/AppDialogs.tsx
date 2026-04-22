import { createContext, useCallback, useContext, type ReactNode } from "react";
import { getSettings } from "@/lib/storage";

interface AppDialogsContextValue {
  /** Open the Settings dialog. */
  openSettings: () => void;
  /**
   * Returns true if an Anthropic API key is present.
   * If not, opens the "Pop in your API key" prompt and returns false.
   * Use this before any AI-triggering action.
   */
  ensureApiKey: () => boolean;
}

const AppDialogsContext = createContext<AppDialogsContextValue | null>(null);

interface AppDialogsProviderProps {
  children: ReactNode;
  onOpenSettings: () => void;
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

  return (
    <AppDialogsContext.Provider value={{ openSettings: onOpenSettings, ensureApiKey }}>
      {children}
    </AppDialogsContext.Provider>
  );
}

export function useAppDialogs(): AppDialogsContextValue {
  const ctx = useContext(AppDialogsContext);
  if (!ctx) throw new Error("useAppDialogs must be used inside AppDialogsProvider");
  return ctx;
}
