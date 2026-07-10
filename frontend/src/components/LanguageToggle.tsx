"use client";

import { colors } from "@/lib/theme";
import { useLocale } from "@/lib/locale-context";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const t = getMessages(locale);

  return (
    <div
      role="group"
      aria-label={t.langSwitchLabel}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: "0.8125rem",
        flexShrink: 0,
      }}
    >
      <LangButton
        code="en"
        label={t.langEn}
        active={locale === "en"}
        onSelect={setLocale}
        position="first"
      />
      <span style={{ color: colors.muted, userSelect: "none" }} aria-hidden="true">
        /
      </span>
      <LangButton
        code="ja"
        label={t.langJa}
        active={locale === "ja"}
        onSelect={setLocale}
        position="last"
      />
    </div>
  );
}

function LangButton({
  code,
  label,
  active,
  onSelect,
  position,
}: {
  code: Locale;
  label: string;
  active: boolean;
  onSelect: (locale: Locale) => void;
  position: "first" | "last";
}) {
  const aria =
    position === "first" ? `Switch language to English` : `Switch language to Japanese`;

  return (
    <button
      type="button"
      onClick={() => onSelect(code)}
      aria-label={aria}
      aria-current={active ? "true" : undefined}
      style={{
        padding: "0.25rem 0.5rem",
        border: "none",
        borderRadius: 4,
        background: active ? colors.surfaceAlt : "transparent",
        color: active ? colors.text : colors.muted,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        fontSize: "inherit",
        lineHeight: 1.2,
      }}
    >
      {label}
    </button>
  );
}
