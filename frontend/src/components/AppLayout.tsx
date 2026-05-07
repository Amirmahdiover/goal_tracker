import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
};

export function AppLayout({ children, title = "Goal Strategy" }: AppLayoutProps) {
  const location = useLocation();
  const showDashboardLink = location.pathname !== "/dashboard";

  return (
    <main className="app-shell" dir="rtl">
      <div className="app-frame">
        <header className="app-header">
          <div>
            <p className="app-kicker">Goal Strategy</p>
            <strong>{title}</strong>
          </div>
          {showDashboardLink ? <Link to="/dashboard">داشبورد</Link> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
