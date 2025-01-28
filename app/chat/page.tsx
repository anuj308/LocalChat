'use client';
import React, { useState } from 'react';

type MessageType = {
  type: 'user' | 'bot';
  text: string;
};

const ChatApp: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [responses, setResponses] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message to the chat
    setResponses((prev) => [...prev, { type: 'user', text: message }]);
    setMessage('');
    setIsLoading(true);

    try {
      const url = 'http://localhost:11434/api/generate';
      const data = {
        model: 'deepseek-r1:1.5b',
        prompt: message,
      };

      // Use fetch API for streaming
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Split the chunk into individual JSON objects
        const jsonChunks = chunk.split('\n').filter(Boolean);

        for (const jsonChunk of jsonChunks) {
          try {
            const parsedChunk = JSON.parse(jsonChunk);

            // Extract the "response" field
            if (parsedChunk.response) {
              botResponse += parsedChunk.response;

              // Update the UI with the streamed response
              setResponses((prev) => {
                const lastResponse = prev[prev.length - 1];
                if (lastResponse?.type === 'bot') {
                  return [...prev.slice(0, -1), { type: 'bot', text: botResponse }];
                }
                return [...prev, { type: 'bot', text: botResponse }];
              });
            }
          } catch (error) {
            console.error('Error parsing JSON chunk:', error);
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4">
        <div className="overflow-y-auto h-96 border rounded-lg p-4 bg-gray-50">
          {responses.map((res, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded-lg ${
                res.type === 'user' ? 'bg-blue-100 text-blue-900 self-end' : 'bg-gray-200 text-gray-800'
              }`}
            >
              {res.text}
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow border rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;