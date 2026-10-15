import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Info } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { ChatMessage } from '../types/watchParty';

const QUICK_REACTIONS = ['😂', '❤️', '😮', '🔥', '👏', '🎉', '🍿'];

export const ChatPanel: React.FC = () => {
  const { room, user, sendChatMessage, sendReaction } = useRoom();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const messages: ChatMessage[] = room?.chat || [];

  // Track scroll position
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setIsScrolledToBottom(isAtBottom);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isScrolledToBottom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatMessageTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E1EBE2] overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-[#E1EBE2] flex items-center justify-between bg-[#F8FAF6]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#20382B]">Live Room Chat</span>
          <span className="text-xs text-[#6B7C70]">({messages.length} msgs)</span>
        </div>
        <span className="text-[11px] text-[#6B7C70] font-mono">
          Room: {room?.id}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px] lg:max-h-[500px]"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B7C70]">
            <Smile className="w-8 h-8 text-[#A8D5BA] mb-2" />
            <p className="text-xs font-semibold text-[#20382B]">No messages yet</p>
            <p className="text-[11px] text-[#6B7C70] mt-0.5">
              Say hello or react to whatever is on screen!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex items-center justify-center my-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7C70] bg-[#F8FAF6] border border-[#E1EBE2] px-2.5 py-1 rounded-full">
                    <Info className="w-3 h-3 text-[#4C956C]" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isSelf = msg.userId === user.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}
              >
                <img
                  src={msg.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userName}`}
                  alt={msg.userName}
                  className="w-7 h-7 rounded-full bg-[#DDF3E4] border border-[#A8D5BA] object-cover shrink-0 mt-0.5"
                  referrerPolicy="no-referrer"
                />
                <div className={`flex flex-col max-w-[80%] ${isSelf ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-semibold text-[#20382B]">
                      {isSelf ? 'You' : msg.userName}
                    </span>
                    <span className="text-[10px] text-[#6B7C70]">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isSelf
                        ? 'bg-[#4C956C] text-white rounded-tr-none'
                        : 'bg-[#F8FAF6] text-[#20382B] border border-[#E1EBE2] rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Reaction Quick Bar */}
      <div className="px-3 py-1.5 bg-[#F8FAF6] border-t border-[#E1EBE2] flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[11px] font-medium text-[#6B7C70] shrink-0 pl-1">
          React:
        </span>
        <div className="flex items-center gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:border-[#A8D5BA] border border-transparent text-base transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#E1EBE2] bg-white flex items-end gap-2">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type message... (Enter to send, Shift+Enter for newline)"
          className="flex-1 resize-none text-xs p-2.5 rounded-lg border border-[#E1EBE2] focus:outline-none focus:border-[#4C956C] text-[#20382B] max-h-24"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] disabled:opacity-40 text-white transition-colors shrink-0 shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
