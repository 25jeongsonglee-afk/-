import React, { useState } from 'react';
import { User, InterviewReservation } from '../types';
import { addReservation } from '../firebase';
import { PenTool, Calendar, Clock, UserCheck, MessageSquare, Phone, CheckCircle, ListChecks, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InterviewRequestProps {
  currentUser: User | null;
  reservations: InterviewReservation[];
  onRefresh: () => void;
  onOpenLogin: () => void;
}

export default function InterviewRequest({ currentUser, reservations, onRefresh, onOpenLogin }: InterviewRequestProps) {
  const isStudent = !currentUser || currentUser.role === 'student' || currentUser.role === 'interview_student' || currentUser.role === 'picture_student';

  // Form values
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userDept, setUserDept] = useState(!isStudent ? '교무부' : '스마트팩토리과');
  const [userGradeClass, setUserGradeClass] = useState(currentUser?.student_number || '');
  const [userContact, setUserContact] = useState('');
  const [date, setDate] = useState('2026-06-12');
  const [time, setTime] = useState('14:00');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');

  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state if user changes
  useState(() => {
    if (currentUser) {
      setUserName(currentUser.name);
      if (currentUser.student_number) {
        setUserGradeClass(currentUser.student_number);
      }
      if (!isStudent) {
        setUserDept('교무부');
      } else {
        setUserDept('스마트팩토리과');
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('인터뷰를 신청하려면 로그인이 필요합니다.');
      onOpenLogin();
      return;
    }

    setLoading(true);
    const resolvedTargetType = (!isStudent) ? 'teacher' : 'student';
    const resolvedTargetName = userName.trim() + ' (신청자 본인)';

    try {
      await addReservation({
        userName: userName.trim(),
        userDept: userDept.trim() || undefined,
        userGradeClass: (isStudent ? userGradeClass.trim() : '교직원') || undefined,
        userContact: userContact.trim(),
        targetType: resolvedTargetType,
        targetName: resolvedTargetName,
        date,
        time,
        topic: topic.trim(),
        content: content.trim()
      });

      setIsCompleted(true);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsCompleted(false);
    setTopic('');
    setContent('');
    setUserContact('');
  };

  // Get user-specific reservations for review/status tracking
  const myReservations = reservations.filter(r => r.userId === currentUser?.id);

  return (
    <div id="interview-request-container" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Submission Module (Colspan 2) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8">
        
        {/* State 1: Submission Finished Banner */}
        {isCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-10"
          >
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">인터뷰 신청이 성공적으로 완료되었습니다!</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md">
              신문 제작기자단 및 관리자의 검토와 승인을 기다려 주세요.<br />
              지면 사정에 의해 사전에 기재해주신 연락처로 취재 관련 개별 전화를 드릴 수 있습니다.
            </p>
            
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleReset}
                className="py-2.5 px-6 bg-[#1E3A5F] hover:bg-[#152943] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                신작 추가 기사 신청하기
              </button>
            </div>
          </motion.div>
        ) : (
          /* State 2: Main Interview Form Input */
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="p-2 rounded-xl bg-[#1E3A5F]/10">
                <PenTool className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">새 지면 인터뷰 기사 신청 가이드</h3>
                <p className="text-xs text-slate-400 mt-0.5">선생님, 친구, 혹은 동아리팀 등 특별한 인물을 신문에 제보하고 기획해 보세요.</p>
              </div>
            </div>

            {!currentUser ? (
              <div className="p-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 mb-4">인터뷰를 신청 및 수정 관리하시려면 학교 구성원 로그인이 필요합니다.</p>
                <button
                  onClick={onOpenLogin}
                  className="py-2.5 px-6 bg-[#1E3A5F] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition-all"
                >
                  학교 구성원 간편 로그인하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Applicant Profile info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-705 mb-1.5">신청자 이름</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 bg-slate-50 cursor-not-allowed text-slate-500 rounded-xl border border-slate-200 outline-none"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-705 mb-1.5">신청자 연락처</label>
                    <span className="relative block">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={userContact}
                        onChange={(e) => setUserContact(e.target.value)}
                        placeholder="010-1234-5678"
                        className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A5F]"
                      />
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-750 mb-1.5">
                      {isStudent ? '소속 학과' : '소속 부서'}
                    </label>
                    <input
                      type="text"
                      required
                      value={userDept}
                      onChange={(e) => setUserDept(e.target.value)}
                      placeholder={isStudent ? '예: 스마트팩토리과' : '예: 교무부'}
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A5F]"
                    />
                  </div>

                  {isStudent && (
                    <div>
                      <label className="block text-xs font-bold text-slate-705 mb-1.5">학년/반/번호</label>
                      <input
                        type="text"
                        required
                        value={userGradeClass}
                        onChange={(e) => setUserGradeClass(e.target.value)}
                        placeholder="예: 3학년 1반 23번"
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A5F]"
                      />
                    </div>
                  )}
                </div>

                {/* Timeslot specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-705 mb-1.5">인터뷰 희망 기획 날짜</label>
                    <span className="relative block">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-705 mb-1.5">취재 면담 희망 시간</label>
                    <span className="relative block">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3">
                  <label className="block text-xs font-bold text-slate-705 mb-1.5">인터뷰 취재 핵심 주제</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="예: 마이스터 경진대회 핵심 부품 기술 금상 수상 기사 기획"
                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5">의도 및 신청 상세 내용</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="기사로 싣고 싶으신 에피소드나 질문 내용 등을 가급적 구체적으로 적어주실수록 승인 및 지면 실릴 확률이 높아집니다."
                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A5F] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-xl text-[10.5px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-[#D9A441]" />
                    <span>신청 완료 후 즉시 예약 시스템에 반영되어 관리자용 대시보드로 발송됩니다.</span>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs py-3 bg-[#1E3A5F] hover:bg-[#152943] text-white font-bold rounded-xl shadow-lg hover:shadow-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PenTool className="h-4 w-4" />
                  <span>{loading ? '신선한 기사로 작성 전송 중...' : '신청 완료하고 관리자 인가 대기'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Personal Status Dashboard (Colspan 1) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            <ListChecks className="h-5 w-5 text-[#1E3A5F]" />
            <h4 className="text-xs font-bold text-[#1E3A5F]">나의 인터뷰 예약 타임라인</h4>
          </div>

          {!currentUser ? (
            <div className="py-12 text-center">
              <p className="text-[11px] text-slate-400">로그인하시면 신청하신 지면 인터뷰의 승인 여부와 편성 스케줄을 조회하실 수 있습니다.</p>
            </div>
          ) : myReservations.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-100 p-4">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[11px] font-semibold text-slate-500">신청하신 인터뷰가 없습니다.</p>
              <p className="text-[10px] text-slate-400 mt-1">대구일마의 멋진 이야기를 가장 먼저 접수해 기획해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[460px] overflow-y-auto custom-scrollbar">
              {myReservations.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">#{r.id.substring(4, 9)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      r.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : r.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {r.status === 'approved' ? '승인 완료' : r.status === 'rejected' ? '신청 반려' : '승인 대기'}
                    </span>
                  </div>
                  
                  <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1">{r.topic}</h5>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{r.content}</p>

                  <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5 mt-2.5 text-[10px] text-slate-400 font-medium">
                    <div>
                      <span className="block text-[9px] text-slate-300">신청인 및 소속</span>
                      <span className="text-slate-600 font-semibold">
                        {r.userDept && `${r.userDept} `}
                        {r.userGradeClass && r.userGradeClass !== '교직원' && `(${r.userGradeClass}) `}
                        {r.userName}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-300">REQUESTED DATE</span>
                      <span className="text-slate-600 font-semibold">{r.date} {r.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informative Tip */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 text-[10px] text-slate-500 mt-4">
          <HelpCircle className="h-4.5 w-4.5 text-[#D9A441] inline-block mr-1.5 shrink-0 align-sub" />
          <span>신청하신 인터뷰 승인이 거절된 경우 취재 요건 미충족 또는 희망 날짜 중복 때문일 수 있습니다. 도서관으로 오시면 언제든지 세부 일정 변경이 조율 가능합니다.</span>
        </div>
      </div>
    </div>
  );
}
