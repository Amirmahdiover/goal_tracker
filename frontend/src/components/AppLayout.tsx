import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
};

export function AppLayout({
  children,
  showHeader = true,
  title = "مسیر من",
}: AppLayoutProps) {
  const location = useLocation();
  const showDashboardLink = location.pathname !== "/dashboard";

  return (
    <main className="app-shell" dir="rtl">
      <div className="app-frame">
        {showHeader ? (
          <header className="app-header">
            <div>
              <p className="app-kicker">Goal Strategy</p>
              <strong>{title}</strong>
            </div>
            {showDashboardLink ? <Link to="/dashboard">خانه</Link> : null}
          </header>
        ) : null}
        {children}
      </div>
    </main>
  );
}
