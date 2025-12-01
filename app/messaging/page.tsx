"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Mail,
  Users,
  History,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Dummy data
const dummyUsers = [
  { id: "user-1", name: "John Doe", email: "john.doe@example.com", avatar: null },
  { id: "user-2", name: "Jane Smith", email: "jane.smith@example.com", avatar: null },
  { id: "user-3", name: "Mike Johnson", email: "mike.johnson@example.com", avatar: null },
  { id: "user-4", name: "Sarah Williams", email: "sarah.williams@example.com", avatar: null },
  { id: "user-5", name: "David Brown", email: "david.brown@example.com", avatar: null },
];

const dummyGroups = [
  { id: "group-1", name: "Orthopedic Team", memberCount: 12 },
  { id: "group-2", name: "Sports Medicine Team", memberCount: 8 },
  { id: "group-3", name: "Pediatric Team", memberCount: 15 },
  { id: "group-4", name: "Geriatric Team", memberCount: 10 },
  { id: "group-5", name: "All Patients", memberCount: 45 },
];

const dummyOrganizationalSegments = [
  { id: "seg-1", name: "Active Patients", memberCount: 32 },
  { id: "seg-2", name: "Inactive Patients", memberCount: 13 },
  { id: "seg-3", name: "High Priority", memberCount: 8 },
  { id: "seg-4", name: "New Patients", memberCount: 5 },
];

const dummyDirectMessages = [
  {
    id: "msg-1",
    userId: "user-1",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
    lastMessage: "Thanks for the update on my exercise program!",
    timestamp: "2024-01-15T10:30:00Z",
    unread: true,
    threadCount: 5,
  },
  {
    id: "msg-2",
    userId: "user-2",
    userName: "Jane Smith",
    userEmail: "jane.smith@example.com",
    lastMessage: "When should I schedule my next appointment?",
    timestamp: "2024-01-14T14:20:00Z",
    unread: false,
    threadCount: 3,
  },
  {
    id: "msg-3",
    userId: "user-3",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@example.com",
    lastMessage: "The exercises are working great!",
    timestamp: "2024-01-13T09:15:00Z",
    unread: false,
    threadCount: 8,
  },
];

