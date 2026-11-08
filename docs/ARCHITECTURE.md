# Architecture

The layer sits between the user and any AI model. It does not replace the model — it gives the model (and the user) the context that makes vague instructions work.

```
User says something vague
        │
        ▼
┌──────────────────────────────┐
│  src/interpret.js            │  intent + slots + assumptions + confidence
│  "what did they mean?"       │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌──────────────┐
│ src/context  │ │ src/clarify  │
│ profile: who │ │ one question │
│ you are, what│ │ when a slot  │
│ you care     │ │ is missing   │
│ about, habits│ │              │
└──────┬───────┘ └──────┬───────┘
       │                │
       └───────┬────────┘
               ▼
        ┌──────────────┐
        │ src/learn.js │  corrections → profile facts
        └──────────────┘
               │
               ▼
        Action (or a model call via src/adapters/llm.js)
```

## The data model

### Profile (`src/context.js`)

```js
{
  name: "Alex",
  timezone: "America/Chicago",
  interests: ["Chicago Bears", "Home cooking"],
  projects: ["Weekend Bakery", "Neighborhood Running Club"],
  people: { "Sam": "friend", "Jo": "teammate" },
  preferences: {
    defaultPlatform: "X",
    tone: "funny",
    postLength: "short"
  },
  routines: ["post Bears content during the day"],
  facts: [] // learned corrections, newest first
}
```

Everything the layer assumes comes from here — never from nowhere. `facts` is append-only; a correction adds a fact, it never silently rewrites history.

### Interpretation result (`src/interpret.js`)

```js
{
  intent: "post",            // post | message | remind | schedule | buy | note | search | unknown
  topic: "Chicago Bears",   // filled from the words or the profile
  slots: { platform: "X", time: "today" },
  assumptions: [
    { slot: "platform", value: "X", source: "preference:defaultPlatform" }
  ],
  confidence: "medium",      // high | medium | low
  question: null,            // or the one clarifying question
  action: "Draft 3 funny Bears posts for X, spaced through today."
}
```

Rules:

- A slot filled from the profile **must** appear in `assumptions`, with its source. Silent guesses are bugs.
- `confidence` is `low` when any required slot is missing, `medium` when any slot was assumed, `high` only when every required slot was stated outright.
- `question` is set only when confidence is `low`, and it asks for the single most important missing slot.

### Required slots by intent

| Intent | Required slots |
|---|---|
| post | topic, platform |
| message | person |
| remind | task, time |
| schedule | event, time |
| buy | item |
| note | content |
| search | query |

## Extension points

### 1. New interpreters

Add an intent in `src/interpret.js`: a keyword pattern, its required slots, and its `action` template. Add examples to `examples/vague-instructions.md` and tests to `tests/interpret.test.mjs`. Keep patterns small and readable — if it needs a model, use an adapter instead.

### 2. Context providers

A provider is a function `provide(profile) -> partial profile updates`. Examples to build:

- Calendar provider: fills `time` slots from "tomorrow" using real events.
- Notes/files provider: fills `topic` from what the user has been working on.
- Location provider: fills "nearby" slots.

Providers must be opt-in and local-first. They never upload the profile.

### 3. LLM adapters (`src/adapters/llm.js`)

```js
// An adapter is any object with:
adapter.complete(prompt, context) // -> Promise<string>
```

Register one with `CommonSense.setAdapter(adapter)`. When set, `interpret()` uses the model for intent + slots and still runs the same assume/clarify/learn loop around it — the layer's job is the loop, not the guessing. Without an adapter, the rule-based interpreter runs. The demo ships with no adapter and no API keys.

### 4. Clarification strategies

`src/clarify.js` picks one question. Better strategies to build:

- Rank by **cost of being wrong** (guessing the wrong person is worse than guessing the wrong time).
- Ask in conversation, one question at a time, instead of all at once.
- Offer quick answers drawn from the profile (the demo does this).

### 5. Commonsense knowledge

A shared, human-readable base of facts like "rain → umbrella" or "3-7 team → fans are frustrated". Proposed format: one fact per line in `knowledge/*.md`, each with an example. Anyone can contribute a fact; the interpreter consults it when no profile fact applies.

## What this is not

- Not a model. The prototype has no model and makes no claim to "understand" in the human sense.
- Not a data collector. The profile lives in the browser's local storage in the demo, and in a file the user controls in the library.
- Not a replacement for asking. When the cost of guessing wrong is high, it asks. That's the point.
