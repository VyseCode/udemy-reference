import { Types } from "mongoose";
import { Course } from "@/models/Course";
import { Section } from "@/models/Section";
import { Lecture } from "@/models/Lecture";
import { Enrollment } from "@/models/Enrollment";
import { Progress } from "@/models/Progress";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Review } from "@/models/Review";
import { Certificate } from "@/models/Certificate";
import { User } from "@/models/User";
import type {
  CertificateDTO,
  CourseDetailDTO,
  CourseListItemDTO,
  CourseListResult,
  EnrollmentDTO,
  InstructorDashboardDTO,
  LectureDTO,
  ProgressDTO,
  QuizAttemptDTO,
  QuizDTO,
  ReviewSummaryDTO,
  SectionDTO,
  StudentDashboardDTO,
} from "@/lib/types";

type Stats = {
  rating: number;
  reviewCount: number;
  studentCount: number;
  lectureCount: number;
  totalMinutes: number;
};

const emptyStats: Stats = {
  rating: 0,
  reviewCount: 0,
  studentCount: 0,
  lectureCount: 0,
  totalMinutes: 0,
};

type LeanCourse = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  status: "draft" | "published";
  createdAt: Date;
  instructor: { _id: Types.ObjectId; name: string } | Types.ObjectId;
};

function instructorInfo(course: LeanCourse): { id: string; name: string } {
  const instructor = course.instructor as
    | { _id: Types.ObjectId; name: string }
    | Types.ObjectId;
  if (instructor && "name" in instructor && "_id" in instructor) {
    return { id: instructor._id.toString(), name: instructor.name };
  }
  return { id: instructor ? instructor.toString() : "", name: "Instructor" };
}

async function bulkStats(courseIds: Types.ObjectId[]): Promise<Map<string, Stats>> {
  const result = new Map<string, Stats>();
  if (courseIds.length === 0) return result;
  for (const id of courseIds) result.set(id.toString(), { ...emptyStats });

  const [ratingRows, enrollmentRows, lectureRows] = await Promise.all([
    Review.aggregate<{ _id: Types.ObjectId; avg: number; count: number }>([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: "$course",
          avg: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]),
    Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]),
    Lecture.aggregate<{
      _id: Types.ObjectId;
      count: number;
      minutes: number;
    }>([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
          minutes: { $sum: "$duration" },
        },
      },
    ]),
  ]);

  for (const row of ratingRows) {
    const stats = result.get(row._id.toString());
    if (stats) {
      stats.rating = Math.round(row.avg * 10) / 10;
      stats.reviewCount = row.count;
    }
  }
  for (const row of enrollmentRows) {
    const stats = result.get(row._id.toString());
    if (stats) stats.studentCount = row.count;
  }
  for (const row of lectureRows) {
    const stats = result.get(row._id.toString());
    if (stats) {
      stats.lectureCount = row.count;
      stats.totalMinutes = row.minutes;
    }
  }
  return result;
}

async function enrolledSet(
  userId: string | undefined,
  courseIds: Types.ObjectId[],
): Promise<Set<string>> {
  if (!userId || !Types.ObjectId.isValid(userId) || courseIds.length === 0) {
    return new Set();
  }
  const docs = await Enrollment.find({ user: userId, course: { $in: courseIds } })
    .select("course")
    .lean();
  return new Set(docs.map((doc) => doc.course.toString()));
}

function serializeCourse(
  course: LeanCourse,
  stats: Stats,
  enrolled: boolean,
): CourseListItemDTO {
  return {
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    category: course.category,
    price: course.price,
    thumbnail: course.thumbnail,
    status: course.status,
    instructor: instructorInfo(course),
    rating: stats.rating,
    reviewCount: stats.reviewCount,
    studentCount: stats.studentCount,
    lectureCount: stats.lectureCount,
    totalMinutes: stats.totalMinutes,
    enrolled,
    createdAt: course.createdAt.toISOString(),
  };
}

