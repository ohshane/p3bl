const LEVELS = [
  { level: 1, name: "Newcomer", xpRequired: 0 },
  { level: 2, name: "Learner", xpRequired: 100 },
  { level: 3, name: "Explorer", xpRequired: 300 },
  { level: 4, name: "Navigator", xpRequired: 600 },
  { level: 5, name: "Pioneer", xpRequired: 1e3 },
  { level: 6, name: "Master", xpRequired: 1500 }
];
const BADGE_DEFINITIONS = [
  // Milestone
  { id: "first-steps", name: "First Steps", description: "Submit first artifact in any project", category: "milestone", icon: "footprints", criteria: "first_artifact" },
  { id: "project-pioneer", name: "Project Pioneer", description: "Complete first project", category: "milestone", icon: "flag", criteria: "first_project" },
  { id: "seasoned-explorer", name: "Seasoned Explorer", description: "Complete 3 projects", category: "milestone", icon: "compass", criteria: "complete_3_projects" },
  { id: "master-explorer", name: "Master Explorer", description: "Complete 5 projects", category: "milestone", icon: "star", criteria: "complete_5_projects" },
  // Engagement
  { id: "early-bird", name: "Early Bird", description: "Submit artifact 24+ hours before deadline", category: "engagement", icon: "sun", criteria: "early_submission" },
  { id: "consistent-contributor", name: "Consistent Contributor", description: "Submit on-time for 5 consecutive sessions", category: "engagement", icon: "calendar", criteria: "consecutive_submissions" },
  { id: "team-player", name: "Team Player", description: "Send 50+ chat messages across all projects", category: "engagement", icon: "message-circle", criteria: "chat_messages" },
  // Collaboration
  { id: "helping-hand", name: "Helping Hand", description: "Share 5+ artifacts to team chat", category: "collaboration", icon: "hand-helping", criteria: "share_artifacts" },
  { id: "feedback-friend", name: "Feedback Friend", description: 'Receive "helpful" reactions on 3+ shared artifacts', category: "collaboration", icon: "heart", criteria: "helpful_reactions" },
  // Competency
  { id: "critical-thinker", name: "Critical Thinker", description: "Reach 70+ in Critical Thinking competency", category: "competency", icon: "brain", criteria: "competency_critical_thinking" },
  { id: "communicator", name: "Communicator", description: "Reach 70+ in Communication competency", category: "competency", icon: "megaphone", criteria: "competency_communication" },
  { id: "collaborator", name: "Collaborator", description: "Reach 70+ in Collaboration competency", category: "competency", icon: "users", criteria: "competency_collaboration" },
  { id: "creative-mind", name: "Creative Mind", description: "Reach 70+ in Creativity competency", category: "competency", icon: "lightbulb", criteria: "competency_creativity" },
  { id: "problem-solver", name: "Problem Solver", description: "Reach 70+ in Problem Solving competency", category: "competency", icon: "puzzle", criteria: "competency_problem_solving" }
];
const COMPETENCY_LABELS = {
  criticalThinking: "Critical Thinking",
  communication: "Communication",
  collaboration: "Collaboration",
  creativity: "Creativity",
  problemSolving: "Problem Solving"
};
export {
  BADGE_DEFINITIONS as B,
  COMPETENCY_LABELS as C,
  LEVELS as L
};
