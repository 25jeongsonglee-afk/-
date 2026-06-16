import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, 
  updateDoc, deleteDoc, addDoc, onSnapshot, getDocFromServer, FirestoreError
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { User, UserRole, InterviewReservation, Newspaper, Inquiry, Notice, NewspaperComment, Compliment } from './types';

// Check if Firebase is using custom/real config or placeholders
const getActiveConfig = () => {
  const saved = localStorage.getItem('lib_book_custom_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.apiKey !== 'placeholder-api-key') {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse custom firebase config:', e);
    }
  }
  return firebaseConfig;
};

const activeConfig = getActiveConfig();
const hasRealConfig = activeConfig.apiKey && activeConfig.apiKey !== 'placeholder-api-key';

let app;
let auth: any = null;
let db: any = null;

if (hasRealConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, activeConfig.firestoreDatabaseId || '(default)');
  } catch (error) {
    console.error('Firebase initialization error, falling back to Local Storage mode:', error);
  }
}

export function isFirebaseActive(): boolean {
  return hasRealConfig && auth !== null && db !== null;
}

export function saveCustomFirebaseConfig(config: any) {
  if (config) {
    localStorage.setItem('lib_book_custom_firebase_config', JSON.stringify(config));
  } else {
    localStorage.removeItem('lib_book_custom_firebase_config');
  }
  window.location.reload();
}

export function getCustomFirebaseConfig() {
  const saved = localStorage.getItem('lib_book_custom_firebase_config');
  return saved ? JSON.parse(saved) : null;
}

// -------------------------------------------------------------
// FIRBASE SECURITY RULES: FIRESTORE ERROR HANDLING CONSTRAINTS
// -------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth ? auth.currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
      isAnonymous: currentAuth?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on launch (Required as per Skill instructions)
if (isFirebaseActive()) {
  async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration: Client is offline.");
      }
    }
  }
  testConnection();
}

// -------------------------------------------------------------
// INTERNAL SEED / LOCAL STORAGE DATABASE ENGINE (FALLBACK / MOCK)
// -------------------------------------------------------------
const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: '월간 사람책 웹사이트 정식 오픈 및 인터뷰 기사 모집 안내',
    content: '대구일마이스터고등학교 학생과 선생님들의 따뜻한 이야기를 담는 "사람책" 웹사이트가 오픈되었습니다. 매월 발간되는 학교 신문을 만나보실 수 있으며 언제든 동료나 학생, 선생님 추천 등을 통해 인터뷰를 신청해 주세요. 많은 관심 부탁드립니다.',
    createdAt: '2026-06-12T09:00:00Z'
  },
  {
    id: 'n2',
    title: '2026년 6월호 대구일마이스터고 신문 발행',
    content: '호국보훈의 달을 맞이하여 교내 애국지사 발자취 찾기 탐방기 및 해병대 마이스터 학급 기동 훈련 취재기사가 실린 6월호 마이스터고 신문이 발행되었습니다. 신문 메뉴에서 PDF 버전을 다운로드하시길 바랍니다.',
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 'n3',
    title: '신문 제작 자율동아리 부원 추가 모집 안내',
    content: '직접 우리 학교의 특별한 스토리를 취재하고 편집 프로그램을 이용해 소책자와 웹 신문을 발행할 인재들을 추가 모집합니다. 문의사항은 본관 2층 방송실(편집장 김선배) 혹은 문의하기 게시판을 이용해주세요.',
    createdAt: '2026-06-05T14:30:00Z'
  }
];

