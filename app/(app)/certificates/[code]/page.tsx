import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateIcon } from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCertificateByCode } from "@/lib/queries";
import { Certificate } from "@/models/Certificate";

type Context = PageProps<"/certificates/[code]">;

export default async function CertificatePage({ params }: Context) {
  const user = await requireUser();
  const { code } = await params;
  await connectDB();

  const [certificate, record] = await Promise.all([
    getCertificateByCode(code),
    Certificate.findOne({ certificateId: code })
      .populate("user", "_id")
      .populate("course", "instructor")
      .lean(),
  ]);
  if (!certificate || !record) notFound();

  const recipientId = (record.user as unknown as { _id: { toString(): string } } | null)?._id.toString();
  const instructorId = (
    record.course as unknown as { instructor: { toString(): string } } | null
  )?.instructor.toString();
  if (recipientId !== user.id && !(user.role === "instructor" && instructorId === user.id)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/certificates" className="text-sm text-muted hover:text-accent-deep">
        ← All certificates
      </Link>
      <article className="mt-8 rounded-lg border-2 border-ink bg-surface p-8 sm:p-12">
        <div className="flex items-center gap-3 border-b border-line pb-6">
          <CertificateIcon className="h-8 w-8 text-accent" />
          <span className="font-serif text-2xl">Lumen</span>
          <span className="ml-auto text-xs uppercase tracking-[0.18em] text-muted">Certificate of completion</span>
        </div>
        <p className="mt-10 text-sm text-muted">This certifies that</p>
        <h1 className="mt-2 font-serif text-4xl">{certificate.studentName}</h1>
        <p className="mt-6 text-sm text-muted">has successfully completed</p>
        <p className="mt-2 font-serif text-2xl text-accent-deep">{certificate.courseTitle}</p>
        <p className="mt-6 max-w-xl text-sm leading-7 text-muted">
          All lectures were completed and the course quiz was passed. This certificate is
          verifiable by its unique code within this reference application.
        </p>
        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
          <div>
            <p className="text-xs text-muted">Certificate ID</p>
            <p className="font-mono text-sm tracking-wide">{certificate.certificateId}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Issued</p>
            <p className="text-sm">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Final quiz score</p>
            <p className="font-serif text-xl">{certificate.finalScore}%</p>
          </div>
        </div>
      </article>
    </div>
  );
}
