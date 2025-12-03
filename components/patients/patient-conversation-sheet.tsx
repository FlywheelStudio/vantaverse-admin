"use client";

import * as React from "react";
import { Patient } from "@/lib/mock-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientConversationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

// Dummy conversation thread data
const dummyConversationThread = [
  {
    id: "thread-1",
    sender: "physiologist",
    message: "Hi, I've updated your exercise program based on your progress. Please review the new exercises.",
    timestamp: "2024-01-15T08:00:00Z",
  },
  {
    id: "thread-2",
    sender: "user",
    message: "Thanks! I'll check them out today.",
    timestamp: "2024-01-15T09:15:00Z",
  },
  {
    id: "thread-3",
    sender: "physiologist",
    message: "Great! Let me know if you have any questions about the new movements.",
    timestamp: "2024-01-15T09:30:00Z",
  },
  {
    id: "thread-4",
    sender: "user",
    message: "Thanks for the update on my exercise program!",
    timestamp: "2024-01-15T10:30:00Z",
  },
];

export function PatientConversationSheet({
  open,
  onOpenChange,
  patient,
}: PatientConversationSheetProps) {
  const [messageText, setMessageText] = React.useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!patient) return null;

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={patient.avatarUrl} />
              <AvatarFallback>
                {patient.firstName[0]}
                {patient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{patientName}</SheetTitle>
              <SheetDescription>{patient.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 py-4 px-4 overflow-hidden">
          {/* Conversation Thread */}
          <div className="flex-1 space-y-3 overflow-y-auto px-2">
            {dummyConversationThread.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "p-3 rounded-lg",
                  thread.sender === "physiologist"
                    ? "bg-primary/10 ml-auto max-w-[80%]"
                    : "bg-muted mr-auto max-w-[80%]"
                )}
              >
                <p className="text-sm">{thread.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(thread.timestamp)}
                </p>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="space-y-2 border-t pt-4 px-2">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
            />
            <Button className="w-full" disabled={!messageText}>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

