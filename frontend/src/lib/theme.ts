import type { CSSProperties } from "react";

export const colors = {
  bg: "#0f1419",
  surface: "#1a2332",
  surfaceAlt: "#243044",
  border: "#2d3a4f",
  text: "#e8edf4",
  muted: "#8b9cb3",
  accent: "#3b82f6",
  accentHover: "#2563eb",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export const layout: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${colors.bg} 0%, #121a24 50%, ${colors.bg} 100%)`,
    color: colors.text,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "2rem 1.25rem 4rem",
  },
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "1.5rem",
  },
};
