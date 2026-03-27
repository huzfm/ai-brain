"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 📄 Upload
  const handleUpload = async (file: File) => {
    setUploading(true);

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

      setNotes((prev) => prev + "\n\n" + `=== ${file.name} ===\n` + data.text);
      setUploadedFiles((prev) => [...prev, file.name]);
    } catch {
      alert("Upload failed");
    }

    setUploading(false);
  };

  // 💬 Chat
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = message;
    setMessage("");
    setChat((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.result,
          extra: data.meetLink,
        },
      ]);

      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      {/* Sidebar */}
      <div className="w-72 border-r border-gray-800 p-4 flex flex-col gap-4">
        <h1 className="text-lg font-bold">🧠 AI Brain</h1>

        {/* Upload Box */}
        <label className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
            className="hidden"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach((file) => handleUpload(file));
            }}
          />
          <div className="text-2xl mb-1">📁</div>
          <div className="text-sm text-gray-400">
            {uploading ? (
              <span className="text-blue-400">Uploading...</span>
            ) : (
              "Click to upload files"
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            PDF, Word, Excel, CSV, TXT
          </div>
        </label>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Uploaded</div>
            {uploadedFiles.map((name, i) => (
              <div key={i} className="text-xs text-green-400 bg-gray-900 rounded px-2 py-1 truncate">
                ✅ {name}
              </div>
            ))}
          </div>
        )}

        {/* Manual Notes */}
        <textarea
          placeholder="Or paste notes manually..."
          className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded text-sm resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={() => { setNotes(""); setUploadedFiles([]); }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Clear all
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-3 text-sm text-gray-400">
          {uploadedFiles.length > 0
            ? `${uploadedFiles.length} file(s) loaded — ask anything`
            : "Upload files or paste notes to get started"}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chat.length === 0 && (
            <div className="text-center text-gray-600 mt-20">
              <div className="text-4xl mb-3">🧠</div>
              <div>Upload a file and ask a question</div>
              <div className="text-xs mt-2 text-gray-700">
                e.g. "What is the total in the Excel sheet?" or "Send email to john@example.com"
              </div>
            </div>
          )}

          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xl px-4 py-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                {msg.content}

                {msg.extra && (
                  <a
                  
                    href={msg.extra}
                    target="_blank"
                    className="block mt-2 text-blue-400 underline text-xs"
                  >
                    🔗 Join Google Meet
                  </a>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-2xl text-sm text-gray-400">
                🤖 Thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder='Ask a question or say "send email to..."'
            className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-xl text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 rounded-xl text-sm font-medium transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}