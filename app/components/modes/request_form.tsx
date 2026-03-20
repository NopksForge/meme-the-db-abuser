"use client";

import { useEffect, useState } from "react";

const INITIAL_FORM = {
  name: "",
  surname: "",
  age: "",
  email: "",
  telephone: "",
  reason: "",
  volume: "50",
};

const CONSENTS = [
  "I accept that my eardrums are my own responsibility",
  "I understand this form is completely unnecessary but I filled it anyway",
  "I promise not to sue if my neighbors call the police",
] as const;

const TRAP_CONSENT =
  "I have read everything above and would like to reset the form";

type RequestFormProps = {
  /** Called with requested volume as 0–1 when the form is submitted and valid */
  onSubmit: (volume: number) => void;
};

type FieldErrors = Partial<Record<keyof typeof INITIAL_FORM, string>>;

function validate(form: typeof INITIAL_FORM): FieldErrors {
  const errors: FieldErrors = {};

  const name = form.name.trim();
  if (!name) errors.name = "Required";
  else if (name.length < 2) errors.name = "At least 2 characters";

  const surname = form.surname.trim();
  if (!surname) errors.surname = "Required";
  else if (surname.length < 2) errors.surname = "At least 2 characters";

  const ageNum = parseInt(form.age, 10);
  if (form.age === "") errors.age = "Required";
  else if (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
    errors.age = "Enter 1–150";
  }

  const email = form.email.trim();
  if (!email) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Invalid email";
  }

  const tel = form.telephone.trim();
  if (!tel) errors.telephone = "Required";
  else if (!/^[\d\s\-+()]+$/.test(tel) || tel.replace(/\D/g, "").length < 6) {
    errors.telephone = "Valid number (6+ digits)";
  }

  const reason = form.reason.trim();
  if (!reason) errors.reason = "Required";
  else if (reason.length < 150) {
    errors.reason = `At least 150 characters (${reason.length}/150)`;
  }

  return errors;
}

const PLACEHOLDER_VARIANTS = {
  name: [
    "e.g. Audio Enjoyer",
    "e.g. Sir Loudsalot",
    "e.g. Neighbor’s Nightmare",
    "e.g. DJ Silence",
    "e.g. Volumina Maximus",
    "e.g. Count Decibel",
    "e.g. Sonic Squire",
    "e.g. The Quiet Destroyer",
  ],
  surname: [
    "e.g. McVolume",
    "e.g. Bassline",
    "e.g. Decibel",
    "e.g. Trebleman",
    "e.g. Hertzfeld",
    "e.g. Wavelet",
    "e.g. Basso",
    "e.g. Tremolo",
  ],
  age: [
    "e.g. 67",
    "e.g. 55",
    "e.g. 69",
    "e.g. 123",
  ],
  email: [
    "you@example.com",
    "noise@my.block",
    "sorry@neighbors.house",
    "basshead@boom.com",
    "quietmode@library.org",
    "agent.sonic@disco.net",
    "loudest@arena.zone",
    "notabot@mail.fake",
  ],
  telephone: [
    "+1 555 0199",
    "06 12 34 56 78",
    "(020) 7946 0958",
    "+44 7000 123456",
    "123-456-7890",
    "+81 90-1234-5678",
    "+358 50 1234567",
  ],
  reason: [
    "Explain in painful detail why the volume must change (150+ chars). The committee reads every word. Twice.",
    "Start with your life story, pivot to acoustics, end with a plea. Minimum one novella paragraph.",
    "Describe the spiritual journey that led you to this slider. Be thorough — brevity is invalid.",
    "Imagine you are Proust. Now explain your need for audio adjustment, using at least three metaphors.",
    "Consider this your audio manifesto. Persuade us with all your decibels and passion.",
    "If Beethoven could write this, how would he plead for volume? Channel that energy.",
    "Describe how the current volume impacts your existence. Hyperbole is encouraged.",
    "Write a poem about your quest for decibel perfection. Rhymes not required, but appreciated.",
  ],
} as const;

type FormFieldKey = keyof typeof INITIAL_FORM;

function pickVariant<T extends readonly string[]>(variants: T): T[number] {
  return variants[Math.floor(Math.random() * variants.length)]!;
}

