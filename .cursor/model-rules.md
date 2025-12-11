# Model Rules for This Repo

## Default models

- Planning, architecture, specs:
  - Use **GPT-5.1 (base or fast)**

- Code changes (small patches, test fixes, single-file edits):
  - Use **GPT-5.1 Codex Mini**

- Code changes (multi-file refactors, big feature work):
  - Use **GPT-5.1 Codex Fast**

- Documentation, long explanations, prose:
  - Use **Claude Sonnet / Opus**

- Do NOT use for engineering in this repo:
  - Gemini 3 Pro
  - DeepSeek R1 / V3
  - GPT-5 Nano / non-Codex Mini
  - Grok

## Quick rules

- When touching `src/` or `tests/` → always Codex (Mini or Fast).
- When running or fixing `npm test` / `pytest` → **Codex Mini**.
- When interpreting long TypeScript errors → Codex Mini or Codex Fast.
- When just asking "what next?" → GPT-5.1 (fast).
- For high-volume text (docs, investor narrative) → Sonnet/Opus.

## Prompt tags

- `CODE:` → I am asking you to write or edit code.
  - I will select **GPT-5.1 Codex Mini** (small) or **Codex Fast** (bigger).
  - You MUST respond with precise file edits or diffs only.

- `PLAN:` → I am asking for architectural reasoning or step planning.
  - I will select **GPT-5.1 (base or fast)**.
  - You MUST NOT edit files; only explain, plan, or outline.

- `DOC:` → I am asking for documentation or prose.
  - I will select **Sonnet / Opus**.
  - You MUST NOT change code, only write text.

- `TEST:` → I am asking you to interpret test output and propose minimal patches.
  - I will select **GPT-5.1 Codex Mini**.
  - You MUST avoid refactors and touch the smallest surface possible.
