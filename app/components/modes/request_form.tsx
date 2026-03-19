"use client";

import { useState } from "react";

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

export function RequestForm({ onSubmit }: RequestFormProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [consents, setConsents] = useState<boolean[]>(
    CONSENTS.map(() => false),
  );
  const [consentError, setConsentError] = useState(false);
  const [showTrapToast, setShowTrapToast] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggleConsent = (index: number) => {
    setConsents((prev) => prev.map((c, i) => (i === index ? !c : c)));
    setConsentError(false);
  };

  const handleTrapConsent = () => {
    setForm(INITIAL_FORM);
    setConsents(CONSENTS.map(() => false));
    setErrors({});
    setConsentError(false);
    setShowTrapToast(true);
    setTimeout(() => setShowTrapToast(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    const allConsentsChecked = consents.every(Boolean);
    if (!allConsentsChecked) {
      setConsentError(true);
    }

    if (Object.keys(nextErrors).length > 0 || !allConsentsChecked) {
      return;
    }

    const numeric = parseInt(form.volume, 10);
    const normalized = Math.max(0, Math.min(1, numeric / 100));
    onSubmit(normalized);
    setForm(INITIAL_FORM);
    setConsents(CONSENTS.map(() => false));
    setErrors({});
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
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 dark:bg-zinc-900 dark:text-zinc-100 ${errors.name ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
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
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 dark:bg-zinc-900 dark:text-zinc-100 ${errors.surname ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
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
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 dark:bg-zinc-900 dark:text-zinc-100 ${errors.age ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
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
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 dark:bg-zinc-900 dark:text-zinc-100 ${errors.email ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
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
            className={`w-full rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 dark:bg-zinc-900 dark:text-zinc-100 ${errors.telephone ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
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
            rows={3}
            className={`w-full resize-none rounded-md border bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 dark:bg-zinc-900 dark:text-zinc-100 ${errors.reason ? "border-red-500/80" : "border-zinc-300 dark:border-zinc-700"}`}
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
