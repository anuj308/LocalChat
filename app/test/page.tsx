'use client';
import React, { useState } from 'react';

type MessageType = {
  type: 'user' | 'bot';
  text: string;
};

const Chat: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [responses, setResponses] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [model, setModel] = useState<string>('DeepSeek-R1');

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message to chat history
    setResponses((prev) => [...prev, { type: 'user', text: message }]);
    setMessage('');
    setIsLoading(true);
    
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: message }]
          }),
        });
    
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let botResponse = '';
    
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          botResponse += decoder.decode(value);
          
          setResponses(prev => {
            const last = prev[prev.length - 1];
            return last?.type === 'bot' 
              ? [...prev.slice(0, -1), { type: 'bot', text: botResponse }]
              : [...prev, { type: 'bot', text: botResponse }];
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <div className="container mx-auto h-screen p-4 flex flex-col items-center">
        <div className="w-full lg:w-3/5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} flex-grow mr-2`}
              placeholder="Model name"
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
          <div className={`flex-1 rounded-lg p-4 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {responses.map((res, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg whitespace-pre-wrap ${res.type === 'user' ? (darkMode ? 'bg-blue-600 ml-20' : 'bg-blue-100 ml-20') : (darkMode ? 'bg-gray-700 mr-20' : 'bg-gray-200 mr-20')}`}
                style={{ wordBreak: 'break-word' }}
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
              className={`flex-grow p-2 rounded-l-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} focus:outline-none`}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`px-6 py-2 rounded-r-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 text-white'} ${isLoading && 'opacity-50 cursor-not-allowed'}`}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
