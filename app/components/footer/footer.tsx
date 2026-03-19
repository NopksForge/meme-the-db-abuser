"use client";

import { useState } from "react";

export function Footer() {
  const [showToast, setShowToast] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("Noppasan.ksj@gmail.com");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <>
      <footer className="w-full py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>
          Have an idea? Check{" "}
          <a
            href="https://github.com/NopksForge/meme-the-db-abuser"
            target="_blank"
            rel="link to the repo"
            title="github: meme-the-db-abuser"
            className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            repo
          </a>{" "}
          or contact me:{" "}
          <button
            type="button"
            className="underline hover:text-zinc-600 dark:hover:text-zinc-300 bg-transparent p-0 border-0 cursor-pointer"
            style={{ fontFamily: "inherit", fontSize: "inherit" }}
            onClick={handleCopyEmail}
            title="Click to copy email"
          >
            Noppasan.ksj@gmail.com
          </button>
        </p>
      </footer>

      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          Email copied to clipboard!
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateX(-50%) translateY(10px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
