type RandomButtonProps = {
  /** Receives a random volume between 0 and 1 */
  onRandom: (value: number) => void;
  /** Current volume between 0 and 1, for display */
  value: number;
};

export function RandomButton({ onRandom, value }: RandomButtonProps) {
  const handleClick = () => {
    // Random integer 0–100, then normalize to 0–1
    const randomPercent = Math.floor(Math.random() * 101);
    onRandom(randomPercent / 100);
  };

  return (
    <div >
        <div className="flex items-center justify-center text-xl text-zinc-500 dark:text-zinc-400 pb-7">
        {Math.round(value * 100)}%
        </div>

        <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
        >
        Roll a random volume
        </button>
    </div>

  );
}

