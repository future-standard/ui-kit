import { useState } from "react";
import { Button } from "@future-standard/button";
import "@future-standard/button/style.css";
import { LoadingButton } from "@future-standard/loading-button";
import "@future-standard/loading-button/style.css";
import { IconButton } from "@future-standard/icon-button";
import "@future-standard/icon-button/style.css";

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
  </svg>
);

export function App() {
  const [loading, setLoading] = useState(false);

  function handleLoadingClick() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1>@future-standard UI Kit</h1>

      <Section title="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="LoadingButton">
        <LoadingButton loading={loading} onClick={handleLoadingClick}>
          {loading ? "Submitting..." : "Submit"}
        </LoadingButton>
      </Section>

      <Section title="IconButton">
        <IconButton icon={<StarIcon />} aria-label="Favorite" />
        <IconButton icon={<StarIcon />} aria-label="Favorite" variant="secondary" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{title}</h2>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        {children}
      </div>
    </section>
  );
}
