"use client";

import { useState } from "react";

export default function Home() {
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
  if (!message) return;

  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, notes }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setChat((prev) => [
      ...prev,
      { role: "user", content: message },
      {
        role: "assistant",
        content: data.answer || data.result,
        extra: data.meetLink,
      },
    ]);

  } catch (err) {
    alert("Something went wrong");
  }

  setMessage("");
  setLoading(false);
};

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 p-4 space-y-4">
        <h1 className="text-xl font-bold">🧠 AI Brain</h1>

        <textarea
          placeholder="Paste your notes or upload data..."
          className="w-full h-40 p-3 bg-gray-900 border border-gray-700 rounded"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="text-sm text-gray-400">
          Add your knowledge here. AI will answer from this.
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chat.map((msg, i) => (
            <div key={i} className={`max-w-xl ${msg.role === "user" ? "ml-auto text-right" : ""}`}>
              
              <div className={`p-4 rounded-xl ${
                msg.role === "user"
                  ? "bg-blue-600"
                  : "bg-gray-800"
              }`}>
                {msg.content}
              </div>

              {/* Extra (like Meet link) */}
              {msg.extra && (
                <a
                  href={msg.extra}
                  target="_blank"
                  className="text-blue-400 text-sm"
                >
                  Join Meet
                </a>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-gray-400">Thinking...</div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 flex gap-2">
          <input
            placeholder="Ask or give command..."
            className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}