const INITIAL_NEWSPAPERS: Newspaper[] = [
  {
    id: 'p1',
    title: '대구일마이스터고 신문 2026년 6월호',
    year: 2026,
    month: 6,
    fileName: 'meister_newspaper_2026_06.pdf',
    fileType: 'pdf',
    fileDataUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', // Mock/Demo placeholder
    createdAt: '2026-06-12T01:00:00Z'
  },
  {
    id: 'p2',
    title: '대구일마이스터고 신문 2026년 5월호',
    year: 2026,
    month: 5,
    fileName: 'meister_newspaper_2026_05.pdf',
    fileType: 'pdf',
    fileDataUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&q=80&w=800',
    createdAt: '2026-05-01T02:00:00Z'
  },
  {
    id: 'p3',
    title: '대구일마이스터고 신문 2026년 4월호',
    year: 2026,
    month: 4,
    fileName: 'meister_newspaper_2026_04.pdf',
    fileType: 'pdf',
    fileDataUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
    createdAt: '2026-04-01T02:00:00Z'
  },
  {
    id: 'p4',
    title: '대구일마이스터고 신문 2026년 3월호',
    year: 2026,
    month: 3,
    fileName: 'meister_newspaper_2026_03.pdf',
    fileType: 'pdf',
    fileDataUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
    createdAt: '2026-03-01T02:00:00Z'
  }
];

const INITIAL_RESERVATIONS: InterviewReservation[] = [];

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'q1',
    name: '김대구',
    contact: 'daegu@meister.hs.kr',
    category: 'website',
    title: '과거 2025년호 신문 PDF 다운로드 버튼 작동 오류',
    content: '과거 전년도 신문 PDF 파일을 다운받을 때 링크가 열리지 않습니다. 확인 부탁드립니다.',
    status: 'pending',
    createdAt: '2026-06-12T04:10:00Z'
  },
  {
    id: 'q2',
    name: '이수성',
    contact: '010-1111-2222',
    category: 'newspaper',
    title: '신인 동아리 부원들의 창의적 취재 기사 제보합니다',
    content: '동아리에서 이번달 자체 제작한 취재 기사를 사람책 신문에 게재 가능 한지 궁금합니다.',
    status: 'answered',
    answer: '정말 적극적이고 멋진 제안입니다! 동아리 기사 초안을 e메일(ilmeister@school.kr) 혹은 기사 편집실로 제출해 주시면 7월호 지면에 적극 검토해 반영하겠습니다.',
    createdAt: '2026-05-28T11:00:00Z'
  }
];

// Initialize LocalStorage Data if not present
const getLocalData = <T>(key: string, initial: T[]): T[] => {
  const data = localStorage.getItem(`lib_book_${key}`);
  if (!data) {
    localStorage.setItem(`lib_book_${key}`, JSON.stringify(initial));
    return initial;
  }
  let parsed = JSON.parse(data) as any[];
  
  // Clean and ensure unique IDs in existing lists to prevent React duplicate key rendering or overwrite bugs
  const seenIds = new Set<string>();
  let hasModified = false;
  parsed = parsed.map((item: any, idx: number) => {
    if (!item || !item.id || seenIds.has(item.id)) {
      const generatedId = `${key === 'newspapers' ? 'paper' : 'item'}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000000)}`;
      seenIds.add(generatedId);
      hasModified = true;
      return { ...item, id: generatedId };
    }
    seenIds.add(item.id);
    return item;
  });

  if (hasModified) {
    localStorage.setItem(`lib_book_${key}`, JSON.stringify(parsed));
  }
  return parsed as T[];
};

const setLocalData = <T>(key: string, value: T[]): void => {
  localStorage.setItem(`lib_book_${key}`, JSON.stringify(value));
};

// Real user account simulation helper for local login
// We support standard passwords and logins for demo
export interface SimulatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  student_number?: string;
}

