"use client";

import { useCallback, useEffect, useState } from "react";

type TinderProps = {
  value: number;
  onChange: (value: number) => void;
};

function randomVolume(): number {
  return Math.floor(Math.random() * 101) / 100;
}

const VOLUME_CAPTIONS: Record<string, string[]> = {
  "0": [
    "The sound of silence",
    "Mime mode activated",
    "Your neighbors thank you",
    "Did you even plug it in?",
    "Literally nothing",
  ],
  "1-10": [
    "Ant whispering to ant",
    "For secret agents only",
    "Can you hear me now? No.",
    "Library voice on steroids",
    "Mosquito at a funeral",
  ],
  "11-20": [
    "ASMR enthusiast starter pack",
    "When parents are asleep",
    "Roommate is studying vibes",
    "Tiptoeing through audio",
    "Background music for fish",
  ],
  "21-30": [
    "Office appropriate™",
    "Pretending to work level",
    "Safe for Zoom calls",
    "Elevator music energy",
    "Dentist waiting room core",
  ],
  "31-40": [
    "Normal human behavior",
    "Suspiciously reasonable",
    "Your audiologist approves",
    "Boring but functional",
    "NPC volume setting",
  ],
  "41-50": [
    "Perfectly balanced",
    "The Switzerland of volume",
    "Mediocrity achieved",
    "Peak average energy",
    "Neither here nor there",
  ],
  "51-60": [
    "Starting to feel it",
    "The vibe is vibing",
    "Confidence is growing",
    "Getting spicy",
    "Mom might complain soon",
  ],
  "61-70": [
    "Party is warming up",
    "Neighbors know your taste now",
    "No more indoor voice",
    "Alexa is concerned",
    "Windows are vibrating",
  ],
  "71-80": [
    "Certified banger territory",
    "RIP eardrums (soon)",
    "Landlord has entered chat",
    "Your plants are stressed",
    "Local dogs are howling",
  ],
  "81-90": [
    "Approaching dangerous",
    "Tinnitus speedrun",
    "Noise complaint any% WR",
    "The walls are crying",
    "OSHA violation incoming",
  ],
  "91-99": [
    "Definitely friendly",
    "Just vibes and hearing loss",
    "Warranty voided",
    "Speakers praying for mercy",
    "911 on speed dial",
  ],
  "100": [
    "MAXIMUM CHAOS",
    "So anyway, I started blasting",
    "Goodbye cruel eardrums",
    "This is a cry for help",
    "WITNESS ME",
  ],
};

function getVolumeRange(percent: number): string {
  if (percent === 0) return "0";
  if (percent === 100) return "100";
  if (percent <= 10) return "1-10";
  if (percent <= 20) return "11-20";
  if (percent <= 30) return "21-30";
  if (percent <= 40) return "31-40";
  if (percent <= 50) return "41-50";
  if (percent <= 60) return "51-60";
  if (percent <= 70) return "61-70";
  if (percent <= 80) return "71-80";
  if (percent <= 90) return "81-90";
  return "91-99";
}

function getRandomCaption(volume: number): string {
  const percent = Math.round(volume * 100);
  const range = getVolumeRange(percent);
  const captions = VOLUME_CAPTIONS[range];
  return captions[Math.floor(Math.random() * captions.length)];
}

