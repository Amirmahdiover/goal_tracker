import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { TextArea } from "../components/TextArea";
import { createConcern, SOFT_ERROR_MESSAGE } from "../lib/api";

export function ConcernInputPage() {
  const navigate = useNavigate();
  const [concerns, setConcerns] = useState(["", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const texts = concerns.map((item) => item.trim()).filter(Boolean);

    if (texts.length === 0) {
      setError("حداقل یک نگرانی را بنویس.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await Promise.all(texts.map((text) => createConcern(text)));
      navigate("/concerns/select");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="نگرانی‌ها">
      <section className="card">
        <h1>چه چیزهایی ذهنت را درگیر کرده؟</h1>
        <p className="description">
          نگرانی‌ها فقط برای خالی‌تر شدن ذهن تو ثبت می‌شوند.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {concerns.map((concern, index) => (
            <TextArea
              key={index}
              label={`نگرانی ${index + 1}`}
              value={concern}
              rows={3}
              onChange={(event) => {
                const nextConcerns = [...concerns];
                nextConcerns[index] = event.target.value;
                setConcerns(nextConcerns);
              }}
              placeholder="چیزی که این روزها ذهنت را درگیر کرده..."
            />
          ))}

          {error ? <p className="error-banner">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "در حال ثبت..." : "ادامه"}
          </Button>
        </form>
      </section>
    </AppLayout>
  );
}