const getSimulatedUsers = (): SimulatedUser[] => {
  const users = localStorage.getItem('lib_book_users');
  if (!users) {
    const defaultUsers: SimulatedUser[] = [
      { id: 'admin-id', email: 'admin@meister.hs.kr', name: '관리자', role: 'admin' },
      { id: 'mock-student-id', email: '25jeongsonglee@dgmeister.hs.kr', name: '정성리', role: 'student', student_number: '3101' },
      { id: 'mock-teacher-id', email: 'teacher@dgmeister.hs.kr', name: '김선생', role: 'teacher' }
    ];
    localStorage.setItem('lib_book_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};

// -------------------------------------------------------------
// DUAL-MODE SERVICE API LAYER
// -------------------------------------------------------------

// Active simulation state to handle client actions without full Firebase Auth account
export let currentSimulatedUser: SimulatedUser | null = (() => {
  const saved = localStorage.getItem('lib_book_current_user');
  if (saved) return JSON.parse(saved);
  
  // No default user to prevent automatic login as Jeong Song-yi for other visitors
  return null;
})();

export function setSimulatedUser(user: SimulatedUser | null) {
  currentSimulatedUser = user;
  if (user) {
    localStorage.setItem('lib_book_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('lib_book_current_user');
  }
}

// 1. AUTHENTICATION SERVICES
export async function googleSignIn(teacherSecret?: string): Promise<User> {
  const secretClean = (teacherSecret || '').trim().toLowerCase();
  const isTeacherBySecret = secretClean === 'meister';
  const isPictureBySecret = secretClean === 'picture';
  const isInterviewBySecret = secretClean === 'interview';
  const isLibrarianBySecret = secretClean === 'librarian';

  if (isFirebaseActive()) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const email = (fbUser.email || '').trim().toLowerCase();

      // Check if user already exists in Firestore to prevent overwriting custom roles
      let existingProfile: User | null = null;
      try {
        const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (docSnap.exists()) {
          existingProfile = docSnap.data() as User;
        }
      } catch (e) {
        console.warn('Could not fetch user profile from Firestore:', e);
      }

      let role: UserRole = 'student';
      let name = fbUser.displayName || '사용자';
      
      if (email === '25jeongsonglee@dgmeister.hs.kr' || email === '25jeongsonglee@gmail.com') {
        role = 'admin';
        name = '정송이 (2학년)';
      } else if (email.includes('admin') || email === 'admin@school.kr') {
        role = 'admin';
      } else if (isTeacherBySecret) {
        role = 'teacher';
        const baseName = fbUser.displayName ? fbUser.displayName.replace(/\s*선생님\s*$/, '').trim() : '교사';
        name = `${baseName}선생님`;
      } else if (isPictureBySecret) {
        role = 'picture_student';
        const baseName = fbUser.displayName ? fbUser.displayName.trim() : '학생';
        name = `${baseName} (사진/촬영 담당)`;
      } else if (isInterviewBySecret) {
        role = 'interview_student';
        const baseName = fbUser.displayName ? fbUser.displayName.trim() : '학생';
        name = `${baseName} (인터뷰 담당)`;
      } else if (isLibrarianBySecret) {
        role = 'librarian';
        const baseName = fbUser.displayName ? fbUser.displayName.trim() : '지도교사';
        name = `${baseName} (지도교사)`;
      } else if (existingProfile) {
        role = existingProfile.role;
        name = existingProfile.name;
      } else if (email.includes('teacher') || email === 'teacher@dgmeister.hs.kr' || email === 'teacher@gmail.com') {
        role = 'teacher';
        const baseName = name.replace(/\s*선생님\s*$/, '').trim();
        name = `${baseName}선생님`;
      }

      const userProfile: User = {
        id: fbUser.uid,
        name: name,
        email: email,
        role: role
      };

      // Save user to cloud firestore
      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      setSimulatedUser(userProfile as SimulatedUser); // sync to local simulated state
      return userProfile;
    } catch (error: any) {
      if (error.message === 'school_domain_restriction_failed') {
        throw error;
      }
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  } else {
    // If firebase is not active, fallback
    let role: UserRole = 'student';
    let name = '정송이';
    if (isTeacherBySecret) {
      role = 'teacher';
      name = '김선생님';
    } else if (isPictureBySecret) {
      role = 'picture_student';
      name = '정송이 (사진/촬영 담당)';
    } else if (isInterviewBySecret) {
      role = 'interview_student';
      name = '정송이 (인터뷰 담당)';
    } else if (isLibrarianBySecret) {
      role = 'librarian';
      name = '정송이 (지도교사)';
    } else {
      role = 'admin';
    }
    const defaultUser: SimulatedUser = {
      id: 'mock-student-id',
      email: '25jeongsonglee@dgmeister.hs.kr',
      name: name,
      role: role
    };
    setSimulatedUser(defaultUser);
    return defaultUser as User;
  }
}

export async function firebaseEmailSignUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  studentNumber?: string
): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (isFirebaseActive()) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = userCredential.user;

      let finalRole = role;
      let finalName = name;
      
      if (normalizedEmail === '25jeongsonglee@dgmeister.hs.kr' || normalizedEmail === '25jeongsonglee@gmail.com') {
        finalRole = 'admin';
        if (!finalName) {
          finalName = '정송이 (2학년)';
        }
      }

      const userProfile: User = {
        id: fbUser.uid,
        name: finalName || '사용자',
        email: normalizedEmail,
        role: finalRole,
        student_number: studentNumber
      };

      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      setSimulatedUser(userProfile as SimulatedUser);
      return userProfile;
    } catch (error: any) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  } else {
    const simulatedUsers = getSimulatedUsers();
    const credentials = JSON.parse(localStorage.getItem('lib_book_users_credentials') || '{}');

    if (credentials[normalizedEmail]) {
      throw new Error('이미 등록된 이메일 계정입니다.');
    }

    let finalRole = role;
    let finalName = name;
    if (normalizedEmail === '25jeongsonglee@dgmeister.hs.kr' || normalizedEmail === '25jeongsonglee@gmail.com') {
      finalRole = 'admin';
      if (!finalName) {
        finalName = '정송이 (2학년)';
      }
    }

    const newUser: SimulatedUser = {
      id: `sim-${finalRole}-${Date.now()}`,
      email: normalizedEmail,
      name: finalName || '사용자',
      role: finalRole,
      student_number: studentNumber
    };

    simulatedUsers.push(newUser);
    credentials[normalizedEmail] = password;

    localStorage.setItem('lib_book_users', JSON.stringify(simulatedUsers));
    localStorage.setItem('lib_book_users_credentials', JSON.stringify(credentials));

    setSimulatedUser(newUser);
    return newUser as User;
  }
}