export async function listCourses(options: {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  viewerId?: string;
}): Promise<CourseListResult> {
  const limit = Math.min(Math.max(options.limit ?? 9, 1), 48);
  const page = Math.max(options.page ?? 1, 1);
  const filter: Record<string, unknown> = { status: "published" };
  if (options.category) filter.category = options.category;
  if (options.q) {
    const term = options.q.trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
      ];
    }
  }

  const sort = options.sort ?? "newest";
  const ranked = sort === "rating" || sort === "popular";

  let docs: LeanCourse[];
  let total: number;

  if (ranked) {
    const candidates = (await Course.find(filter)
      .populate("instructor", "name")
      .limit(300)
      .lean()) as unknown as LeanCourse[];
    const stats = await bulkStats(candidates.map((course) => course._id));
    candidates.sort((a, b) => {
      const sa = stats.get(a._id.toString()) ?? emptyStats;
      const sb = stats.get(b._id.toString()) ?? emptyStats;
      return sort === "rating"
        ? sb.rating - sa.rating || sb.reviewCount - sa.reviewCount
        : sb.studentCount - sa.studentCount || sb.rating - sa.rating;
    });
    total = candidates.length;
    docs = candidates.slice((page - 1) * limit, page * limit);
  } else {
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
    };
    [docs, total] = await Promise.all([
      Course.find(filter)
        .populate("instructor", "name")
        .sort(sortMap[sort] ?? sortMap.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as Promise<LeanCourse[]>,
      Course.countDocuments(filter),
    ]);
  }

  const stats = await bulkStats(docs.map((course) => course._id));
  const enrolled = await enrolledSet(
    options.viewerId,
    docs.map((course) => course._id),
  );

  return {
    courses: docs.map((course) =>
      serializeCourse(
        course,
        stats.get(course._id.toString()) ?? emptyStats,
        enrolled.has(course._id.toString()),
      ),
    ),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getCourseDocument(
  id: string,
): Promise<LeanCourse | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return (await Course.findById(id)
    .populate("instructor", "name")
    .lean()) as unknown as LeanCourse | null;
}

export async function getCurriculum(
  courseId: string,
  includeAllVideo: boolean,
): Promise<SectionDTO[]> {
  const sections = (await Section.find({ course: courseId })
    .sort({ order: 1, createdAt: 1 })
    .select("title order")
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    title: string;
    order: number;
  }>;
  const lectures = (await Lecture.find({ course: courseId })
    .sort({ order: 1, createdAt: 1 })
    .select("section title description order duration videoUrl isPreview")
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    section: Types.ObjectId;
    title: string;
    description: string;
    order: number;
    duration: number;
    videoUrl: string;
    isPreview: boolean;
  }>;

  return sections.map((section) => ({
    id: section._id.toString(),
    title: section.title,
    order: section.order,
    lectures: lectures
      .filter((lecture) => lecture.section.toString() === section._id.toString())
      .map<LectureDTO>((lecture) => ({
        id: lecture._id.toString(),
        title: lecture.title,
        description: lecture.description ?? "",
        order: lecture.order,
        duration: lecture.duration ?? 0,
        isPreview: lecture.isPreview ?? false,
        videoUrl:
          includeAllVideo || lecture.isPreview ? lecture.videoUrl ?? "" : "",
      })),
  }));
}

export async function getCourseDetail(
  id: string,
  viewer: { id: string; role: string } | null,
): Promise<CourseDetailDTO | null> {
  const course = await getCourseDocument(id);
  if (!course) return null;

  const isOwner =
    viewer?.role === "instructor" &&
    instructorInfo(course).id === viewer.id &&
    instructorInfo(course).id !== "";
  const enrolled = viewer
    ? await Enrollment.exists({ course: course._id, user: viewer.id })
    : null;
  const canView = course.status === "published" || isOwner || Boolean(enrolled);
  if (!canView) return null;

  const stats = await bulkStats([course._id]);
  const statsForCourse = stats.get(course._id.toString()) ?? emptyStats;
  const sections = await getCurriculum(id, Boolean(isOwner || enrolled));

  return {
    ...serializeCourse(course, statsForCourse, Boolean(enrolled)),
    sections,
    isOwner: Boolean(isOwner),
  };
}

export async function isEnrolled(
  courseId: string,
  userId: string,
): Promise<boolean> {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(userId)) {
    return false;
  }
  return Boolean(await Enrollment.exists({ course: courseId, user: userId }));
}

export async function isCourseOwner(
  courseId: string,
  userId: string,
): Promise<boolean> {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(userId)) {
    return false;
  }
  const course = await Course.findById(courseId).select("instructor").lean();
  return course?.instructor.toString() === userId;
}

