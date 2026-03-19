import type { SliderMode } from "../modes/config";

export type HallOfFameItem = {
  username: string;
  achievementName: string;
  description: string;
  achievedAt: string;
  mode: SliderMode;
  pic: string;
};

export const HALL_OF_FAME_LIST: HallOfFameItem[] = [
  {
    username: "wearpp",
    achievementName: "No Card Left Behind",
    description: "First to match every pair in under 30 minutes.",
    achievedAt: "2026-03-19",
    mode: "pair",
    pic: "/wearpp.jpeg",
  },
];