export async function firebaseEmailSignIn(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isFirebaseActive()) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = userCredential.user;

      try {
        const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (docSnap.exists()) {
          const profile = docSnap.data() as User;
          setSimulatedUser(profile as SimulatedUser);
          return profile;
        }
      } catch (e) {
        console.warn('Could not fetch user profile from Firestore, creating fallback:', e);
      }

      let role: UserRole = 'student';
      let name = fbUser.displayName || normalizedEmail.split('@')[0];

      if (normalizedEmail === '25jeongsonglee@dgmeister.hs.kr' || normalizedEmail === '25jeongsonglee@gmail.com') {
        role = 'admin';
        if (!fbUser.displayName) {
          name = '정송이 (2학년)';
        }
      } else if (normalizedEmail.includes('admin') || normalizedEmail === 'admin@school.kr') {
        role = 'admin';
      } else if (normalizedEmail.includes('teacher') || normalizedEmail === 'teacher@dgmeister.hs.kr' || normalizedEmail === 'teacher@gmail.com') {
        role = 'teacher';
      }

      const userProfile: User = {
        id: fbUser.uid,
        name: name,
        email: normalizedEmail,
        role: role
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      } catch (e) {
        console.warn('Could not save newly created email profile to firestore:', e);
      }

      setSimulatedUser(userProfile as SimulatedUser);
      return userProfile;
    } catch (error: any) {
      console.error('Firebase email sign-in error:', error);
      throw error;
    }
  } else {
    const simulatedUsers = getSimulatedUsers();
    const credentials = JSON.parse(localStorage.getItem('lib_book_users_credentials') || '{}');

    if (!credentials['25jeongsonglee@dgmeister.hs.kr'] || credentials['25jeongsonglee@dgmeister.hs.kr'] === '123456') {
      credentials['25jeongsonglee@dgmeister.hs.kr'] = 'kaidou634@';
    }
    if (!credentials['admin@meister.hs.kr']) {
      credentials['admin@meister.hs.kr'] = 'admin123';
    }
    if (!credentials['teacher@dgmeister.hs.kr']) {
      credentials['teacher@dgmeister.hs.kr'] = 'teacher123';
    }
    localStorage.setItem('lib_book_users_credentials', JSON.stringify(credentials));

    const savedPassword = credentials[normalizedEmail];
    if (!savedPassword) {
      throw new Error('등록되지 않은 이메일 주소이거나 비밀번호가 틀렸습니다.');
    }

    if (savedPassword !== password) {
      throw new Error('비밀번호가 올바르지 않습니다.');
    }

    let foundUser = simulatedUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!foundUser) {
      let role: UserRole = 'student';
      let name = normalizedEmail.split('@')[0];

      if (normalizedEmail === '25jeongsonglee@dgmeister.hs.kr' || normalizedEmail === '25jeongsonglee@gmail.com') {
        role = 'admin';
        name = '정송이';
      }

      foundUser = {
        id: `sim-${role}-${Date.now()}`,
        email: normalizedEmail,
        name: name,
        role: role
      };
      simulatedUsers.push(foundUser);
      localStorage.setItem('lib_book_users', JSON.stringify(simulatedUsers));
    }

    setSimulatedUser(foundUser);
    return foundUser as User;
  }
}

