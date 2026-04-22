import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  AnthropicAuthError,
  AnthropicRateLimitError,
  testConnection,
} from "@/lib/anthropic";
import {
  exportAll,
  getSettings,
  importAll,
  resetAll,
  saveSettings,
  type ModelId,
} from "@/lib/storage";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TestState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<TestState>({ kind: "idle" });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset local form state on open from current persisted settings.
  useEffect(() => {
    if (open) {
      const s = getSettings();
      setApiKey(s.anthropic_api_key);
      setModel(s.model);
      setShowKey(false);
      setTestState({ kind: "idle" });
    }
  }, [open]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestState({ kind: "error", message: "Add a key first." });
      return;
    }
    setTestState({ kind: "loading" });
    try {
      await testConnection(apiKey.trim(), model);
      setTestState({ kind: "success" });
    } catch (err) {
      let msg = "That didn't work";
      if (err instanceof AnthropicAuthError) msg = "That key didn't work";
      else if (err instanceof AnthropicRateLimitError) msg = "Rate-limited — try again in a minute";
      else if (err instanceof Error) msg = err.message;
      setTestState({ kind: "error", message: msg });
    }
  };

  const handleSave = () => {
    saveSettings({ anthropic_api_key: apiKey.trim(), model });
    toast.success("Settings saved.");
    onOpenChange(false);
  };

  const handleExport = () => {
    const data = exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `jam-session-export-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Data exported.");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting same file
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = importAll(parsed);
      // Refresh local form from possibly-updated settings.
      const s = getSettings();
      setApiKey(s.anthropic_api_key);
      setModel(s.model);
      if (result.droppedPersonas > 0) {
        toast.warning(
          `Imported, but ${result.droppedPersonas} persona${result.droppedPersonas === 1 ? "" : "s"} dropped (six max).`,
        );
      } else {
        toast.success("Data imported.");
      }
    } catch {
      toast.error("Couldn't read that file. Is it a Jam Session export?");
    }
  };

  const handleResetConfirm = () => {
    resetAll();
    setApiKey("");
    setModel("claude-sonnet-4-6");
    setResetConfirmOpen(false);
    toast.success("Everything wiped.");
    onOpenChange(false);
    // Reload so any cached UI re-reads empty state.
    setTimeout(() => window.location.reload(), 200);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Settings</DialogTitle>
            <DialogDescription>Stored locally in your browser. Nothing leaves your machine except calls to Anthropic.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* API key */}
            <section className="space-y-2">
              <Label htmlFor="api-key" className="text-sm font-medium">
                Anthropic API key
              </Label>
              <p className="text-xs text-muted-foreground">
                Get one at{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-secondary underline-offset-2 hover:underline"
                >
                  console.anthropic.com
                </a>
                . Stored locally in your browser only.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestState({ kind: "idle" });
                    }}
                    placeholder="sk-ant-..."
                    className="pr-10 font-mono text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showKey ? "Hide API key" : "Show API key"}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testState.kind === "loading"}
                  className="rounded-[10px]"
                >
                  {testState.kind === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Testing
                    </>
                  ) : (
                    "Test connection"
                  )}
                </Button>
              </div>
              {testState.kind === "success" && (
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </p>
              )}
              {testState.kind === "error" && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> {testState.message}
                </p>
              )}
            </section>

            <Separator />

            {/* Model */}
            <section className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">
                Model
              </Label>
              <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
                <SelectTrigger id="model" className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6 (default)</SelectItem>
                  <SelectItem value="claude-opus-4-7">Claude Opus 4.7</SelectItem>
                  <SelectItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sonnet is the sweet spot. Opus is smarter and slower. Haiku is fastest and cheapest.
              </p>
            </section>

            <Separator />

            {/* Data */}
            <section className="space-y-3">
              <Label className="text-sm font-medium">Data</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="rounded-[10px]"
                >
                  <Download className="h-4 w-4" /> Export data
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImportClick}
                  className="rounded-[10px]"
                >
                  <Upload className="h-4 w-4" /> Import data
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <Button
                  variant="ghost"
                  onClick={() => setResetConfirmOpen(true)}
                  className="rounded-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="h-4 w-4" /> Reset everything
                </Button>
              </div>
            </section>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-[10px]">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-[10px]">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="font-display text-xl">Wipe everything?</AlertDialogTitle>
            <AlertDialogDescription>
              This wipes all personas, tests, and settings. Sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="rounded-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Wipe everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
