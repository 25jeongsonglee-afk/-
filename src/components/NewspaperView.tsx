import React, { useState, useEffect } from 'react';
import { Newspaper, User, NewspaperComment } from '../types';
import { addNewspaper, deleteNewspaper, getNewspaperComments, addNewspaperComment, deleteNewspaperComment } from '../firebase';
import { BookOpen, Search, Download, Trash, RefreshCw, Plus, FileText, Image as ImageIcon, Check, Calendar, AlertCircle, MessageSquare, Trash2, X, Shield, Users, Maximize2, ZoomIn, ZoomOut, RotateCw, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewspaperViewProps {
  newspapers: Newspaper[];
  onRefresh: () => void;
  currentUser: User | null;
  initialSelectedId?: string | null;
  onClearInitialId?: () => void;
  onRequestAppInstall?: () => void;
}

export default function NewspaperView({ newspapers, onRefresh, currentUser, initialSelectedId, onClearInitialId, onRequestAppInstall }: NewspaperViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  
  // Add state forms (supports multiple files up to 3 inside each slot)
  interface UploadFile {
    fileBase64: string;
    fileName: string;
  }

  interface UploadSlot {
    title: string;
    year: number;
    month: number;
    fileType: 'pdf' | 'image';
    files: UploadFile[];
  }

  const [uploadSlots, setUploadSlots] = useState<UploadSlot[]>([
    { title: '', year: 2026, month: 6, fileType: 'pdf', files: [] }
  ]);
  const [uploadError, setUploadError] = useState('');
  const [downloadGuidePaper, setDownloadGuidePaper] = useState<Newspaper | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'librarian';
  const canManageNewspaper = currentUser?.role === 'admin' || currentUser?.role === 'librarian';
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  // Comments states
  const [selectedNewspaper, setSelectedNewspaper] = useState<Newspaper | null>(null);
  const [commentsModalPageIndex, setCommentsModalPageIndex] = useState(0);
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

  // States for viewing newspaper large
  const [zoomedPaper, setZoomedPaper] = useState<Newspaper | null>(null);
  const [zoomedPageIndex, setZoomedPageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showZoomSidebar, setShowZoomSidebar] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedPaper(null);
      } else if (e.key === 'ArrowLeft') {
        setZoomedPageIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        if (zoomedPaper) {
          const pagesCount = zoomedPaper.fileDataUrls && zoomedPaper.fileDataUrls.length > 0
            ? zoomedPaper.fileDataUrls.length
            : (zoomedPaper.fileDataUrl ? 1 : 0);
          setZoomedPageIndex(prev => Math.min(pagesCount - 1, prev + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedPaper]);

  useEffect(() => {
    if (initialSelectedId) {
      const found = newspapers.find((n) => n.id === initialSelectedId);
      if (found) {
        setSelectedNewspaper(found);
        setCommentsModalPageIndex(0);
        loadComments(found.id);
        // Automatically open in zoomed view as well
        setZoomedPaper(found);
        setZoomedPageIndex(0);
        setZoomScale(1);
        setRotation(0);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setShowZoomSidebar(false);
        }
      }
      if (onClearInitialId) {
        onClearInitialId();
      }
    }
  }, [initialSelectedId, newspapers]);

  const handleZoomOpen = (paper: Newspaper) => {
    setZoomedPaper(paper);
    setZoomedPageIndex(0);
    setSelectedNewspaper(paper); // Sync selectedNewspaper to that paper!
    setCommentsModalPageIndex(0);
    setZoomScale(1);
    setRotation(0);
    loadComments(paper.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowZoomSidebar(false);
    } else {
      setShowZoomSidebar(true);
    }
  };

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
    setCommentsModalPageIndex(0);
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

  // Functions to manage multiple upload slots (up to 3 distinct newspapers)
  const addUploadSlot = () => {
    if (uploadSlots.length >= 3) {
      alert('한 번에 최대 3개까지만 업로드할 수 있습니다.');
      return;
    }
    const lastSlot = uploadSlots[uploadSlots.length - 1];
    setUploadSlots([
      ...uploadSlots,
      {
        title: '',
        year: lastSlot?.year || 2026,
        month: Math.min(12, (lastSlot?.month || 6) + 1),
        fileType: 'pdf',
        files: []
      }
    ]);
  };

  const removeUploadSlot = (idx: number) => {
    if (uploadSlots.length <= 1) return;
    setUploadSlots(uploadSlots.filter((_, i) => i !== idx));
  };

  const updateSlot = (index: number, fields: Partial<UploadSlot>) => {
    setUploadSlots(uploadSlots.map((slot, i) => i === index ? { ...slot, ...fields } : slot));
  };

  const compressImageBase64 = (base64Str: string, maxWidth = 1200, maxHeight = 1600, quality = 0.55): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Str.startsWith('data:image/')) {
        resolve(base64Str);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = () => {
        resolve(base64Str);
      };

      img.src = base64Str;
    });
  };

  const handleSlotFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentFilesCount = uploadSlots[index].files.length;
    const availableSlots = 3 - currentFilesCount;
    if (availableSlots <= 0) {
      alert('이미 최대 3개의 파일이 업로드되어 더 추가할 수 없습니다.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, availableSlots) as File[];
    setUploadError('');

    filesToRead.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`용량이 10MB를 초과하는 파일은 처리되지 않습니다: ${file.name} (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const rawBase64 = reader.result;
          let finalBase64 = rawBase64;
          
          if (rawBase64.startsWith('data:image/')) {
            try {
              finalBase64 = await compressImageBase64(rawBase64, 1200, 1600, 0.55);
            } catch (err) {
              console.error('Image compression failed, using original base64:', err);
            }
          }

          setUploadSlots(prevSlots => prevSlots.map((slot, sIdx) => {
            if (sIdx === index) {
              return {
                ...slot,
                files: [...slot.files, { fileBase64: finalBase64, fileName: file.name }]
              };
            }
            return slot;
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveFileFromSlot = (slotIdx: number, fileIdx: number) => {
    setUploadSlots(prevSlots => prevSlots.map((slot, i) => {
      if (i === slotIdx) {
        return {
          ...slot,
          files: slot.files.filter((_, fIdx) => fIdx !== fileIdx)
        };
      }
      return slot;
    }));
  };

  const handleSlotURLFallback = (index: number) => {
    const currentFilesCount = uploadSlots[index].files.length;
    if (currentFilesCount >= 3) {
      alert('이미 최대 3개의 파일이 업로드되어 더 추가할 수 없습니다.');
      return;
    }

    const randomSeed = Math.floor(Math.random() * 1000);
    const mockPic = `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800&sig=${randomSeed}`;
    const slot = uploadSlots[index];
    const pageNum = currentFilesCount + 1;

    setUploadSlots(prevSlots => prevSlots.map((s, i) => {
      if (i === index) {
        return {
          ...s,
          files: [...s.files, { fileBase64: mockPic, fileName: `meister_paper_gen_${s.month}월호_p${pageNum}.pdf` }]
        };
      }
      return s;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations: each slot requires a title and at least 1 file
    for (let i = 0; i < uploadSlots.length; i++) {
      const slot = uploadSlots[i];
      if (!slot.title.trim()) {
        alert(`물별 신문 ${i + 1}의 제목을 기입해주세요.`);
        return;
      }
      if (slot.files.length === 0) {
        alert(`물별 신문 ${i + 1}의 신문 문서를 업로드하거나 데모 템플릿 소스를 자동 배치 해주어야 합니다.`);
        return;
      }
    }

    try {
      for (const slot of uploadSlots) {
        const mainFile = slot.files[0];
        const allBase64s = slot.files.map(f => f.fileBase64);
        const allNames = slot.files.map(f => f.fileName);

        await addNewspaper({
          title: slot.title.trim(),
          year: slot.year,
          month: slot.month,
          fileType: slot.fileType,
          fileName: mainFile.fileName,
          fileDataUrl: mainFile.fileBase64,
          fileDataUrls: allBase64s,
          fileNames: allNames
        });
      }
      // reset
      setUploadSlots([
        { title: '', year: 2026, month: 6, fileType: 'pdf', files: [] }
      ]);
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('신문 등록 처리 중 에러가 발생했습니다.');
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

  const handleDownloadClick = (paper: Newspaper) => {
    setDownloadGuidePaper(paper);
  };

  return (
    <div id="newspapers-archive" className="space-y-6">
      {/* Top Banner Control Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
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
            className="text-xs bg-white border border-slate-200 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#1E3A5F] cursor-pointer w-full sm:w-auto text-center"
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
            <form onSubmit={handleSubmit} className="bg-[#1E3A5F]/5 border-2 border-dashed border-[#1E3A5F]/20 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
                  <h4 className="text-sm font-bold text-[#1E3A5F]">관리자 - 신규 월별 신문 보관소 추가 (최대 3개 동시 게시 가능)</h4>
                </div>
                <button
                  type="button"
                  onClick={addUploadSlot}
                  disabled={uploadSlots.length >= 3}
                  className="flex items-center gap-1.5 bg-[#1E3A5F] hover:bg-[#152e4f] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>신문 추가 ({uploadSlots.length}/3)</span>
                </button>
              </div>

              <div className="space-y-6">
                {uploadSlots.map((slot, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 relative space-y-4 shadow-sm animate-fade-inScale">
                    {uploadSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUploadSlot(index)}
                        className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="이 항목 삭제"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                    
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md mb-2">
                      신문 항목 #{index + 1}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">발행 신문 제목</label>
                        <input
                          type="text"
                          required
                          value={slot.title}
                          onChange={(e) => updateSlot(index, { title: e.target.value })}
                          placeholder="예: 대구일마이스터고 신문 2026년 6월호"
                          className="w-full text-xs py-2.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A5F]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">발행 연도 / 월 선택</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={slot.year}
                            onChange={(e) => updateSlot(index, { year: Number(e.target.value) })}
                            className="text-xs bg-white border border-slate-200 py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
                          >
                            <option value={2026}>2026년</option>
                            <option value={2025}>2025년</option>
                            <option value={2024}>2024년</option>
                          </select>

                          <select
                            value={slot.month}
                            onChange={(e) => updateSlot(index, { month: Number(e.target.value) })}
                            className="text-xs bg-white border border-slate-200 py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
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
                            onClick={() => updateSlot(index, { fileType: 'pdf' })}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                              slot.fileType === 'pdf' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            PDF 업로드 (.pdf)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlot(index, { fileType: 'image' })}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                              slot.fileType === 'image' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            이미지 보드 (.png/.jpg)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Upload Dropzone */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">신문 문서 또는 커버 표지 업로드 (최대 3장)</label>
                        <span className="text-xs bg-[#1E3A5F]/10 text-[#1E3A5F] font-bold px-2 py-0.5 rounded-full">
                          {slot.files.length} / 3 개 업로드됨
                        </span>
                      </div>
                      
                      {slot.files.length < 3 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-white text-center flex flex-col items-center justify-center relative hover:bg-slate-50 transition-colors">
                            <input
                              type="file"
                              multiple
                              accept={slot.fileType === 'pdf' ? '.pdf' : 'image/*'}
                              onChange={(e) => handleSlotFileChange(index, e)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            {slot.fileType === 'pdf' ? <FileText className="h-8 w-8 text-[#1E3A5F] mb-2" /> : <ImageIcon className="h-8 w-8 text-[#1E3A5F] mb-2" />}
                            <p className="text-xs font-bold text-slate-800">
                              파일 선택하기 또는 드래그 앤 드롭
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">파일 업로드 용량 제한: <strong className="text-[#1E3A5F]">6MB (개당)</strong></p>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-[#D9A441] block">DEVELOPER TOOLS AUTO-TEST</span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                본인 컴퓨터에 업로드할 신문 이미지 파일이 없다면 아래 버튼을 누르십시오. Unsplash 무작위 고품질 신문 표지 이미지를 생성하여 자동 매핑합니다. (최대 3장 순차 추가 가능)
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSlotURLFallback(index)}
                              className="mt-3 py-2 px-4 bg-[#1E3A5F] hover:bg-[#1c3657] text-white text-[11px] font-semibold rounded-xl cursor-pointer transition-colors"
                            >
                              랜덤 템플릿 소스 자동 배치 (+1장 완료)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold text-center">
                          🎉 최대 갯수인 3개의 파일을 모두 성공적으로 등록했습니다!
                        </div>
                      )}

                      {/* Display Uploaded File list */}
                      {slot.files.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-bold text-slate-700">등록된 지면 목록:</p>
                          <div className="space-y-1.5">
                            {slot.files.map((file, fIdx) => (
                              <div key={fIdx} className="flex items-center justify-between bg-white border border-slate-150 p-2 rounded-lg text-xs">
                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                    {fIdx + 1}쪽 지면
                                  </span>
                                  {slot.fileType === 'pdf' ? (
                                    <FileText className="h-4 w-4 text-[#1E3A5F] shrink-0" />
                                  ) : (
                                    <img
                                      src={file.fileBase64}
                                      alt="미리보기"
                                      className="h-6 w-6 object-cover rounded shrink-0 border border-slate-200"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <span className="truncate font-medium text-slate-700">{file.fileName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFileFromSlot(index, fIdx)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                                  title="지면 삭제"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {uploadError && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs mt-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 게재된 신문은 보관소에 <strong className="text-[#D9A441]">영구 보존</strong>되며, 오직 관리자만 지울 수 있습니다.
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadSlots([
                        { title: '', year: 2026, month: 6, fileType: 'pdf', files: [] }
                      ]);
                      setIsAdding(false);
                    }}
                    className="py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 bg-[#1A365D] hover:bg-[#11243F] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {uploadSlots.length}개의 신문 보관소 게시 완수
                  </button>
                </div>
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                    onClick={() => handleZoomOpen(paper)}
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <BookOpen className="h-10 w-10 text-[#1E3A5F]/20 mb-2" />
                    <span className="text-xs font-mono">No Image Preview</span>
                  </div>
                )}
                
                {/* Format Tag */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                  <span className="bg-[#1E3A5F] text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                    {paper.fileType === 'pdf' ? '📖 PDF ARCHIVE' : '🖼️ IMAGE BOARD'}
                  </span>
                  {paper.fileDataUrls && paper.fileDataUrls.length > 1 && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm w-fit flex items-center gap-1">
                      📄 {paper.fileDataUrls.length}쪽 분량
                    </span>
                  )}
                </div>

                {/* Quick Details Floating Banner */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3 gap-1.5 duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOpen(paper);
                    }}
                    className="w-full py-2 bg-[#D9A441] hover:bg-[#c29235] text-white flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>지면 크게 보기</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadClick(paper);
                    }}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-[#1E3A5F] flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-xl shadow cursor-pointer transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>아카이브 다운</span>
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
                      onClick={() => handleDownloadClick(paper)}
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
                    {(() => {
                      const selectedPages = selectedNewspaper.fileDataUrls && selectedNewspaper.fileDataUrls.length > 0
                        ? selectedNewspaper.fileDataUrls
                        : (selectedNewspaper.fileDataUrl ? [selectedNewspaper.fileDataUrl] : []);
                      const activeImage = selectedPages[commentsModalPageIndex] || '';
                      
                      return selectedPages.length > 0 ? (
                        <div className="space-y-2">
                          <div 
                            onClick={() => handleZoomOpen(selectedNewspaper)}
                            className="aspect-[4/5] rounded-xl overflow-hidden relative border border-slate-200 shadow-sm max-h-[220px] lg:max-h-[300px] cursor-zoom-in group/thumb"
                          >
                            <img
                              src={activeImage}
                              alt={selectedNewspaper.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                              <Maximize2 className="h-4 w-4 text-amber-300" />
                              <span>크게 기사 보기</span>
                            </div>
                            <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg text-[9px] text-amber-300 font-bold uppercase font-mono border border-slate-700 z-10">
                              {selectedNewspaper.fileType === 'pdf' ? `📖 PDF 지면 ${commentsModalPageIndex + 1}/${selectedPages.length}` : `🖼️ 이미지 지면 ${commentsModalPageIndex + 1}/${selectedPages.length}`}
                            </span>
                          </div>

                          {selectedPages.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-1">
                              {selectedPages.map((_, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCommentsModalPageIndex(pIdx);
                                  }}
                                  className={`h-2 rounded-full transition-all cursor-pointer ${
                                    commentsModalPageIndex === pIdx ? 'w-5 bg-[#1E3A5F]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                                  }`}
                                  title={`${pIdx + 1}페이지`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-[4/5] bg-slate-100 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400">
                          <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                          <span className="text-xs text-slate-400 font-semibold font-mono">신문 지면 이미지 없음</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownloadClick(selectedNewspaper)}
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

                            <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed pr-6 font-medium">
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
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
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

      {/* ──────────────────────────────────────────────────────────
          NEWSPAPER IMAGE ZOOM / LIGHTBOX OVERLAY
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {zoomedPaper && (() => {
          const isMobileSize = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
          const baseHeight = isMobileSize ? 58 : 78;
          const pages = zoomedPaper.fileDataUrls && zoomedPaper.fileDataUrls.length > 0
            ? zoomedPaper.fileDataUrls
            : (zoomedPaper.fileDataUrl ? [zoomedPaper.fileDataUrl] : []);
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[60] flex flex-col p-3 sm:p-4 select-none"
            >
              {/* Lightbox Header Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 text-white border-b border-slate-850 pb-3 mb-3 select-text shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-[#D9A441]/10 text-[#D9A441] rounded-lg shrink-0">
                    <BookOpen className="h-4 sm:h-5 w-4 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">{zoomedPaper.title}</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5">
                      {zoomedPaper.year}년 {zoomedPaper.month}월호 • <span className="hidden sm:inline">화면 조절기 혹은 키보드 방향키(◀, ▶)를 사용하면 지면을 탐색할 수 있습니다.</span><span className="sm:hidden">지면 이동/방향키 조절가능</span>
                    </p>
                  </div>
                </div>

                {/* Manipulation Control Center */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 p-1 sm:p-1.5 rounded-2xl md:mx-auto">
                  {/* Page Navigation block */}
                  {pages.length > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={zoomedPageIndex === 0}
                        onClick={() => setZoomedPageIndex(prev => Math.max(0, prev - 1))}
                        className="p-1 px-2.5 bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="이전 쪽"
                      >
                        <span>◀</span>
                        <span className="hidden sm:inline">이전 쪽</span>
                      </button>

                      <span className="text-[10px] font-mono text-amber-400 px-2 py-1 font-bold min-w-[55px] text-center bg-slate-950 rounded-lg">
                        {zoomedPageIndex + 1} / {pages.length} 쪽
                      </span>

                      <button
                        type="button"
                        disabled={zoomedPageIndex === pages.length - 1}
                        onClick={() => setZoomedPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                        className="p-1 px-2.5 bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="다음 쪽"
                      >
                        <span className="hidden sm:inline">다음 쪽</span>
                        <span>▶</span>
                      </button>

                      <div className="w-[1px] h-4 bg-slate-800 mx-0.5 sm:mx-1" />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="축소"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">축소</span>
                  </button>
                  
                  <span className="text-[10px] font-mono text-amber-400 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold min-w-[42px] sm:min-w-[50px] text-center bg-slate-950 rounded-lg">
                    {Math.round(zoomScale * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="확대"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">확대</span>
                  </button>

                  <div className="w-[1px] h-4 bg-slate-800 mx-0.5 sm:mx-1" />

                  <button
                    type="button"
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="회전"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">회전</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setRotation(0);
                    }}
                    className="p-1 px-1.5 sm:px-2.5 bg-slate-950 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition-all text-[9px] sm:text-[10px] font-bold cursor-pointer"
                  >
                    초기화
                  </button>

                  <div className="w-[1px] h-4 bg-slate-800 mx-0.5 sm:mx-1" />

                  {/* Sidebar Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowZoomSidebar(prev => !prev)}
                    className={`p-1 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      showZoomSidebar 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black' 
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="소통창 토글"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{showZoomSidebar ? '소통방 숨기기' : '소통방 & 댓글 보기'}</span>
                    <span className="sm:hidden">{showZoomSidebar ? '소통 숨김' : '의견달기'}</span>
                  </button>
                </div>

                {/* Exit / Save controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end lg:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadClick(zoomedPaper)}
                    className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] sm:text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">전체 파일 다운로드</span>
                    <span className="sm:hidden">다운</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomedPaper(null)}
                    className="p-1.5 sm:p-2 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-350 rounded-xl transition-all cursor-pointer"
                    title="닫기 (Esc)"
                  >
                    <X className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Split Viewport Layout Container */}
              <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden min-h-0">
                
                {/* Display Canvas Frame Container */}
                <div className="flex-1 overflow-auto p-1 sm:p-4 max-h-full cursor-grab active:cursor-grabbing relative custom-scrollbar bg-black/20 rounded-2xl border border-slate-900 flex animate-fadeIn bg-slate-950">
                  <div 
                    className="m-auto transition-all duration-200 ease-out origin-center shrink-0 flex items-center justify-center p-2"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {pages[zoomedPageIndex] ? (
                      <img
                        src={pages[zoomedPageIndex]}
                        alt={`${zoomedPaper.title} - ${zoomedPageIndex + 1}페이지`}
                        referrerPolicy="no-referrer"
                        className="shadow-2xl rounded-lg pointer-events-auto border border-slate-850 object-contain transition-all"
                        style={{
                          height: `${baseHeight * zoomScale}vh`,
                          width: 'auto',
                          maxWidth: zoomScale > 1 ? 'none' : '100%',
                          transition: 'height 0.15s ease-out'
                        }}
                      />
                    ) : (
                      <div className="text-center py-20 text-slate-500 m-auto">
                        <BookOpen className="h-16 w-16 mx-auto text-slate-750 mb-3" />
                        <p className="text-sm font-semibold">고해상도 원본 이미지를 찾을 수 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>

              {/* Right Sidebar: Details & Live Comments */}
              {showZoomSidebar && (
                <div className="w-full lg:w-[380px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[40vh] lg:max-h-full overflow-hidden shrink-0 select-text">
                  <div className="p-4 border-b border-slate-850 bg-slate-950/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#D9A441]" />
                      <span className="text-xs font-bold text-white">독자 한마디 & 소통 정보</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {comments.length}개
                    </span>
                  </div>

                  {/* Scrollable comment list inside Zoom Sidebar */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-900/40">
                    {commentsLoading ? (
                      <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#D9A441]" />
                        <span className="text-[10px]">댓글 동기화 중...</span>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/25">
                        <MessageSquare className="h-8 w-8 text-slate-750 mx-auto mb-2" />
                        <p className="text-[10.5px]">작성된 독자 의견이 없습니다.</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">화면을 보며 아래 양식으로 첫 남김을 전해 보세요!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5 hover:border-slate-750 transition-colors">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-950 pb-1 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-900/30">
                                {comment.authorDept}
                              </span>
                              {comment.authorGrade && (
                                <span className="text-[9px] bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-900/30">
                                  {comment.authorGrade}
                                </span>
                              )}
                              <span className="text-[9.5px] text-slate-400">{comment.authorClassNumber}</span>
                              <span className="text-[10px] text-slate-200 font-bold">{comment.authorName}</span>
                            </div>
                            
                            {/* Deletion Option */}
                            {(currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                                title="댓글 삭제"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed select-text">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Compact comment writer form inside Zoom Sidebar */}
                  <div className="p-4 border-t border-slate-850 bg-slate-950/80 space-y-2 shrink-0">
                    <h4 className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5 text-[#D9A441]" />
                      <span>의견 실시간 등록하기</span>
                    </h4>

                    <form onSubmit={handleCommentSubmit} className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          required
                          value={commentDept}
                          onChange={(e) => setCommentDept(e.target.value)}
                          placeholder="학과/부서"
                          className="text-[10.5px] py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 font-medium focus:outline-none focus:border-[#D9A441]"
                        />
                        <input
                          type="text"
                          required
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          placeholder="이름"
                          className="text-[10.5px] py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 font-medium focus:outline-none focus:border-[#D9A441]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {!isTeacher && (
                          <select
                            value={commentGrade}
                            onChange={(e) => setCommentGrade(e.target.value)}
                            className="text-[10.5px] py-1.5 px-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-[#D9A441]"
                          >
                            <option value="1학년">1학년</option>
                            <option value="2학년">2학년</option>
                            <option value="3학년">3학년</option>
                          </select>
                        )}
                        <input
                          type="text"
                          required
                          value={commentClassNum}
                          onChange={(e) => setCommentClassNum(e.target.value)}
                          placeholder={isTeacher ? "직함 (교사, 부장 등)" : "반/번호 (예: 2반 15번)"}
                          className={`text-[10.5px] py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 font-medium focus:outline-none focus:border-[#D9A441] ${isTeacher ? 'col-span-2' : ''}`}
                        />
                      </div>

                      <div className="relative">
                        <textarea
                          required
                          rows={2}
                          maxLength={300}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="기사를 읽고 느낀 점이나 격려의 소회를 적어주세요..."
                          className="w-full text-[10.5px] py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D9A441] resize-none"
                        />
                      </div>

                      {commentError && (
                        <p className="text-[9px] text-rose-400 font-semibold">{commentError}</p>
                      )}

                      {commentSuccess && (
                        <p className="text-[9px] text-emerald-400 font-semibold">의견이 등록 완료되었습니다!</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#D9A441] hover:bg-[#c29235] text-slate-950 hover:text-white font-bold rounded-lg text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>의견 보내기</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Scale Hint Bar */}
            <div className="mt-4 flex items-center justify-between text-slate-500 text-[10px] font-mono shrink-0">
              <span>대구일마이스터고 신문고 원본 돋보기 뷰어</span>
              <div className="flex gap-4">
                <span>• 마우스 드래그/휠 스크롤 또는 터치 제스처 연동</span>
                <span>• 닫기 버튼 또는 ESC 키로 닫기</span>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 📱 모바일 홈 화면 바탕화면 안내 및 앱 추가 통합 유도 가이드 */}
      <AnimatePresence>
        {downloadGuidePaper && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDownloadGuidePaper(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative z-10 p-6 flex flex-col font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center text-[#1E3A5F]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">바탕화면(홈 화면) 바로가기 & 파일 보관</h3>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">Mobile App Setup & File Save Assistance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDownloadGuidePaper(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl">
                  <p className="text-[11.5px] text-amber-900 font-bold leading-relaxed">
                    ⚠️ 스마트폰(모바일)의 브라우저 보안 규정상, 일반 파일 다운로드는 바탕화면이 아닌 기기 내부의 <strong>'다운로드(Downloads)' 또는 '내 파일' 폴더</strong>로만 저장됩니다!
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/60 border border-[#1E3A5F]/10 rounded-2xl space-y-3.5">
                  <h4 className="text-xs font-black text-[#1E3A5F] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>휴대폰 바탕화면에 즉시 설치하는 법</span>
                  </h4>
                  
                  <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                    매번 복잡한 주소를 주소창에 치고 들어올 필요가 전혀 없습니다! <br />
                    아래 <strong>'📱 바탕화면에 앱 아이콘 생성'</strong> 버튼을 클릭하고 우아한 금빛 마이스터 전용 앱 아이콘을 바탕화면에 단 1초 만에 바로 추가해보세요. 터치 한 번에 시원한 전체 화면으로 상시 접속 가능합니다.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const paper = downloadGuidePaper;
                    setDownloadGuidePaper(null);
                    if (onRequestAppInstall) {
                      onRequestAppInstall();
                    } else {
                      alert('스마트폰 홈 화면(우측 상단 3개 점 ⋮ 또는 하단 공유출력 📤 버튼)에서 "홈 화면에 추가"를 누르시면 바탕화면에 전용 앱 아이콘이 바로 생성됩니다!');
                    }
                  }}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 duration-150 active:scale-95 cursor-pointer"
                >
                  <Smartphone className="h-4 w-4 text-slate-950" />
                  <span>📱 바탕화면(홈 화면)에 바로가기 앱 설치하기</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (downloadGuidePaper) {
                      startDownload(downloadGuidePaper);
                    }
                    setDownloadGuidePaper(null);
                  }}
                  className="w-full py-3 bg-slate-155 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 duration-150 cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>📁 일반 파일(PDF)로 내 기기 내부 폴더에 저장하기</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDownloadGuidePaper(null)}
                  className="w-full py-2 text-slate-400 hover:text-slate-650 font-bold text-[10.5px] transition-all text-center cursor-pointer"
                >
                  취소하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