export async function getProgress(
  courseId: string,
  userId: string,
): Promise<ProgressDTO> {
  const empty: ProgressDTO = {
    completedLectureIds: [],
    total: 0,
    completed: 0,
    percent: 0,
  };
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(userId)) {
    return empty;
  }
  const [lectures, completed] = await Promise.all([
    Lecture.find({ course: courseId }).select("_id").lean(),
    Progress.find({ course: courseId, user: userId, completed: true })
      .select("lecture")
      .lean(),
  ]);
  const validIds = new Set(lectures.map((lecture) => lecture._id.toString()));
  const completedIds = completed
    .map((item) => item.lecture.toString())
    .filter((id) => validIds.has(id));
  const total = validIds.size;
  return {
    completedLectureIds: completedIds,
    total,
    completed: completedIds.length,
    percent: total === 0 ? 0 : Math.round((completedIds.length / total) * 100),
  };
}

export async function getReviews(courseId: string): Promise<ReviewSummaryDTO> {
  const docs = (await Review.find({ course: courseId })
    .populate("user", "name avatarUrl")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    user: { _id: Types.ObjectId; name: string; avatarUrl: string } | null;
  }>;
  const aggregation = (await Review.aggregate<{
    avg: number | null;
    count: number;
  }>([
    { $match: { course: new Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ])) as Array<{ avg: number | null; count: number }>;
  const row = aggregation[0];
  return {
    average: row?.avg ? Math.round(row.avg * 10) / 10 : 0,
    count: row?.count ?? 0,
    reviews: docs.map((doc) => ({
      id: doc._id.toString(),
      rating: doc.rating,
      comment: doc.comment ?? "",
      author: {
        id: doc.user?._id.toString() ?? "",
        name: doc.user?.name ?? "Former learner",
        avatarUrl: doc.user?.avatarUrl ?? "",
      },
      createdAt: doc.createdAt.toISOString(),
    })),
  };
}

export async function getQuiz(
  courseId: string,
  userId: string,
): Promise<QuizDTO> {
  const quiz = await Quiz.findOne({ course: courseId })
    .select("questions")
    .lean();
  const attempts = (await QuizAttempt.find({ course: courseId, user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    score: number;
    correctCount: number;
    total: number;
    passed: boolean;
    createdAt: Date;
  }>;
  const attemptDTOs: QuizAttemptDTO[] = attempts.map((attempt) => ({
    id: attempt._id.toString(),
    score: attempt.score,
    correctCount: attempt.correctCount,
    total: attempt.total,
    passed: attempt.passed,
    attemptedAt: attempt.createdAt.toISOString(),
  }));
  const questions = (quiz?.questions ?? []).map((question) => ({
    id: question._id.toString(),
    prompt: question.prompt,
    options: question.options,
  }));
  return {
    courseId,
    questions,
    attempts: attemptDTOs,
    bestScore: attemptDTOs.reduce((best, attempt) => Math.max(best, attempt.score), 0),
    passed: attemptDTOs.some((attempt) => attempt.passed),
  };
}

export async function getCertificateForCourse(
  courseId: string,
  userId: string,
): Promise<CertificateDTO | null> {
  const doc = (await Certificate.findOne({ course: courseId, user: userId })
    .populate("course", "title")
    .populate("user", "name")
    .lean()) as unknown as {
    _id: Types.ObjectId;
    certificateId: string;
    finalScore: number;
    issuedAt: Date;
    course: { title: string };
    user: { name: string };
  } | null;
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    certificateId: doc.certificateId,
    finalScore: doc.finalScore,
    issuedAt: doc.issuedAt.toISOString(),
    courseTitle: doc.course?.title ?? "",
    studentName: doc.user?.name ?? "",
  };
}

export async function getCertificateByCode(
  certificateId: string,
): Promise<CertificateDTO | null> {
  const doc = (await Certificate.findOne({ certificateId })
    .populate("course", "title")
    .populate("user", "name")
    .lean()) as unknown as {
    _id: Types.ObjectId;
    certificateId: string;
    finalScore: number;
    issuedAt: Date;
    course: { title: string };
    user: { name: string };
  } | null;
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    certificateId: doc.certificateId,
    finalScore: doc.finalScore,
    issuedAt: doc.issuedAt.toISOString(),
    courseTitle: doc.course?.title ?? "",
    studentName: doc.user?.name ?? "",
  };
}

export async function getInstructorDashboard(
  userId: string,
): Promise<InstructorDashboardDTO> {
  const courses = (await Course.find({ instructor: userId })
    .populate("instructor", "name")
    .sort({ updatedAt: -1 })
    .lean()) as unknown as LeanCourse[];
  const ids = courses.map((course) => course._id);
  const stats = await bulkStats(ids);

  const enrollments = await Enrollment.aggregate<{
    _id: Types.ObjectId;
    students: number;
    revenue: number;
  }>([
    { $match: { course: { $in: ids } } },
    {
      $group: {
        _id: "$course",
        students: { $sum: 1 },
        revenue: { $sum: "$pricePaid" },
      },
    },
  ]);
  const revenueByCourse = new Map(
    enrollments.map((row) => [row._id.toString(), row]),
  );

  const [reviewAgg, certificateCount] = await Promise.all([
    Review.aggregate<{ avg: number | null; count: number }>([
      { $match: { course: { $in: ids } } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
    Certificate.countDocuments({ course: { $in: ids } }),
  ]);

  let revenue = 0;
  for (const row of enrollments) revenue += row.revenue ?? 0;

  return {
    courseCount: courses.length,
    studentCount: enrollments.reduce((sum, row) => sum + row.students, 0),
    revenue: Math.round(revenue * 100) / 100,
    averageRating: reviewAgg[0]?.avg
      ? Math.round(reviewAgg[0].avg * 10) / 10
      : 0,
    certificatesIssued: certificateCount,
    courses: courses.map((course) => ({
      ...serializeCourse(
        course,
        stats.get(course._id.toString()) ?? emptyStats,
        false,
      ),
      students: revenueByCourse.get(course._id.toString())?.students ?? 0,
      revenue: revenueByCourse.get(course._id.toString())?.revenue ?? 0,
    })),
  };
}

export async function getStudentDashboard(
  userId: string,
): Promise<StudentDashboardDTO> {
  const enrollments = (await Enrollment.find({ user: userId })
    .populate({
      path: "course",
      populate: { path: "instructor", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    pricePaid: number;
    createdAt: Date;
    course: LeanCourse | null;
  }>;

  const ids = enrollments
    .map((enrollment) => enrollment.course?._id)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const [stats, enrolled, certificateDocs] = await Promise.all([
    bulkStats(ids),
    enrolledSet(userId, ids),
    Certificate.find({ user: userId, course: { $in: ids } })
      .select("course")
      .lean(),
  ]);
  const certifiedIds = new Set(
    certificateDocs.map((doc) => doc.course.toString()),
  );

  const courses: StudentDashboardDTO["courses"] = [];
  for (const enrollment of enrollments) {
    if (!enrollment.course) continue;
    const course = enrollment.course;
    const progress = await getProgress(course._id.toString(), userId);
    courses.push({
      id: enrollment._id.toString(),
      enrolledAt: enrollment.createdAt.toISOString(),
      pricePaid: enrollment.pricePaid,
      course: serializeCourse(
        course,
        stats.get(course._id.toString()) ?? emptyStats,
        enrolled.has(course._id.toString()),
      ),
      percent: progress.percent,
    });
  }

  return {
    enrolledCount: courses.length,
    completedCount: courses.filter(
      (item) => item.percent === 100 || certifiedIds.has(item.course.id),
    ).length,
    inProgressCount: courses.filter(
      (item) => item.percent > 0 && item.percent < 100,
    ).length,
    certificateCount: certifiedIds.size,
    courses,
  };
}

export async function getCourseCategories(): Promise<string[]> {
  const rows = await Course.aggregate<{ _id: string }>([
    { $match: { status: "published" } },
    { $group: { _id: "$category" } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => row._id);
}

export async function getPublicInstructors(): Promise<
  Array<{ id: string; name: string; headline: string }>
> {
  const docs = await User.find({ role: "instructor" })
    .select("name headline")
    .sort({ name: 1 })
    .limit(20)
    .lean();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    headline: doc.headline ?? "",
  }));
}