export async function customUserLogin(email: string, role: UserRole, studentNumber?: string, customName?: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  // Setup standard user metadata - Use passed role or default to student
  let finalRole: UserRole = role || 'student';
  let finalName = customName ? customName.trim() : '학생독자';

  if (normalizedEmail === '25jeongsonglee@dgmeister.hs.kr' || normalizedEmail === '25jeongsonglee@gmail.com') {
    finalRole = 'admin';
    if (!customName) {
      finalName = '정송이 (2학년)';
    }
  } else if (normalizedEmail.includes('admin') || normalizedEmail === 'admin@school.kr') {
    finalRole = 'admin';
  }

  const userObj: SimulatedUser = {
    id: `sim-${finalRole}-${Date.now()}`,
    email: email.trim(),
    name: finalName,
    role: finalRole,
    student_number: studentNumber
  };

  if (isFirebaseActive()) {
    try {
      // In cloud mode, write custom profile info to mock collection with ID
      await setDoc(doc(db, 'users', userObj.id), {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        student_number: userObj.student_number || ""
      });
    } catch (e) {
      console.warn('Could not register in Firebase Firestore but logging in client-side:', e);
    }
  }

  setSimulatedUser(userObj);
  return userObj as User;
}

export async function userLogout(): Promise<void> {
  if (isFirebaseActive()) {
    await signOut(auth);
  }
  setSimulatedUser(null);
}

// 2. NEWSPAPER ARCHIVE SERVICES
export async function getNewspapers(): Promise<Newspaper[]> {
  const localList = getLocalData<Newspaper>('newspapers', INITIAL_NEWSPAPERS);

  if (isFirebaseActive()) {
    try {
      const q = collection(db, 'newspapers');
      const querySnapshot = await getDocs(q);
      const items: Newspaper[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Newspaper);
      });
      const sorted = items.sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
      
      // Sync local cache with Firestore data. Merge any locally added items to prevent data disappearing on sync resets.
      const firestoreIds = new Set(sorted.map(p => p.id));
      const localUnsynced = localList.filter(p => !firestoreIds.has(p.id) && p.id.startsWith('paper-'));
      
      const merged = [...sorted, ...localUnsynced].sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
      setLocalData('newspapers', merged);
      return merged;
    } catch (error) {
      console.warn("Could not fetch newspapers from Firestore, returning local cache fallback:", error);
      return localList.sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
    }
  } else {
    return localList.sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
  }
}

