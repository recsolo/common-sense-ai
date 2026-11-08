# Common Sense AI

An open-source **common-sense layer** that helps AI understand vague, everyday instructions the way a person would — with context, assumptions, and one smart question when it matters.

You shouldn't have to spell out every detail for an AI to help you. Say *"post Bears content"* and it should know you mean the Chicago Bears, that you post on X, and that you like it funny. Say *"remind me about the thing tomorrow"* and it should know which thing, because it remembers your day.

That's what this project builds: not a bigger model, but a **layer between you and the model** that remembers, assumes, asks once, and learns.

> **Status: prototype.** The interpreter in `src/` is rule-based and deliberately small, so anyone can read it in an afternoon. It is the layer — not the model. Plug a real model in through `src/adapters/llm.js`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## The loop

```
You say something vague
        │
        ▼
  1. INTERPRET ── what did you probably mean? (intent + slots)
        │
        ▼
  2. ASSUME ── fill the gaps from your context (profile, history, habits)
        │
        ▼
  3. CLARIFY ── if something critical is still missing, ask ONE question
        │
        ▼
  4. LEARN ── your answer or correction updates the context, so next
              time it doesn't have to ask
```

## Try it

Open `demo/index.html` in a browser (or enable GitHub Pages on this repo). No build step, no keys, no server.

- Type something vague, like `post bears content` or `remind me about the thing tomorrow`.
- See what it understood, what it assumed from your context, and the one question it asks when it's unsure.
- Edit your context on the right. Correct it once, and it remembers.

See [examples/vague-instructions.md](examples/vague-instructions.md) for more things to try.

## How it works

| Piece | File | Job |
|---|---|---|
| Context profile | `src/context.js` | What the layer remembers about you: interests, projects, people, preferences, routines. |
| Interpreter | `src/interpret.js` | Turns a vague instruction into intent + slots, records every assumption, scores confidence. |
| Clarifier | `src/clarify.js` | Picks the single most important question when a critical slot is missing. |
| Learner | `src/learn.js` | Applies corrections back into the profile, so the same question is never asked twice. |
| LLM adapter | `src/adapters/llm.js` | Interface for plugging in a real model. The prototype runs without one. |

## Build on top of it

This project is meant to be extended. Good first contributions:

- **New interpreters** — an intent the rule-based one doesn't cover (e.g. cooking, travel, code).
- **New context providers** — calendar, email, files, location. Anything that fills slots without asking.
- **A real LLM adapter** — implement `complete(prompt, context)` in `src/adapters/llm.js` and the layer uses the model for interpretation while keeping the clarify/learn loop.
- **Better clarification** — ranking questions by cost of being wrong, not just by what's missing.
- **More examples** — vague instructions from real life, with expected interpretations.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the extension points and [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.

## Roadmap

- [ ] Pluggable LLM adapters (OpenAI / Anthropic / local models)
- [ ] Confidence calibration: track when assumptions were right vs. wrong
- [ ] Multi-turn clarification: one question at a time, in conversation
- [ ] Context providers: calendar, notes, browser history (opt-in, local-first)
- [ ] A shared commonsense knowledge base (facts like "rain → umbrella") that anyone can contribute to

## Principles

1. **Assume, then show your work.** Never silently guess on something that matters — show the assumption so the user can correct it in one tap.
2. **Ask once, never twice.** A correction is a fact. Store it.
3. **Local-first context.** Your profile lives with you. Nothing is uploaded by this layer.
4. **Small and readable.** If a contributor can't understand the core in an afternoon, it's too big.

## License

MIT. See [LICENSE](LICENSE).
