import type { ReactNode } from "react";
import { NormalSlider } from "./normal_slider";
import { AlphabetOrderSlider } from "./alphabet_order_slider";
import { RandomButton } from "./random_button";
import { RequestForm } from "./request_form";
import { XoGame } from "./xo";
import { DndDiceRoll } from "./roll_20";
import { HorseRace } from "./horse_race";
import { Tinder } from "./tinder";
import { Plinko } from "./plinko";
import { Snake } from "./snake";
import { Pair } from "./pair";
import { HoldCar } from "./hold_car";
import { Audition } from "./audition";
import { Farm } from "./farm";

export type SliderMode =
  | "normal"
  | "alphabet"
  | "random"
  | "request"
  | "xo"
  | "dnd"
  | "horse_race"
  | "tinder"
  | "plinko"
  | "snake"
  | "pair"
  | "car"
  | "audition"
  | "farm";

export type ModeDefinition = {
  id: SliderMode;
  label: string;
  description: string;
  render: (volume: number, handleVolumeChange: (value: number) => void) => ReactNode;
};

export const MODES: ModeDefinition[] = [
  {
    id: "normal",
    label: "Normal",
    description: "",
    render: (volume, handleVolumeChange) => (
      <NormalSlider value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "alphabet",
    label: "Alphabet Order",
    description: "",
    render: (volume, handleVolumeChange) => (
      <AlphabetOrderSlider value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "random",
    label: "Random",
    description: "",
    render: (volume, handleVolumeChange) => (
      <RandomButton value={volume} onRandom={handleVolumeChange} />
    ),
  },
  {
    id: "request",
    label: "Request Form",
    description: "",
    render: (_volume, handleVolumeChange) => (
      <RequestForm onSubmit={handleVolumeChange} />
    ),
  },
  {
    id: "xo",
    label: "XO Game",
    description: "",
    render: (volume, handleVolumeChange) => (
      <XoGame value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "dnd",
    label: "DnD Dice Roll",
    description: "",
    render: (volume, handleVolumeChange) => (
      <DndDiceRoll value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "horse_race",
    label: "Horse Race",
    description: "",
    render: (volume, handleVolumeChange) => (
      <HorseRace value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "tinder",
    label: "Tinder",
    description: "",
    render: (volume, handleVolumeChange) => (
      <Tinder value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "plinko",
    label: "Plinko",
    description: "",
    render: (volume, handleVolumeChange) => (
      <Plinko value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "snake",
    label: "Snake",
    description: "",
    render: (volume, handleVolumeChange) => (
      <Snake value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "pair",
    label: "Pair",
    description: "",
    render: (volume, handleVolumeChange) => (
      <Pair value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "car",
    label: "Car",
    description: "",
    render: (volume, handleVolumeChange) => (
      <HoldCar value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "audition",
    label: "Audition",
    description: "",
    render: (volume, handleVolumeChange) => (
      <Audition value={volume} onChange={handleVolumeChange} />
    ),
  },
  {
    id: "farm",
    label: "Farm",
    description: "",
    render: (volume, handleVolumeChange) => (
      <Farm value={volume} onChange={handleVolumeChange} />
    ),
  },
];

