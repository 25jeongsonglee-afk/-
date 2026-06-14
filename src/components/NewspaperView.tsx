import React, { useState } from 'react';
import { Newspaper, User, NewspaperComment } from '../types';
import { addNewspaper, deleteNewspaper, getNewspaperComments, addNewspaperComment, deleteNewspaperComment } from '../firebase';
import { BookOpen, Search, Download, Trash, RefreshCw, Plus, FileText, Image as ImageIcon, Check, Calendar, AlertCircle, MessageSquare, Trash2, X, Shield, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewspaperViewProps {
  newspapers: Newspaper[];
  onRefresh: () => void;
  currentUser: User | null;
}

export default function NewspaperView({ newspapers, onRefresh, currentUser }: NewspaperViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  
  // Add state forms
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const [fileType, setFileType] = useState<'pdf' | 'image'>('pdf');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'librarian';
  const canManageNewspaper = currentUser?.role === 'admin' || currentUser?.role === 'librarian';
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  // Comments states
  const [selectedNewspaper, setSelectedNewspaper] = useState<Newspaper | null>(null);
  const [comments, setComments] = useState<NewspaperComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDept, setCommentDept] = useState('');
  const [commentGrade, setCommentGrade] = useState('1학년');
  const [commentClassNum, setCommentClassNum] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const loadComments = async (paperId: string) => {
    setCommentsLoading(true);
    try {
      const fetched = await getNewspaperComments(paperId);
      setComments(fetched);
    } catch (err) {
      console.error("댓글 로딩 실패:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComments = (paper: Newspaper) => {
    setSelectedNewspaper(paper);
    loadComments(paper.id);

    // Pre-populate fields based on currentUser to make it extremely friendly
    if (currentUser) {
      setCommentName(currentUser.name || '');
      if (currentUser.role === 'teacher' || currentUser.role === 'admin' || currentUser.role === 'librarian') {
        setCommentGrade('교직원');
        setCommentDept('교무부');
        setCommentClassNum('교직원');
      } else {
        if (currentUser.student_number && currentUser.student_number.length >= 4) {
          const g = currentUser.student_number.substring(0, 1) + '학년';
          const cNum = currentUser.student_number.substring(1, 2) + '반 ' + parseInt(currentUser.student_number.substring(2)) + '번';
          setCommentGrade(g);
          setCommentClassNum(cNum);
        } else {
          setCommentGrade('1학년');
          setCommentClassNum('');
        }
        setCommentDept(''); // clear for manual input
      }
    } else {
      setCommentName('');
      setCommentGrade('1학년');
      setCommentClassNum('');
      setCommentDept('');
    }
    setCommentText('');
    setCommentError('');
    setCommentSuccess(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewspaper) return;
    
    // Validations: Dept, Grade/Teacher-Omission, ClassNum, Name, Content
    if (!commentDept.trim()) {
      setCommentError('학과 및 부서를 기입해주세요 (예: 스마트팩토리과, 전자기기과, 교무부).');
      return;
    }
    if (!isTeacher && !commentGrade) {
      setCommentError('학생독자는 학년을 반드시 선택해야 합니다.');
      return;
    }
    if (!commentClassNum.trim()) {
      setCommentError(isTeacher ? '교직원 구분 또는 직함을 기입해주세요 (예: 교직원, 교사, 행정실).' : '반과 번호를 입력해주세요 (예: 1반 23번).');
      return;
    }
    if (!commentName.trim()) {
      setCommentError('이름을 입력해주세요.');
      return;
    }
    if (!commentText.trim()) {
      setCommentError('댓글 내용을 입력해주세요.');
      return;
    }

    setCommentError('');
    try {
      await addNewspaperComment({
        newspaperId: selectedNewspaper.id,
        authorDept: commentDept.trim(),
        authorGrade: isTeacher ? undefined : commentGrade,
        authorClassNumber: commentClassNum.trim(),
        authorName: commentName.trim(),
        content: commentText.trim()
      });

      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3050);
      loadComments(selectedNewspaper.id);
    } catch (err) {
      console.error(err);
      setCommentError('댓글 등록 처리 중 에러가 발생했습니다.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    setDeletingCommentId(commentId);
    try {
      await deleteNewspaperComment(commentId);
      if (selectedNewspaper) {
        loadComments(selectedNewspaper.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Handle local file readings and conversions to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('데모 저장을 위해 2MB 이내의 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploadError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleURLFallback = () => {
    // Fill realistic mock placeholder URL safely
    const randomSeed = Math.floor(Math.random() * 1000);
    const mockPic = `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800&sig=${randomSeed}`;
    setFileBase64(mockPic);
    setFileName(`meister_paper_gen_${month}월호.pdf`);
    setUploadError('데모 이미지 템플릿 주소가 자동 생성되어 적용되었습니다.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await addNewspaper({
        title: title.trim(),
        year,
        month,
        fileType,
        fileName: fileName || `meister_paper_${year}_${month}.pdf`,
        fileDataUrl: fileBase64 || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800'
      });
      // reset
      setTitle('');
      setFileBase64('');
      setFileName('');
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말로 이 월호 신문을 목록에서 완전히 삭제하시겠습니까?')) {
      await deleteNewspaper(id);
      onRefresh();
    }
  };

  // Filtering
  const filteredNewspapers = newspapers.filter((paper) => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'all' || paper.year === selectedYear;
    return matchesSearch && matchesYear;
  });

  const yearsList = Array.from(new Set(newspapers.map(p => p.year))).sort((a,b) => b - a);

  const startDownload = (paper: Newspaper) => {
    // Generate simple programmatic file download
    const link = document.createElement('a');
    link.href = paper.fileDataUrl || '#';
    link.download = paper.fileName || `meister_newspaper_${paper.year}_${paper.month}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="newspapers-archive" className="space-y-6">
      {/* Top Banner Control Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="궁금한 신문이나 기사 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs py-2.5 pl-10 pr-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A5F] transition-all"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs bg-white border border-slate-200 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#1E3A5F] cursor-pointer"
          >
            <option value="all">전체 연도</option>
            {yearsList.map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 bg-[#D9A441] hover:bg-[#c29235] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>신문 업로드</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 cursor-pointer"
            title="다시 로드"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Admin Insertion Drawer block */}
      <AnimatePresence>
        {isAdding && isAdmin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-[#1E3A5F]/5 border-2 border-dashed border-[#1E3A5F]/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
                  <h4 className="text-sm font-bold text-[#1E3A5F]">관리자 - 신규 월별 신문 보관소 추가</h4>
                </div>
                <span className="text-[10px] text-[#D9A441] font-bold">ADMIN CONSOLE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">발행 신문 제목</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 대구일마이스터고 신문 2026년 6월호"
                    className="w-full text-xs py-2.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">발행 연도 / 월 선택</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="text-xs bg-white border border-slate-200 py-2 px-3 rounded-xl focus:outline-none"
                    >
                      <option value={2026}>2026년</option>
                      <option value={2025}>2025년</option>
                      <option value={2024}>2024년</option>
                    </select>

                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="text-xs bg-white border border-slate-200 py-2 px-3 rounded-xl focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}월호</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">파일 포맷 규격</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFileType('pdf')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                        fileType === 'pdf' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-slate-700'
                      }`}
                    >
                      PDF 업로드 (.pdf)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileType('image')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                        fileType === 'image' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-slate-700'
                      }`}
                    >
                      이미지 보드 (.png/.jpg)
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">신문 문서 또는 커버 표지 업로드</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-white text-center flex flex-col items-center justify-center relative">
                    <input
                      type="file"
                      accept={fileType === 'pdf' ? '.pdf' : 'image/*'}
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {fileType === 'pdf' ? <FileText className="h-8 w-8 text-[#1E3A5F] mb-2" /> : <ImageIcon className="h-8 w-8 text-[#1E3A5F] mb-2" />}
                    <p className="text-xs font-bold text-slate-800">
                      파일 선택하기 또는 드래그 앤 드롭
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">파일 제한 용량: 2MB</p>
                    {fileName && <p className="text-xs font-semibold text-indigo-600 mt-2">✓ {fileName}</p>}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#D9A441] block">DEVELOPER TOOLS AUTO-TEST</span>
                      <p className="text-xs text-slate-600">
                        직접 업로드할 파일이 없으시다면 아래 버튼을 클릭하여 데모용 Unsplash 고품질 신문 표지 템플릿 이미지를 무작위 자동 매핑해 삽입할 수 있습니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleURLFallback}
                      className="mt-3 py-2 px-4 bg-[#1E3A5F] hover:bg-[#1c3657] text-white text-[11px] font-semibold rounded-xl cursor-pointer"
                    >
                      랜덤 템플릿 소스 자동 배치
                    </button>
                  </div>
                </div>
                {uploadError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs mt-2 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-[#1A365D] hover:bg-[#11243F] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  보관소 게시 완수
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly grid and list of newspaper titles */}
      {filteredNewspapers.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl border-slate-200 bg-slate-50/50">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">지정된 조건에 마칭되는 신문 문서가 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">검색어를 수정하시거나 다른 필터를 선택해 보십시오.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredNewspapers.map((paper, idx) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all flex flex-col group"
            >
              {/* Cover Mock Thumbnail */}
              <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                {paper.fileDataUrl ? (
                  <img
                    src={paper.fileDataUrl}
                    alt={paper.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <BookOpen className="h-10 w-10 text-[#1E3A5F]/20 mb-2" />
                    <span className="text-xs font-mono">No Image Preview</span>
                  </div>
                )}
                
                {/* Format Tag */}
                <span className="absolute top-3 left-3 bg-[#1E3A5F] text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                  {paper.fileType === 'pdf' ? '📖 PDF ARCHIVE' : '🖼️ IMAGE BOARD'}
                </span>

                {/* Quick Details Floating Banner */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                  <button
                    onClick={() => startDownload(paper)}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-[#1E3A5F] hover:text-[#1E3A5F] flex items-center justify-center gap-2 text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>바로 아카이브 다운</span>
                  </button>
                </div>
              </div>

              {/* Contents block */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-[#D9A441] font-bold tracking-wider mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>{paper.year}년 {paper.month}월호</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#1E3A5F] transition-colors">{paper.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate border-t border-slate-50 pt-2 font-mono">
                    파일명: {paper.fileName || `${paper.month}월신문.pdf`}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleOpenComments(paper)}
                    className="w-full py-2 bg-indigo-50/70 hover:bg-indigo-100 text-[#1E3A5F] border border-indigo-150/40 hover:border-indigo-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                    <span>독자 소통방 / 댓글 쓰기</span>
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => startDownload(paper)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-[#1E3A5F]/5 border border-slate-200 hover:border-[#1E3A5F]/40 text-[#1E3A5F] font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>다운로드 (PDF)</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(paper.id)}
                        className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shrink-0"
                        title="지면 삭제"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          READERS COMMENTS AND NEWSPAPER DETAIL OVERLAY MODAL
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNewspaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] border border-slate-100"
            >
              {/* Modal Header */}
              <div className="bg-[#1E3A5F] text-white p-4 md:px-6 md:py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-amber-300">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold tracking-tight">
                      📖 {selectedNewspaper.title} 독자 소통방
                    </h3>
                    <p className="text-[10px] text-slate-200 md:text-[11px] font-mono mt-0.5">
                      {selectedNewspaper.year}년 {selectedNewspaper.month}월호 • 실시간 의견 나눔터
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNewspaper(null)}
                  className="p-1.5 md:p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                  title="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Core Contents Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 custom-scrollbar">
                
                {/* Left Panel: Newspaper Poster */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-inner">
                    {selectedNewspaper.fileDataUrl ? (
                      <div className="aspect-[4/5] rounded-xl overflow-hidden relative border border-slate-200 shadow-sm max-h-[220px] lg:max-h-[300px]">
                        <img
                          src={selectedNewspaper.fileDataUrl}
                          alt={selectedNewspaper.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg text-[9px] text-amber-300 font-bold uppercase font-mono border border-slate-700">
                          {selectedNewspaper.fileType === 'pdf' ? '📖 PDF 데이터 보관본' : '🖼️ 이미지 파일 지면'}
                        </span>
                      </div>
                    ) : (
                      <div className="aspect-[4/5] bg-slate-100 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400">
                        <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                        <span className="text-xs text-slate-400 font-semibold font-mono">신문 지면 이미지 없음</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => startDownload(selectedNewspaper)}
                      className="w-full py-2.5 bg-[#D9A441] hover:bg-[#c29235] text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-4 w-4" />
                      <span>신문지면 전체 내려받기</span>
                    </button>
                    
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                      <div className="text-[10px] text-[#1E3A5F] font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>의견 나눔 에티켓</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-normal">
                        동료 학생, 선생님들이 지식과 온기를 담아 만든 학교 신문입니다. 건설적인 의견, 따뜻한 응원의 한마디 등 고운 말로 독자 소통방 가치를 빛내주세요.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Comments List & Submission Form */}
                <div className="lg:col-span-8 flex flex-col gap-6 font-sans">
                  
                  {/* Comment Submission Box */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5 text-indigo-600" />
                        <span>독자 한마디 남기기</span>
                      </h4>
                    </div>

                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                      <div className={`grid grid-cols-2 ${isTeacher ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-2.5`}>
                        
                        {/* Department Area */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">학과 및 부서</label>
                          <input
                            type="text"
                            required
                            value={commentDept}
                            onChange={(e) => setCommentDept(e.target.value)}
                            placeholder="예: 전기과, 기계과, 교무부"
                            className="w-full text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A5F]"
                          />
                        </div>

                        {/* Grade Area (Omitted entirely if Teacher) */}
                        {!isTeacher && (
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">학년</label>
                            <select
                              value={commentGrade}
                              onChange={(e) => setCommentGrade(e.target.value)}
                              className="w-full text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A5F] cursor-pointer"
                            >
                              <option value="1학년">1학년</option>
                              <option value="2학년">2학년</option>
                              <option value="3학년">3학년</option>
                            </select>
                          </div>
                        )}

                        {/* Class and Number / Role Area */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            {isTeacher ? '직함/부서지위' : '반-번호'}
                          </label>
                          <input
                            type="text"
                            required
                            value={commentClassNum}
                            onChange={(e) => setCommentClassNum(e.target.value)}
                            placeholder={isTeacher ? '예: 교사, 관리자' : '예: 1반 23번'}
                            className="w-full text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A5F]"
                          />
                        </div>

                        {/* Name Area */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">이름</label>
                          <input
                            type="text"
                            required
                            value={commentName}
                            onChange={(e) => setCommentName(e.target.value)}
                            placeholder="이름 입력"
                            className="w-full text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A5F]"
                          />
                        </div>

                      </div>

                      {/* Content Area */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">동료평가 및 의견 상세 내용</label>
                        <div className="relative">
                          <textarea
                            required
                            rows={3}
                            maxLength={300}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="신문 기사에 대한 느낀 점이나 응원의 한마디를 나누어 주십시오..."
                            className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A5F] resize-none pr-12"
                          />
                          <span className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-400">
                            {commentText.length}/300
                          </span>
                        </div>
                      </div>

                      {/* Quick Suggestions for departments */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                        <span className="text-slate-400 font-semibold">대구일마이스터고 추천 부서:</span>
                        {[
                          '스마트팩토리과', '모바일전자기기과', '정밀기계과', '자동화시스템과', '교무부'
                        ].map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setCommentDept(dept);
                              if (dept === '교무부' && isTeacher) {
                                setCommentClassNum('교직원');
                              }
                            }}
                            className="px-2 py-0.5 bg-white border border-slate-150 rounded-md hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors text-slate-500 font-medium cursor-pointer"
                          >
                            #{dept}
                          </button>
                        ))}
                      </div>

                      {commentError && (
                        <div className="p-2 border border-rose-100 bg-rose-50 rounded-xl text-rose-600 text-[10px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{commentError}</span>
                        </div>
                      )}

                      {commentSuccess && (
                        <div className="p-2 border border-emerald-100 bg-emerald-50 rounded-xl text-emerald-700 text-[10px] font-semibold flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>댓글이 안전하게 실시간 동기화되어 발행되었습니다!</span>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="py-2 px-5 bg-[#1E3A5F] hover:bg-[#13253d] text-white text-[11px] font-bold rounded-xl shadow cursor-pointer transition-colors"
                        >
                          의견 소중히 등록하기
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Comments Display List Section */}
                  <div className="space-y-3.5 flex-1 flex flex-col min-h-[180px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <h4 className="text-xs font-bold text-[#1E3A5F] flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[#D9A441]" />
                        <span>독자 댓글 목록</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {comments.length}
                        </span>
                      </h4>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1.5 custom-scrollbar">
                      {commentsLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                          <RefreshCw className="h-4.5 w-4.5 animate-spin text-[#1E3A5F]" />
                          <span className="text-xs">피드백 데이터를 동기화하는 중입니다...</span>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                          <MessageSquare className="h-8 w-8 text-slate-300 mb-1.5" />
                          <p className="text-[11px]">지면에 등록된 첫 번째 독자가 되어보세요!</p>
                          <p className="text-[9px] text-slate-400">마음에 들었던 기사에 소중한 댓글 한마디를 적어주세요.</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-150 hover:bg-slate-50/30 transition-all shadow-sm space-y-1.5 relative group"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Dept tag */}
                                <span className="text-[9.5px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                                  {comment.authorDept}
                                </span>
                                
                                {/* Grade tag if available */}
                                {comment.authorGrade ? (
                                  <span className="text-[9.5px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">
                                    {comment.authorGrade}
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-semibold font-mono">
                                    교직원 (선생님)
                                  </span>
                                )}

                                {/* Class detail */}
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {comment.authorClassNumber}
                                </span>

                                {/* Bullet */}
                                <span className="text-slate-300">•</span>

                                {/* Name detail */}
                                <span className="text-[10px] text-slate-800 font-bold">
                                  {comment.authorName}
                                </span>
                              </div>

                              {/* Deletion Option - Only accessible for admin or teacher */}
                              {(currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={deletingCommentId === comment.id}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                                  title="댓글 삭제"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-705 whitespace-pre-wrap leading-relaxed pr-6 font-medium">
                              {comment.content}
                            </p>

                            <div className="text-[9px] text-slate-400 font-mono text-right shrink-0">
                              {new Date(comment.createdAt).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">
                  실시간 피드백 동기화 완료
                </span>
                <button
                  onClick={() => setSelectedNewspaper(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  보관실 나가기
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
