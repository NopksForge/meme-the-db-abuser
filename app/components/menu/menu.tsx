"use client";

import { useEffect, useState } from "react";
import { MODES, SliderMode } from "../modes/config";

type MenuProps = {
  activeMode: SliderMode;
  onChange: (mode: SliderMode) => void;
};

export function Menu({ activeMode, onChange }: MenuProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const ua =
      navigator.userAgent || (navigator as any).vendor || (window as any).opera;

    const mobileRegex =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;

    setIsMobile(mobileRegex.test(ua));
  }, []);

  const desktopOnlyModeIds: SliderMode[] = ["snake", "audition"];
  const desktopOnlyModes = MODES.filter((m) => desktopOnlyModeIds.includes(m.id));
  const normalModes = MODES.filter((m) => !desktopOnlyModeIds.includes(m.id));

  return (
    <div className="text-xs text-zinc-200">
      {isMobile ? (
        <div className="pointer-events-none fixed left-3 top-3 z-50">
          <div className="pointer-events-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-[11px] font-medium text-zinc-100 shadow-lg"
              aria-label="Toggle modes menu"
            >
              <span className="flex flex-col gap-[3px]">
                <span className="h-[1.5px] w-4 rounded-full bg-zinc-200" />
                <span className="h-[1.5px] w-4 rounded-full bg-zinc-200" />
                <span className="h-[1.5px] w-4 rounded-full bg-zinc-200" />
              </span>
              <span>Modes</span>
            </button>

            <nav
              className={[
                "mt-2 flex w-32 flex-col gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/90 p-2 text-xs text-zinc-200 shadow-xl backdrop-blur transition-all duration-200 origin-top transform",
                isOpen
                  ? "pointer-events-auto opacity-100 scale-100 translate-y-0"
                  : "pointer-events-none opacity-0 scale-95 -translate-y-1",
              ].join(" ")}
              aria-label="Volume adjuster modes"
              aria-hidden={!isOpen}
            >
              <ul className="flex flex-col gap-1">
                {normalModes.map((item) => {
                  const isActive = item.id === activeMode;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(item.id);
                          setIsOpen(false);
                        }}
                        className={[
                          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors",
                          isActive
                            ? "bg-zinc-800 text-zinc-50"
                            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100",
                        ].join(" ")}
                      >
                        <span className="text-[11px] font-medium">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                          {item.description}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {desktopOnlyModes.length > 0 && (
                <>
                  <p className="mt-4 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    PC Only
                  </p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {desktopOnlyModes.map((item) => {
                      const isActive = item.id === activeMode;

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={undefined}
                            disabled
                            className={[
                              "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors",
                              isActive
                                ? "bg-zinc-800 text-zinc-50"
                                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100",
                              "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-zinc-400",
                            ].join(" ")}
                          >
                            <span className="text-[11px] font-medium">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                              {item.description}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </nav>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

