import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Send, AlertOctagon, PhoneCall, Bot, Loader2 } from 'lucide-react';

function uuidv4() {
  return crypto.randomUUID();
}
import { motion, AnimatePresence } from 'framer-motion';

import { useSendMessage, useEscalateTicket } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ChatMessage, type MessageProps } from '@/components/ChatMessage';
import { SecurityPanel } from '@/components/SecurityPanel';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [sessionId] = useState(() => uuidv4());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>([
    {
      id: uuidv4(),
      role: 'bot',
      content: "Hi there. I'm Emerald, Blockstream's advanced support assistant. How can I help secure your account or answer your technical questions today?",
      timestamp: new Date(),
      trustScore: 0.99,
      ciBreakdown: "System initialization verified.",
    }
  ]);
  
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [hasSecurityAlertSession, setHasSecurityAlertSession] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useSendMessage();
  const escalateMutation = useEscalateTicket();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message to UI immediately
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

      // Update global security state if alert detected
      if (response.isSecurityAlert) {
        setHasSecurityAlertSession(true);
      }

      // Add bot response
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

    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to reach Emerald. Please try again.",
        variant: "destructive"
      });
      // Remove the optimistic user message on failure or keep it? Usually better to keep it and show error inline, but simple error toast works for MVP.
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
      // Map local messages to API format
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
        console.log("[Zendesk Export Payload]:", JSON.stringify(res.ticketPayload, null, 2));
        toast({
          title: "Ticket Escalated",
          description: "A human agent has been notified and will review your session shortly.",
        });
      }
    } catch (error) {
      toast({
        title: "Escalation Failed",
        description: "Could not create support ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative selection:bg-primary/30">
      {/* Background aesthetics */}
      <img 
        src={`${import.meta.env.BASE_URL}images/blockstream-bg.png`} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none mix-blend-screen"
      />
      <img 
        src={`${import.meta.env.BASE_URL}images/grain.png`} 
        alt="Texture" 
        className="texture-overlay"
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      
      {/* Radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      {/* Main Chat Container */}
      <div className="relative flex flex-col w-full max-w-4xl mx-auto h-full z-10 border-x border-white/5 glass-panel shadow-2xl">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {/* Simplified Blockstream-esque geometric logo placeholder */}
                <div className="w-4 h-4 border-[2px] border-background border-t-transparent rounded-sm transform rotate-45" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-lg text-foreground tracking-tight">Blockstream</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Help Center</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold font-mono tracking-wider">
                EMERALD
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-semibold tracking-wide cursor-default group relative">
                <ShieldCheck className="w-3 h-3" />
                <span>Privacy Protected</span>
                
                {/* Tooltip */}
                <div className="absolute top-full left-0 mt-2 w-48 p-2 bg-popover border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-foreground/80 font-normal normal-case">
                  Local scrubbing is active. Sensitive PII is redacted before leaving your device.
                </div>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEscalate}
            disabled={escalateMutation.isPending}
            className="border-white/10 hover:border-white/20 hover:bg-white/5"
          >
            {escalateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PhoneCall className="w-4 h-4 mr-2 text-muted-foreground" />
            )}
            Escalate to Human
          </Button>
        </header>

        {/* Global Security Triage Banner */}
        <AnimatePresence>
          {hasSecurityAlertSession && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-destructive border-b border-red-500/50 shadow-[0_4px_20px_rgba(220,38,38,0.2)] overflow-hidden shrink-0 z-20"
            >
              <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-white">
                  <AlertOctagon className="w-5 h-5 animate-pulse" />
                  <span className="font-semibold text-sm">Potential Account Compromise Detected</span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowSecurityPanel(true)}
                  className="w-full sm:w-auto bg-white text-destructive hover:bg-white/90 font-bold"
                >
                  Secure My Account Now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} />
            ))}
            
            {/* Loading State */}
            {chatMutation.isPending && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full gap-4 mb-6 justify-start"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-primary/50 animate-pulse" />
                </div>
                <div className="px-5 py-4 bg-card border border-white/5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-background/80 backdrop-blur-xl border-t border-white/10 shrink-0">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500" />
            <div className="relative flex items-end gap-2 bg-input border border-white/10 rounded-2xl p-2 shadow-inner">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your issue..."
                className="w-full max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-foreground px-3 py-2.5 text-sm md:text-base placeholder:text-muted-foreground/60"
                rows={1}
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                size="icon"
                className="shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-[44px] w-[44px]"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </div>
            <div className="text-center mt-3 text-[10px] text-muted-foreground/60 font-medium tracking-wide">
              Emerald is an AI assistant. Verify critical information.
            </div>
          </div>
        </div>

      </div>

      {/* Slide-in Security Walkthrough */}
      <SecurityPanel 
        isOpen={showSecurityPanel} 
        onClose={() => setShowSecurityPanel(false)} 
      />
    </div>
  );
}
