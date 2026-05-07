import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { markOnboardingSeen } from "../lib/onboarding";

export function OnboardingIntroPage() {
  const navigate = useNavigate();

  function handleStart() {
    markOnboardingSeen();
    navigate("/concerns/new");
  }

  return (
    <AppLayout title="شروع نرم" showHeader={false}>
      <Card variant="hero" className="intro-card">
        <div className="calm-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <p className="eyebrow">برای کمی خلوت‌تر شدن ذهن</p>
        <h1>قرار نیست همه‌چیز را یک‌جا حل کنی.</h1>
        <p className="description">
          اینجا فقط چیزی را که ذهنت را درگیر کرده می‌نویسی، بعد با هم برایش
          یک قدم کوچک و قابل انجام پیدا می‌کنیم.
        </p>

        <div className="intro-note">
          <strong>همین که شروع کردی ارزش دارد.</strong>
          <span>لازم نیست همه‌چیز کامل باشد.</span>
        </div>

        <Button type="button" onClick={handleStart}>
          با یک یادداشت شروع کن
        </Button>
      </Card>
    </AppLayout>
  );
}
