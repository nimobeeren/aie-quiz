"use client";

import { useState } from "react";

interface NameEntryProps {
  onSubmit: (name: string) => void;
}

export default function NameEntry({ onSubmit }: NameEntryProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-4"
    >
      <h1 className="text-2xl font-bold">Join Quiz</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={20}
        aria-label="Your name"
        className="w-64 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-xl focus:border-blue-500 focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold transition hover:bg-blue-500 disabled:opacity-50"
      >
        Join
      </button>
    </form>
  );
}
