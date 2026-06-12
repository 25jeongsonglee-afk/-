import React, { useState } from 'react';
import { Newspaper, User } from '../types';
import { addNewspaper, deleteNewspaper } from '../firebase';
import { BookOpen, Search, Download, Trash, RefreshCw, Plus, FileText, Image as ImageIcon, Check, Calendar, AlertCircle } from 'lucide-react';
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

  const isAdmin = currentUser?.role === 'admin';

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

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => startDownload(paper)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-[#1E3A5F]/5 border border-slate-200 hover:border-[#1E3A5F]/40 text-[#1E3A5F] font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>다운로드</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(paper.id)}
                      className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="지면 삭제"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
