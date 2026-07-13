// ─── CampusIQ Mock Data ───
// All mock datasets used by the API layer during development.
// Structured to mirror real FastAPI response shapes.

export const MOCK_DELAY = 600; // ms — simulates network latency

// ─── Users ───
export const mockUsers = [
  {
    id: 'stu-001',
    name: 'Aarav Sharma',
    email: 'aarav@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Computer Science & Engineering',
    year: 3,
    batch: '2023-2027',
    memberSince: '2024-08-15',
    notifications: {
      weeklySchedule: true,
      riskAlerts: false,
      suggestedQuestions: true,
    },
  },
  {
    id: 'stu-002',
    name: 'Priya Patel',
    email: 'priya@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Computer Science & Engineering',
    year: 3,
    batch: '2023-2027',
    memberSince: '2024-08-15',
    notifications: {
      weeklySchedule: true,
      riskAlerts: true,
      suggestedQuestions: true,
    },
  },
  {
    id: 'stu-003',
    name: 'Rohan Mehta',
    email: 'rohan@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Information Technology',
    year: 2,
    batch: '2024-2028',
    memberSince: '2025-01-10',
    notifications: {
      weeklySchedule: true,
      riskAlerts: false,
      suggestedQuestions: false,
    },
  },
  {
    id: 'stu-004',
    name: 'Ananya Gupta',
    email: 'ananya@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Computer Science & Engineering',
    year: 4,
    batch: '2022-2026',
    memberSince: '2023-07-20',
    notifications: {
      weeklySchedule: true,
      riskAlerts: true,
      suggestedQuestions: true,
    },
  },
  {
    id: 'stu-005',
    name: 'Vikram Singh',
    email: 'vikram@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Electronics & Communication',
    year: 3,
    batch: '2023-2027',
    memberSince: '2024-08-15',
    notifications: {
      weeklySchedule: false,
      riskAlerts: true,
      suggestedQuestions: true,
    },
  },
  {
    id: 'stu-006',
    name: 'Sneha Reddy',
    email: 'sneha@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Computer Science & Engineering',
    year: 2,
    batch: '2024-2028',
    memberSince: '2025-01-10',
    notifications: {
      weeklySchedule: true,
      riskAlerts: false,
      suggestedQuestions: true,
    },
  },
  {
    id: 'stu-007',
    name: 'Arjun Nair',
    email: 'arjun@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Information Technology',
    year: 3,
    batch: '2023-2027',
    memberSince: '2024-08-15',
    notifications: {
      weeklySchedule: true,
      riskAlerts: true,
      suggestedQuestions: false,
    },
  },
  {
    id: 'stu-008',
    name: 'Kavya Iyer',
    email: 'kavya@campusiq.dev',
    password: 'password123',
    role: 'student',
    avatar: null,
    branch: 'Computer Science & Engineering',
    year: 4,
    batch: '2022-2026',
    memberSince: '2023-07-20',
    notifications: {
      weeklySchedule: true,
      riskAlerts: false,
      suggestedQuestions: true,
    },
  },
  {
    id: 'men-001',
    name: 'Dr. Rajesh Kumar',
    email: 'mentor@campusiq.dev',
    password: 'password123',
    role: 'mentor',
    avatar: null,
    department: 'CSE Batch 2023-2027',
    memberSince: '2023-06-01',
    notifications: {
      riskFlagAlerts: true,
      weeklyReports: true,
      interventionReminders: true,
    },
  },
];

// ─── Resume Scores ───
export const mockResumeScores = {
  'stu-001': {
    current: {
      score: 74,
      missing_keywords: ['Docker', 'CI/CD', 'GraphQL', 'AWS'],
      suggestions: [
        'Quantify impact in bullet 2 — use numbers like "improved performance by 30%"',
        'Add a dedicated Projects section with 2-3 major projects',
        'Include relevant certifications (AWS, GCP, etc.)',
        'Add links to GitHub profile and live project demos',
      ],
      strengths: ['Strong technical skills section', 'Good education formatting', 'Relevant coursework listed'],
    },
    history: [
      { date: '2025-01-15', score: 52 },
      { date: '2025-03-10', score: 61 },
      { date: '2025-05-22', score: 68 },
      { date: '2025-07-01', score: 74 },
    ],
  },
  'stu-002': {
    current: {
      score: 82,
      missing_keywords: ['Kubernetes', 'TypeScript'],
      suggestions: [
        'Add more measurable outcomes to project descriptions',
        'Consider adding a summary/objective at the top',
      ],
      strengths: ['Excellent project descriptions', 'Clean formatting', 'Strong skills match'],
    },
    history: [
      { date: '2025-02-01', score: 65 },
      { date: '2025-04-15', score: 74 },
      { date: '2025-06-20', score: 82 },
    ],
  },
  'stu-003': {
    current: {
      score: 45,
      missing_keywords: ['React', 'Node.js', 'SQL', 'Git', 'REST APIs'],
      suggestions: [
        'Your resume needs more technical projects — add at least 2 coding projects',
        'Include internship or freelance experience if available',
        'Add a skills section organized by category',
        'Remove generic soft skills and focus on technical competencies',
      ],
      strengths: ['Clean layout', 'Good academic scores mentioned'],
    },
    history: [
      { date: '2025-06-01', score: 38 },
      { date: '2025-07-01', score: 45 },
    ],
  },
};

