import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, AlertTriangle, FileText } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { TrustBadge } from './TrustBadge';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@workspace/api-client-react';

export interface MessageProps {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  trustScore?: number;
  ciBreakdown?: string;
  sources?: any[];
  lastUpdated?: string;
  isFinancialAdvice?: boolean;
  relatedArticles?: Article[];
  compact?: boolean;
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  trustScore, 
  ciBreakdown, 
  sources, 
  lastUpdated, 
  isFinancialAdvice,
  relatedArticles,
  compact = false,
}: MessageProps) {
  const isBot = role === 'bot';
  const { toast } = useToast();

  const handleRequestUpdate = () => {
    toast({
      title: "Update Requested",
      description: "Our documentation team has been notified to review this article.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 mb-6 group",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      {isBot && (
        <div className={cn(
          "rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center shrink-0 mt-0.5",
          compact ? "w-7 h-7" : "w-8 h-8"
        )}>
          <Bot className={cn("text-emerald-400", compact ? "w-4 h-4" : "w-5 h-5")} />
        </div>
      )}

      <div className={cn("flex flex-col gap-1", compact ? "max-w-[85%]" : "max-w-[85%] md:max-w-[75%]", isBot ? "items-start" : "items-end")}>
        {isBot && isFinancialAdvice && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            This is informational only. Not financial advice.
          </div>
        )}

        <div 
          className={cn(
            "shadow-sm relative",
            compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm md:text-base",
            isBot 
              ? "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl rounded-tl-sm" 
              : "bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-2xl rounded-tr-sm"
          )}
        >
          <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        </div>

        {/* Metadata & Actions */}
        <div className="flex flex-wrap items-center gap-3 px-1 mt-1">
          <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide uppercase">
            {formatTime(timestamp)}
          </span>
          
          {isBot && trustScore !== undefined && (
            <TrustBadge 
              score={trustScore} 
              ciBreakdown={ciBreakdown}
              sourceUrl={sources?.[0]?.url}
              lastUpdated={lastUpdated}
            />
          )}
        </div>

        {/* Related Articles */}
        {isBot && relatedArticles && relatedArticles.length > 0 && (
          <div className="mt-3 w-full space-y-2">
            {relatedArticles.map((article) => (
              <div 
                key={article.id}
                className="bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] rounded-xl p-3 hover:border-emerald-500/30 transition-colors group/card cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-emerald-600/10 rounded-md text-emerald-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold group-hover/card:text-emerald-400 transition-colors">{article.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{article.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{article.category}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRequestUpdate(); }}
                    className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
                  >
                    Request Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isBot && (
        <div className={cn(
          "rounded-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center justify-center shrink-0 mt-0.5",
          compact ? "w-7 h-7" : "w-8 h-8"
        )}>
          <User className={cn("text-[hsl(var(--muted-foreground))]", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
        </div>
      )}
    </motion.div>
  );
}
