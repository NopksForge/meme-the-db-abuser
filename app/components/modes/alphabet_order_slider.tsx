function numberToWords(n: number): string {
  if (n < 0 || n > 100 || !Number.isInteger(n)) {
    throw new RangeError("numberToWords supports only integers 0–100");
  }

  const ones = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];

  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];

  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n === 100) return "one hundred";

  const ten = Math.floor(n / 10);
  const rest = n % 10;

  if (rest === 0) return tens[ten];
  return `${tens[ten]} ${ones[rest]}`;
}

const ALPHABET_ORDERED_NUMBERS = Array.from({ length: 101 }, (_, value) => ({
  value, // 0–100
  label: numberToWords(value),
})).sort((a, b) => a.label.localeCompare(b.label));

type AlphabetOrderSliderProps = {
  /**
   * Current volume in the range 0–1.
   * Internally mapped to 0–100 and then to alphabet-ordered words.
   */
  value: number;
  /** Called with a volume in the range 0–1. */
  onChange: (volume: number) => void;
};

export function AlphabetOrderSlider({
  value,
  onChange,
}: AlphabetOrderSliderProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  const numericValue = Math.round(clampedValue * 100); // 0–100

  const currentIndex =
    ALPHABET_ORDERED_NUMBERS.findIndex((item) => item.value === numericValue) ??
    0;

  const safeIndex =
    currentIndex >= 0 ? currentIndex : 0;

  const handleSliderChange = (index: number) => {
    const clampedIndex = Math.min(
      ALPHABET_ORDERED_NUMBERS.length - 1,
      Math.max(0, index),
    );
    const numeric = ALPHABET_ORDERED_NUMBERS[clampedIndex].value; // 0–100
    onChange(numeric / 100); // 0–1
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Volume</span>
        <span className="font-medium">
          {ALPHABET_ORDERED_NUMBERS[safeIndex].label} (
          {ALPHABET_ORDERED_NUMBERS[safeIndex].value})
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={ALPHABET_ORDERED_NUMBERS.length - 1}
        step={1}
        value={safeIndex}
        onChange={(e) => handleSliderChange(Number(e.target.value))}
        className="w-full accent-zinc-900 dark:accent-zinc-100"
      />
      <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
        <span>
          {ALPHABET_ORDERED_NUMBERS[0].label} (
          {ALPHABET_ORDERED_NUMBERS[0].value})
        </span>
        <span>
          {
            ALPHABET_ORDERED_NUMBERS[ALPHABET_ORDERED_NUMBERS.length - 1]
              .label
          }{" "}
          (
          {
            ALPHABET_ORDERED_NUMBERS[ALPHABET_ORDERED_NUMBERS.length - 1]
              .value
          }
          )
        </span>
      </div>
    </div>
  );
}


