'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Mail,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  Clock,
  Building2,
} from 'lucide-react';

interface MessageThread {
  id: string;
  senderName: string;
  senderOrg: string;
  avatarInitials: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: { id: string; sender: string; text: string; time: string; isMe: boolean }[];
}

const INITIAL_THREADS: MessageThread[] = [
  {
    id: '1',
    senderName: 'Sarah Jenkins',
    senderOrg: 'Acme Global Corp',
    avatarInitials: 'SJ',
    subject: 'Question regarding Invoice #INV-2026-001',
    preview: 'Hi Team, we have processed payment for invoice #INV-2026-001 today. Please find transaction ref attached...',
    time: '10:45 AM',
    unread: true,
    messages: [
      { id: 'm1', sender: 'Sarah Jenkins (Acme)', text: 'Hi Team, we have processed payment for invoice #INV-2026-001 today. Please verify receipt when available.', time: '10:45 AM', isMe: false },
      { id: 'm2', sender: 'DirectFN Accounting', text: 'Thank you Sarah! We received the wire transfer. Marking invoice as Paid.', time: '11:02 AM', isMe: true },
    ],
  },
  {
    id: '2',
    senderName: 'David Miller',
    senderOrg: 'Apex Technologies',
    avatarInitials: 'DM',
    subject: 'Updated Tax Identification Form W-9',
    preview: 'Please find our updated 2026 W-9 tax certificate attached for your records...',
    time: 'Yesterday',
    unread: false,
    messages: [
      { id: 'm3', sender: 'David Miller (Apex)', text: 'Please find our updated 2026 W-9 tax certificate attached for your audit records.', time: 'Yesterday', isMe: false },
    ],
  },
  {
    id: '3',
    senderName: 'Elena Rostova',
    senderOrg: 'Starlight Retail LLC',
    avatarInitials: 'ER',
    subject: 'Receipt request for June Outflow',
    preview: 'Could you resend the PDF itemized receipt for our June software subscription?',
    time: 'Jul 17',
    unread: false,
    messages: [
      { id: 'm4', sender: 'Elena Rostova', text: 'Could you resend the PDF itemized receipt for our June software subscription?', time: 'Jul 17', isMe: false },
    ],
  },
];

export default function InboxPage() {
  const [threads, setThreads] = useState<MessageThread[]>(INITIAL_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('1');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const newMsg = {
      id: String(Date.now()),
      sender: 'DirectFN Finance Team',
      text: replyText,
      time: 'Just now',
      isMe: true,
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            preview: replyText,
            time: 'Just now',
            unread: false,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Client billing inquiries, payment confirmation receipts, and vendor communications.
          </p>
        </div>

        <Button className="cursor-pointer">
          <Mail className="h-4 w-4 mr-2" /> Compose Message
        </Button>
      </div>

      {/* Main Inbox Panel */}
      <div className="grid gap-6 lg:grid-cols-3 min-h-[560px]">
        {/* Thread List Sidebar */}
        <Card className="shadow-2xs flex flex-col">
          <CardHeader className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y flex-1 overflow-y-auto max-h-[500px]">
            {threads.map((t) => {
              const isSelected = t.id === selectedThreadId;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-foreground truncate max-w-[140px]">{t.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{t.time}</span>
                  </div>

                  <div className="text-[11px] font-semibold text-primary/90 flex items-center gap-1 mb-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {t.senderOrg}
                  </div>

                  <div className="text-xs font-semibold text-foreground truncate">{t.subject}</div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Conversation View */}
        <Card className="lg:col-span-2 shadow-2xs flex flex-col">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <CardHeader className="p-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {activeThread.avatarInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="text-sm font-bold text-foreground">{activeThread.subject}</h3>
                      <p className="text-xs text-muted-foreground">
                        From <span className="font-semibold">{activeThread.senderName}</span> ({activeThread.senderOrg})
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-1 inline" /> {activeThread.time}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages Thread */}
              <CardContent className="p-6 flex-1 space-y-4 overflow-y-auto max-h-[380px]">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-muted-foreground">{m.sender}</span>
                      <span className="text-[10px] text-muted-foreground/70">{m.time}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                        m.isMe
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted border rounded-bl-none text-foreground'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Reply Composer Footer */}
              <div className="p-3 border-t bg-muted/10">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <Input
                    placeholder={`Reply to ${activeThread.senderName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="h-10 text-xs"
                  />

                  <Button type="submit" className="cursor-pointer h-10 px-4">
                    <Send className="h-4 w-4 mr-1.5" /> Reply
                  </Button>
                </form>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
