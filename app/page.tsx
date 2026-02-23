"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length === 4) {
      router.push(`/play/${trimmed}`);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="mb-8 text-4xl font-bold">AIE Quiz</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <label htmlFor="room-code" className="text-lg text-gray-300">
          Enter room code
        </label>
        <input
          id="room-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="0000"
          className="w-48 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-3xl tracking-widest focus:border-blue-500 focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={code.length !== 4}
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold transition hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          Join
        </button>
      </form>
    </main>
  );
}
