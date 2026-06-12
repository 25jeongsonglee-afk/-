import React, { useState } from 'react';
import { User, InterviewReservation, Inquiry, Notice } from '../types';
import { 
  updateReservationStatus, deleteReservation, 
  updateInquiryAnswer, 
  addNotice, deleteNotice 
} from '../firebase';
import { 
  ShieldAlert, CheckCircle, XCircle, Search, Edit3, Calendar, Clock, 
  Trash, MessageSquare, AlertCircle, Plus, FileText, Send, Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  currentUser: User | null;
  reservations: InterviewReservation[];
  inquiries: Inquiry[];
  notices: Notice[];
  onRefresh: () => void;
}

export default function AdminPanel({ currentUser, reservations, inquiries, notices, onRefresh }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'interviews' | 'inquiries' | 'notices'>('interviews');
  
  // Search metrics
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit schedule states
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Answering inquiry states
  const [answeringInqId, setAnsweringInqId] = useState<string | null>(null);
  const [inquiryAnswerText, setInquiryAnswerText] = useState('');

  // Adding Notice states
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
        <ShieldAlert className="h-12 w-12 text-[#D9A441] mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">접근 권한이 없습니다.</h3>
        <p className="text-xs text-slate-500 mt-2">
          해당 구역은 대구일마이스터고 사람책 신문 부서의 <strong>관리자 전용</strong> 콘솔입니다. 시스템 권한을 획득하신 로그인 정보로 접근하여 조작해 주십시오.<br />
          (💡 상단 로그인 버튼 인근 "데모 로그인 &gt; 관리자" 이용 시 즉시 인가가 가능합니다)
        </p>
      </div>
    );
  }

  // Operation handlers
  const handleApprove = async (id: string) => {
    try {
      await updateReservationStatus(id, 'approved');
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReservationStatus(id, 'rejected');
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSchedule = async (id: string) => {
    if (!editDate || !editTime) return;
    try {
      await updateReservationStatus(id, 'approved', { date: editDate, time: editTime });
      setEditingResId(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!inquiryAnswerText.trim()) return;
    try {
      await updateInquiryAnswer(id, inquiryAnswerText.trim(), 'answered');
      setAnsweringInqId(null);
      setInquiryAnswerText('');
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    try {
      await addNotice({ title: noticeTitle.trim(), content: noticeContent.trim() });
      setNoticeTitle('');
      setNoticeContent('');
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm('이 공지사항 게시물을 삭제하겠습니까?')) {
      await deleteNotice(id);
      onRefresh();
    }
  };

  // Searching filter logic
  const filteredReservations = reservations.filter(r => 
    r.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInquiries = inquiries.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Selectors & Inner Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex border-2 border-[#1E3A5F]/10 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('interviews'); setSearchQuery(''); }}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'interviews' ? 'bg-[#1E3A5F] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🎤 인터뷰 신청 관리 ({reservations.length})
          </button>
          <button
            onClick={() => { setActiveTab('inquiries'); setSearchQuery(''); }}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'inquiries' ? 'bg-[#1E3A5F] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📩 문의 확인/답변 ({inquiries.length})
          </button>
          <button
            onClick={() => { setActiveTab('notices'); setSearchQuery(''); }}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'notices' ? 'bg-[#1E3A5F] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📢 공지사항 통합 관리 ({notices.length})
          </button>
        </div>

        {activeTab !== 'notices' && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="예약자, 제목, 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs py-2 px-9 rounded-xl border border-slate-200 bg-white"
            />
          </div>
        )}
      </div>

      {/* RENDER VIEW BLOCKS */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: INTERVIEW SCHEDULER MANAGEMENT */}
        {activeTab === 'interviews' && (
          <motion.div
            key="interviews-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E3A5F]/5 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="p-4">신청자 정보</th>
                    <th className="p-4">인터뷰 대상</th>
                    <th className="p-4">일시 및 장소</th>
                    <th className="p-4">취재 주제 및 핵심 설명</th>
                    <th className="p-4 text-center">승인 상태</th>
                    <th className="p-4 text-right">기획 배포</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">등록된 지면 조율 스케줄이 비어있습니다.</td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{res.userName}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">상세 소속: {res.userGradeClass || '인가필요'} | H.P: {res.userContact}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[9.5px] px-2 py-0.5 rounded font-bold ${res.targetType === 'student' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {res.targetType === 'student' ? '학생' : '교사의길'}
                          </span>
                          <div className="font-bold text-slate-800 mt-1">{res.targetName}</div>
                        </td>
                        <td className="p-4">
                          {editingResId === res.id ? (
                            <div className="space-y-1.5 p-1.5 bg-slate-50 rounded-lg max-w-[190px]">
                              <input 
                                type="date" 
                                value={editDate} 
                                onChange={(e) => setEditDate(e.target.value)} 
                                className="w-full p-1 border rounded text-[11px] focus:outline-none"
                              />
                              <input 
                                type="time" 
                                value={editTime} 
                                onChange={(e) => setEditTime(e.target.value)} 
                                className="w-full p-1 border rounded text-[11px] focus:outline-none"
                              />
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleUpdateSchedule(res.id)}
                                  className="flex-1 py-1 bg-[#1E3A5F] text-white text-[10px] font-bold rounded cursor-pointer"
                                >
                                  저장
                                </button>
                                <button 
                                  onClick={() => setEditingResId(null)}
                                  className="flex-1 py-1 bg-slate-300 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1 text-slate-700">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-semibold">{res.date}</span>
                              </span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{res.time}</span>
                              </span>
                              <button 
                                onClick={() => {
                                  setEditingResId(res.id);
                                  setEditDate(res.date);
                                  setEditTime(res.time);
                                }}
                                className="text-left text-[10.5px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>일정 수정</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 max-w-[260px]">
                          <div className="font-bold text-slate-850 line-clamp-1">{res.topic}</div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{res.content}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-[10px] rounded-full font-bold ${
                            res.status === 'approved' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : res.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {res.status === 'approved' ? '승인 완료' : res.status === 'rejected' ? '신청 반려' : '승인 대기'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {res.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleApprove(res.id)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg cursor-pointer"
                                  title="승인 승낙"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleReject(res.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg cursor-pointer"
                                  title="편성 거부"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => {
                                if(confirm('이 예약을 대시보드 목록에서 제외하겠습니까?')) {
                                  deleteReservation(res.id);
                                  onRefresh();
                                }
                              }}
                              className="p-1.5 text-slate-3 w-7 h-7 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer"
                              title="식제"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB 2: INQUIRIES FEEDBACK CENTER */}
        {activeTab === 'inquiries' && (
          <motion.div
            key="inquiries-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E3A5F]/5 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="p-4 w-16">번호</th>
                    <th className="p-4 w-32">작성자 정보</th>
                    <th className="p-4 w-28">문의 부문</th>
                    <th className="p-4">의제 제목 및 전문 내용</th>
                    <th className="p-4 text-center">전결 상태</th>
                    <th className="p-4 text-right">피드백 조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">수집된 교내 소통 문의가 없습니다.</td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq, index) => (
                      <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-slate-400 font-mono font-bold">
                          {index + 1}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{inq.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">{inq.contact}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[9.5px] px-2 py-0.5 rounded font-bold ${inq.category === 'website' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                            {inq.category === 'website' ? '홈페이지' : '신문 오류/기사'}
                          </span>
                        </td>
                        <td className="p-4 max-w-[320px]">
                          <div className="font-bold text-slate-850">{inq.title}</div>
                          <div className="text-[10.5px] text-slate-550 mt-1">{inq.content}</div>

                          {inq.answer && (
                            <div className="mt-2.5 p-3 bg-slate-50 border-l-2 border-[#1E3A5F] rounded-r-lg">
                              <p className="text-[10px] text-[#1E3A5F] font-bold flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>작성된 전결 답변지</span>
                              </p>
                              <p className="text-[10.5px] mt-1 text-slate-650 leading-relaxed font-semibold">{inq.answer}</p>
                            </div>
                          )}

                          {answeringInqId === inq.id && (
                            <form onSubmit={(e) => handleAnswerSubmit(e, inq.id)} className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2">
                              <label className="block text-[10px] font-bold text-indigo-800">해당 문항에 대한 공식 답변 작성</label>
                              <textarea
                                value={inquiryAnswerText}
                                onChange={(e) => setInquiryAnswerText(e.target.value)}
                                rows={3}
                                placeholder="작성하신 공식 코멘트 의견은 유저 문의 답변 영역에 노출됩니다."
                                className="w-full text-xs p-2 bg-white border border-indigo-250 rounded focus:outline-none focus:border-[#1E3A5F]"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button type="submit" className="py-1 px-3 bg-[#1E3A5F] text-white text-[10px] font-bold rounded cursor-pointer">
                                  답변 송신
                                </button>
                                <button type="button" onClick={() => setAnsweringInqId(null)} className="py-1 px-3 bg-slate-300 text-slate-700 text-[10px] font-bold rounded cursor-pointer">
                                  취소
                                </button>
                              </div>
                            </form>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[9.5px] rounded ${inq.status === 'answered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            {inq.status === 'answered' ? '답변 완료' : '답변 대기'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setAnsweringInqId(inq.id);
                              setInquiryAnswerText(inq.answer || '');
                            }}
                            className="bg-[#1E3A5F] hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <Send className="h-3 w-3 text-[#D9A441]" />
                            <span>{inq.answer ? '답변 수정' : '답변 달기'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB 3: NOTICE BOARD INTEGRATION */}
        {activeTab === 'notices' && (
          <motion.div
            key="notices-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Col: Notice Board Write */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg h-fit">
              <form onSubmit={handleAddNotice} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <Plus className="h-4.5 w-4.5 text-[#1E3A5F]" />
                  <h4 className="text-xs font-bold text-[#1E3A5F]">교내 공지사항 공표/게재</h4>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">공지사항 신규 타이틀</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="예: 2026학년도 2학기 방송반 편제 지침"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">상세 전언 내용</label>
                  <textarea
                    required
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    rows={4}
                    placeholder="전파하고자 하시는 상세 텍스트 문단을 서술하여 주십시오."
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#1E3A5F] hover:bg-slate-850 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>공지사항 바로 배포</span>
                </button>
              </form>
            </div>

            {/* Right Col: Current Active Notices list */}
            <div className="lg:col-span-2 space-y-3.5">
              <div className="p-3 bg-[#1E3A5F]/5 border border-slate-100 rounded-xl text-slate-700 text-xs font-bold flex items-center justify-between">
                <span>📢 현재 등재되어 발행된 공지 리스트 ({notices.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">순차 역순 정렬</span>
              </div>

              {notices.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-100 rounded-xl text-slate-400">
                  게시된 소식이 일시적으로 전무합니다.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto custom-scrollbar">
                  {notices.map((not) => (
                    <div key={not.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D9A441]" />
                          <span>{not.title}</span>
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed pl-3">{not.content}</p>
                        <span className="inline-block text-[9px] text-slate-400 pl-3">배포 일자: {new Date(not.createdAt).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(not.id)}
                        className="p-1 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                        title="공지 철거"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
