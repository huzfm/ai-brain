"use client";

import { useState } from "react";

export default function Home() {
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  // 📄 Upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      setNotes(data.text);
    } catch {
      alert("Upload failed");
    }

    setUploading(false);
  };

  // 💬 Chat
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
    } catch {
      alert("Something went wrong");
    }

    setMessage("");
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 p-4 space-y-4 flex flex-col">
        <h1 className="text-xl font-bold">🧠 AI Brain</h1>

        <label className="block border-2 border-dashed border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />

          📄 Upload PDF

          {uploading && <div className="text-blue-400 text-xs">Uploading...</div>}
          {fileName && !uploading && (
            <div className="text-green-400 text-xs">✅ {fileName}</div>
          )}
        </label>

        <textarea
          placeholder="Paste notes..."
          className="w-full h-40 p-3 bg-gray-900 border border-gray-700 rounded text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={() => {
            setNotes("");
            setFileName("");
          }}
          className="text-xs text-red-400"
        >
          Clear
        </button>
      </div>

      {/* Chat */}
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chat.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "text-right" : ""}>
              <div className="p-4 rounded bg-gray-800">
                {msg.content}
              </div>

              {msg.extra && (
                <a href={msg.extra} target="_blank">
                  🔗 Join Meet
                </a>
              )}
            </div>
          ))}

          {loading && <div>🤖 Thinking...</div>}
        </div>

        <div className="p-4 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-3 bg-gray-900 border rounded"
          />

          <button onClick={sendMessage} className="bg-blue-600 px-4">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}