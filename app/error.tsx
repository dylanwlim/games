"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="fallback-page">
      <div className="fallback-panel">
        <p className="fallback-kicker">Error</p>
        <h1>The launcher hit a recoverable issue.</h1>
        <p>Reset the view and the hub will reload locally.</p>
        <button className="primary-link as-button" type="button" onClick={reset}>
          Reset launcher
        </button>
      </div>
    </main>
  );
}
