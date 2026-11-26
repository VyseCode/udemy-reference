import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/udemy_ref";

const video = (slug) => `https://media.lumen.example/placeholder/${slug}.mp4`;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "instructor"], default: "student" },
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

const courseSchema = new mongoose.Schema(
  {
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    enrollmentCount: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true },
);
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ status: 1, price: 1 });
courseSchema.index({ status: 1, enrollmentCount: -1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructor: 1, updatedAt: -1 });
courseSchema.index({ title: "text", description: "text", category: "text" });

const sectionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true },
);
sectionSchema.index({ course: 1, order: 1 });

const lectureSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    duration: { type: Number, default: 0 },
    videoUrl: { type: String, default: "" },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true },
);
lectureSchema.index({ section: 1, order: 1 });
lectureSchema.index({ course: 1, order: 1 });

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    pricePaid: { type: Number, default: 0 },
    status: { type: String, enum: ["active"], default: "active" },
  },
  { timestamps: true },
);
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, createdAt: -1 });

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
progressSchema.index({ user: 1, lecture: 1 }, { unique: true });
progressSchema.index({ user: 1, course: 1 });

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: true },
);
const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, unique: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true },
);

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    answers: {
      type: [
        new mongoose.Schema(
          { questionId: mongoose.Schema.Types.ObjectId, selectedIndex: Number },
          { _id: false },
        ),
      ],
      default: [],
    },
    correctCount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
  },
  { timestamps: true },
);
attemptSchema.index({ user: 1, course: 1, createdAt: -1 });

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, createdAt: -1 });

const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    certificateId: { type: String, required: true, unique: true },
    finalScore: { type: Number, default: 0 },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
