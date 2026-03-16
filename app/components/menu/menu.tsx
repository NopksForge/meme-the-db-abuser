import { MODES, SliderMode } from "../modes/config";

type MenuProps = {
  activeMode: SliderMode;
  onChange: (mode: SliderMode) => void;
};

export function Menu({ activeMode, onChange }: MenuProps) {
  return (
    <nav
      className="flex w-40 flex-col gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/70 p-2 text-xs text-zinc-200 backdrop-blur"
      aria-label="Volume adjuster modes"
    >
      <p className="my-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        Modes
      </p>
      <ul className="flex flex-col gap-1">
        {MODES.map((item) => {
          const isActive = item.id === activeMode;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={[
                  "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors",
                  isActive
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100",
                ].join(" ")}
              >
                <span className="text-[11px] font-medium">{item.label}</span>
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                  {item.description}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