// ─── Risk Predictions ───
export const mockRiskData = {
  'stu-001': { risk: 'medium', score: 0.45, readiness: 72, topFactor: 'Low attendance in DBMS (68%)', factors: ['Low DBMS attendance', 'Missing 2 assignments', 'Average lab scores'] },
  'stu-002': { risk: 'low',    score: 0.15, readiness: 88, topFactor: 'Strong across all metrics', factors: ['Consistent high performance'] },
  'stu-003': { risk: 'high',   score: 0.78, readiness: 35, topFactor: 'Failed 2 mid-semester exams', factors: ['2 mid-sem failures', 'Very low project submissions', 'Poor attendance (52%)'] },
  'stu-004': { risk: 'low',    score: 0.22, readiness: 85, topFactor: 'Slight dip in elective performance', factors: ['Minor elective grade drop'] },
  'stu-005': { risk: 'high',   score: 0.82, readiness: 28, topFactor: 'Missing 5 lab submissions', factors: ['5 missing lab subs', 'No internship', 'Low resume score'] },
  'stu-006': { risk: 'medium', score: 0.52, readiness: 58, topFactor: 'Needs stronger project portfolio', factors: ['Weak project portfolio', 'Average grades'] },
  'stu-007': { risk: 'low',    score: 0.18, readiness: 82, topFactor: 'Consistent performance', factors: ['Strong overall'] },
  'stu-008': { risk: 'medium', score: 0.48, readiness: 65, topFactor: 'Declining attendance trend', factors: ['Attendance dropping', 'Late submissions increasing'] },
};

// ─── Cohort Risk Distribution (for Recharts) ───
export const mockRiskDistribution = [
  { level: 'Low Risk',    count: 12, fill: '#22c55e' },
  { level: 'Medium Risk', count: 8,  fill: '#f59e0b' },
  { level: 'High Risk',   count: 4,  fill: '#ef4444' },
];

// ─── Chat History ───
export const mockChatHistory = [
  {
    id: 'msg-001',
    role: 'user',
    content: 'Explain the concept of normalization in databases',
    timestamp: '2025-07-12T10:30:00Z',
  },
  {
    id: 'msg-002',
    role: 'assistant',
    content: `**Database Normalization** is the process of organizing a relational database to reduce data redundancy and improve data integrity.\n\nThere are several normal forms:\n\n1. **1NF (First Normal Form):** Each column contains atomic (indivisible) values, and each record is unique.\n2. **2NF (Second Normal Form):** Meets 1NF and all non-key attributes are fully dependent on the primary key.\n3. **3NF (Third Normal Form):** Meets 2NF and no transitive dependencies exist.\n4. **BCNF (Boyce-Codd Normal Form):** A stricter version of 3NF where every determinant is a candidate key.\n\nNormalization helps prevent **update anomalies**, **insertion anomalies**, and **deletion anomalies**.`,
    source: {
      document: 'DBMS_Notes_Unit3.pdf',
      snippet: 'Normalization is a technique for organizing data in a database. It includes creating tables and establishing relationships between them according to rules...',
      page: 42,
    },
    feedback: null,
    timestamp: '2025-07-12T10:30:02Z',
  },
  {
    id: 'msg-003',
    role: 'user',
    content: 'What is the difference between 2NF and 3NF?',
    timestamp: '2025-07-12T10:32:00Z',
  },
  {
    id: 'msg-004',
    role: 'assistant',
    content: `Great question! Here's the key difference:\n\n**2NF** eliminates **partial dependencies** — where a non-key attribute depends on only part of a composite primary key.\n\n**3NF** eliminates **transitive dependencies** — where a non-key attribute depends on another non-key attribute.\n\n**Example:**\nIf you have a table with (StudentID, CourseID, CourseName, InstructorName):\n- **2NF violation:** CourseName depends only on CourseID, not the full key (StudentID, CourseID)\n- **3NF violation:** If InstructorName depends on CourseName (not directly on the key), that's a transitive dependency\n\nIn practice, most well-designed databases aim for at least 3NF.`,
    source: {
      document: 'DBMS_Notes_Unit3.pdf',
      snippet: 'Second Normal Form requires that all non-key attributes be fully functionally dependent on the primary key. Third Normal Form additionally requires...',
      page: 45,
    },
    feedback: 'up',
    timestamp: '2025-07-12T10:32:03Z',
  },
];

