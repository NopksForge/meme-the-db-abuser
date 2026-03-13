type SliderMode =
  | "normal"
  | "alphabet"
  | "random"
  | "request"
  | "xo"
  | "dnd"
  | "horse_race"
  | "tinder";

type MenuProps = {
  activeMode: SliderMode;
  onChange: (mode: SliderMode) => void;
};

const ITEMS: { id: SliderMode; label: string; description: string }[] = [
  {
    id: "normal",
    label: "Normal",
    description: "",
  },
  {
    id: "alphabet",
    label: "Alphabet Order",
    description: "",
  },
  {
    id: "random",
    label: "Random",
    description: "",
  },
  {
    id: "request",
    label: "Request Form",
    description: "",
  },
  {
    id: "xo",
    label: "XO Game",
    description: "",
  },
  {
    id: "dnd",
    label: "DnD Dice Roll",
    description: "",
  },
  {
    id: "horse_race",
    label: "Horse Race",
    description: "",
  },
  {
    id: "tinder",
    label: "Tinder",
    description: "",
  },
];

export function Menu({ activeMode, onChange }: MenuProps) {
  return (
    <nav
      className="flex w-40 flex-col gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/70 p-2 text-xs text-zinc-200 backdrop-blur"
      aria-label="Volume adjuster modes"
    >
      <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
        Modes
      </p>
      <ul className="flex flex-col gap-1">
        {ITEMS.map((item) => {
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