export function RequestForm({ onSubmit }: RequestFormProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormFieldKey, boolean>>>(
    {},
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [placeholders] = useState(() => ({
    name: pickVariant(PLACEHOLDER_VARIANTS.name),
    surname: pickVariant(PLACEHOLDER_VARIANTS.surname),
    age: pickVariant(PLACEHOLDER_VARIANTS.age),
    email: pickVariant(PLACEHOLDER_VARIANTS.email),
    telephone: pickVariant(PLACEHOLDER_VARIANTS.telephone),
    reason: pickVariant(PLACEHOLDER_VARIANTS.reason),
  }));
  const [consents, setConsents] = useState<boolean[]>(
    CONSENTS.map(() => false),
  );
  const [consentTouched, setConsentTouched] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [showTrapToast, setShowTrapToast] = useState(false);

  useEffect(() => {
    const next = validate(form);
    const merged: FieldErrors = {};
    for (const key of Object.keys(INITIAL_FORM) as FormFieldKey[]) {
      if (submitAttempted || touched[key]) {
        const err = next[key];
        if (err) merged[key] = err;
      }
    }
    setErrors(merged);
  }, [form, touched, submitAttempted]);

  useEffect(() => {
    if (!consentTouched) return;
    setConsentError(!consents.every(Boolean));
  }, [consents, consentTouched]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: FormFieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const toggleConsent = (index: number) => {
    setConsentTouched(true);
    setConsents((prev) => prev.map((c, i) => (i === index ? !c : c)));
  };

  const handleTrapConsent = () => {
    setForm(INITIAL_FORM);
    setConsents(CONSENTS.map(() => false));
    setTouched({});
    setSubmitAttempted(false);
    setConsentTouched(false);
    setConsentError(false);
    setShowTrapToast(true);
    setTimeout(() => setShowTrapToast(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setConsentTouched(true);

    const nextErrors = validate(form);
    const allConsentsChecked = consents.every(Boolean);

    if (Object.keys(nextErrors).length > 0 || !allConsentsChecked) {
      return;
    }

    const numeric = parseInt(form.volume, 10);
    const normalized = Math.max(0, Math.min(1, numeric / 100));
    onSubmit(normalized);
    setForm(INITIAL_FORM);
    setConsents(CONSENTS.map(() => false));
    setTouched({});
    setSubmitAttempted(false);
    setConsentTouched(false);
    setConsentError(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-xs text-zinc-900 dark:text-zinc-100"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] text-zinc-900 dark:text-zinc-400">Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={() => handleBlur("name")}
            placeholder={placeholders.name}
            autoComplete="given-name"
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.name ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
          />
          {errors.name && (
            <p className="text-[10px] text-red-400">{errors.name}</p>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-[11px] text-zinc-900 dark:text-zinc-400">Surname</span>
          <input
            name="surname"
            value={form.surname}
            onChange={handleChange}
            onBlur={() => handleBlur("surname")}
            placeholder={placeholders.surname}
            autoComplete="family-name"
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.surname ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
          />
          {errors.surname && (
            <p className="text-[10px] text-red-400">{errors.surname}</p>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-[11px] text-zinc-900 dark:text-zinc-400">Age</span>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            onBlur={() => handleBlur("age")}
            placeholder={placeholders.age}
            autoComplete="off"
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.age ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
          />
          {errors.age && (
            <p className="text-[10px] text-red-400">{errors.age}</p>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-[11px] text-zinc-900 dark:text-zinc-400">Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={() => handleBlur("email")}
            placeholder={placeholders.email}
            autoComplete="email"
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.email ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
          />
          {errors.email && (
            <p className="text-[10px] text-red-400">{errors.email}</p>
          )}
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-[11px] text-zinc-900 dark:text-zinc-400">Telephone</span>
          <input
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
            onBlur={() => handleBlur("telephone")}
            placeholder={placeholders.telephone}
            autoComplete="tel"
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.telephone ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
          />
          {errors.telephone && (
            <p className="text-[10px] text-red-400">{errors.telephone}</p>
          )}
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="flex items-center justify-between text-[11px] text-zinc-900 dark:text-zinc-400">
            <span>Reason for change request</span>
            <span className="text-zinc-500">{`${form.reason.length}/150`}</span>
          </span>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            onBlur={() => handleBlur("reason")}
            placeholder={placeholders.reason}
            rows={4}
            className={`w-full resize-none rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.reason ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
          />
          {errors.reason && (
            <p className="text-[10px] text-red-400">{errors.reason}</p>
          )}
        </label>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-[11px] text-zinc-900 dark:text-zinc-400">
          <span>Volume requested (0–100%)</span>
          <span className="text-zinc-200">{form.volume || "?"}%</span>
        </label>
        <input
          type="range"
          name="volume"
          min={0}
          max={100}
          value={form.volume}
          onChange={handleChange}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-zinc-700">
        <p className="text-[11px] text-zinc-900 dark:text-zinc-400">Terms & Conditions</p>
        {CONSENTS.map((text, i) => (
          <label
            key={i}
            className="flex items-start gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={consents[i]}
              onChange={() => toggleConsent(i)}
              className="mt-0.5 accent-zinc-100"
            />
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
              {text}
            </span>
          </label>
        ))}
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={false}
            onChange={handleTrapConsent}
            className="mt-0.5 accent-zinc-100"
          />
          <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
            I have read everything above and{" "}
            <span
              className={`transition-colors duration-300 ${showTrapToast ? "bg-red-500 text-white px-1 rounded" : ""}`}
            >
              would like to reset the form
            </span>
          </span>
        </label>
        {consentError && (
          <p className="text-[10px] text-red-400">
            You must agree to (almost) all terms and conditions
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Submit request
      </button>

    </form>
  );
}
