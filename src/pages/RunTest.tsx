import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, Check, AlertCircle, Paperclip, X, FileText, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAppDialogs } from "@/components/layout/AppDialogs";
import { getAvatarUrl } from "@/lib/avatar";
import {
  AnthropicAuthError,
  AnthropicRateLimitError,
  InvalidJsonResponseError,
  runPersonaReaction,
  fileToAttachment,
  isSupportedMimeType,
  type Attachment,
} from "@/lib/anthropic";
import { getPersonas, newId, saveTest, type Persona, type Test, type TestPersonaResult } from "@/lib/storage";

type PersonaRunStatus = "pending" | "running" | "done" | "error";

interface RunRow {
  persona: Persona;
  status: PersonaRunStatus;
  error?: string;
}

const MIN_FEATURE_LENGTH = 20;
const MAX_ATTACHMENTS = 5;
// ~4.5 MB uncompressed → ~6 MB base64 ceiling per file
const MAX_FILE_BYTES = 4.5 * 1024 * 1024;

const RunTest = () => {
  const navigate = useNavigate();
  const { ensureApiKey } = useAppDialogs();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [feature, setFeature] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [runRows, setRunRows] = useState<RunRow[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const all = getPersonas();
    setPersonas(all);
    setSelectedIds(new Set(all.map((p) => p.id)));
  }, []);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, []); // intentionally empty — we handle per-removal below

  const featureTrimmed = feature.trim();
  // Allow empty text if there are attachments
  const featureValid = featureTrimmed.length >= MIN_FEATURE_LENGTH || attachments.length > 0;
  const selectedPersonas = useMemo(() => personas.filter((p) => selectedIds.has(p.id)), [personas, selectedIds]);
  const canRun = !running && featureValid && selectedPersonas.length > 0;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---------- File handling ---------- */

  const processFiles = async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`Max ${MAX_ATTACHMENTS} attachments per session.`);
      return;
    }

    const toProcess = incoming.slice(0, remaining);
    const skipped = incoming.length - toProcess.length;

    const results: Attachment[] = [];
    for (const file of toProcess) {
      if (!isSupportedMimeType(file.type)) {
        toast.error(`${file.name}: unsupported type. Use PNG, JPG, GIF, WebP, or PDF.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is too large (max 4.5 MB).`);
        continue;
      }
      try {
        const attachment = await fileToAttachment(file);
        results.push(attachment);
      } catch {
        toast.error(`Couldn't read ${file.name}.`);
      }
    }

    if (results.length > 0) setAttachments((prev) => [...prev, ...results]);
    if (skipped > 0) toast(`${skipped} file${skipped > 1 ? "s" : ""} skipped — limit is ${MAX_ATTACHMENTS}.`);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  /* ---------- Run ---------- */

  const completedCount = runRows.filter((r) => r.status === "done").length;
  const totalCount = runRows.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleRun = async () => {
    if (!canRun) return;
    if (!ensureApiKey()) return;

    setRunning(true);
    const initialRows: RunRow[] = selectedPersonas.map((p) => ({ persona: p, status: "pending" }));
    setRunRows(initialRows);

    const results: TestPersonaResult[] = [];

    for (let i = 0; i < selectedPersonas.length; i++) {
      const persona = selectedPersonas[i];
      setRunRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)));

      try {
        const result = await runPersonaReaction(
          persona,
          featureTrimmed,
          attachments.length > 0 ? attachments : undefined,
        );
        results.push(result);
        setRunRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "done" } : r)));
      } catch (err) {
        let message = "Something went sideways. Try again?";
        if (err instanceof AnthropicAuthError) message = err.message;
        else if (err instanceof AnthropicRateLimitError) message = err.message;
        else if (err instanceof InvalidJsonResponseError) message = err.message;
        else if (err instanceof Error) message = err.message;

        setRunRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: message } : r)));
        toast.error(`${persona.name} couldn't weigh in`, { description: message });
        setRunning(false);
        return;
      }
    }

    const panelScore =
      results.length === 0 ? 0 : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    const test: Test = {
      id: newId(),
      feature_description: featureTrimmed,
      persona_ids: selectedPersonas.map((p) => p.id),
      results,
      panel_score: panelScore,
      created_at: new Date().toISOString(),
    };

    saveTest(test);
    toast.success("Panel's weighed in.");
    setRunning(false);
    navigate(`/test/${test.id}`);
  };

  if (personas.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-10 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your panel is empty</h1>
        <p className="text-muted-foreground">Add at least one persona before running a session.</p>
        <Button size="lg" onClick={() => navigate("/persona/new")} className="rounded-[10px]">
          Create your first persona
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <button
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          disabled={running}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Panel
        </button>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Run a session</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Describe what you're testing — add text, screenshots, mockups, or a PDF spec.
        </p>
      </div>

      {/* Feature input */}
      <section
        className={`space-y-0 rounded-2xl border bg-card shadow-warm transition-colors duration-150 ${
          isDragging ? "border-primary ring-2 ring-primary/30" : "border-border"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Text area */}
        <div className="space-y-3 p-6 pb-4">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="feature" className="font-display text-lg font-semibold">
              What feature should the panel react to?
            </label>
            {attachments.length === 0 && (
              <span className="text-xs text-muted-foreground">
                {featureTrimmed.length}/{MIN_FEATURE_LENGTH}+
              </span>
            )}
          </div>
          <Textarea
            id="feature"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            placeholder={
              attachments.length > 0
                ? "Optional — add context for your attached files…"
                : "e.g. A weekly digest email summarising every conversation a sales rep had, with auto-generated next steps and a one-click 'send to CRM' button…"
            }
            rows={6}
            disabled={running}
            className="resize-none rounded-xl bg-background"
          />
          {attachments.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Be specific — describe the behaviour, not just the name. Personas react better to detail.
            </p>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mx-6 mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {attachments.map((a, i) => (
              <AttachmentThumb key={i} attachment={a} onRemove={() => removeAttachment(i)} disabled={running} />
            ))}
          </div>
        )}

        {/* Upload bar */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isDragging ? (
              <span className="font-medium text-primary">Drop files here</span>
            ) : (
              <>
                <span>PNG, JPG, GIF, WebP, PDF</span>
                <span>·</span>
                <span>max 4.5 MB each</span>
                {attachments.length > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      {attachments.length}/{MAX_ATTACHMENTS} attached
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={running || attachments.length >= MAX_ATTACHMENTS}
            className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </section>

      {/* Persona picker */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Who's on the panel?</h2>
          <span className="text-sm text-muted-foreground">
            {selectedPersonas.length} of {personas.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {personas.map((persona) => {
            const checked = selectedIds.has(persona.id);
            return (
              <label
                key={persona.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200 ease-bounce ${
                  checked ? "border-primary bg-primary/10 shadow-warm" : "border-border bg-card hover:border-primary/40"
                } ${running ? "pointer-events-none opacity-60" : ""}`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleSelected(persona.id)}
                  disabled={running}
                  aria-label={`Include ${persona.name}`}
                />
                <img
                  src={getAvatarUrl(persona.avatar_seed ?? persona.id)}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full bg-subtle"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{persona.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{persona.role}</p>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Run button + live progress */}
      <section className="space-y-4">
        {running && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-warm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Session in progress…</span>
              <span className="text-muted-foreground">
                {completedCount} of {totalCount} done
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <ul className="space-y-2 pt-1">
              {runRows.map((row) => (
                <li key={row.persona.id} className="flex items-center gap-3 text-sm">
                  <StatusIcon status={row.status} />
                  <span
                    className={
                      row.status === "done"
                        ? "text-foreground"
                        : row.status === "running"
                          ? "font-medium text-foreground"
                          : row.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground"
                    }
                  >
                    {row.persona.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.status === "running" && "thinking…"}
                    {row.status === "pending" && "waiting"}
                    {row.status === "done" && "weighed in"}
                    {row.status === "error" && (row.error ?? "failed")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {!featureValid && !running && (featureTrimmed.length > 0 || attachments.length === 0) && (
            <p className="text-sm text-muted-foreground">
              {attachments.length === 0
                ? "A few more words and we're good to go."
                : "Add text or attach a file to continue."}
            </p>
          )}
          <Button
            size="lg"
            onClick={handleRun}
            disabled={!canRun}
            className="rounded-[10px] px-7 text-base transition-transform duration-200 ease-bounce enabled:hover:scale-[1.02]"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run session
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
};

/* ---------- Attachment thumbnail ---------- */

function AttachmentThumb({
  attachment,
  onRemove,
  disabled,
}: {
  attachment: Attachment;
  onRemove: () => void;
  disabled: boolean;
}) {
  const isImage = attachment.mediaType.startsWith("image/");

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-subtle">
      {isImage && attachment.previewUrl ? (
        <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center">
          {isImage ? (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          ) : (
            <FileText className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{attachment.name}</span>
        </div>
      )}

      {/* Overlay on hover */}
      {!disabled && (
        <div className="absolute inset-0 flex flex-col items-end justify-start bg-foreground/0 p-1 transition-all group-hover:bg-foreground/40">
          <button
            type="button"
            onClick={onRemove}
            className="flex h-5 w-5 translate-y-1 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-all hover:bg-foreground group-hover:translate-y-0 group-hover:opacity-100"
            aria-label={`Remove ${attachment.name}`}
          >
            <X className="h-3 w-3" />
          </button>
          {isImage && attachment.previewUrl && (
            <div className="mt-auto w-full translate-y-1 rounded-b-none rounded-t-md bg-foreground/70 px-1.5 py-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <p className="truncate text-[10px] leading-tight text-background">{attachment.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Status icon ---------- */

function StatusIcon({ status }: { status: PersonaRunStatus }) {
  if (status === "running") return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />;
  if (status === "done")
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  if (status === "error") return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
  return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />;
}

export default RunTest;
