'use client'

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, AlertCircle } from 'lucide-react';
import { hoiTroLyAI, getAILuotHoiConLai } from '@/app/(dashboard)/actions/ai.actions';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'ai';
  content: string;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Chào bạn, tôi là trợ lý AI của Ôn Luyện Hải Quan. Tôi có thể giải đáp các thắc mắc về nghiệp vụ dựa trên dữ liệu hệ thống. Bạn cần hỏi gì?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ unlimited: boolean, limit?: number, used?: number, remaining?: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !limitInfo) {
      getAILuotHoiConLai().then(info => {
        if (info) setLimitInfo(info);
      });
    }
  }, [isOpen, limitInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const reply = await hoiTroLyAI(userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
      
      // Update limit info after answering
      if (limitInfo && !limitInfo.unlimited) {
        getAILuotHoiConLai().then(info => {
          if (info) setLimitInfo(info);
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, đã xảy ra lỗi trong quá trình xử lý.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const isLimitReached = limitInfo && !limitInfo.unlimited && limitInfo.remaining !== undefined && limitInfo.remaining <= 0;

  return (
    <>
      {/* Nút bấm mở chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-50 flex items-center justify-center group"
          aria-label="Mở trợ lý AI"
        >
          <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
        </button>
      )}

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex flex-col shadow-sm z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Trợ lý AI Hải Quan</h3>
                  <p className="text-[10px] text-white/80">Trả lời dựa trên tài liệu hệ thống</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {limitInfo && !limitInfo.unlimited && (
              <div className="mt-3 text-xs bg-black/20 rounded px-2 py-1 flex items-center justify-between">
                <span>Còn {limitInfo.remaining}/{limitInfo.limit} lượt hỏi hôm nay</span>
              </div>
            )}
          </div>

          {/* Body chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-white border text-gray-800 rounded-tl-sm shadow-sm prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 max-w-full overflow-hidden'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 bg-white border rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-white border-t z-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
              {isLimitReached && (
                <div className="text-xs text-red-600 flex items-center gap-1 px-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Đã hết lượt hỏi hôm nay. Vui lòng quay lại vào ngày mai!</span>
                </div>
              )}
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isLimitReached ? "Đã hết lượt hỏi hôm nay" : "Hỏi về mã HS, thủ tục..."}
                  className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-full px-4 py-2.5 text-sm outline-none transition-all pr-12 disabled:opacity-50"
                  disabled={isTyping || isLimitReached}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping || isLimitReached}
                  className="absolute right-1 top-1 bottom-1 w-9 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-50 disabled:bg-gray-400 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
