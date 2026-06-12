import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page page--shop">
      <div className="empty">
        <h1 style={{ fontSize: 24 }}>Seite nicht gefunden</h1>
        <p>Die gewünschte Maschine oder Seite existiert nicht.</p>
        <Link className="btn btn--primary" href="/bagger">Zu den Baggern</Link>
      </div>
    </div>
  );
}