export const mockDocuments = [
  { id: 'doc-001', name: 'DBMS_Notes_Unit3.pdf', size: '2.4 MB', uploadedAt: '2025-07-10', pages: 68 },
  { id: 'doc-002', name: 'OS_Process_Scheduling.pdf', size: '1.8 MB', uploadedAt: '2025-07-08', pages: 42 },
  { id: 'doc-003', name: 'CN_TCP_IP_Model.pdf', size: '3.1 MB', uploadedAt: '2025-07-05', pages: 55 },
];

export const mockSuggestedQuestions = [
  'What are ACID properties in DBMS?',
  'Explain process scheduling algorithms',
  'Compare TCP and UDP protocols',
  'What is deadlock and how to prevent it?',
];

// ─── Canned AI Responses (for simulating RAG) ───
export const mockAIResponses = [
  {
    content: `**ACID Properties** are a set of properties that guarantee reliable processing of database transactions:\n\n1. **Atomicity:** A transaction is all-or-nothing. If any part fails, the entire transaction is rolled back.\n2. **Consistency:** A transaction brings the database from one valid state to another, maintaining all defined rules.\n3. **Isolation:** Concurrent transactions don't interfere with each other — each appears to execute in isolation.\n4. **Durability:** Once a transaction is committed, it remains so, even in case of system failure.\n\nThese properties are fundamental to maintaining data integrity in any relational database system.`,
    source: {
      document: 'DBMS_Notes_Unit3.pdf',
      snippet: 'ACID properties ensure that database transactions are processed reliably. Atomicity ensures that each transaction is treated as a single unit...',
      page: 28,
    },
  },
  {
    content: `**Process Scheduling Algorithms** determine which process runs on the CPU at any given time:\n\n1. **FCFS (First Come First Serve):** Simple queue — processes execute in arrival order. Can cause convoy effect.\n2. **SJF (Shortest Job First):** Picks the process with smallest burst time. Optimal for average waiting time but requires knowing burst times in advance.\n3. **Round Robin:** Each process gets a fixed time quantum. Fair but can have high context-switching overhead.\n4. **Priority Scheduling:** Processes assigned priorities; higher priority runs first. Risk of starvation for low-priority processes.\n5. **Multilevel Queue:** Multiple queues with different scheduling algorithms for different process types.\n\nThe choice of algorithm depends on system goals: throughput, response time, fairness, or CPU utilization.`,
    source: {
      document: 'OS_Process_Scheduling.pdf',
      snippet: 'CPU scheduling algorithms are used to manage the order in which processes are executed. The main algorithms include FCFS, SJF, Round Robin...',
      page: 15,
    },
  },
  {
    content: `**TCP vs UDP — Key Differences:**\n\n| Feature | TCP | UDP |\n|---------|-----|-----|\n| Connection | Connection-oriented | Connectionless |\n| Reliability | Guaranteed delivery | Best-effort delivery |\n| Ordering | Maintains order | No ordering guarantee |\n| Speed | Slower (overhead) | Faster (minimal overhead) |\n| Use Cases | Web browsing, email, file transfer | Streaming, gaming, DNS |\n\n**TCP** uses a 3-way handshake (SYN → SYN-ACK → ACK) and provides flow control and congestion control.\n\n**UDP** sends datagrams without establishing a connection, making it ideal for real-time applications where speed matters more than reliability.`,
    source: {
      document: 'CN_TCP_IP_Model.pdf',
      snippet: 'TCP provides reliable, ordered, and error-checked delivery of data between applications. UDP, on the other hand, uses a simpler connectionless model...',
      page: 33,
    },
  },
];