const dummyConversationThread = [
  {
    id: "thread-1",
    sender: "physiologist",
    message: "Hi John, I've updated your exercise program based on your progress. Please review the new exercises.",
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

const dummyBroadcastHistory = [
  {
    id: "broadcast-1",
    subject: "Weekly Exercise Reminder",
    message: "Don't forget to complete your weekly exercises. Stay consistent!",
    recipients: "Orthopedic Team (12 members)",
    sentAt: "2024-01-15T08:00:00Z",
    status: "delivered",
    deliveryRate: "100%",
  },
  {
    id: "broadcast-2",
    subject: "New Program Available",
    message: "A new exercise program has been added to your library. Check it out!",
    recipients: "All Patients (45 members)",
    sentAt: "2024-01-14T10:00:00Z",
    status: "delivered",
    deliveryRate: "98%",
  },
  {
    id: "broadcast-3",
    subject: "Appointment Reminder",
    message: "Your appointment is scheduled for tomorrow at 2 PM.",
    recipients: "High Priority (8 members)",
    sentAt: "2024-01-13T14:00:00Z",
    status: "delivered",
    deliveryRate: "100%",
  },
];

const dummyMessageHistory = [
  {
    id: "hist-1",
    type: "direct",
    recipient: "John Doe",
    subject: "Exercise Program Update",
    preview: "Hi John, I've updated your exercise program based on your progress...",
    timestamp: "2024-01-15T10:30:00Z",
    status: "sent",
  },
  {
    id: "hist-2",
    type: "broadcast",
    recipient: "Orthopedic Team (12 members)",
    subject: "Weekly Exercise Reminder",
    preview: "Don't forget to complete your weekly exercises. Stay consistent!",
    timestamp: "2024-01-15T08:00:00Z",
    status: "sent",
  },
  {
    id: "hist-3",
    type: "direct",
    recipient: "Jane Smith",
    subject: "Appointment Scheduling",
    preview: "When should I schedule my next appointment?",
    timestamp: "2024-01-14T14:20:00Z",
    status: "received",
  },
  {
    id: "hist-4",
    type: "broadcast",
    recipient: "All Patients (45 members)",
    subject: "New Program Available",
    preview: "A new exercise program has been added to your library...",
    timestamp: "2024-01-14T10:00:00Z",
    status: "sent",
  },
  {
    id: "hist-5",
    type: "direct",
    recipient: "Mike Johnson",
    subject: "Progress Update",
    preview: "The exercises are working great!",
    timestamp: "2024-01-13T09:15:00Z",
    status: "received",
  },
];

const dummyPushNotifications = [
  {
    id: "push-1",
    title: "Exercise Reminder",
    body: "Time to complete your daily exercises!",
    target: "All Active Users",
    sentAt: "2024-01-15T09:00:00Z",
    status: "sent",
    deliveryCount: 32,
  },
  {
    id: "push-2",
    title: "New Program Available",
    body: "Check out the new exercise program in your library",
    target: "All Users",
    sentAt: "2024-01-14T11:00:00Z",
    status: "sent",
    deliveryCount: 45,
  },
  {
    id: "push-3",
    title: "Appointment Reminder",
    body: "Your appointment is tomorrow at 2 PM",
    target: "High Priority Users",
    sentAt: "2024-01-13T15:00:00Z",
    status: "sent",
    deliveryCount: 8,
  },
];

type TabType = "direct" | "broadcast" | "history" | "mobile";

export default function MessagingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("direct");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [subject, setSubject] = useState("");
  const [broadcastType, setBroadcastType] = useState<"group" | "segment">("group");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "direct" | "broadcast">("all");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState<string>("");

  const tabs = [
    { id: "direct" as TabType, label: "Direct Messaging", icon: MessageSquare },
    { id: "broadcast" as TabType, label: "Broadcast Messaging", icon: Users },
    { id: "history" as TabType, label: "Message History", icon: History },
    { id: "mobile" as TabType, label: "Messaging (VV Mobile App)", icon: Bell },
  ];

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

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : [...prev, segmentId]
    );
  };

  const filteredHistory = dummyMessageHistory.filter((msg) => {
    const matchesSearch =
      msg.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || msg.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Messaging</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-none border-b-2 border-transparent",
              activeTab === tab.id && "border-primary"
            )}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Direct Messaging Tab */}
      {activeTab === "direct" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Select a user to start or continue a conversation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                {dummyDirectMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedConversation(msg.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                      selectedConversation === msg.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{msg.userName}</p>
                          {msg.unread && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {msg.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.timestamp)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {msg.threadCount} messages
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedConversation
                  ? dummyDirectMessages.find((m) => m.id === selectedConversation)?.userName
                  : "Compose Message"}
              </CardTitle>
              <CardDescription>
                {selectedConversation
                  ? "Conversation thread"
                  : "Select a user or compose a new message"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedConversation ? (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
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
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={3}
                    />
                    <Button className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {dummyUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="Message subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>User will receive email notification via Resend integration</span>
                  </div>
                  <Button className="w-full" disabled={!selectedUser || !messageText}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Broadcast Messaging Tab */}
      {activeTab === "broadcast" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compose Broadcast</CardTitle>
              <CardDescription>Send a message to multiple users at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Broadcast Type</Label>
                <Select
                  value={broadcastType}
                  onValueChange={(value: "group" | "segment") => setBroadcastType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Groups</SelectItem>
                    <SelectItem value="segment">Organizational Segments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {broadcastType === "group" ? (
                <div className="space-y-2">
                  <Label>Select Groups</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {dummyGroups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <Label
                          htmlFor={group.id}
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <span>{group.name}</span>
                          <Badge variant="secondary">{group.memberCount} members</Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Segments</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {dummyOrganizationalSegments.map((segment) => (
                      <div key={segment.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={segment.id}
                          checked={selectedSegments.includes(segment.id)}
                          onCheckedChange={() => handleSegmentToggle(segment.id)}
                        />
                        <Label
                          htmlFor={segment.id}
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <span>{segment.name}</span>
                          <Badge variant="secondary">{segment.memberCount} members</Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Broadcast subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your broadcast message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Each recipient will receive this as an individual message</span>
              </div>
              <Button
                className="w-full"
                disabled={
                  (broadcastType === "group" && selectedGroups.length === 0) ||
                  (broadcastType === "segment" && selectedSegments.length === 0) ||
                  !messageText
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Send Broadcast
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>View past broadcasts and delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dummyBroadcastHistory.map((broadcast) => (
                  <div key={broadcast.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{broadcast.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1">{broadcast.message}</p>
                      </div>
                      {broadcast.status === "delivered" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {broadcast.recipients}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(broadcast.sentAt)}
                        </span>
                      </div>
                      <Badge variant="outline">{broadcast.deliveryRate}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message History Tab */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              Complete log of all messages sent to or from this user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(value: "all" | "direct" | "broadcast") => setFilterType(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="direct">Direct Only</SelectItem>
                  <SelectItem value="broadcast">Broadcast Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {filteredHistory.map((msg) => (
                <div key={msg.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={msg.type === "direct" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {msg.type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {msg.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>
                  <p className="font-medium mb-1">{msg.subject}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    To: {msg.recipient}
                  </p>
                  <p className="text-sm">{msg.preview}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile App Messaging Tab */}
      {activeTab === "mobile" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Push Notification</CardTitle>
              <CardDescription>Send push notifications via VV Mobile App</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={pushTarget} onValueChange={setPushTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="inactive">Inactive Users</SelectItem>
                    <SelectItem value="high-priority">High Priority Users</SelectItem>
                    <SelectItem value="new">New Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notification Title</Label>
                <Input
                  placeholder="Enter notification title"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notification Body</Label>
                <Textarea
                  placeholder="Enter notification message"
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                className="w-full"
                disabled={!pushTarget || !pushTitle || !pushBody}
              >
                <Bell className="mr-2 h-4 w-4" />
                Send Push Notification
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notification History</CardTitle>
              <CardDescription>View past push notifications and delivery stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dummyPushNotifications.map((notif) => (
                  <div key={notif.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{notif.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>
                      </div>
                      {notif.status === "sent" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notif.target}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(notif.sentAt)}
                        </span>
                      </div>
                      <Badge variant="outline">{notif.deliveryCount} delivered</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

