type NormalSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function NormalSlider({ value, onChange }: NormalSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Volume</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-zinc-900 dark:accent-zinc-100"
      />
    </div>
  );
}

