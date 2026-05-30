import Link from "next/link";

export default function NotFound() {
  return (
    <main className="fallback-page">
      <div className="fallback-panel">
        <p className="fallback-kicker">404</p>
        <h1>Game not found.</h1>
        <p>The launcher is still available from the hub.</p>
        <Link className="primary-link" href="/">
          Return to Dylan Games
        </Link>
      </div>
    </main>
  );
}