export function Tinder({ value, onChange }: TinderProps) {
  const [cardVolume, setCardVolume] = useState(() => randomVolume());
  const [cardCaption, setCardCaption] = useState(() => getRandomCaption(cardVolume));
  const [nextCardVolume, setNextCardVolume] = useState(() => randomVolume());
  const [nextCardCaption, setNextCardCaption] = useState(() => getRandomCaption(nextCardVolume));
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [feedback, setFeedback] = useState<"match" | "no_match" | null>(null);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [matchAnimating, setMatchAnimating] = useState(false);

  const nextCard = useCallback(() => {
    setCardVolume(nextCardVolume);
    setCardCaption(nextCardCaption);
    const newNextVolume = randomVolume();
    setNextCardVolume(newNextVolume);
    setNextCardCaption(getRandomCaption(newNextVolume));
    setDragX(0);
    setDragStart(null);
    setFeedback(null);
  }, [nextCardVolume, nextCardCaption]);

  useEffect(() => {
    if (feedback === "match") {
      setShowMatchOverlay(true);
      requestAnimationFrame(() => setMatchAnimating(true));
      const timer = setTimeout(() => {
        setMatchAnimating(false);
        setTimeout(() => {
          setShowMatchOverlay(false);
          nextCard();
        }, 300);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (feedback === "no_match") {
      const timer = setTimeout(nextCard, 0);
      return () => clearTimeout(timer);
    }
  }, [feedback, nextCard]);

  const handlePass = useCallback(() => {
    nextCard();
  }, [nextCard]);

  const handleLike = useCallback(() => {
    const isMatch = Math.random() < 0.5;
    setFeedback(isMatch ? "match" : "no_match");
    if (isMatch) {
      onChange(cardVolume);
    }
  }, [cardVolume, onChange]);

  const handleDragStart = (clientX: number) => {
    setDragStart(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (dragStart === null) return;
    setDragX(clientX - dragStart);
  };

  const handleDragEnd = () => {
    if (dragStart === null) return;
    const delta = dragX;
    const threshold = 80;
    if (delta < -threshold) {
      handlePass();
    } else if (delta > threshold) {
      handleLike();
    }
    setDragStart(null);
    setDragX(0);
  };

  const isPointer = (e: React.PointerEvent) =>
    e.pointerType === "touch" || e.pointerType === "mouse";

  const showHeart = dragStart !== null && dragX > 20;
  const showBrokenHeart = dragStart !== null && dragX < -20;
  const heartOpacity = Math.min(1, Math.max(0, (dragX - 20) / 100));
  const brokenHeartOpacity = Math.min(1, Math.max(0, (-dragX - 20) / 100));

  const dragProgress = Math.min(1, Math.abs(dragX) / 120);
  const nextCardScale = 0.9 + dragProgress * 0.1;
  const nextCardOpacity = 0.5 + dragProgress * 0.5;

  return (
    <div className="flex flex-col items-center gap-6">
      {showHeart && (
        <span
          className="absolute left-13/12 z-10 bottom-1/2 text-6xl"
          style={{ opacity: heartOpacity }}
        >
          ❤️
        </span>
      )}
      {showBrokenHeart && (
        <span
          className="absolute right-13/12 z-10 bottom-1/2 text-6xl"
          style={{ opacity: brokenHeartOpacity }}
        >
          💔
        </span>
      )}
      <div
        className="relative flex h-[320px] w-[240px] touch-none select-none items-center justify-center"
        onPointerDown={(e) => isPointer(e) && handleDragStart(e.clientX)}
        onPointerMove={(e) => isPointer(e) && handleDragMove(e.clientX)}
        onPointerUp={() => handleDragEnd()}
        onPointerLeave={() => handleDragEnd()}
        onPointerCancel={() => handleDragEnd()}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white shadow dark:border-zinc-700 dark:bg-zinc-900"
          style={{
            transform: `scale(${nextCardScale})`,
            opacity: nextCardOpacity,
            transition: dragStart !== null ? "none" : "all 0.2s ease-out",
          }}
        >
          <span className="text-5xl font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
            {Math.round(nextCardVolume * 100)}%
          </span>
          <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            volume
          </span>
          <span className="mt-4 px-4 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
            &quot;{nextCardCaption}&quot;
          </span>
        </div>
        <div
          className="absolute flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
            transition: dragStart !== null ? "none" : "transform 0.2s ease-out",
          }}
        >
          <span className="text-5xl font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
            {Math.round(cardVolume * 100)}%
          </span>
          <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            volume
          </span>
          <span className="mt-4 px-4 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
            &quot;{cardCaption}&quot;
          </span>
        </div>
      </div>
      {showMatchOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300"
          style={{ opacity: matchAnimating ? 1 : 0 }}
        >
          <div
            className="flex flex-col items-center transition-all duration-500 ease-out"
            style={{
              transform: matchAnimating ? "translateY(0)" : "translateY(100px)",
              opacity: matchAnimating ? 1 : 0,
            }}
          >
            <div className="text-2xl font-bold text-green-400">
              <i>It&apos;s a</i>
            </div>
            <div className="text-8xl font-bold text-green-400">
              <i>MATCH!</i>
            </div>
          </div>
        </div>
      )}
      <p className="text-center text-md text-zinc-500 dark:text-zinc-400">
        Current volume: {Math.round(value * 100)}%
      </p>
    </div>
  );
}
