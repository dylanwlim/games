"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="fallback-page">
          <div className="fallback-panel">
            <p className="fallback-kicker">Error</p>
            <h1>Dylan Games needs a reset.</h1>
            <p>The page can recover without leaving the app.</p>
            <button className="primary-link as-button" type="button" onClick={reset}>
              Reset
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
