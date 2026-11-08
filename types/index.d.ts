/**
 * common-sense-ai v0.3.0 — TypeScript type definitions
 */

export interface Profile {
  name: string;
  timezone: string;
  interests: string[];
  projects: string[];
  people: Record<string, string>;
  preferences: Preferences;
  routines: string[];
  facts: Fact[];
  calibration?: Record<string, CalibrationRecord>;
}

export interface Preferences {
  defaultPlatform: string | null;
  tone: string | null;
  postLength: 'short' | 'medium' | 'long';
}

export interface Fact {
  key: string;
  value: string;
  at: string;
}

export interface CalibrationRecord {
  hits: number;
  misses: number;
}

export type Intent = 'post' | 'message' | 'remind' | 'schedule' | 'buy' | 'note' | 'search' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export interface Slots {
  topic?:    string | null;
  platform?: string | null;
  person?:   string | null;
  content?:  string | null;
  task?:     string | null;
  event?:    string | null;
  time?:     string | null;
  item?:     string | null;
  query?:    string | null;
  tone?:     string | null;
  [key: string]: string | null | undefined;
}

export interface Assumption {
  slot:        string;
  value:       string;
  source:      string;
  unreliable?: boolean;
}

export interface InterpretResult {
  intent:      Intent;
  topic:       string | null;
  slots:       Slots;
  assumptions: Assumption[];
  confidence:  Confidence;
  question:    string | null;
  action:      string;
}

export type CorrectionType = 'fact' | 'preference' | 'interest' | 'person';

export interface Correction {
  type:   CorrectionType;
  key?:   string;
  value:  string;
}

export interface LearnResult {
  profile: Profile;
  note:    string;
}

export interface Turn {
  instruction: string;
  result:      InterpretResult;
  at:          number;
}

export interface LLMAdapter {
  complete(prompt: string, context: Record<string, unknown>): Promise<string>;
}

export type ProviderFn = (profile: Profile) => Promise<Partial<Slots>>;

export interface CalendarEvent {
  title: string;
  start: Date | string;
  end:   Date | string;
}

export interface RecentDoc {
  title:    string;
  editedAt: Date | string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface CommonSenseAPI {
  VERSION: string;

  setAdapter(adapter: LLMAdapter | null): LLMAdapter | null;
  getAdapter(): LLMAdapter | null;
  createLLMAdapter(fn: (prompt: string, context: Record<string, unknown>) => Promise<string>): LLMAdapter;
  createOpenAIAdapter(client: unknown, options?: { model?: string }): LLMAdapter;
  createAnthropicAdapter(client: unknown, options?: { model?: string }): LLMAdapter;
  completeWithAdapter(prompt: string, context?: Record<string, unknown>): Promise<string>;

  defaultProfile(): Profile;
  loadProfile(): Profile;
  saveProfile(profile: Profile): Profile;
  resetProfile(): Profile;

  interpret(instruction: string, profile?: Profile): InterpretResult;
  interpretAsync(instruction: string, profile?: Profile): Promise<InterpretResult>;

  clarify(result: { intent: string; slots: Slots; missing: string[] }): string | null;
  quickAnswers(slot: string, profile?: Profile): string[];

  learn(profile: Profile, correction: Correction): LearnResult;
  learnFromAnswer(profile: Profile, slot: string, answer: string): LearnResult;

  addTurn(instruction: string, result: InterpretResult): void;
  getHistory(): Turn[];
  clearHistory(): void;
  resolveFromHistory(slot: string): string | null;
  enrichFromHistory(result: InterpretResult): InterpretResult;

  recordAssumptionResult(profile: Profile, source: string, wasCorrect: boolean): Profile;
  isSourceReliable(profile: Profile, source: string): boolean;
  calibratedConfidence(profile: Profile, missing: string[], assumptions: Assumption[]): Confidence;
  recordCorrectionMiss(profile: Profile, slot: string, assumptions: Assumption[]): void;
  recordConfirmationHits(profile: Profile, assumptions: Assumption[]): void;

  registerProvider(name: string, fn: ProviderFn): string;
  unregisterProvider(name: string): void;
  runProviders(profile: Profile): Promise<Partial<Slots>>;
  createCalendarProvider(events: CalendarEvent[]): ProviderFn;
  createLocationProvider(coords: Coordinates, reverseGeocode: (lat: number, lon: number) => Promise<string>): ProviderFn;
  createNotesProvider(recentDocs: RecentDoc[]): ProviderFn;
}

declare const CommonSense: CommonSenseAPI;
export default CommonSense;
export { CommonSense };
