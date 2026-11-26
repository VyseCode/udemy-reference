import { notFound, redirect } from "next/navigation";
import { LearnView } from "@/components/LearnView";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  getCertificateForCourse,
  getCourseDetail,
  getProgress,
  getQuiz,
  getReviews,
  isEnrolled,
} from "@/lib/queries";

type Context = PageProps<"/courses/[id]/learn">;

export default async function LearnPage({ params }: Context) {
  const user = await requireUser();
  const { id } = await params;
  await connectDB();

  const [course, enrolled] = await Promise.all([
    getCourseDetail(id, { id: user.id, role: user.role }),
    isEnrolled(id, user.id),
  ]);
  if (!course) notFound();
  if (!enrolled) redirect(`/courses/${id}`);

  const [progress, quiz, reviews, certificate] = await Promise.all([
    getProgress(id, user.id),
    getQuiz(id, user.id),
    getReviews(id),
    getCertificateForCourse(id, user.id),
  ]);
  const myReview = reviews.reviews.find((review) => review.author.id === user.id) ?? null;

  return (
    <LearnView
      course={course}
      progress={progress}
      quiz={quiz}
      reviews={reviews}
      certificate={certificate}
      myReview={myReview ? { rating: myReview.rating, comment: myReview.comment } : null}
      studentName={user.name}
    />
  );
}