export async function addNewspaper(newspaper: Omit<Newspaper, 'id' | 'createdAt'>): Promise<Newspaper> {
  const newPaper: Newspaper = {
    ...newspaper,
    id: `paper-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    createdAt: new Date().toISOString()
  };

  // Always write immediately to local storage cache to keep local edits persistent
  const list = getLocalData<Newspaper>('newspapers', INITIAL_NEWSPAPERS);
  list.unshift(newPaper);
  setLocalData('newspapers', list);

  if (isFirebaseActive()) {
    try {
      await setDoc(doc(db, 'newspapers', newPaper.id), newPaper);
    } catch (error) {
      console.warn("Could not save newspaper to Firestore cloud, but it was safely cached locally:", error);
    }
  }

  return newPaper;
}

export async function deleteNewspaper(id: string): Promise<void> {
  // Always update the local cache immediately to prevent deleted items from persisting offline
  const list = getLocalData<Newspaper>('newspapers', INITIAL_NEWSPAPERS);
  const updated = list.filter(p => p.id !== id);
  setLocalData('newspapers', updated);

  if (isFirebaseActive()) {
    try {
      await deleteDoc(doc(db, 'newspapers', id));
    } catch (error) {
      console.warn("Could not delete newspaper from Firestore cloud, but it was removed locally:", error);
    }
  }
}

// 3. INTERVIEW RESERVATIONS SERVICES
export async function getReservations(): Promise<InterviewReservation[]> {
  if (isFirebaseActive()) {
    try {
      const q = collection(db, 'interview_reservations');
      const querySnapshot = await getDocs(q);
      const items: InterviewReservation[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(docSnap.data() as InterviewReservation);
      });
      return items
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'interview_reservations');
    }
  } else {
    const list = getLocalData<InterviewReservation>('reservations_v4', INITIAL_RESERVATIONS);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function addReservation(reservation: Omit<InterviewReservation, 'id' | 'userId' | 'status' | 'createdAt'>): Promise<InterviewReservation> {
  const current = currentSimulatedUser;
  const newReservation: InterviewReservation = {
    ...reservation,
    id: `res-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    userId: current?.id || 'guest',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive()) {
    try {
      await setDoc(doc(db, 'interview_reservations', newReservation.id), newReservation);
      return newReservation;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `interview_reservations/${newReservation.id}`);
    }
  } else {
    const list = getLocalData<InterviewReservation>('reservations_v4', INITIAL_RESERVATIONS);
    list.unshift(newReservation);
    setLocalData('reservations_v4', list);
    return newReservation;
  }
}

export async function updateReservationStatus(id: string, status: 'approved' | 'rejected', details?: Partial<InterviewReservation>): Promise<void> {
  if (isFirebaseActive()) {
    try {
      const docRef = doc(db, 'interview_reservations', id);
      await updateDoc(docRef, { status, ...details });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `interview_reservations/${id}`);
    }
  } else {
    const list = getLocalData<InterviewReservation>('reservations_v4', INITIAL_RESERVATIONS);
    const updated = list.map(item => {
      if (item.id === id) {
        return { ...item, status, ...details };
      }
      return item;
    });
    setLocalData('reservations_v4', updated);
  }
}

export async function deleteReservation(id: string): Promise<void> {
  if (isFirebaseActive()) {
    try {
      await deleteDoc(doc(db, 'interview_reservations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `interview_reservations/${id}`);
    }
  } else {
    const list = getLocalData<InterviewReservation>('reservations_v4', INITIAL_RESERVATIONS);
    const updated = list.filter(r => r.id !== id);
    setLocalData('reservations_v4', updated);
  }
}

// 4. INQUIRIES SERVICES
export async function getInquiries(): Promise<Inquiry[]> {
  if (isFirebaseActive()) {
    try {
      const q = collection(db, 'inquiries');
      const querySnapshot = await getDocs(q);
      const items: Inquiry[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Inquiry);
      });
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'inquiries');
    }
  } else {
    return getLocalData<Inquiry>('inquiries', INITIAL_INQUIRIES);
  }
}

