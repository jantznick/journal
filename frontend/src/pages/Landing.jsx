import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Get a prompt',
    body: 'Pick a focus in Settings, then generate a short writing prompt. Or use a one-time focus for a single session.',
  },
  {
    title: 'Write freely',
    body: 'A simple editor with bold, italic, and underline — nothing fancy. Save as many entries as you like.',
  },
  {
    title: 'Stay private',
    body: 'Optional: unlock an encryption key in the top bar. Entries are encrypted on your device before they’re stored.',
  },
  {
    title: 'See patterns',
    body: 'Insights can summarize entries into highlights and goals. Those goals help shape future prompts — you control whether AI is used at all.',
  },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
        Journal
      </p>
      <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
        A quiet place to write. Thoughtful prompts, optional private encryption, and light AI
        summaries you can turn off anytime.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          to="/register"
          className="inline-flex items-center justify-center rounded-lg bg-leaf px-5 py-3 text-sm font-semibold text-white hover:bg-leaf-dark"
        >
          Create account
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-lg border border-stone-400 bg-white/70 px-5 py-3 text-sm font-semibold text-ink hover:bg-white"
        >
          Sign in
        </Link>
      </div>

      <section className="mt-14 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-ink">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-stone-300/80 bg-white/70 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {i + 1}. {step.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/90">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-stone-300/80 bg-white/70 p-4 sm:p-5">
        <h2 className="font-display text-xl font-semibold text-ink">About AI</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          When enabled, AI can write prompts and optionally summarize entries. You choose the level:
          generic prompts (focus only, no personal data), personalized prompts (uses your goals and
          highlights), full prompts plus summaries, or no AI at all. Summaries produce short
          highlights and goals — those are what later personalized prompts can reuse, not your full
          journal history.
        </p>
      </section>
    </div>
  );
}