certificateSchema.index({ user: 1, course: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Course = mongoose.model("Course", courseSchema);
const Section = mongoose.model("Section", sectionSchema);
const Lecture = mongoose.model("Lecture", lectureSchema);
const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
const Progress = mongoose.model("Progress", progressSchema);
const Quiz = mongoose.model("Quiz", quizSchema);
const QuizAttempt = mongoose.model("QuizAttempt", attemptSchema);
const Review = mongoose.model("Review", reviewSchema);
const Certificate = mongoose.model("Certificate", certificateSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  if (mongoose.connection.name !== "udemy_ref") {
    throw new Error(`Refusing to wipe unexpected database: ${mongoose.connection.name}`);
  }
  await mongoose.connection.dropDatabase();
  await Promise.all(
    [
      User,
      Course,
      Section,
      Lecture,
      Enrollment,
      Progress,
      Quiz,
      QuizAttempt,
      Review,
      Certificate,
    ].map((model) => model.createIndexes()),
  );

  const hash = await bcrypt.hash("password123", 10);

  const [maya, daniel, priya, tomas, aisha, lucas, sofia] = await User.create([
    {
      name: "Maya Chen",
      email: "maya.chen@example.com",
      password: hash,
      role: "instructor",
      headline: "Frontend educator · 12 years shipping products",
      bio: "Maya teaches practical frontend engineering with a focus on TypeScript and maintainable systems.",
    },
    {
      name: "Daniel Okafor",
      email: "daniel.okafor@example.com",
      password: hash,
      role: "instructor",
      headline: "Systems engineer turned teacher",
      bio: "Daniel makes computer science fundamentals feel approachable through real-world examples.",
    },
    {
      name: "Priya Nair",
      email: "priya.nair@example.com",
      password: hash,
      role: "student",
      headline: "Product engineer",
    },
    {
      name: "Tomás Rivera",
      email: "tomas.rivera@example.com",
      password: hash,
      role: "student",
      headline: "Designer",
    },
    {
      name: "Aisha Bello",
      email: "aisha.bello@example.com",
      password: hash,
      role: "student",
      headline: "Junior developer",
    },
    {
      name: "Lucas Meyer",
      email: "lucas.meyer@example.com",
      password: hash,
      role: "student",
      headline: "Computer science student",
    },
    {
      name: "Sofia Rossi",
      email: "sofia.rossi@example.com",
      password: hash,
      role: "student",
      headline: "Data analyst",
    },
  ]);

  const [react, ds, design, sql, product] = await Course.create([
    {
      instructor: maya._id,
      title: "Modern React with TypeScript",
      description:
        "Build maintainable React applications with a type-safe, component-first workflow. From props and composition to effects you can reason about.",
      category: "Web Development",
      price: 49.99,
      thumbnail: "",
      status: "published",
    },
    {
      instructor: daniel._id,
      title: "Data Structures in Practice",
      description:
        "A rigorous, free course on the structures behind efficient software, with an emphasis on trade-offs you will actually face.",
      category: "Computer Science",
      price: 0,
      thumbnail: "",
      status: "published",
    },
    {
      instructor: maya._id,
      title: "Design Systems from Scratch",
      description:
        "Turn a loose collection of styles into a documented, scalable design system that teams can adopt with confidence.",
      category: "Design",
      price: 79,
      thumbnail: "",
      status: "published",
    },
    {
      instructor: daniel._id,
      title: "SQL for Analysts",
      description:
        "The mental model and query patterns analysts need to answer real business questions with SQL.",
      category: "Data",
      price: 29.99,
      thumbnail: "",
      status: "draft",
    },
    {
      instructor: daniel._id,
      title: "The Product Mindset",
      description:
        "Learn to discover what users actually need and turn findings into focused product decisions.",
      category: "Business",
      price: 39.99,
      thumbnail: "",
      status: "published",
    },
  ]);

  const [reactBasics, reactState, dsLinear, dsTrees, designTokens, designComp, sqlBasics, productDiscovery] =
    await Section.create([
      { course: react._id, title: "Foundations", order: 0 },
      { course: react._id, title: "State and Effects", order: 1 },
      { course: ds._id, title: "Linear structures", order: 0 },
      { course: ds._id, title: "Trees and graphs", order: 1 },
      { course: design._id, title: "Tokens and foundations", order: 0 },
      { course: design._id, title: "Components and governance", order: 1 },
      { course: sql._id, title: "Query basics", order: 0 },
      { course: product._id, title: "Discovery", order: 0 },
    ]);

  const [r1, r2, r3] = await Lecture.create([
    {
      course: react._id, section: reactBasics._id, order: 0,
      title: "Why React still matters in 2026", duration: 9, isPreview: true,
      videoUrl: video("react-why"), description: "The ideas behind the component model.",
    },
    {
      course: react._id, section: reactBasics._id, order: 1,
      title: "Setting up a type-safe workspace", duration: 14, isPreview: false,
      videoUrl: video("react-setup"), description: "Project structure and compiler settings.",
    },
    {
      course: react._id, section: reactBasics._id, order: 2,
      title: "Components, props and composition", duration: 22, isPreview: false,
      videoUrl: video("react-props"), description: "Build interfaces from small, clear pieces.",
    },
  ]);
  await Lecture.create([
    {
      course: react._id, section: reactState._id, order: 0,
      title: "Managing local state", duration: 18, isPreview: false,
      videoUrl: video("react-state"), description: "Choosing the right state shape.",
    },
    {
      course: react._id, section: reactState._id, order: 1,
      title: "Effects without the footguns", duration: 26, isPreview: false,
      videoUrl: video("react-effects"), description: "When and when not to reach for an effect.",
    },
    {
      course: react._id, section: reactState._id, order: 2,
      title: "Building a reusable data hook", duration: 20, isPreview: false,
      videoUrl: video("react-hook"), description: "Encapsulate fetching and loading states.",
    },
  ]);

  const [d1, d2, d3, d4] = await Lecture.create([
    {
      course: ds._id, section: dsLinear._id, order: 0,
      title: "Arrays and the cost of insertion", duration: 12, isPreview: true,
      videoUrl: video("ds-arrays"), description: "Why contiguous memory is usually your friend.",
    },
    {
      course: ds._id, section: dsLinear._id, order: 1,
      title: "Linked lists you can actually use", duration: 17, isPreview: false,
      videoUrl: video("ds-lists"), description: "Trade-offs and practical use cases.",
    },
    {
      course: ds._id, section: dsTrees._id, order: 0,
      title: "Binary search trees", duration: 24, isPreview: false,
      videoUrl: video("ds-bst"), description: "Balancing, insertion and lookup.",
    },
    {
      course: ds._id, section: dsTrees._id, order: 1,
      title: "Graph traversal in the wild", duration: 28, isPreview: false,
      videoUrl: video("ds-graphs"), description: "BFS, DFS and choosing between them.",
    },
  ]);

  const [g1, g2] = await Lecture.create([
    {
      course: design._id, section: designTokens._id, order: 0,
      title: "Colour that scales", duration: 16, isPreview: true,
      videoUrl: video("design-colour"), description: "Semantic tokens and accessible contrast.",
    },
    {
      course: design._id, section: designTokens._id, order: 1,
      title: "Type and rhythm", duration: 19, isPreview: false,
      videoUrl: video("design-type"), description: "A type scale that survives real content.",
    },
  ]);
  await Lecture.create([
    {
      course: design._id, section: designComp._id, order: 0,
      title: "A button is not just a button", duration: 25, isPreview: false,
      videoUrl: video("design-button"), description: "States, variants and API design.",
    },
    {
      course: design._id, section: designComp._id, order: 1,
      title: "Documenting decisions", duration: 15, isPreview: false,
      videoUrl: video("design-docs"), description: "Make the why discoverable.",
    },
  ]);

  await Lecture.create({
    course: sql._id, section: sqlBasics._id, order: 0,
    title: "SELECT, WHERE and the mental model", duration: 13, isPreview: false,
    videoUrl: video("sql-select"), description: "How to think in sets, not loops.",
  });
  const p1 = await Lecture.create({
    course: product._id, section: productDiscovery._id, order: 0,
    title: "Talking to users without leading them", duration: 21, isPreview: true,
    videoUrl: video("product-interviews"), description: "Better questions, better evidence.",
  });

  await Quiz.create([
    {
      course: react._id,
      questions: [
        {
          prompt: "Which hook lets a component keep state between renders?",
          options: ["useMemo", "useState", "useRef", "useId"],
          correctIndex: 1,
          explanation: "useState stores local state that persists across renders.",
        },
        {
          prompt: "What should be the dependency array for an effect that reads a prop?",
          options: ["Always empty", "The prop it reads", "Every render value", "Never one"],
          correctIndex: 1,
          explanation: "List values the effect reads so it re-runs when they change.",
        },
        {
          prompt: "In TypeScript, what does `PropsWithChildren` add?",
          options: ["A children prop", "A key prop", "A ref prop", "State typing"],
          correctIndex: 0,
          explanation: "It augments your props type with the children prop.",
        },
      ],
    },
    {
      course: ds._id,
      questions: [
        {
          prompt: "What is the average time to append to a dynamic array?",
          options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
          correctIndex: 2,
          explanation: "Amortised append is constant time thanks to geometric growth.",
        },
        {
          prompt: "Which traversal uses a queue?",
          options: ["DFS", "BFS", "In-order", "Post-order"],
          correctIndex: 1,
          explanation: "Breadth-first search expands nodes FIFO via a queue.",
        },
        {
          prompt: "A binary search tree lookup is efficient when the tree is…",
          options: ["Balanced", "Sorted but skewed", "Empty", "Complete but deep"],
          correctIndex: 0,
          explanation: "Height determines lookup cost, so balance matters.",
        },
      ],
    },
    {
      course: design._id,
      questions: [
        {
          prompt: "What makes a colour token semantic?",
          options: ["It uses a hex value", "It names intent, not a hue", "It is always dark", "It is generated"],
          correctIndex: 1,
          explanation: "Semantic tokens describe purpose, so themes can remap them.",
        },
        {
          prompt: "Why document component decisions?",
          options: ["To slow teams down", "To make the why discoverable", "To replace tests", "To avoid design review"],
          correctIndex: 1,
          explanation: "Documentation preserves rationale and prevents drift.",
        },
      ],
    },
    {
      course: sql._id,
      questions: [
        {
          prompt: "Which clause filters rows before aggregation?",
          options: ["HAVING", "WHERE", "ORDER BY", "LIMIT"],
          correctIndex: 1,
          explanation: "WHERE filters rows; HAVING filters groups.",
        },
        {
          prompt: "SQL results are best thought of as…",
          options: ["Arrays", "Sets of rows", "Objects", "Streams of bytes"],
          correctIndex: 1,
          explanation: "Set-based thinking leads to clearer queries.",
        },
      ],
    },
    {
      course: product._id,
      questions: [
        {
          prompt: "A good discovery interview question is…",
          options: ["Would you use this feature?", "Tell me about the last time you did X", "Do you like our idea?", "How much would you pay?"],
          correctIndex: 1,
          explanation: "Past behaviour is stronger evidence than hypothetical answers.",
        },
        {
          prompt: "The goal of discovery is to…",
          options: ["Ship faster", "Reduce uncertainty", "Write specs", "Beat competitors"],
          correctIndex: 1,
          explanation: "Discovery reduces uncertainty about what to build.",
        },
      ],
    },
  ]);

  await Enrollment.create([
      { user: priya._id, course: react._id, pricePaid: 49.99 },
      { user: priya._id, course: ds._id, pricePaid: 0 },
      { user: tomas._id, course: design._id, pricePaid: 79 },
      { user: tomas._id, course: product._id, pricePaid: 39.99 },
      { user: aisha._id, course: react._id, pricePaid: 49.99 },
      { user: lucas._id, course: ds._id, pricePaid: 0 },
      { user: sofia._id, course: product._id, pricePaid: 39.99 },
    ]);

  for (const course of [react, ds, design, sql, product]) {
    const count = await Enrollment.countDocuments({ course: course._id });
    await Course.updateOne({ _id: course._id }, { $set: { enrollmentCount: count } });
  }

  const now = new Date();
  await Progress.create(
    [r1, r2, r3].map((lecture) => ({
      user: priya._id, course: react._id, lecture: lecture._id,
      completed: true, completedAt: now,
    })),
  );
  await Progress.create(
    [d1, d2, d3, d4].map((lecture) => ({
      user: priya._id, course: ds._id, lecture: lecture._id,
      completed: true, completedAt: now,
    })),
  );
  await Progress.create(
    [g1, g2].map((lecture) => ({
      user: tomas._id, course: design._id, lecture: lecture._id,
      completed: true, completedAt: now,
    })),
  );
  await Progress.create({
    user: lucas._id, course: ds._id, lecture: d1._id,
    completed: true, completedAt: now,
  });
  await Progress.create({
    user: sofia._id, course: product._id, lecture: p1._id,
    completed: true, completedAt: now,
  });

  const dsQuiz = await Quiz.findOne({ course: ds._id }).lean();
  const designQuiz = await Quiz.findOne({ course: design._id }).lean();
  const productQuiz = await Quiz.findOne({ course: product._id }).lean();

  await QuizAttempt.create([
    {
      user: priya._id, course: ds._id,
      answers: dsQuiz.questions.map((question) => ({
        questionId: question._id, selectedIndex: question.correctIndex,
      })),
      correctCount: 3, total: 3, score: 100, passed: true,
    },
    {
      user: tomas._id, course: design._id,
      answers: designQuiz.questions.map((question) => ({
        questionId: question._id, selectedIndex: 0,
      })),
      correctCount: 0, total: 2, score: 0, passed: false,
    },
    {
      user: sofia._id, course: product._id,
      answers: productQuiz.questions.map((question) => ({
        questionId: question._id, selectedIndex: question.correctIndex,
      })),
      correctCount: 2, total: 2, score: 100, passed: true,
    },
  ]);

  await Review.create([
    {
      user: priya._id, course: react._id, rating: 5,
      comment: "The TypeScript sections alone were worth the price. Clear, practical, and never hand-wavy.",
    },
    {
      user: aisha._id, course: react._id, rating: 4,
      comment: "Well paced and easy to follow. I built a small app alongside it.",
    },
    {
      user: tomas._id, course: design._id, rating: 5,
      comment: "Finally a course that treats tokens as a system instead of a colour palette.",
    },
    {
      user: lucas._id, course: ds._id, rating: 5,
      comment: "Free and rigorous. The graph traversal lesson clarified BFS for me.",
    },
  ]);

  await Certificate.create({
    user: priya._id, course: ds._id,
    certificateId: "LMN-DS-2024-001", finalScore: 100,
  });

  const counts = {
    users: await User.countDocuments(),
    courses: await Course.countDocuments(),
    sections: await Section.countDocuments(),
    lectures: await Lecture.countDocuments(),
    enrollments: await Enrollment.countDocuments(),
    progress: await Progress.countDocuments(),
    quizzes: await Quiz.countDocuments(),
    quizAttempts: await QuizAttempt.countDocuments(),
    reviews: await Review.countDocuments(),
    certificates: await Certificate.countDocuments(),
  };

  console.log("Seeded udemy_ref (all demo passwords: password123)");
  console.log(JSON.stringify(counts, null, 2));

  const expected = {
    users: 7, courses: 5, sections: 8, lectures: 16, enrollments: 7,
    progress: 11, quizzes: 5, quizAttempts: 3, reviews: 4, certificates: 1,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (counts[key] !== value) {
      throw new Error(`Seed mismatch for ${key}: got ${counts[key]}, expected ${value}`);
    }
  }
  console.log("All expected counts verified.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
