"use client";

import { useMemo, useState } from "react";

type XoGameProps = {
  /** Current volume between 0 and 1 */
  value: number;
  /** Called with new volume (0–1) when the game ends */
  onChange: (value: number) => void;
};

type Player = "X" | "O";
type Cell = Player | null;

const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Cell[]): Player | "draw" | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every((cell) => cell !== null)) {
    return "draw";
  }

  return null;
}

function clampVolume(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function XoGame({ value, onChange }: XoGameProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [status, setStatus] = useState<string>("Your turn (you are X)");
  const [finished, setFinished] = useState(false);

  const volumePercent = useMemo(
    () => Math.round(clampVolume(value) * 100),
    [value],
  );

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setStatus("Your turn (you are X)");
    setFinished(false);
  };

  const handleGameEnd = (result: Player | "draw") => {
    if (result === "X") {
      setStatus("You win! Volume +1%");
      const next = clampVolume(value + 0.01);
      onChange(next);
    } else if (result === "O") {
      setStatus("You lose! Volume -2%");
      const next = clampVolume(value - 0.02);
      onChange(next);
    } else {
      setStatus("Draw! Volume -1%");
      const next = clampVolume(value - 0.01);
      onChange(next);
    }
    setFinished(true);
  };

  const handleCellClick = (index: number) => {
    if (finished) return;
    if (board[index] !== null) return;
    if (currentPlayer !== "X") return;

    const nextBoard = board.slice();
    nextBoard[index] = "X";
    setBoard(nextBoard);

    const resultAfterPlayer = checkWinner(nextBoard);
    if (resultAfterPlayer) {
      handleGameEnd(resultAfterPlayer);
      return;
    }

    setCurrentPlayer("O");
    setStatus("Computer's turn…");

    // Simple computer move (random empty cell)
    const emptyIndices = nextBoard
      .map((cell, idx) => (cell === null ? idx : -1))
      .filter((idx) => idx !== -1) as number[];

    if (emptyIndices.length === 0) {
      handleGameEnd("draw");
      return;
    }

    const randomIndex =
      emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    const boardAfterComputer = nextBoard.slice();
    boardAfterComputer[randomIndex] = "O";
    setBoard(boardAfterComputer);

    const resultAfterComputer = checkWinner(boardAfterComputer);
    if (resultAfterComputer) {
      handleGameEnd(resultAfterComputer);
      return;
    }

    setCurrentPlayer("X");
    setStatus("Your turn (you are X)");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>XO Game volume</span>
        <span className="font-medium">{volumePercent}%</span>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-800 p-1">
        {board.map((cell, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleCellClick(idx)}
            className="flex h-16 items-center justify-center rounded-md bg-zinc-900 text-xl font-bold text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={finished || cell !== null || currentPlayer !== "X"}
          >
            {cell}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-400">{status}</p>

      <button
        type="button"
        onClick={handleReset}
        className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
      >
        Reset game
      </button>
    </div>
  );
}

