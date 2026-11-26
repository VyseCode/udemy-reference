export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor";
  headline: string;
  bio: string;
  avatarUrl: string;
};

export type CourseListItemDTO = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  status: "draft" | "published";
  instructor: { id: string; name: string };
  rating: number;
  reviewCount: number;
  studentCount: number;
  lectureCount: number;
  totalMinutes: number;
  enrolled: boolean;
  createdAt: string;
};

export type LectureDTO = {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  isPreview: boolean;
  videoUrl: string;
};

export type SectionDTO = {
  id: string;
  title: string;
  order: number;
  lectures: LectureDTO[];
};

export type CourseDetailDTO = CourseListItemDTO & {
  sections: SectionDTO[];
  isOwner: boolean;
};

export type CourseListResult = {
  courses: CourseListItemDTO[];
  total: number;
  page: number;
  pages: number;
};

export type ProgressDTO = {
  completedLectureIds: string[];
  total: number;
  completed: number;
  percent: number;
};

export type QuizQuestionPublic = {
  id: string;
  prompt: string;
  options: string[];
};

export type QuizDTO = {
  courseId: string;
  questions: QuizQuestionPublic[];
  attempts: QuizAttemptDTO[];
  bestScore: number;
  passed: boolean;
};

export type QuizAttemptDTO = {
  id: string;
  score: number;
  correctCount: number;
  total: number;
  passed: boolean;
  attemptedAt: string;
};

export type ReviewDTO = {
  id: string;
  rating: number;
  comment: string;
  author: { id: string; name: string; avatarUrl: string };
  createdAt: string;
};

export type ReviewSummaryDTO = {
  average: number;
  count: number;
  reviews: ReviewDTO[];
};

export type CertificateDTO = {
  id: string;
  certificateId: string;
  finalScore: number;
  issuedAt: string;
  courseTitle: string;
  studentName: string;
};

export type EnrollmentDTO = {
  id: string;
  course: CourseListItemDTO;
  enrolledAt: string;
  pricePaid: number;
};

export type InstructorDashboardDTO = {
  courseCount: number;
  studentCount: number;
  revenue: number;
  averageRating: number;
  certificatesIssued: number;
  courses: Array<CourseListItemDTO & { students: number; revenue: number }>;
};

export type StudentDashboardDTO = {
  enrolledCount: number;
  completedCount: number;
  inProgressCount: number;
  certificateCount: number;
  courses: Array<EnrollmentDTO & { percent: number }>;
};