export async function addInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'createdAt'>): Promise<Inquiry> {
  const newInquiry: Inquiry = {
    ...inquiry,
    id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive()) {
    try {
      await setDoc(doc(db, 'inquiries', newInquiry.id), newInquiry);
      return newInquiry;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inquiries/${newInquiry.id}`);
    }
  } else {
    const list = getLocalData<Inquiry>('inquiries', INITIAL_INQUIRIES);
    list.unshift(newInquiry);
    setLocalData('inquiries', list);
    return newInquiry;
  }
}

export async function updateInquiryAnswer(id: string, answer: string, status: 'answered' | 'pending' = 'answered'): Promise<void> {
  if (isFirebaseActive()) {
    try {
      const docRef = doc(db, 'inquiries', id);
      await updateDoc(docRef, { answer, status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inquiries/${id}`);
    }
  } else {
    const list = getLocalData<Inquiry>('inquiries', INITIAL_INQUIRIES);
    const updated = list.map(item => {
      if (item.id === id) {
        return { ...item, answer, status };
      }
      return item;
    });
    setLocalData('inquiries', updated);
  }
}

// 5. NOTICES SERVICES
export async function getNotices(): Promise<Notice[]> {
  const localList = getLocalData<Notice>('notices', INITIAL_NOTICES);

  if (isFirebaseActive()) {
    try {
      const q = collection(db, 'notices');
      const querySnapshot = await getDocs(q);
      const items: Notice[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Notice);
      });
      const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const firestoreIds = new Set(sorted.map(n => n.id));
      const localUnsynced = localList.filter(n => !firestoreIds.has(n.id) && n.id.startsWith('notice-'));
      
      const merged = [...sorted, ...localUnsynced].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocalData('notices', merged);
      return merged;
    } catch (error) {
      console.warn("Could not fetch notices from Firestore, using local cache backup:", error);
      return localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } else {
    return localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function addNotice(notice: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> {
  const newNotice: Notice = {
    ...notice,
    id: `notice-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    createdAt: new Date().toISOString()
  };

  const list = getLocalData<Notice>('notices', INITIAL_NOTICES);
  list.unshift(newNotice);
  setLocalData('notices', list);

  if (isFirebaseActive()) {
    try {
      await setDoc(doc(db, 'notices', newNotice.id), newNotice);
    } catch (error) {
      console.warn("Could not save notice to Firestore, but saved backup locally:", error);
    }
  }

  return newNotice;
}

export async function deleteNotice(id: string): Promise<void> {
  const list = getLocalData<Notice>('notices', INITIAL_NOTICES);
  const updated = list.filter(n => n.id !== id);
  setLocalData('notices', updated);

  if (isFirebaseActive()) {
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      console.warn("Could not delete notice from Firestore, but removed locally:", error);
    }
  }
}

// 6. NEWSPAPER COMMENTS SERVICES
const INITIAL_COMMENTS: NewspaperComment[] = [
  {
    id: 'c1',
    newspaperId: 'p1',
    authorDept: '전기전자제어과',
    authorGrade: '3학년',
    authorClassNumber: '1반 15번',
    authorName: '김태우',
    content: '호국보훈의 달 특집 기사가 정말 감명 깊습니다. 특히 선배들이 다녀온 기동 훈련 취재는 마이스터고 학생으로서 큰 자부심을 가지게 만드네요!',
    createdAt: '2026-06-13T11:20:00Z'
  },
  {
    id: 'c2',
    newspaperId: 'p1',
    authorDept: '교무기획부',
    authorGrade: undefined,
    authorClassNumber: '교직원',
    authorName: '장민철 교사',
    content: '신문 자율동아리 학생들이 학업 와중에도 정성을 다해 신문을 편집해 준 과정이 고스란히 느껴집니다. 모든 학생독자가 꼭 읽어보았으면 좋겠습니다.',
    createdAt: '2026-06-13T15:45:00Z'
  }
];

export async function getNewspaperComments(newspaperId: string): Promise<NewspaperComment[]> {
  if (isFirebaseActive()) {
    try {
      const q = query(collection(db, 'newspaper_comments'), where('newspaperId', '==', newspaperId));
      const querySnapshot = await getDocs(q);
      const items: NewspaperComment[] = [];
      querySnapshot.forEach((docSnap) => {
         items.push(docSnap.data() as NewspaperComment);
      });
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, `newspaper_comments`);
    }
  } else {
    const list = getLocalData<NewspaperComment>('newspaper_comments', INITIAL_COMMENTS);
    return list
      .filter((c) => c.newspaperId === newspaperId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export async function addNewspaperComment(comment: Omit<NewspaperComment, 'id' | 'createdAt'>): Promise<NewspaperComment> {
  const newComment: NewspaperComment = {
    ...comment,
    id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive()) {
    try {
      await setDoc(doc(db, 'newspaper_comments', newComment.id), newComment);
      return newComment;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `newspaper_comments/${newComment.id}`);
    }
  } else {
    const list = getLocalData<NewspaperComment>('newspaper_comments', INITIAL_COMMENTS);
    list.push(newComment);
    setLocalData('newspaper_comments', list);
    return newComment;
  }
}

export async function deleteNewspaperComment(id: string): Promise<void> {
  if (isFirebaseActive()) {
    try {
      await deleteDoc(doc(db, 'newspaper_comments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `newspaper_comments/${id}`);
    }
  } else {
    const list = getLocalData<NewspaperComment>('newspaper_comments', INITIAL_COMMENTS);
    const updated = list.filter((c) => c.id !== id);
    setLocalData('newspaper_comments', updated);
  }
}

// 7. COMPLIMENTS SERVICES
const INITIAL_COMPLIMENTS: Compliment[] = [
  {
    id: 'comp1',
    senderName: '이수성',
    senderRole: 'student',
    senderDept: '3학년 스마트팩토리과',
    receiverName: '김민지 선생님',
    receiverDept: '도서관 정보부',
    content: '매월 발행되는 사람책 신문과 도서관 행사를 늘 밝은 모습으로 준비하고 이끌어주시는 김민지 선생님을 칭찬합니다! 덕분에 책과 친해지게 되었어요.',
    createdAt: '2026-06-13T10:15:00Z'
  },
  {
    id: 'comp2',
    senderName: '홍길동 선생님',
    senderRole: 'teacher',
    senderDept: '수학교육실',
    receiverName: '배성준',
    receiverDept: '2학년 전기전자제어과',
    content: '신문 사진/촬영 동아리에서 책임감을 가지고 늘 조용히 솔선수범하며 성실한 태도로 취재 촬영을 완벽하게 마치는 배성준 학생을 칭찬의 첫 주자로 강력 추천합니다.',
    createdAt: '2026-06-14T02:30:00Z'
  }
];

export async function getCompliments(): Promise<Compliment[]> {
  if (isFirebaseActive()) {
    try {
      const q = collection(db, 'compliments');
      const querySnapshot = await getDocs(q);
      const items: Compliment[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Compliment);
      });
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'compliments');
    }
  } else {
    return getLocalData<Compliment>('compliments', INITIAL_COMPLIMENTS);
  }
}

export async function addCompliment(compliment: Omit<Compliment, 'id' | 'createdAt'>): Promise<Compliment> {
  const newComp: Compliment = {
    ...compliment,
    id: `comp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive()) {
    try {
      await setDoc(doc(db, 'compliments', newComp.id), newComp);
      return newComp;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `compliments/${newComp.id}`);
    }
  } else {
    const list = getLocalData<Compliment>('compliments', INITIAL_COMPLIMENTS);
    list.unshift(newComp);
    setLocalData('compliments', list);
    return newComp;
  }
}

export async function deleteCompliment(id: string): Promise<void> {
  if (isFirebaseActive()) {
    try {
      await deleteDoc(doc(db, 'compliments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `compliments/${id}`);
    }
  } else {
    const list = getLocalData<Compliment>('compliments', INITIAL_COMPLIMENTS);
    const updated = list.filter(c => c.id !== id);
    setLocalData('compliments', updated);
  }
}

