import { db } from './index'
import {
  users,
  organizations,
  projects,
  projectSessions,
  sessionResources,
  sessionRubrics,
  teams,
  teamMembers,
  aiPersonas,
  teamAiPersonas,
  badges,
  projectInvitations,
} from './schema'
import { hashPassword } from '../server/auth/password'
import { v4 as uuidv4 } from 'uuid'

async function seed() {
  console.log('Seeding database...')

  const now = new Date()

  // Clear existing data (in reverse dependency order)
  console.log('Clearing existing data...')
  await db.delete(teamAiPersonas)
  await db.delete(teamMembers)
  await db.delete(projectInvitations)
  await db.delete(sessionRubrics)
  await db.delete(sessionResources)
  await db.delete(projectSessions)
  await db.delete(teams)
  await db.delete(projects)
  await db.delete(aiPersonas)
  await db.delete(badges)
  await db.delete(organizations)
  await db.delete(users)

  // Create users
  console.log('Creating users...')
  // All demo users use 'supersecret!' as password for E2E testing
  const passwordHash = await hashPassword('supersecret!')

  const userRecords = [
    // Simple test accounts
    {
      id: 'user_admin',
      email: 'admin@p3bl.local',
      passwordHash,
      name: 'Admin User',
      role: 'admin' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Admin_001',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_creator1',
      email: 'creator1@p3bl.local',
      passwordHash,
      name: 'Creator One',
      role: 'creator' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Creator_001',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_creator2',
      email: 'creator2@p3bl.local',
      passwordHash,
      name: 'Creator Two',
      role: 'creator' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Creator_002',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_creator3',
      email: 'creator3@p3bl.local',
      passwordHash,
      name: 'Creator Three',
      role: 'creator' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Creator_003',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_explorer1',
      email: 'explorer1@p3bl.local',
      passwordHash,
      name: 'Explorer One',
      role: 'explorer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Explorer_001',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_explorer2',
      email: 'explorer2@p3bl.local',
      passwordHash,
      name: 'Explorer Two',
      role: 'explorer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Explorer_002',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_explorer3',
      email: 'explorer3@p3bl.local',
      passwordHash,
      name: 'Explorer Three',
      role: 'explorer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Explorer_003',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_pioneer1',
      email: 'pioneer1@p3bl.local',
      passwordHash,
      name: 'Pioneer One',
      role: 'pioneer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Pioneer_001',
      hallOfFameOptIn: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  await db.insert(users).values(userRecords)

  // Create AI Personas
  console.log('Creating AI personas...')
  const personaRecords = [
    {
      id: 'persona_sage',
      name: 'Sage',
      type: 'tutor' as const,
      description: 'Patient and thorough, breaks down complex concepts into digestible pieces.',
      avatar: 'sage',
      systemPrompt: `You are Sage, an AI learning tutor. Your role is to:
- Break down complex concepts into simple, understandable parts
- Ask clarifying questions to understand student confusion
- Provide step-by-step explanations
- Encourage students and celebrate their progress
- Use analogies and examples from everyday life
Be patient, supportive, and never condescending.`,
      traits: JSON.stringify(['patient', 'thorough', 'encouraging']),
      expertise: JSON.stringify(['explaining concepts', 'study strategies', 'problem decomposition']),
      isActive: true,
      createdAt: now,
    },
    {
      id: 'persona_spark',
      name: 'Spark',
      type: 'facilitator' as const,
      description: 'Energetic and creative, sparks new ideas and keeps discussions lively.',
      avatar: 'spark',
      systemPrompt: `You are Spark, an AI facilitator. Your role is to:
- Generate creative ideas and brainstorming prompts
- Keep group discussions engaging and on-track
- Connect different ideas and perspectives
- Encourage participation from all team members
- Suggest innovative approaches to problems
Be energetic, creative, and inclusive.`,
      traits: JSON.stringify(['creative', 'energetic', 'inclusive']),
      expertise: JSON.stringify(['brainstorming', 'facilitation', 'creative thinking']),
      isActive: true,
      createdAt: now,
    },
    {
      id: 'persona_atlas',
      name: 'Atlas',
      type: 'expert' as const,
      description: 'Knowledgeable guide providing deep expertise and industry insights.',
      avatar: 'atlas',
      systemPrompt: `You are Atlas, an AI expert. Your role is to:
- Provide deep knowledge on technical topics
- Share industry best practices and standards
- Reference relevant research and resources
- Offer professional insights and real-world applications
- Challenge students to think critically
Be knowledgeable, professional, and thorough.`,
      traits: JSON.stringify(['knowledgeable', 'professional', 'insightful']),
      expertise: JSON.stringify(['technical knowledge', 'industry practices', 'research']),
      isActive: true,
      createdAt: now,
    },
    {
      id: 'persona_echo',
      name: 'Echo',
      type: 'critic' as const,
      description: 'Thoughtful reviewer who provides constructive feedback and different perspectives.',
      avatar: 'echo',
      systemPrompt: `You are Echo, an AI reviewer. Your role is to:
- Provide constructive feedback on student work
- Identify strengths and areas for improvement
- Offer alternative perspectives and approaches
- Ask thought-provoking questions
- Help students refine their ideas
Be constructive, honest, and supportive in your critique.`,
      traits: JSON.stringify(['analytical', 'constructive', 'thoughtful']),
      expertise: JSON.stringify(['feedback', 'critical analysis', 'quality improvement']),
      isActive: true,
      createdAt: now,
    },
  ]

  await db.insert(aiPersonas).values(personaRecords)

  // Create badges
  console.log('Creating badges...')
  const badgeRecords = [
    // Milestone badges
    { id: 'badge_first_steps', name: 'First Steps', description: 'Submit your first artifact', category: 'milestone' as const, icon: 'footprints', criteria: 'Submit first artifact in any project', criteriaType: 'artifact_count', criteriaValue: 1, xpReward: 15, isActive: true, createdAt: now },
    { id: 'badge_project_pioneer', name: 'Project Pioneer', description: 'Complete your first project', category: 'milestone' as const, icon: 'flag', criteria: 'Complete first project', criteriaType: 'project_complete', criteriaValue: 1, xpReward: 50, isActive: true, createdAt: now },
    { id: 'badge_seasoned_explorer', name: 'Seasoned Explorer', description: 'Complete 3 projects', category: 'milestone' as const, icon: 'compass', criteria: 'Complete 3 projects', criteriaType: 'project_complete', criteriaValue: 3, xpReward: 100, isActive: true, createdAt: now },
    { id: 'badge_master_explorer', name: 'Master Explorer', description: 'Complete 5 projects', category: 'milestone' as const, icon: 'star', criteria: 'Complete 5 projects', criteriaType: 'project_complete', criteriaValue: 5, xpReward: 200, isActive: true, createdAt: now },
    
    // Engagement badges
    { id: 'badge_early_bird', name: 'Early Bird', description: 'Submit 24+ hours early', category: 'engagement' as const, icon: 'sun', criteria: 'Submit artifact 24+ hours before deadline', criteriaType: 'early_submission', criteriaValue: 24, xpReward: 20, isActive: true, createdAt: now },
    { id: 'badge_consistent', name: 'Consistent Contributor', description: '5 consecutive on-time submissions', category: 'engagement' as const, icon: 'calendar', criteria: 'Submit on-time for 5 consecutive sessions', criteriaType: 'consecutive_submissions', criteriaValue: 5, xpReward: 30, isActive: true, createdAt: now },
    { id: 'badge_team_player', name: 'Team Player', description: 'Send 50+ chat messages', category: 'engagement' as const, icon: 'message-circle', criteria: 'Send 50+ chat messages', criteriaType: 'chat_count', criteriaValue: 50, xpReward: 25, isActive: true, createdAt: now },
    
    // Collaboration badges
    { id: 'badge_helping_hand', name: 'Helping Hand', description: 'Share 5+ artifacts with team', category: 'collaboration' as const, icon: 'hand-helping', criteria: 'Share 5+ artifacts to team chat', criteriaType: 'share_count', criteriaValue: 5, xpReward: 20, isActive: true, createdAt: now },
    { id: 'badge_feedback_friend', name: 'Feedback Friend', description: 'Get 3+ helpful reactions', category: 'collaboration' as const, icon: 'heart', criteria: 'Receive helpful reactions on 3+ shared artifacts', criteriaType: 'reaction_count', criteriaValue: 3, xpReward: 25, isActive: true, createdAt: now },
    
    // Competency badges
    { id: 'badge_critical_thinker', name: 'Critical Thinker', description: 'Reach 70+ in Critical Thinking', category: 'competency' as const, icon: 'brain', criteria: 'Reach 70+ in Critical Thinking competency', criteriaType: 'competency_score', criteriaValue: 70, xpReward: 50, isActive: true, createdAt: now },
    { id: 'badge_communicator', name: 'Communicator', description: 'Reach 70+ in Communication', category: 'competency' as const, icon: 'megaphone', criteria: 'Reach 70+ in Communication competency', criteriaType: 'competency_score', criteriaValue: 70, xpReward: 50, isActive: true, createdAt: now },
    { id: 'badge_collaborator', name: 'Collaborator', description: 'Reach 70+ in Collaboration', category: 'competency' as const, icon: 'users', criteria: 'Reach 70+ in Collaboration competency', criteriaType: 'competency_score', criteriaValue: 70, xpReward: 50, isActive: true, createdAt: now },
    { id: 'badge_creative_mind', name: 'Creative Mind', description: 'Reach 70+ in Creativity', category: 'competency' as const, icon: 'lightbulb', criteria: 'Reach 70+ in Creativity competency', criteriaType: 'competency_score', criteriaValue: 70, xpReward: 50, isActive: true, createdAt: now },
    { id: 'badge_problem_solver', name: 'Problem Solver', description: 'Reach 70+ in Problem Solving', category: 'competency' as const, icon: 'puzzle', criteria: 'Reach 70+ in Problem Solving competency', criteriaType: 'competency_score', criteriaValue: 70, xpReward: 50, isActive: true, createdAt: now },
  ]

  await db.insert(badges).values(badgeRecords)

  // Create organization
  console.log('Creating organization...')
  const orgId = uuidv4()
  await db.insert(organizations).values({
    id: orgId,
    name: 'Demo University',
    type: 'school',
    description: 'Demo university for P3BL platform testing',
    createdAt: now,
    updatedAt: now,
  })

  // Create projects
  console.log('Creating projects...')
  
  // Project 1: Active project by Dr. Chen
  const project1Id = 'proj_ml_fundamentals'
  const startDate1 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago
  const endDate1 = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000) // 4 weeks from now

  await db.insert(projects).values({
    id: project1Id,
    creatorId: 'user_creator1',
    orgId,
    title: 'Machine Learning Fundamentals',
    description: 'A comprehensive introduction to machine learning concepts and practical applications.',
    background: 'Machine learning is transforming industries across the globe. This project introduces core ML concepts through hands-on exercises.',
    drivingQuestion: 'How can we use machine learning to solve real-world problems ethically and effectively?',
    joinCode: 'ML2024',
    teamSize: 4,
    startDate: startDate1,
    endDate: endDate1,
    createdAt: now,
    updatedAt: now,
  })

  // Project 1 Sessions
  const session1_1 = uuidv4()
  const session1_2 = uuidv4()
  const session1_3 = uuidv4()
  const session1_4 = uuidv4()

  await db.insert(projectSessions).values([
    {
      id: session1_1,
      projectId: project1Id,
      order: 1,
      title: 'Introduction to ML',
      topic: 'What is Machine Learning?',
      guide: `# Welcome to Machine Learning Fundamentals

In this session, you'll explore the basics of machine learning:
- What is ML and why does it matter?
- Types of ML: Supervised, Unsupervised, Reinforcement
- Real-world applications

## Your Task
Write a reflection on how ML impacts your daily life.`,
      weight: 1,
      deliverableType: 'document',
      deliverableTitle: 'ML Impact Reflection',
      deliverableDescription: 'Write a 500-word reflection on machine learning applications you encounter daily.',
      dueDate: new Date(startDate1.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: session1_2,
      projectId: project1Id,
      order: 2,
      title: 'Data Preparation',
      topic: 'Cleaning and Preparing Data',
      guide: `# Data Preparation

Good data is the foundation of good ML models. In this session:
- Data cleaning techniques
- Feature engineering
- Handling missing values
- Data normalization`,
      weight: 1.5,
      deliverableType: 'code',
      deliverableTitle: 'Data Cleaning Script',
      deliverableDescription: 'Create a Python script that cleans and prepares a provided dataset.',
      dueDate: new Date(startDate1.getTime() + 14 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: session1_3,
      projectId: project1Id,
      order: 3,
      title: 'Building Models',
      topic: 'Creating Your First ML Model',
      guide: `# Building Your First Model

Time to build! In this session:
- Choosing the right algorithm
- Training and testing splits
- Model evaluation metrics
- Avoiding overfitting`,
      weight: 2,
      deliverableType: 'code',
      deliverableTitle: 'ML Model Implementation',
      deliverableDescription: 'Implement a classification model using scikit-learn.',
      dueDate: new Date(startDate1.getTime() + 28 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: session1_4,
      projectId: project1Id,
      order: 4,
      title: 'Ethics & Presentation',
      topic: 'ML Ethics and Final Presentation',
      guide: `# Ethics in Machine Learning

As we conclude, consider:
- Bias in ML systems
- Privacy concerns
- Responsible AI practices
- Presenting your findings`,
      weight: 1.5,
      deliverableType: 'presentation',
      deliverableTitle: 'Final Presentation',
      deliverableDescription: 'Create a presentation summarizing your ML project and ethical considerations.',
      dueDate: endDate1,
      createdAt: now,
      updatedAt: now,
    },
  ])

  // Add rubrics for session 1
  await db.insert(sessionRubrics).values([
    { id: uuidv4(), sessionId: session1_1, criteria: 'Understanding', description: 'Demonstrates clear understanding of ML concepts', weight: 1, maxScore: 100, order: 0, createdAt: now },
    { id: uuidv4(), sessionId: session1_1, criteria: 'Examples', description: 'Provides relevant real-world examples', weight: 1, maxScore: 100, order: 1, createdAt: now },
    { id: uuidv4(), sessionId: session1_1, criteria: 'Critical Thinking', description: 'Shows critical analysis of ML impact', weight: 1, maxScore: 100, order: 2, createdAt: now },
  ])

  // Add resources for session 1
  await db.insert(sessionResources).values([
    { id: uuidv4(), sessionId: session1_1, type: 'link', title: 'ML Crash Course - Google', url: 'https://developers.google.com/machine-learning/crash-course', order: 0, createdAt: now },
    { id: uuidv4(), sessionId: session1_1, type: 'video', title: 'What is Machine Learning?', url: 'https://www.youtube.com/watch?v=ukzFI9rgwfU', order: 1, createdAt: now },
  ])

  // Create team for project 1
  const team1Id = uuidv4()
  await db.insert(teams).values({
    id: team1Id,
    projectId: project1Id,
    name: 'Alpha Team',
    createdAt: now,
    updatedAt: now,
  })

  // Add team members
  await db.insert(teamMembers).values([
    { teamId: team1Id, userId: 'user_explorer1', currentSessionId: session1_2, joinedAt: now },
    { teamId: team1Id, userId: 'user_explorer2', currentSessionId: session1_3, joinedAt: now },
  ])

  // Assign AI personas to team
  await db.insert(teamAiPersonas).values([
    { teamId: team1Id, personaId: 'persona_sage', assignedAt: now },
    { teamId: team1Id, personaId: 'persona_spark', assignedAt: now },
  ])

  // Project 2: Completed project
  const project2Id = 'proj_web_design'
  const startDate2 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
  const endDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 14 days ago

  await db.insert(projects).values({
    id: project2Id,
    creatorId: 'user_creator2',
    orgId,
    title: 'Responsive Web Design',
    description: 'Learn modern responsive web design principles and create a portfolio website.',
    background: 'In today\'s multi-device world, responsive design is essential for any web developer.',
    drivingQuestion: 'How can we create web experiences that work beautifully across all devices?',
    joinCode: 'WEB101',
    teamSize: 3,
    startDate: startDate2,
    endDate: endDate2,
    createdAt: startDate2,
    updatedAt: endDate2,
  })

  // Project 3: Scheduled project (starts in the future)
  const project3Id = 'proj_data_viz'
  const startDate3 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  const endDate3 = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000) // 35 days from now
  await db.insert(projects).values({
    id: project3Id,
    creatorId: 'user_creator1',
    title: 'Data Visualization Mastery',
    description: 'Master the art of telling stories with data through interactive visualizations.',
    background: 'Data visualization transforms complex information into understandable insights.',
    drivingQuestion: 'How can we use visualization to communicate data insights effectively?',
    teamSize: 4,
    startDate: startDate3,
    endDate: endDate3,
    createdAt: now,
    updatedAt: now,
  })

  // Project 3 Sessions (at least one, so draft can be activated)
  const session3_1 = uuidv4()
  await db.insert(projectSessions).values([
    {
      id: session3_1,
      projectId: project3Id,
      order: 1,
      title: 'Visualization Foundations',
      topic: 'Principles of effective charts',
      guide: `# Visualization Foundations

In this session, you'll learn:
- Choosing the right chart for the data
- Visual hierarchy and clarity
- Avoiding common chart pitfalls`,
      weight: 1,
      deliverableType: 'document',
      deliverableTitle: 'Chart Critique',
      deliverableDescription: 'Analyze two charts and explain which is more effective and why.',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  ])

  // Create invitation for explorer3
  await db.insert(projectInvitations).values({
    id: uuidv4(),
    projectId: project1Id,
    userId: 'user_explorer3',
    status: 'pending',
    createdAt: now,
  })

  console.log('Seed completed successfully!')
  console.log('\nTest accounts created (all use password: supersecret!):')
  console.log('  Admin:')
  console.log('    - admin (or admin@p3bl.local)')
  console.log('  Creators:')
  console.log('    - creator1 (or creator1@p3bl.local)')
  console.log('    - creator2 (or creator2@p3bl.local)')
  console.log('    - creator3 (or creator3@p3bl.local)')
  console.log('  Explorers:')
  console.log('    - explorer1 (or explorer1@p3bl.local)')
  console.log('    - explorer2 (or explorer2@p3bl.local)')
  console.log('    - explorer3 (or explorer3@p3bl.local)')
  console.log('  Pioneers:')
  console.log('    - pioneer1 (or pioneer1@p3bl.local)')
  console.log('\nJoin codes:')
  console.log('    - ML2024 (Machine Learning Fundamentals)')
  console.log('    - WEB101 (Responsive Web Design - completed)')
}

seed().catch(console.error)
