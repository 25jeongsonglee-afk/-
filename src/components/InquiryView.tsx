import React, { useState } from 'react';
import { Inquiry, User } from '../types';
import { addInquiry } from '../firebase';
import { Mail, Send, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface InquiryViewProps {
  currentUser: User | null;
  inquiries: Inquiry[];
  onRefresh: () => void;
}

export default function InquiryView({ currentUser, inquiries, onRefresh }: InquiryViewProps) {
  // States for Inquiries
  const [name, setName] = useState(currentUser?.name || '');
  const [contact, setContact] = useState(currentUser?.email || '');
  const [category, setCategory] = useState<'website' | 'newspaper'>('website');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !title || !content) return;

    setLoading(true);
    try {
      await addInquiry({
        name: name.trim(),
        contact: contact.trim(),
        category,
        title: title.trim(),
        content: content.trim()
      });

      setIsSent(true);
      setTitle('');
      setContent('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="inquiries-section" className="max-w-3xl mx-auto w-full">
      {/* COLUMN 1: Inquiry Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xl">
        {isSent ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">문의 사항이 접수되었습니다!</h4>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              전달해주신 문의는 총괄 신문 관리자가 접수하여 정성껏 피드백을 드릴 예정입니다.
            </p>
            <button
              onClick={() => setIsSent(false)}
              className="mt-6 py-2 px-6 bg-[#1E3A5F] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-slate-800 transition-all"
            >
              추가 문의사항 작성
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#1E3A5F]/10">
                <Mail className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">편집 기자실 소통 및 문의 건의</h3>
                <p className="text-xs text-slate-400 mt-0.5">신문 건의, 교내 제보 기획, 홈페이지 이용에 대한 의견을 남겨주십시오.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">작성자 이름</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">이메일 또는 연락처</label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="이메일 주소 또는 휴대전화 번호"
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">문의 유형 카테고리</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('website')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                    category === 'website' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  🏫 홈페이지 이용 및 건의 사항
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('newspaper')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                    category === 'newspaper' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  📰 마이스터고 신문 기사 제보 및 건의
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">문의 제목</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="도움이 필요하거나 제보하고 싶은 내용을 기입해주세요."
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">상세 건의 내용</label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="구체적인 내용을 입력해 주세요."
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-xs py-3 bg-[#1E3A5F] hover:bg-[#122641] disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? '전달하는 중...' : '건의사항 등록하기'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
