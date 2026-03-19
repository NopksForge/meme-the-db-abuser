"use client";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="fixed right-4 top-4 z-60 inline-flex h-10 w-20 items-center rounded-full border border-zinc-300 bg-white/90 p-1 shadow-lg backdrop-blur transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:bg-zinc-800"
    >
      <span
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform duration-200",
          isDark
            ? "translate-x-10 bg-zinc-800 text-zinc-100"
            : "translate-x-0 bg-amber-100 text-amber-700",
        ].join(" ")}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
      <span className="sr-only">
        Current theme: {isDark ? "dark" : "light"}
      </span>
    </button>
  );
}
