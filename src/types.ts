export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  student_number?: string; // Standard student ID like '3101' (3rd grade, 1st class, number 1)
  email: string;
  role: UserRole;
}

export interface InterviewReservation {
  id: string;
  userId: string;
  userName: string;
  userGradeClass?: string; // e.g. 1st grade, 2nd class
  userContact: string;
  targetType: 'student' | 'teacher';
  targetName: string; // The person being interviewed
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  topic: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Newspaper {
  id: string;
  title: string;
  year: number;
  month: number;
  fileDataUrl?: string; // Base64 representation of PDF or image uploaded
  fileName?: string;
  fileType?: string; // 'pdf' | 'image'
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  contact: string; // email or phone
  category: 'website' | 'newspaper';
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface NewspaperComment {
  id: string;
  newspaperId: string;
  authorDept: string; // 학과 및 부서
  authorGrade?: string; // 학년 (선생님일 경우 선택/생략 가능)
  authorClassNumber: string; // 반-번호
  authorName: string; // 이름
  content: string; // 댓글 내용
  createdAt: string;
}
