import { useState } from 'react';
import { InterviewReservation } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Landmark, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  reservations: InterviewReservation[];
}

export default function Calendar({ reservations }: CalendarProps) {
  const [viewType, setViewType] = useState<'monthly' | 'weekly'>('monthly');
  // Current client date setup to June 12, 2026 (matches provided school's local time setting reference)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 12)); // June 2026

  // Helper date generators
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const shiftMonth = (amount: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + amount);
    setCurrentDate(nextDate);
  };

  const shiftWeek = (amount: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + amount * 7);
    setCurrentDate(nextDate);
  };

  const getApprovedReservations = () => {
    return reservations.filter(r => r.status === 'approved' || r.status === 'pending');
  };

  // Monthly View Generators
  const renderMonthlyDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const totalDays = getDaysInMonth(year, month);
    const startOffset = getFirstDayOfMonth(year, month);

    const days = [];
    
    // Header Row offset days
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 border border-slate-100 bg-slate-50/40" />);
    }

    // Days with schedule events
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayReservations = getApprovedReservations().filter(r => r.date === dateString);
      const isToday = day === 12 && month === 5 && year === 2026;

      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-28 border border-slate-100 p-2 flex flex-col justify-between transition-all hover:bg-slate-50/50 ${
            isToday ? 'bg-[#D9A441]/5 border-[#D9A441]/60' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${
              isToday ? 'bg-[#D9A441] text-white h-5 w-5 rounded-full flex items-center justify-center font-bold' : 'text-slate-700'
            }`}>
              {day}
            </span>
            {dayReservations.length > 0 && (
              <span className="text-[10px] scale-90 bg-[#1E3A5F] text-white px-1.5 py-0.5 rounded-full font-bold">
                {dayReservations.length}건
              </span>
            )}
          </div>
          
          <div className="flex-1 mt-1.5 overflow-y-auto space-y-1 custom-scrollbar">
            {dayReservations.slice(0, 2).map((r) => {
              const bgClass = r.status === 'approved' ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-amber-100/80 text-amber-800';
              const dotClass = r.status === 'approved' ? 'bg-[#1E3A5F]' : 'bg-amber-500';
              return (
                <div 
                  key={r.id} 
                  title={`${r.time} - ${r.userName} 인터뷰 (${r.topic})`}
                  className={`text-[10px] p-1 rounded font-medium flex items-center gap-1 truncate ${bgClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
                  <span className="font-semibold text-[9.5px] whitespace-nowrap">{r.time}</span>
                  <span className="truncate">{r.userName.split('(')[0]}</span>
                </div>
              );
            })}
            {dayReservations.length > 2 && (
              <div className="text-[9px] text-slate-400 font-medium text-center">+{dayReservations.length - 2}개 더보기</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Weekly View Generator
  const getWeeklyDates = () => {
    const dates = [];
    const currentDayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  return (
    <div id="calendar-board" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Calendar Header Control Block */}
      <div className="px-6 py-5 bg-gradient-to-r from-[#1E3A5F] to-[#2C5282] text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10">
            <CalendarIcon className="h-5.5 w-5.5 text-[#D9A441]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">인터뷰 일정표</h3>
            <p className="text-xs text-slate-200 mt-0.5">학교 방송실 및 신문편집 취재 일정을 확인하세요.</p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/15 p-1 rounded-lg border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${viewType === 'monthly' ? 'bg-white text-[#1E3A5F] shadow' : 'text-slate-100 hover:text-white'}`}
            >
              월간 보기
            </button>
            <button
              onClick={() => setViewType('weekly')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${viewType === 'weekly' ? 'bg-white text-[#1E3A5F] shadow' : 'text-slate-100 hover:text-white'}`}
            >
              주간 보기
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => viewType === 'monthly' ? shiftMonth(-1) : shiftWeek(-1)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold tracking-wider whitespace-nowrap min-w-[90px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={() => viewType === 'monthly' ? shiftMonth(1) : shiftWeek(1)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-5">
        {viewType === 'monthly' ? (
          <div>
            {/* Days of the Week Header Row */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 mb-2">
              <div className="text-rose-500 py-1 bg-slate-50 rounded-md">일</div>
              <div className="py-1 bg-slate-50 rounded-md">월</div>
              <div className="py-1 bg-slate-50 rounded-md">화</div>
              <div className="py-1 bg-slate-50 rounded-md">수</div>
              <div className="py-1 bg-slate-50 rounded-md">목</div>
              <div className="py-1 bg-slate-50 rounded-md">금</div>
              <div className="text-blue-500 py-1 bg-slate-50 rounded-md">토</div>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {renderMonthlyDays()}
            </div>
          </div>
        ) : (
          /* Weekly View Layout */
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2.5">
              {getWeeklyDates().map((wDate, idx) => {
                const dateStr = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, '0')}-${String(wDate.getDate()).padStart(2, '0')}`;
                const weekReservations = getApprovedReservations().filter(r => r.date === dateStr);
                const isSelectedDay = wDate.getDate() === 12 && wDate.getMonth() === 5 && wDate.getFullYear() === 2026;
                const daysKorean = ['일', '월', '화', '수', '목', '금', '토'];

                return (
                  <div 
                    key={`week-day-${idx}`} 
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelectedDay ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="block text-[11px] font-medium opacity-85 mb-1">
                      {daysKorean[wDate.getDay()]}
                    </span>
                    <span className="block text-lg font-bold">
                      {wDate.getDate()}
                    </span>
                    <span className={`inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      weekReservations.length > 0 
                        ? (isSelectedDay ? 'bg-[#D9A441] text-[#1E3A5F]' : 'bg-[#1E3A5F] text-white')
                        : 'bg-slate-200/50 text-slate-400'
                    }`}>
                      {weekReservations.length}건
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hour schedules for selected week */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
              <div className="p-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>📅 이번 주 지면 인터뷰 상세 예약 목록</span>
                <span className="text-[10px] text-slate-400 font-mono">주간 취재 스케줄러</span>
              </div>

              <div className="divide-y divide-slate-100">
                {getWeeklyDates().flatMap(wDate => {
                  const dateStr = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, '0')}-${String(wDate.getDate()).padStart(2, '0')}`;
                  return getApprovedReservations().filter(r => r.date === dateStr);
                }).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">이번 주 계획된 인터뷰 일정이 없습니다.</div>
                ) : (
                  getWeeklyDates().flatMap(wDate => {
                    const dateStr = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, '0')}-${String(wDate.getDate()).padStart(2, '0')}`;
                    return getApprovedReservations().filter(r => r.date === dateStr);
                  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time)).map((res) => (
                    <div key={`week-detail-${res.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {res.status === 'approved' ? (
                            <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800">{res.topic}</h4>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              res.targetType === 'student' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              대상: {res.targetType === 'student' ? '학생' : '교사'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{res.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              신청자: {res.userName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              희망 날짜: {res.date} {res.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-slate-50 sm:border-0 pt-2 sm:pt-0">
                        <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400">STATUS</span>
                        <span className={`text-[11px] font-bold ${res.status === 'approved' ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {res.status === 'approved' ? '승인 완료' : '승인 대기'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Block */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1E3A5F]" />
            <span>승인된 정식 인터뷰</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>예약 및 검토 중인 일정</span>
          </span>
        </div>
        <div className="text-[10px] text-[#D9A441] font-semibold bg-[#1E3A5F]/5 py-1 px-2.5 rounded-lg border border-[#D9A441]/20">
          * 매월 고정 인쇄를 위한 취재 인터뷰는 방송실/편집기자단 지원을 거치게 되며 상시 조정 가능합니다.
        </div>
      </div>
    </div>
  );
}
