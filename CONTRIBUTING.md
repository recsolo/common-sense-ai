# Contributing to Common Sense AI

Thanks for wanting to build on this. The project is small on purpose — please keep it that way.

## How to contribute

1. Fork the repo and create a branch: `git checkout -b your-idea`.
2. Make your change. Add or update tests in `tests/` when you touch `src/`.
3. Run the tests: `node --test tests/`
4. Open a pull request. Describe what a vague instruction looks like before and after your change — that's the review that matters most.

## What makes a good contribution

- **A new intent or context provider** with examples in `examples/vague-instructions.md`.
- **A real LLM adapter** in `src/adapters/`.
- **Better clarification**: a smarter question, a better default, a cheaper mistake.
- **More examples**: real vague instructions and what they should mean.

## Ground rules

- **Show assumptions, don't hide them.** Every slot filled from context must appear in the result's `assumptions` list. A silent guess is a bug.
- **Ask once, never twice.** If a correction teaches a fact, store it in the profile via `learn.js`. Don't ask the same question again.
- **Keep the core readable.** If a new contributor can't follow `src/interpret.js` in one sitting, simplify.
- **Local-first.** No network calls, no tracking, no uploading the user's profile. Adapters that call an API must be opt-in and clearly labeled.
- **No fake intelligence.** Don't claim the prototype "understands" something it pattern-matched. Label confidence honestly.

## Code style

- Plain JavaScript, no build step, no dependencies for the core. The demo must run by opening `demo/index.html`.
- Two-space indent, single quotes, semicolons. Match the existing files.
- Every public function gets a one-line comment saying what it returns.

## Questions?

Open an issue with a vague instruction the layer gets wrong. That's the best kind of bug report here.
