import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { LuBot, LuUser, LuSend, LuLoader, LuMenu,LuHouse as LuHome,LuUser as LuHelpCircle, LuSettings } from 'react-icons/lu';

// --- Modern Chat Bubble Component ---
const ChatBubble = ({ message, role }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex items-start gap-4 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
        ${isUser ? 'bg-emerald-600' : 'bg-white border-2 border-emerald-500'}`}>
        {isUser ? 
          <LuUser size={20} className="text-white" /> :
          <LuBot size={20} className="text-emerald-600" />
        }
      </div>

      <div className={`flex flex-col max-w-[75%] gap-1`}>
        <span className="text-xs text-gray-500">
          {isUser ? 'You' : 'Sarthi AI'}
        </span>
        <div className={`px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-emerald-600 text-white' 
            : 'bg-white border border-gray-200 text-gray-800'}`}>
          {role === 'bot' && message === '...thinking...' ? (
            <div className="flex items-center gap-2">
              <LuLoader className="animate-spin" />
              <span className="text-sm">Processing your request...</span>
            </div>
          ) : (
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main Chat Page Component ---
function ChatPage() {
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', message: 'नमस्ते! मैं फसल साथी AI हूं 🌱\nआपकी कृषि संबंधी जिज्ञासाओं का समाधान करने में मदद कर सकता हूं। कृपया अपना प्रश्न पूछें।' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatEndRef = useRef(null); // For auto-scrolling

  // Prevent whole page from scrolling while this page is mounted
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlHeight = document.documentElement.style.height;
    // Lock scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';

    return () => {
      // restore
      document.body.style.overflow = prevBodyOverflow || '';
      document.documentElement.style.height = prevHtmlHeight || '';
      document.body.style.height = '';
    };
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle form submission (API call)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage = newMessage.trim();
    
    // Add user message immediately
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
    setNewMessage('');
    setIsLoading(true);

    // Add bot thinking state
    setChatHistory(prev => [...prev, { role: 'bot', message: '...thinking...' }]);

    try {
      const response = await axios.post('http://localhost:5000/sarthi_ai_chat', {
        message: userMessage
      });
      const aiMessage = response.data.response; 

      // Replace thinking message with actual response
      setChatHistory(prev => {
        const updatedHistory = [...prev];
        updatedHistory[updatedHistory.length - 1] = { role: 'bot', message: aiMessage };
        return updatedHistory;
      });

    } catch (error) {
      console.error("Chat API error:", error);
      // Replace thinking message with error message
      setChatHistory(prev => {
         const updatedHistory = [...prev];
        updatedHistory[updatedHistory.length - 1] = { role: 'bot', message: 'Maaf kijiye, abhi kuch gadbad ho gayi hai. Kripya thodi der baad try karein.' };
        return updatedHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 "
    >
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap ">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <LuBot size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">Fasal Sarthi</h1>
            <p className="text-xs text-gray-500">Your Agricultural AI Assistant</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 ">
        <div className="max-w-3xl mx-auto">
          {chatHistory.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} message={msg.message} />
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-600 p-4 shadow-2xl mb-16 md:mb-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto  flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter your message..."
            className="flex-1 bg-white px-4 py-3 rounded-full border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className={`p-3 rounded-full ${
              isLoading || !newMessage.trim()
                ? 'bg-gray-200 text-gray-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            } transition-colors duration-200`}
          >
            {isLoading ? (
              <LuLoader className="animate-spin" size={20} />
            ) : (
              <LuSend size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;