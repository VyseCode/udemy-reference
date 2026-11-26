import Link from "next/link";
import { CertificateIcon } from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCertificatesForUser } from "@/lib/queries";

export default async function CertificatesPage() {
  const user = await requireUser();
  await connectDB();
  const certificates = await getCertificatesForUser(user.id);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Achievements
      </p>
      <h1 className="mt-2 font-serif text-4xl">Certificates</h1>
      <p className="mt-2 text-muted">Proof of work you have completed — earned, not given.</p>

      {certificates.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
          <CertificateIcon className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-4 font-serif text-xl">No certificates yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Complete every lecture and pass a course quiz to earn your first certificate.
          </p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Go to my learning
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <Link
              key={certificate.id}
              href={`/certificates/${certificate.certificateId}`}
              className="group rounded-lg border border-line bg-surface p-6 transition hover:border-accent/50"
            >
              <CertificateIcon className="h-8 w-8 text-accent" />
              <p className="mt-4 font-serif text-xl group-hover:text-accent-deep">{certificate.courseTitle}</p>
              <p className="mt-1 font-mono text-xs text-olive">{certificate.certificateId}</p>
              <p className="mt-4 text-xs text-muted">
                Issued {new Date(certificate.issuedAt).toLocaleDateString()} · Score {certificate.finalScore}%
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
