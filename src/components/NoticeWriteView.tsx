import React, { useState } from 'react';
import { User } from '../types';
import { addNotice } from '../firebase';
import { Bell, Megaphone, Check, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface NoticeWriteViewProps {
  currentUser: User | null;
  onRefresh: () => void;
}

export default function NoticeWriteView({ currentUser, onRefresh }: NoticeWriteViewProps) {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeSuccess, setNoticeSuccess] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    setNoticeLoading(true);
    try {
      await addNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim()
      });

      setNoticeSuccess(true);
      setNoticeTitle('');
      setNoticeContent('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setNoticeLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto w-full text-center py-16 px-4 animate-fade-in">
        <div className="bg-white border border-rose-100 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">접근 권한이 제한되었습니다</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            이 페이지는 <strong>총괄 대표 관리자(정송이)</strong> 전용 공지사항 등록 공간입니다. 
            학생 회원이나 독자이신 경우 홈페이지의 문의 사항 혹은 기사 제보실을 이용해 주시길 바랍니다.
          </p>
          <div className="pt-2">
            <span className="text-[10px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl font-bold font-mono border border-rose-200">
              권한 제한: 대표 관리자 전용
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="notice-write-section" className="max-w-2xl mx-auto w-full animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl">
        {noticeSuccess ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center p-8 text-center min-h-[350px]"
          >
            <div className="h-16 w-16 bg-amber-50 text-[#D9A441] rounded-full flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">공지 및 교내 소식이 발행되었습니다!</h4>
            <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
              작성해주신 내용이 홈화면 우측의 <strong>&quot;📢 공지사항 및 교내 소식&quot;</strong> 섹션에 실시간 게시되었습니다.
            </p>
            <button
              onClick={() => setNoticeSuccess(false)}
              className="mt-6 py-2.5 px-6 bg-[#D9A441] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#c39133] transition-all"
            >
              추가 소식 등록하기
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleNoticeSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Bell className="h-5 w-5 text-[#D9A441]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">📢 공지사항 및 교내 소식 등록</h3>
                <p className="text-xs text-slate-400 mt-0.5">홈화면에 실시간으로 게시될 마이스터고 중요 알림이나 교내 소식을 생성합니다.</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
              <div className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
                ✓ 대표관리자 <span className="font-bold underline">{currentUser?.name || '정송이'}</span> 계정으로 연결되어 라이브 인증이 완료되었습니다. 글 등록 즉시 홈 전광판에 즉시 브로드캐스트 전파됩니다.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">소식 / 공지 제목</label>
              <input
                type="text"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="예: [안내] 6월호 월간 사람책 발행 기념 행사 안내"
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#D9A441] focus:ring-1 focus:ring-[#D9A441]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">공지 및 소식 상세 내용</label>
              <textarea
                required
                rows={9}
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="홈페이지 우측 보드에 보일 내용을 작성해주십시오. 줄바꿈이 정상적으로 표현됩니다."
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#D9A441] focus:ring-1 focus:ring-[#D9A441] resize-none"
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                💡 등록 즉시 홈화면에 라이브 반영되어 모든 독자가 확인할 수 있습니다.
              </p>
            </div>

            <button
              type="submit"
              disabled={noticeLoading}
              className="w-full text-xs py-3 bg-[#D9A441] hover:bg-[#c39133] disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Megaphone className="h-4 w-4" />
              <span>{noticeLoading ? '소식을 게시판에 발행하는 중...' : '공지 및 교내 소식 등록하기'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
