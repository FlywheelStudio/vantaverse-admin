'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessagesRealtime } from '@/lib/supabase/realtime/messages';
import type { Message } from '@/lib/supabase/schemas/messages';
import {
  getMessagesByChatId,
  markLastUserMessageSeen,
  uploadChatFile,
} from '../chat-actions';
import { useSendMessage } from '../hooks/use-chat-mutations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '../hooks/use-chat-mutations';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Image from 'next/image';

const MAX_CHAT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface ChatInterfaceProps {
  chatId: string;
  patientName: string;
  onClose: () => void;
  onMarkedAsSeen?: () => void;
}

export function ChatInterface({
  chatId,
  patientName,
  onClose,
  onMarkedAsSeen,
}: ChatInterfaceProps) {
  const [messageContent, setMessageContent] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<MessagesRealtime | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markSeenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markedSeenForChatIdRef = useRef<string | null>(null);
  const { user: currentUser } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const sendMessage = useSendMessage(chatId);

  const messagesKey = chatKeys.messages(chatId);

  // Load initial messages using React Query
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: messagesKey,
    queryFn: async () => {
      const result = await getMessagesByChatId(chatId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load messages');
      }
      return result.data;
    },
    enabled: !!chatId,
  });

  const markLastUserMessageAsSeen = useCallback(async () => {
    if (!chatId) return;

    const result = await markLastUserMessageSeen(chatId);
    if (!result.success) {
      console.error(result.error || 'Failed to mark last user message as seen');
      return;
    }
    if (result.data.updated) {
      onMarkedAsSeen?.();
    }
  }, [chatId, onMarkedAsSeen]);

  const scheduleDebouncedMarkAsSeen = useCallback(() => {
    if (markSeenTimeoutRef.current) {
      clearTimeout(markSeenTimeoutRef.current);
    }

    markSeenTimeoutRef.current = setTimeout(() => {
      markSeenTimeoutRef.current = null;
      void markLastUserMessageAsSeen();
    }, 3000);
  }, [markLastUserMessageAsSeen]);

  // Mark last user message as seen once when chat is open and messages have loaded
  useEffect(() => {
    if (!chatId || isLoading) return;
    if (markedSeenForChatIdRef.current === chatId) return;
    markedSeenForChatIdRef.current = chatId;
    void markLastUserMessageAsSeen();
  }, [chatId, isLoading, markLastUserMessageAsSeen]);

  // Debounced mark-as-seen on focus / tab visibility restore
  useEffect(() => {
    if (!chatId) return;

    const handleFocus = () => {
      scheduleDebouncedMarkAsSeen();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleDebouncedMarkAsSeen();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (markSeenTimeoutRef.current) {
        clearTimeout(markSeenTimeoutRef.current);
        markSeenTimeoutRef.current = null;
      }
    };
  }, [chatId, scheduleDebouncedMarkAsSeen]);

  // Setup realtime subscription (defer setState to avoid synchronous setState-in-effect)
  useEffect(() => {
    if (!chatId || isLoading) return;

    let isMounted = true;

    const setupConnection = () => {
      if (!isMounted) return;

      const realtime = new MessagesRealtime();

      realtime.subscribeToChat(chatId, (newMessage) => {
        if (isMounted) {
          queryClient.setQueryData<Message[]>(messagesKey, (old) => {
            if (!old) return [newMessage];
            if (old.some((msg) => msg.id === newMessage.id)) {
              return old;
            }
            const filtered = old.filter((msg) => {
              const isTemp = msg.id.startsWith('temp-');
              if (!isTemp) return true;
              const contentMatches = msg.content.trim() === newMessage.content.trim();
              const typeMatches = msg.message_type === newMessage.message_type;
              if (contentMatches && typeMatches) {
                return false;
              }
              return true;
            });
            return [...filtered, newMessage];
          });
        }
      });

      realtimeRef.current = realtime;

      if (isMounted) {
        setIsConnecting(false);
      }
    };

    queueMicrotask(() => {
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
  }, [chatId, isLoading, messagesKey, queryClient]);

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
    if (!messageContent.trim() || sendMessage.isPending || isConnecting || !currentUser) {
      return;
    }

    await sendMessage.mutateAsync(
      {
        content: messageContent,
        userId: currentUser.id,
      },
      {
        onSuccess: () => {
          setMessageContent('');
        },
      },
    );
  };

  const handlePickFile = () => {
    if (isConnecting || isUploadingFile || isSending) return;
    fileInputRef.current?.click();
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (!result || typeof result !== 'string') {
          reject(new Error('Failed to read file.'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_CHAT_FILE_SIZE_BYTES) {
      toast.error('File is too large. Maximum size is 5MB.');
      e.target.value = '';
      return;
    }

    if (!currentUser || isConnecting || sendMessage.isPending) {
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingFile(true);
      const base64String = await readFileAsBase64(selectedFile);
      const uploadResult = await uploadChatFile(
        chatId,
        base64String,
        selectedFile.name,
        selectedFile.type,
        currentUser.id,
      );

      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Failed to upload file');
        return;
      }

      await sendMessage.mutateAsync(
        {
          content: messageContent.trim() || selectedFile.name,
          userId: currentUser.id,
          attachment: uploadResult.data,
        },
        {
          onSuccess: () => {
            setMessageContent('');
          },
        },
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
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

  const isSending = sendMessage.isPending;
  const isComposerBusy = isSending || isConnecting || isUploadingFile;
  const canSendText = !!messageContent.trim() && !isComposerBusy;

  const renderAttachment = (message: Message) => {
    if (!message.attachments) return null;

    if (message.attachments.type === 'image') {
      return (
        <a href={message.attachments.url} target="_blank" rel="noreferrer">
          <Image
            src={message.attachments.url}
            alt="Image attachment"
            className="mt-2 max-h-56 w-full rounded-md object-cover"
            width={560}
            height={320}
          />
        </a>
      );
    }

    if (message.attachments.type === 'video') {
      return (
        <video
          src={message.attachments.url}
          controls
          className="mt-2 max-h-64 w-full rounded-md"
        />
      );
    }

    return (
      <a
        href={message.attachments.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs underline underline-offset-4 opacity-90"
      >
        Open document
      </a>
    );
  };

  return (
    <Card className="h-full min-h-0 overflow-hidden border-0 shadow-xl flex flex-col">
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
      <CardContent className="flex-1 flex flex-col p-0 min-h-0" style={{ backgroundColor: 'oklch(0.9849 0.0029 264.54)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1 min-h-0 px-4 py-4 slim-scrollbar"
            >
              <div className="space-y-4">
                    {messages.map((message) => (
                    <div
                      key={message.id}
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
                        {renderAttachment(message)}
                        {message.created_at && (
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="border-t p-4 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                  onChange={handleFileSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePickFile}
                  disabled={isComposerBusy}
                  className="self-end"
                >
                  {isUploadingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={3}
                  disabled={isComposerBusy}
                  className="resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!canSendText}
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