// ─── Weekly Schedule ───
export const mockSchedule = [
  { id: 'sch-001', day: 'Monday',    startTime: '09:00', endTime: '10:30', subject: 'Database Management Systems', reason: 'weak subject',       color: '#fbbf24' },
  { id: 'sch-002', day: 'Monday',    startTime: '11:00', endTime: '12:00', subject: 'Operating Systems',           reason: 'revision due',       color: '#60a5fa' },
  { id: 'sch-003', day: 'Monday',    startTime: '14:00', endTime: '15:30', subject: 'Computer Networks Lab',       reason: 'lab practice',       color: '#34d399' },
  { id: 'sch-004', day: 'Tuesday',   startTime: '09:00', endTime: '10:00', subject: 'Data Structures',             reason: 'strong — maintain',  color: '#34d399' },
  { id: 'sch-005', day: 'Tuesday',   startTime: '10:30', endTime: '12:00', subject: 'DBMS Practice Problems',      reason: 'weak subject',       color: '#fbbf24' },
  { id: 'sch-006', day: 'Tuesday',   startTime: '14:00', endTime: '15:00', subject: 'Resume Building Workshop',    reason: 'placement prep',     color: '#a78bfa' },
  { id: 'sch-007', day: 'Wednesday', startTime: '09:00', endTime: '10:30', subject: 'Computer Networks',           reason: 'deadline in 2 days', color: '#f87171' },
  { id: 'sch-008', day: 'Wednesday', startTime: '11:00', endTime: '12:30', subject: 'Operating Systems',           reason: 'revision due',       color: '#60a5fa' },
  { id: 'sch-009', day: 'Wednesday', startTime: '14:00', endTime: '15:00', subject: 'Soft Skills / Communication', reason: 'placement prep',     color: '#a78bfa' },
  { id: 'sch-010', day: 'Thursday',  startTime: '09:00', endTime: '10:30', subject: 'DBMS',                        reason: 'weak subject',       color: '#fbbf24' },
  { id: 'sch-011', day: 'Thursday',  startTime: '11:00', endTime: '12:00', subject: 'Data Structures Practice',    reason: 'strong — maintain',  color: '#34d399' },
  { id: 'sch-012', day: 'Thursday',  startTime: '14:00', endTime: '16:00', subject: 'Project Work',                reason: 'portfolio building', color: '#a78bfa' },
  { id: 'sch-013', day: 'Friday',    startTime: '09:00', endTime: '10:00', subject: 'Computer Networks',           reason: 'revision due',       color: '#60a5fa' },
  { id: 'sch-014', day: 'Friday',    startTime: '10:30', endTime: '12:00', subject: 'Mock Interviews',             reason: 'placement prep',     color: '#a78bfa' },
  { id: 'sch-015', day: 'Friday',    startTime: '14:00', endTime: '15:30', subject: 'Open Revision / Doubts',      reason: 'self-study',         color: '#94a3b8' },
  { id: 'sch-016', day: 'Saturday',  startTime: '10:00', endTime: '12:00', subject: 'Competitive Coding Practice', reason: 'placement prep',     color: '#a78bfa' },
  { id: 'sch-017', day: 'Saturday',  startTime: '14:00', endTime: '15:30', subject: 'DBMS Revision',               reason: 'weak subject',       color: '#fbbf24' },
  { id: 'sch-018', day: 'Sunday',    startTime: '10:00', endTime: '11:30', subject: 'Project Work',                reason: 'portfolio building', color: '#a78bfa' },
  { id: 'sch-019', day: 'Sunday',    startTime: '14:00', endTime: '15:00', subject: 'Week Review & Planning',      reason: 'self-study',         color: '#94a3b8' },
];

// ─── Interventions ───
export const mockInterventions = {
  'stu-003': [
    {
      id: 'int-001',
      action: 'One-on-one counseling session',
      note: 'Discussed time management strategies and identified personal challenges affecting academic performance. Student agreed to a structured study plan.',
      date: '2025-06-15',
      risk_before: 0.85,
      risk_after: 0.78,
      outcome: 'improved',
      reviewDate: '2025-07-01',
      mentor: 'Dr. Rajesh Kumar',
    },
    {
      id: 'int-002',
      action: 'Assigned peer study group',
      note: 'Connected with top-performing students in DBMS and OS. Meets twice a week for group study sessions.',
      date: '2025-07-01',
      risk_before: 0.78,
      risk_after: 0.78,
      outcome: 'no change',
      reviewDate: '2025-07-15',
      mentor: 'Dr. Rajesh Kumar',
    },
  ],
  'stu-005': [
    {
      id: 'int-003',
      action: 'Parent-teacher meeting',
      note: 'Informed parents about academic concerns. Student has personal issues affecting focus. Recommended counseling support.',
      date: '2025-06-20',
      risk_before: 0.88,
      risk_after: 0.82,
      outcome: 'improved',
      reviewDate: '2025-07-10',
      mentor: 'Dr. Rajesh Kumar',
    },
  ],
  'stu-001': [
    {
      id: 'int-004',
      action: 'Extra lab sessions assigned',
      note: 'Assigned 2 additional DBMS lab sessions per week to improve practical understanding. Student is responsive.',
      date: '2025-07-05',
      risk_before: 0.52,
      risk_after: 0.45,
      outcome: 'improved',
      reviewDate: '2025-07-20',
      mentor: 'Dr. Rajesh Kumar',
    },
  ],
};

export const mockInterventionActions = [
  'One-on-one counseling session',
  'Assigned peer study group',
  'Parent-teacher meeting',
  'Extra lab sessions assigned',
  'Referred to academic support center',
  'Modified course load recommendation',
  'Provided additional study materials',
  'Scheduled regular check-ins',
  'Connected with industry mentor',
  'Custom action',
];

// ─── Helper: simulate delay ───
export const delay = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms));
