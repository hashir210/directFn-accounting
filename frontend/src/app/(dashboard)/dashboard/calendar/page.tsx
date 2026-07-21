'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'invoice' | 'payroll' | 'tax' | 'payment';
  amount?: string;
  status: 'upcoming' | 'completed';
}

const EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Acme Global Invoice Due', date: '2026-07-05', type: 'invoice', amount: '$14,500.00', status: 'completed' },
  { id: '2', title: 'Q2 Tax Estimation Filing', date: '2026-07-10', type: 'tax', status: 'completed' },
  { id: '3', title: 'Bi-Weekly Team Payroll Run', date: '2026-07-15', type: 'payroll', amount: '$28,400.00', status: 'completed' },
  { id: '4', title: 'Apex Technologies Payment', date: '2026-07-19', type: 'payment', amount: '$8,200.50', status: 'completed' },
  { id: '5', title: 'WeWork Lease Payment Due', date: '2026-07-25', type: 'payment', amount: '$12,500.00', status: 'upcoming' },
  { id: '6', title: 'Vanguard Capital Invoice Due', date: '2026-07-26', type: 'invoice', amount: '$12,100.00', status: 'upcoming' },
  { id: '7', title: 'End-of-Month Payroll Run', date: '2026-07-31', type: 'payroll', amount: '$29,100.00', status: 'upcoming' },
];

export default function CalendarPage() {
  const [currentMonth] = useState('July 2026');
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track scheduled invoice due dates, recurring payrolls, and tax filing deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <span className="text-sm font-bold px-2">{currentMonth}</span>
          <Button variant="outline" size="sm" className="cursor-pointer">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button size="sm" className="cursor-pointer ml-2">
            <Plus className="h-4 w-4 mr-1" /> Schedule Event
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 shadow-2xs">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Month Schedule — July 2026
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600">● Invoices</Badge>
              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600">● Payroll</Badge>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600">● Tax</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground mb-2">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding offset for July 2026 start (Wed = 3 offset) */}
              <div className="h-20 bg-muted/20 rounded-lg p-1 text-[10px] text-muted-foreground/40">28</div>
              <div className="h-20 bg-muted/20 rounded-lg p-1 text-[10px] text-muted-foreground/40">29</div>
              <div className="h-20 bg-muted/20 rounded-lg p-1 text-[10px] text-muted-foreground/40">30</div>

              {daysInMonth.map((day) => {
                const dayStr = `2026-07-${day < 10 ? '0' + day : day}`;
                const dayEvents = EVENTS.filter((e) => e.date === dayStr);
                const isToday = day === 20;

                return (
                  <div
                    key={day}
                    className={`h-20 border rounded-lg p-1.5 flex flex-col justify-between transition-colors ${
                      isToday ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30' : 'bg-background hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold ${isToday ? 'bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center' : ''}`}>
                        {day}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                            ev.type === 'invoice'
                              ? 'bg-emerald-100 text-emerald-700'
                              : ev.type === 'payroll'
                              ? 'bg-indigo-100 text-indigo-700'
                              : ev.type === 'tax'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="shadow-2xs">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming Events
            </CardTitle>
            <CardDescription className="text-xs">Scheduled for this month</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {EVENTS.map((ev) => (
              <div key={ev.id} className="p-3 border rounded-xl bg-card space-y-1.5 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${
                      ev.type === 'invoice'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : ev.type === 'payroll'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}
                  >
                    {ev.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">{ev.date}</span>
                </div>

                <div className="text-xs font-bold text-foreground">{ev.title}</div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>{ev.amount || 'Filing Deadline'}</span>
                  {ev.status === 'completed' ? (
                    <span className="text-emerald-600 flex items-center font-medium">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center font-medium">
                      <AlertCircle className="h-3 w-3 mr-1" /> Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
