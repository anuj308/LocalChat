"use client";
import React, { useState, useEffect } from "react";
// import
type MessageType = {
  type: "user" | "bot";
  text: string;
  timestamp?: number;
  duration?: number;
};

const Home: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [responses, setResponses] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [model, setModel] = useState<string>("DeepSeek-R1");
  const [showThink, setShowThink] = useState<boolean>(true);
  const [textareaRows, setTextareaRows] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    const savedShowThink = localStorage.getItem("showThink") !== "false";
    const savedModel = localStorage.getItem("model") || "DeepSeek-R1";
    setDarkMode(savedDarkMode);
    setShowThink(savedShowThink);
    setModel(savedModel);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    localStorage.setItem("showThink", showThink.toString());
    localStorage.setItem("model", model);
  }, [darkMode, showThink, model]);

  const parseResponse = (text: string): React.JSX.Element[] => {
    const elements: React.JSX.Element[] = [];
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = text.split(thinkRegex);

    parts.forEach((part, index) => {
      if (index % 2 === 1 && showThink) {
        elements.push(<span key={`think-${index}`}>{part}</span>);
      } else if (index % 2 === 0) {
        let lastIndex = 0;
        let match;

        while ((match = codeRegex.exec(part)) !== null) {
          const [ lang, code] = match;
          const currentKey = `code-${index}-${match.index}`;

          if (match.index > lastIndex) {
            elements.push(
              <span key={`text-${lastIndex}`}>
                {part.substring(lastIndex, match.index)}
              </span>
            );
          }

          elements.push(
            <div
              key={currentKey}
              className={` transition-colors p-1.5 rounded-lg mx-2 overflow-x-auto ${
                darkMode
                  ? "text-gray-300 bg-black"
                  : "text-gray-800 hover:bg-gray-200"
              }`}
              title="Copy code"
            >
              <div className="flex justify-between mx-2">
                <button
                  className={`p-1 rounded ${
                    darkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"
                  }`}
                >
                  {lang || "code"}
                </button>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(code);
                    setCopiedKey(currentKey);
                    setTimeout(() => setCopiedKey(null), 2000);
                  }}
                  className={`p-1 rounded ${
                    darkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"
                  }`}
                >
                  {copiedKey === currentKey ? "Copied!" : " Copy"}
                </button>
              </div>
              <pre>
                <code>{code}</code>
              </pre>
            </div>
          );

          lastIndex = codeRegex.lastIndex;
        }

        if (lastIndex < part.length) {
          elements.push(
            <span key={`text-${lastIndex}`}>{part.substring(lastIndex)}</span>
          );
        }
      }
    });

    return elements;
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    const rows = Math.min(Math.max(value.split("\n").length, 1), 6);
    setTextareaRows(rows);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const startTime = Date.now();
    setResponses((prev) => [...prev, { type: "user", text: message }]);
    setMessage("");
    setTextareaRows(1);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: message }],
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        botResponse += decoder.decode(value);

        setResponses((prev) => {
          const last = prev[prev.length - 1];
          return last?.type === "bot"
            ? [...prev.slice(0, -1), { type: "bot", text: botResponse }]
            : [...prev, { type: "bot", text: botResponse }];
        });
      }
      const duration = Math.round((Date.now() - startTime) / 1000);
      setResponses((prev) => {
        return prev.map((msg, index) => {
          if (index === prev.length - 1 && msg.type === "bot") {
            return { ...msg, duration };
          }
          return msg;
        });
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100"
      }`}
    >
      <div className="container mx-auto h-screen p-4 flex flex-col items-center">
        <div className="w-full lg:w-3/5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 gap-2">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`p-2 rounded-lg ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
              } flex-grow`}
              placeholder="Model name"
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-white hover:bg-gray-50"
              } transition-colors`}
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>

          <div
            className={`flex-1 rounded-lg p-4 overflow-y-auto relative ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {responses.map((res, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg whitespace-pre-wrap relative ${
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
                {res.type === "bot" && (
                  <div className="absolute -top-3 left-2">
                    <button
                      onClick={() => setShowThink(!showThink)}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 ${
                        darkMode
                          ? "bg-gray-600 hover:bg-gray-500 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      <span
                        className={
                          showThink ? "text-green-400" : "text-red-400"
                        }
                      >
                        {/* • */}
                        🤔
                      </span>
                      Thinking
                      {showThink ? "^ " : "V"}
                    </button>
                  </div>
                )}
                {res.type === "bot" && res.duration && (
                  <div className="absolute -top-3 left-2">
                    <button
                      onClick={() => setShowThink(!showThink)}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 ${
                        darkMode
                          ? "bg-gray-600 hover:bg-gray-500 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      Thought for {res.duration} seconds
                      <span
                        className={
                          showThink ? "text-green-400" : "text-red-400"
                        }
                      >
                        {showThink ? "^ " : "V"}
                      </span>
                    </button>
                  </div>
                )}

                {res.type === "bot" ? parseResponse(res.text) : res.text}
              </div>
            ))}
          </div>

          <div className="mt-4 flex">
            <textarea
              value={message}
              onChange={handleMessageChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={textareaRows}
              className={`flex-grow p-2 rounded-l-lg resize-none overflow-y-auto ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
              } focus:outline-none focus:ring-2 ${
                darkMode ? "focus:ring-blue-500" : "focus:ring-blue-400"
              }`}
              style={{ minHeight: "2.5rem", maxHeight: "8rem" }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`px-6 py-2 rounded-r-lg transition-colors ${
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

export default Home;
