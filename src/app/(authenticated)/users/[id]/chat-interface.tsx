'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessagesRealtime } from '@/lib/supabase/realtime/messages';
import type { Message } from '@/lib/supabase/schemas/messages';
import { sendMessage, getMessagesByChatId } from './chat-actions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  chatId: string;
  patientName: string;
  onClose: () => void;
}

export function ChatInterface({
  chatId,
  patientName,
  onClose,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<MessagesRealtime | null>(null);
  const { user: currentUser } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      setIsLoading(true);
      const result = await getMessagesByChatId(chatId);

      if (result.success) {
        setMessages(result.data);
      }
      setIsLoading(false);
    }

    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!chatId || isLoading) return;

    let isMounted = true;

    // Set connecting state asynchronously
    const setupConnection = () => {
      if (!isMounted) return;

      const realtime = new MessagesRealtime();

      realtime.subscribeToChat(chatId, (newMessage) => {
        if (isMounted) {
          setMessages((prev) => [...prev, newMessage]);
        }
      });

      realtimeRef.current = realtime;

      // Mark as connected after subscription is set up
      startTransition(() => {
        if (isMounted) {
          setIsConnecting(false);
        }
      });
    };

    // Set connecting state in next tick to avoid synchronous setState
    startTransition(() => {
      if (isMounted) {
        setIsConnecting(true);
        setupConnection();
      }
    });

    return () => {
      isMounted = false;
      if (realtimeRef.current) {
        realtimeRef.current.cleanup();
        realtimeRef.current = null;
      }
      setIsConnecting(false);
    };
  }, [chatId, isLoading]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleClose = () => {
    if (isConnecting) return;

    if (realtimeRef.current) {
      setIsConnecting(true);
      realtimeRef.current.cleanup();
      realtimeRef.current = null;
      setTimeout(() => {
        setIsConnecting(false);
        onClose();
      }, 200);
    } else {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!messageContent.trim() || isSending || isConnecting || !currentUser) {
      return;
    }

    setIsSending(true);

    const result = await sendMessage(chatId, messageContent, currentUser.id);

    if (result.success) {
      setMessageContent('');
    }

    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageColor = (messageType: string) => {
    switch (messageType) {
      case 'admin':
        return 'bg-primary text-primary-foreground ml-auto';
      case 'user':
        return 'bg-muted text-foreground mr-auto';
      default:
        return 'bg-muted/50 text-muted-foreground mx-auto';
    }
  };

  return (
    <Card className="h-full border-0 shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-sm font-medium text-muted-foreground">
          Chat with {patientName}
        </span>
        <div className="flex items-center gap-2">
          {isConnecting && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isConnecting}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea ref={scrollAreaRef} className="flex-1 h-0 px-4 py-4">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex w-full',
                        message.message_type === 'admin'
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg px-4 py-2',
                          getMessageColor(message.message_type),
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">
                          {message.content}
                        </p>
                        {message.created_at && (
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="border-t p-4 shrink-0">
              <div className="flex gap-2">
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={3}
                  disabled={isSending || isConnecting}
                  className="resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageContent.trim() || isSending || isConnecting}
                  size="icon"
                  className="self-end"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
