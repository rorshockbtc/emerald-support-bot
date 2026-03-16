import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, ChevronDown, Maximize2, Minimize2, ShieldCheck, PhoneCall, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage, useEscalateTicket } from '@workspace/api-client-react';
import { ChatMessage, type MessageProps } from './ChatMessage';
import { SecurityPanel } from './SecurityPanel';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTime } from '@/lib/utils';

function uuidv4() {
  return crypto.randomUUID();
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [startTime] = useState(() => new Date());
  const [input, setInput] = useState('');
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [hasSecurityAlertSession, setHasSecurityAlertSession] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([
    {
      id: uuidv4(),
      role: 'bot',
      content: "Hello! I'm Blockstream AI assistant. What can I help you with?",
      timestamp: new Date(),
      trustScore: 0.99,
      ciBreakdown: "System initialization verified.",
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const chatMutation = useSendMessage();
  const escalateMutation = useEscalateTicket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userText = input.trim();
    setInput('');

    const userMsg: MessageProps = {
      id: uuidv4(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await chatMutation.mutateAsync({
        data: { message: userText, sessionId }
      });

      if (response.isSecurityAlert) {
        setHasSecurityAlertSession(true);
      }

      const botMsg: MessageProps = {
        id: uuidv4(),
        role: 'bot',
        content: response.reply,
        timestamp: new Date(),
        trustScore: response.trustScore,
        ciBreakdown: response.ciBreakdown,
        sources: response.sources,
        lastUpdated: response.lastUpdated,
        isFinancialAdvice: response.isFinancialAdvice,
        relatedArticles: response.relatedArticles,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      toast({
        title: "Connection Error",
        description: "Failed to reach Emerald. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscalate = async () => {
    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      }));

      const res = await escalateMutation.mutateAsync({
        data: {
          sessionId,
          subject: hasSecurityAlertSession ? "URGENT: Possible Account Compromise" : "General Support Escalation",
          chatHistory: history
        }
      });

      if (res.success) {
        toast({
          title: "Ticket Escalated",
          description: "A human agent has been notified and will review your session shortly.",
        });
      }
    } catch {
      toast({
        title: "Escalation Failed",
        description: "Could not create support ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  const widgetWidth = isFullScreen ? 'w-screen h-screen' : 'w-[380px] h-[520px] sm:w-[400px] sm:h-[560px]';
  const widgetPosition = isFullScreen ? 'inset-0' : 'bottom-6 right-6';

  const formattedStartTime = startTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={isFullScreen ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "chat-widget fixed z-50 flex flex-col bg-[hsl(var(--widget-bg))] shadow-2xl overflow-hidden",
              isFullScreen ? 'inset-0 rounded-none' : 'bottom-6 right-6 rounded-2xl border border-[hsl(var(--widget-border))]',
            )}
            style={!isFullScreen ? { width: 400, height: 560 } : undefined}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[hsl(220,13%,8%)] border-b border-[hsl(var(--widget-border))]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setIsOpen(false); setIsFullScreen(false); }}
                  className="p-1 text-[hsl(var(--widget-muted))] hover:text-[hsl(var(--widget-fg))] transition-colors"
                  aria-label="Back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-[hsl(var(--widget-fg))]">
                  Started {formattedStartTime}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEscalate}
                  disabled={escalateMutation.isPending}
                  className="p-1.5 text-[hsl(var(--widget-muted))] hover:text-[hsl(var(--widget-fg))] transition-colors"
                  title="Escalate to Human"
                  aria-label="Escalate to Human"
                >
                  {escalateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PhoneCall className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 text-[hsl(var(--widget-muted))] hover:text-[hsl(var(--widget-fg))] transition-colors"
                  title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                  aria-label={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {hasSecurityAlertSession && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-red-600 overflow-hidden shrink-0"
                >
                  <div className="px-4 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white text-xs font-medium">
                      <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
                      <span>Account Compromise Detected</span>
                    </div>
                    <button
                      onClick={() => setShowSecurityPanel(true)}
                      className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                    >
                      Secure Now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-4">
              <div className={cn(isFullScreen ? "max-w-3xl mx-auto" : "")}>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} {...msg} compact={!isFullScreen} />
                ))}

                {chatMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex w-full gap-3 mb-4 justify-start"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="px-4 py-3 bg-[hsl(var(--widget-card))] border border-[hsl(var(--widget-border))] rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-[hsl(var(--widget-border))] bg-[hsl(220,13%,8%)]">
              <div className="flex items-center gap-2">
                <div className="p-2 text-[hsl(var(--widget-muted))]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-[hsl(var(--widget-fg))] text-sm placeholder:text-[hsl(var(--widget-muted))] py-1 max-h-20"
                    rows={1}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || chatMutation.isPending}
                  className="p-2 text-emerald-400 hover:text-emerald-300 disabled:text-[hsl(var(--widget-muted))] disabled:opacity-50 transition-colors"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-1 text-[9px] text-[hsl(var(--widget-muted))] opacity-60">
                Powered by Emerald AI
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1a1c20] hover:bg-[#25282d] text-white shadow-xl flex items-center justify-center transition-colors border border-white/10"
            aria-label="Open chat"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {isOpen && (
        <AnimatePresence>
          {isOpen && !isFullScreen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed bottom-6 right-6 z-[49] w-14 h-14 rounded-full bg-[#1a1c20] hover:bg-[#25282d] text-white shadow-xl flex items-center justify-center transition-colors border border-white/10"
              style={{ transform: 'translateY(580px)' }}
              aria-label="Close chat"
            >
              <ChevronDown className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      )}

      <SecurityPanel
        isOpen={showSecurityPanel}
        onClose={() => setShowSecurityPanel(false)}
      />
    </>
  );
}
