import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";

export function OnboardingIntroPage() {
  const navigate = useNavigate();

  return (
    <AppLayout title="شروع آرام">
      <section className="hero-card">
        <p className="eyebrow">برای خالی‌تر شدن ذهن</p>
        <h1>لازم نیست همه‌چیز را امروز حل کنی.</h1>
        <p className="description">
          فقط چیزی که ذهنت را درگیر کرده بنویس و یک قدم کوچک برایش بساز.
        </p>
        <Button type="button" onClick={() => navigate("/concerns/new")}>
          شروع
        </Button>
      </section>
    </AppLayout>
  );
}
