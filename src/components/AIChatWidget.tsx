import React, { useState } from 'react';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'こんにちは！PetMog AIアシスタントです。ペットのケアについて何でも聞いてくださいね！' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const aiResponse = await geminiService.askPetQuestion(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 md:bottom-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white rounded-3xl w-80 h-[450px] card-shadow flex flex-col overflow-hidden mb-4 border border-brand-peach-100/20"
          >
            <div className="bg-brand-peach-100 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-bold">PetMog AIに相談</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-peach-100 text-white rounded-tr-none' 
                      : 'bg-brand-peach-50 text-brand-peach-800 rounded-tl-none border border-brand-peach-100/10'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-brand-peach-50 p-3 rounded-2xl rounded-tl-none border border-brand-peach-100/10">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-brand-peach-100 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-brand-peach-100 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-brand-peach-100 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-brand-peach-50 flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="ペットの悩みを聞かせて..."
                className="flex-1 bg-brand-peach-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-peach-100"
              />
              <button 
                onClick={handleSend}
                className="bg-brand-peach-100 text-white p-2 rounded-full hover:scale-110 transition-transform"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-peach-100 text-white p-4 rounded-full shadow-xl shadow-brand-peach-100/40 hover:scale-110 transition-transform flex items-center justify-center"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
};
