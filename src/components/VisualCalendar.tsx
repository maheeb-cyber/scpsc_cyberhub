import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Tag, Sparkles, MapPin, Check } from "lucide-react";
import { Event } from "../types";

interface VisualCalendarProps {
  events: Event[];
  onRegisterEvent: (eventId: string) => void;
  userId: string;
}

export default function VisualCalendar({ events, onRegisterEvent, userId }: VisualCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to check if two dates are same calendar day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Helper to parse dynamic event dates
  const getEventDate = (evt: Event): Date => {
    return new Date(evt.date);
  };

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Index of first day of the month (0 = Sun, 1 = Mon, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Array of days for the grid
  const daysGrid: (Date | null)[] = [];
  // Pad with nulls for empty slots before 1st day
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  // Fill in active dates
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get events on a specific date
  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(evt => isSameDay(getEventDate(evt), date));
  };

  // Get active events for the currently selected date
  const activeEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-950/40 p-6 rounded-2xl border border-gray-900">
      
      {/* Left Col: Month Grid (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg tracking-tight">
                {monthNames[month]} {year}
              </h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                SCPSC IT Workshop Calendar
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 font-mono">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-gray-800 hover:border-cyber-cyan bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1.5 rounded-lg border border-gray-800 hover:border-cyber-cyan bg-gray-900 hover:bg-gray-800 text-[10px] text-gray-300 transition-all font-bold"
            >
              TODAY
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-gray-800 hover:border-cyber-cyan bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs">
          {/* Weekday headers */}
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div key={day} className="py-2 text-[10px] text-gray-500 font-bold border-b border-gray-900">
              {day}
            </div>
          ))}

          {/* Day Cells */}
          {daysGrid.map((date, idx) => {
            if (!date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square bg-transparent border border-transparent"
                />
              );
            }

            const dayEvents = getEventsForDate(date);
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={`day-${date.getTime()}`}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 transition-all relative ${
                  isSelected 
                    ? "bg-cyber-cyan/15 border-cyber-cyan text-white shadow-lg shadow-cyber-cyan/10" 
                    : isToday 
                      ? "bg-gray-900 border-gray-800 text-cyber-cyan font-bold ring-1 ring-cyber-cyan/30" 
                      : "bg-gray-900/35 hover:bg-gray-900 border-gray-900/50 hover:border-gray-800 text-gray-300"
                }`}
              >
                {/* Day indicator */}
                <span className={`text-[11px] self-start font-bold ${isToday && "text-cyber-cyan bg-cyber-cyan/5 px-1 rounded"}`}>
                  {date.getDate()}
                </span>

                {/* Event bullet glow */}
                {hasEvents && (
                  <div className="flex space-x-1 justify-center w-full mb-0.5">
                    {dayEvents.map((evt, eIdx) => (
                      <span
                        key={evt.id}
                        className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          evt.type === "Hackathon" 
                            ? "bg-cyber-pink" 
                            : evt.type === "Competition" 
                              ? "bg-amber-400" 
                              : "bg-cyber-cyan"
                        }`}
                        title={evt.title}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Col: Selected Day Events detail panel (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-900 lg:pl-6 pt-6 lg:pt-0">
        <div className="space-y-4 flex-1">
          <div className="border-b border-gray-900 pb-3">
            <span className="text-[9px] font-mono text-cyber-cyan uppercase tracking-wider block">
              SCHEDULED AGENDA
            </span>
            <h4 className="text-sm font-display font-extrabold text-white">
              {selectedDate ? selectedDate.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select a date"}
            </h4>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activeEvents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-gray-700 mx-auto opacity-40" />
                <p className="text-xs text-gray-500 font-mono">NO LAB WORKSHOPS OR HACKATHONS SCHEDULED ON THIS NODE</p>
              </div>
            ) : (
              activeEvents.map((evt) => {
                const isRegistered = evt.registeredUsers?.includes(userId);
                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700/80 transition-all space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider ${
                        evt.type === "Hackathon"
                          ? "bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink"
                          : evt.type === "Competition"
                            ? "bg-amber-400/10 border border-amber-400/20 text-amber-400"
                            : "bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan"
                      }`}>
                        {evt.type}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">{evt.countdown}</span>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-xs font-display font-bold text-white group-hover:text-cyber-cyan transition-colors">
                        {evt.title}
                      </h5>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-950 font-mono text-[9px] text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-cyber-cyan" />
                        <span>{new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-cyber-cyan" />
                        <span className="truncate">Computer Lab 404</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRegisterEvent(evt.id)}
                      disabled={isRegistered}
                      className={`w-full py-2 rounded-lg text-[10px] font-mono font-bold transition-all border flex items-center justify-center space-x-1 ${
                        isRegistered
                          ? "bg-gray-950 border-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-cyber-cyan hover:bg-cyber-cyan/90 border-cyber-cyan hover:border-cyber-cyan text-gray-950 hover:shadow-md hover:shadow-cyber-cyan/15"
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>SECURED ACCESS GRANTED</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>ENROLL TO SECURE PLACE</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-900 mt-4 text-[10px] text-gray-500 leading-relaxed flex items-start space-x-2 font-mono">
          <Sparkles className="w-4 h-4 text-cyber-cyan shrink-0 mt-0.5" />
          <span>Click highlight slots on month matrix to decrypt workshops. Registered events issue direct certification tokens upon pass completion.</span>
        </div>
      </div>
    </div>
  );
}
