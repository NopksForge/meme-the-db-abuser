 "use client";
import { useEffect, useRef, useState } from "react";
import { MODES, SliderMode } from "./components/modes/config";
import { Menu } from "./components/menu/menu";
import { Footer } from "./components/footer/footer";

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0);
  const [mode, setMode] = useState<SliderMode>(MODES[0]?.id ?? "normal");

  // Try to start playback on mount (may still be blocked by browser autoplay policies)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Ignore errors; browser may require a user interaction first
      });
    }
  }, [volume]);

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Menu activeMode={mode} onChange={setMode} />
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 py-20 px-6 bg-white dark:bg-black sm:px-12">
        <div className="hidden sm:block">
          
        </div>

        <div className="space-y-1 text-center sm:text-left">
          <p className="text-2xl font-semibold tracking-tight">
            The dB Abuser
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            /Bro said “lemme fix the volume real quick”/
          </p>
        </div>

        <section className="w-full max-w-xl space-y-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
          <audio
            ref={audioRef}
            src="/Mii_Channel.mp3"
            autoPlay
            loop
            className="hidden"
          />

          {MODES.find((m) => m.id === mode)?.render(volume, handleVolumeChange)}
        </section>

        <Footer />
      </main>
    </div>
  );
}
