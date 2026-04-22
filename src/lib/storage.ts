/**
 * Jam Session — localStorage data layer.
 * Single root key: `jam-session-data`.
 */

export type Reaction = "loves" | "likes" | "mixed" | "rejects";

export interface Persona {
  id: string;
  name: string;
  role: string;
  company: string;
  goals: string[];
  pain_points: string[];
  behaviour: string;
  voice: string;
  quote: string;
  gaps: string[];
  /** Optional original free-text description used to structure the persona. */
  source_text?: string;
  /** Optional avatar seed if user reseeds; defaults to id. */
  avatar_seed?: string;
  created_at: string;
}

export interface TestPersonaResult {
  persona_id: string;
  reaction: Reaction;
  what_lands: string[];
  what_concerns: string[];
  questions_for_pm: string[];
  suggestion: string;
  score: number;
}

export interface Test {
  id: string;
  feature_description: string;
  persona_ids: string[];
  results: TestPersonaResult[];
  panel_score: number;
  created_at: string;
}

export type ModelId =
  | "claude-sonnet-4-6"
  | "claude-opus-4-7"
  | "claude-haiku-4-5-20251001";

export interface Settings {
  anthropic_api_key: string;
  model: ModelId;
}

export interface JamData {
  personas: Persona[];
  tests: Test[];
  settings: Settings;
}

const ROOT_KEY = "jam-session-data";
export const MAX_PERSONAS = 6;

const DEFAULT_DATA: JamData = {
  personas: [],
  tests: [],
  settings: {
    anthropic_api_key: "",
    model: "claude-sonnet-4-6",
  },
};

function read(): JamData {
  if (typeof window === "undefined") return structuredClone(DEFAULT_DATA);
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<JamData>;
    return {
      personas: parsed.personas ?? [],
      tests: parsed.tests ?? [],
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function write(data: JamData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOT_KEY, JSON.stringify(data));
}

export function newId(): string {
  return crypto.randomUUID();
}

/* ---------------- Personas ---------------- */

export function getPersonas(): Persona[] {
  return read().personas;
}

export function getPersona(id: string): Persona | undefined {
  return read().personas.find((p) => p.id === id);
}

export class PanelFullError extends Error {
  constructor() {
    super("Panel is full");
    this.name = "PanelFullError";
  }
}

/** Insert or update a persona by id. Throws PanelFullError if inserting beyond MAX_PERSONAS. */
export function savePersona(persona: Persona): Persona {
  const data = read();
  const idx = data.personas.findIndex((p) => p.id === persona.id);
  if (idx === -1) {
    if (data.personas.length >= MAX_PERSONAS) {
      throw new PanelFullError();
    }
    data.personas.push(persona);
  } else {
    data.personas[idx] = persona;
  }
  write(data);
  return persona;
}

export function deletePersona(id: string): void {
  const data = read();
  data.personas = data.personas.filter((p) => p.id !== id);
  write(data);
}

/* ---------------- Tests ---------------- */

export function getTests(): Test[] {
  // Newest first.
  return read().tests.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getTest(id: string): Test | undefined {
  return read().tests.find((t) => t.id === id);
}

export function saveTest(test: Test): Test {
  const data = read();
  const idx = data.tests.findIndex((t) => t.id === test.id);
  if (idx === -1) data.tests.push(test);
  else data.tests[idx] = test;
  write(data);
  return test;
}

/* ---------------- Settings ---------------- */

export function getSettings(): Settings {
  return read().settings;
}

export function saveSettings(settings: Settings): Settings {
  const data = read();
  data.settings = settings;
  write(data);
  return settings;
}

/* ---------------- Bulk ops ---------------- */

export function exportAll(): JamData {
  return read();
}

/**
 * Merge imported data into current state.
 * - Personas/tests merged by id (incoming overwrites existing).
 * - Settings overwritten by imported settings if present.
 * - Persona cap enforced after merge — extras dropped.
 */
export function importAll(incoming: Partial<JamData>): { droppedPersonas: number } {
  const current = read();
  const personaMap = new Map<string, Persona>();
  current.personas.forEach((p) => personaMap.set(p.id, p));
  (incoming.personas ?? []).forEach((p) => personaMap.set(p.id, p));
  const mergedPersonas = Array.from(personaMap.values());
  const droppedPersonas = Math.max(0, mergedPersonas.length - MAX_PERSONAS);

  const testMap = new Map<string, Test>();
  current.tests.forEach((t) => testMap.set(t.id, t));
  (incoming.tests ?? []).forEach((t) => testMap.set(t.id, t));

  const next: JamData = {
    personas: mergedPersonas.slice(0, MAX_PERSONAS),
    tests: Array.from(testMap.values()),
    settings: { ...current.settings, ...(incoming.settings ?? {}) },
  };
  write(next);
  return { droppedPersonas };
}

export function resetAll(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROOT_KEY);
}
