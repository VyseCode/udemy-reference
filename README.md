# Lumen — Udemy-style learning platform (reference implementation)

A reference implementation inspired by **Udemy**: a focused learning platform where instructors publish courses and learners enroll, track progress, take quizzes, leave reviews and earn verifiable certificates.

> This project is an original implementation for demonstration purposes. It is not affiliated with Udemy and uses no Udemy assets or branding.

## Features

- **Roles** — student and instructor accounts with server-side authorization on every mutation.
- **Courses** — create, edit, publish/unpublish and delete courses with title, description, category, price, thumbnail and rich curriculum.
- **Curriculum** — ordered sections and lectures with duration, preview flag and a placeholder video URL; reorder sections and lectures.
- **Enrollment** — simulated free and paid checkout, duplicate-enrollment protection, per-course student list for instructors.
- **Progress** — mark lectures complete/incomplete and see a live percentage per course.
- **Quizzes** — instructor-authored questions, hidden correct answers for learners, scored attempts with a 70% pass mark.
- **Reviews** — one review per enrolled learner, aggregate rating on every course.
- **Certificates** — issued only after every lecture is complete and the quiz is passed; unique verifiable code.
- **Discovery** — search, category filtering, sorting (newest, price, rating, popularity) and bounded pagination.
- **Dashboards** — instructor revenue/students/ratings and student learning overview.
- **UI** — an original editorial identity (warm paper, ink and persimmon, serif display type, inline SVG icon set), responsive from mobile to desktop, with deliberate empty, loading and error states.

## Stack

Next.js 16.4.6 (App Router, Turbopack), React 19, Tailwind CSS 4, TypeScript, MongoDB + Mongoose, bcryptjs, `jose` JWT in an HTTP-only cookie, and zod validation.

## Setup

```bash
npm install
cp .env.example .env.local       # then edit values if needed
npm run seed                     # creates indexes and wipes ONLY udemy_ref
npm run dev                      # development server
```

Local deploy (production build):

```bash
npm run build && npm start -- -p 3228
```

Open http://localhost:3228. All checks are available via `npm run lint`, `npm run typecheck` and `npm run seed`.

## Environment variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/udemy_ref` | MongoDB connection. Seed refuses to wipe any database other than `udemy_ref`. |
| `JWT_SECRET` | long random string | Signs the session JWT stored in the HTTP-only cookie. |

`.env.example` is committed; `.env.local` is ignored.

## Seed data

`npm run seed` is idempotent: it drops only `udemy_ref`, creates indexes, and inserts realistic data.

Expected counts: 7 users, 5 courses, 8 sections, 16 lectures, 7 enrollments, 11 progress records, 5 quizzes, 3 quiz attempts, 4 reviews, 1 certificate.

## Demo accounts

All demo passwords are **`password123`**.

| Role | Email |
| --- | --- |
| Instructor | `maya.chen@example.com` |
| Instructor | `daniel.okafor@example.com` |
| Student | `priya.nair@example.com` |
| Student | `tomas.rivera@example.com` |
| Student | `aisha.bello@example.com` |
| Student | `lucas.meyer@example.com` |
| Student | `sofia.rossi@example.com` |

Registered accounts default to `student`; registration accepts `role: "instructor"` for teaching accounts.

## API

All endpoints are JSON under `/api`. Auth uses an HTTP-only cookie set by `login`/`register`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create account (`name`, `email`, `password`, optional `role`) |
| POST | `/api/auth/login` | public | Sign in |
| POST | `/api/auth/logout` | signed in | Clear session |
| GET | `/api/auth/me` | public | Current user or `null` |
| GET | `/api/courses` | public | Search/filter/sort/paginate published courses |
| POST | `/api/courses` | instructor | Create course |
| GET | `/api/courses/[id]` | public | Course detail (draft only for owner/enrolled) |
| PATCH | `/api/courses/[id]` | owner | Update course |
| DELETE | `/api/courses/[id]` | owner | Delete course and related records |
| GET | `/api/courses/[id]/enrollments` | owner | Students enrolled in a course |
| POST | `/api/courses/[id]/enroll` | student | Enroll (simulated checkout) |
| GET | `/api/courses/[id]/progress` | enrolled | Progress summary |
| POST | `/api/courses/[id]/sections` | owner | Add section |
| POST | `/api/courses/[id]/sections/reorder` | owner | Reorder sections |
| PATCH / DELETE | `/api/sections/[id]` | owner | Edit/delete section |
| POST | `/api/sections/[id]/lectures` | owner | Add lecture |
| POST | `/api/sections/[id]/lectures/reorder` | owner | Reorder lectures |
| PATCH / DELETE | `/api/lectures/[id]` | owner | Edit/delete lecture |
| PUT | `/api/lectures/[id]/progress` | enrolled | Mark lecture complete/incomplete |
| GET / PUT | `/api/courses/[id]/quiz` | enrolled / owner | Quiz questions (answers hidden for learners) / save quiz |
| POST | `/api/courses/[id]/quiz/attempt` | enrolled | Submit answers, get score and pass status |
| GET / POST | `/api/courses/[id]/reviews` | public / enrolled | List reviews / add review |
| GET / POST | `/api/courses/[id]/certificate` | enrolled | Eligibility / issue certificate |
| GET | `/api/certificates/[code]` | recipient or course instructor | Verify certificate |
| GET | `/api/enrollments` | student | My enrollments |

## Pages

`/` · `/login` · `/register` · `/browse` · `/courses/[id]` · `/courses/[id]/learn` · `/dashboard` · `/certificates` · `/certificates/[code]` · `/teach` · `/teach/courses/new` · `/teach/courses/[id]`

Protected pages redirect anonymous visitors to `/login`; unpublished courses return 404 for unauthorized viewers.

## Simulation boundary

**No real external service is contacted.** The following are deliberately simulated behind swappable interfaces, and all app logic, permissions and workflows around them are genuine:

1. **Video media** — `lib/media.ts` defines `MediaAdapter`. `localPlaceholderMedia` simply returns a validated `https://` placeholder URL stored on each lecture; nothing is uploaded or streamed. **Swap path:** implement `MediaAdapter.resolveVideoUrl()` with your storage provider (e.g. S3/GCS signed URLs or a streaming API) and export it as `media`. Lecture models, APIs and the player UI depend only on the interface.
2. **Payments** — `lib/payments.ts` defines `PaymentAdapter`. `localSimulatedPayments.charge()` performs no network call and returns a local receipt reference. **Swap path:** implement `charge()` with Stripe (or another PSP), store the returned reference on the enrollment, and keep the zod validation at the boundary. No card data is collected anywhere in this app.
3. **Email / notifications** — not implemented; certificate issuance is immediate and visible in-app.

## Known limitations

- Video playback shows a labeled placeholder rather than real media.
- Payment receipts are local strings; there is no refund, invoice or tax flow.
- Search uses escaped regex matching rather than a dedicated search index; adequate for the reference dataset.
- Rating-based sorting ranks the bounded published catalog in memory; other sorts use indexed MongoDB queries.
- Authentication is cookie/JWT based without password reset, email verification or rate limiting.
- No real deployment infrastructure is configured; `npm run build && npm start` is the supported local production path.
