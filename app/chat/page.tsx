"use client";
import React, { useState } from "react";

type MessageType = {
  type: "user" | "bot";
  text: string;
};

const Chat: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [responses, setResponses] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [model, setModel] = useState<string>("deepseek-r1:1.5b");

  const handleSend = async () => {
    if (!message.trim()) return;

    setResponses((prev) => [...prev, { type: "user", text: message }]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: message,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const jsonChunks = chunk.split("\n").filter(Boolean);

        for (const jsonChunk of jsonChunks) {
          try {
            const parsedChunk = JSON.parse(jsonChunk);
            if (parsedChunk.response) {
              // Add line break after </think> tag
              botResponse += parsedChunk.response.replace(
                /<\/think>/g,
                "</think>\n\n"
              );

              setResponses((prev) => {
                const last = prev[prev.length - 1];
                if (last?.type === "bot") {
                  return [
                    ...prev.slice(0, -1),
                    { type: "bot", text: botResponse },
                  ];
                }
                return [...prev, { type: "bot", text: botResponse }];
              });
            }
          } catch (error) {
            console.error("Error parsing chunk:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`min-h-screen w-full ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100"
      }`}
    >
      <div className="container mx-auto h-screen p-4 flex flex-row items-center">
        {/* Add informational message here */}
        <div className="w-80 mx-6">
          <div
            className={`mb-4 p-4 rounded-lg ${
              darkMode
                ? "bg-gray-700/50 border border-gray-600"
                : "bg-gray-200/80 border border-gray-300"
            }`}
          >
            <div className="flex items-start mb-2">
              <span className="mr-2">ℹ️</span>
              <h3 className="font-semibold text-lg">
                Requirements for Local Operation
              </h3>
            </div>
            <p className="text-sm mb-3">This chat interface requires:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <span className="font-medium">Ollama Installation</span>
                <ul className="list-disc list-inside ml-4 text-gray-500">
                  <li>
                    Download from{" "}
                    <a
                      href="https://ollama.ai"
                      target="_blank"
                      className="text-blue-400 hover:underline"
                    >
                      ollama.ai
                    </a>
                  </li>
                  <li>Install following platform instructions</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Start Ollama Server</span>
                <code className="ml-2 p-1 bg-gray-700/30 rounded text-xs font-mono">
                  ollama serve
                </code>
              </li>
              <li>
                <span className="font-medium">Download Model</span>
                <code className="ml-2 p-1 bg-gray-700/30 rounded text-xs font-mono">
                  ollama pull {model}
                </code>
              </li>
            </ol>
            <p className="mt-3 text-xs opacity-75">
              Ensure the model name matches exactly what you've downloaded via
              Ollama.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-3/5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`p-2 rounded-lg ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-black"
              } flex-grow mr-2`}
              placeholder="Model name"
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>

          <div
            className={`flex-1 rounded-lg p-4 overflow-y-auto ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {responses.map((res, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg whitespace-pre-wrap ${
                  res.type === "user"
                    ? darkMode
                      ? "bg-blue-600 ml-20"
                      : "bg-blue-100 ml-20"
                    : darkMode
                    ? "bg-gray-700 mr-20"
                    : "bg-gray-200 mr-20"
                }`}
                style={{ wordBreak: "break-word" }}
              >
                {res.text}
              </div>
            ))}
          </div>

          <div className="mt-4 flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className={`flex-grow p-2 rounded-l-lg ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-black"
              } focus:outline-none`}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`px-6 py-2 rounded-r-lg ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } ${isLoading && "opacity-50 cursor-not-allowed"}`}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
