# Information Architecture

| ID      | Category              | Name                                  | Description                                                                           |
| ------- | --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| 1       | Admin Panel           | Admin Panel                           | Entry point for all administrative features                                           |
| 1.1     | User & Org Management | User & Organization Management        | Management of users, organizations, and access control                                |
| 1.1.1   | User & Org Management | Unified Account Management & Roles    | Unified user accounts and role-based access control                                   |
| 1.1.2   | User & Org Management | IAM Policy Configuration              | Definition and management of IAM policies                                             |
| 1.1.3   | User & Org Management | Bulk User Registration & Account Sync | Bulk user onboarding and account synchronization                                      |
| 1.1.4   | User & Org Management | Organization & Class Hierarchy Design | Design of organizational and class hierarchies                                        |
| 1.2     | Infrastructure        | Infrastructure Management             | System and infrastructure resource management                                         |
| 1.2.1   | Infrastructure        | System Configuration (API Deployment) | System configuration and API deployment                                               |
| 1.2.2   | Infrastructure        | Session-based AI Token & Cost Control | Control of AI token usage and cost per session                                        |
| 1.3     | Security & Ethics     | Security & Ethics Guidelines          | Security, compliance, and ethical policy management                                   |
| 1.3.1   | Security & Ethics     | AI Ethics Compliance                  | Enforcement of AI ethics standards                                                    |
| 1.3.2   | Security & Ethics     | Terms & Policy Management             | Management of service terms and internal policies                                     |
| 1.3.3   | Security & Ethics     | Data Anonymization Protocol           | Personal data anonymization and protection protocols                                  |
| 1.4     | Logging & Analytics   | Data Logging                          | Logging and analytics management                                                      |
| 1.4.1   | Logging & Analytics   | Real-time System Logs & Traffic       | Real-time monitoring of system logs and traffic                                       |
| 1.4.2   | Logging & Analytics   | User-level Analytics Reports          | Analytics and reporting at the user level                                             |
| 2       | Creators              | Creators                              | Entry point for creator-facing project creation and management                        |
| 2.1     | Project Dashboard     | Project Dashboard                     | Overview of active projects and creator activities                                    |
| 2.1.1   | Project Dashboard     | Active Projects                       | List of ongoing projects                                                              |
| 2.1.1.1 | Project Dashboard     | Live Project Cards                    | Real-time project progress, signals, and risk highlights                              |
| 2.1.2   | Project Dashboard     | Performance & Library                 | Management of outcomes and reusable assets                                            |
| 2.1.2.1 | Project Dashboard     | Performance-based Project Scoring     | Project scoring based on metrics (achievement, engagement, etc.)                      |
| 2.1.3   | Project Dashboard     | Team & Organization Management        | AI-assisted team and organization building                                            |
| 2.1.3.1 | Project Dashboard     | Bulk Import & Team Formation (CSV)    | Bulk upload (CSV) for users and automatic team building                               |
| 2.2     | Discovery             | Member / Team Explorer                | Search and discovery of members and teams                                             |
| 2.2.1   | Discovery             | Advanced Member & Team Search         | Search by individual or team with detailed capability history                         |
| 2.2.1.1 | Discovery             | Student Performance & Content History | Per-student cumulative metrics, capabilities, and AI content history                  |
| 2.3     | Project Creation      | Project Creation Wizard (Gen AI)      | AI-powered project creation workflow                                                  |
| 2.3.1   | Project Creation      | Base Environment Setup                | Initial project environment configuration                                             |
| 2.3.1.1 | Project Creation      | Topic & Persona Definition            | Topic selection, persona design, AI classmate (level/role/team), and multi-body setup |
| 2.3.2   | Project Creation      | Asymmetric Timeline Design            | Non-linear timeline configuration                                                     |
| 2.3.2.1 | Project Creation      | Weighted Schedule Calculation         | Schedule calculation using weighted parameters with temporary save                    |
| 2.3.3   | Project Creation      | Activity & Rubric Design              | Definition of activities and evaluation rubrics                                       |
| 2.3.3.1 | Project Creation      | Mission-based Rubric Generation       | Mission-level rubric design and AI-assisted generation                                |
| 2.3.4   | Project Creation      | Draft Save & Final Generation         | Draft management and final project generation                                         |
| 2.3.4.1 | Project Creation      | Design Validation & Publish           | Temporary storage, validation, and dashboard publishing                               |
| 2.4     | Real-time Monitoring  | Real-time Monitoring                  | Live monitoring of project execution                                                  |
| 2.4.1   | Real-time Monitoring  | Signal & Risk Center                  | Risk visualization using a three-color severity system                                |
| 2.4.1.1 | Real-time Monitoring  | Automatic Risk Classification         | Automatic classification of inactivity, conflicts, and delays                         |
| 2.4.2   | Real-time Monitoring  | Proactive AI Intervention             | Dynamic AI-driven intervention                                                        |
| 2.4.2.1 | Real-time Monitoring  | Intervention Policy Configuration     | Custom policies by cycle (1h–15d) and risk type                                       |
| 2.5     | Evaluation & Reports  | Evaluation & Reporting                | Project assessment and reporting                                                      |
| 2.5.1   | Evaluation & Reports  | Integrated Rubric Configuration       | Project-wide rubric setup (skippable)                                                 |
| 2.5.1.1 | Evaluation & Reports  | Project-wide Evaluation Criteria      | Unified evaluation standards                                                          |
| 2.5.2   | Evaluation & Reports  | Expert Management                     | Expert invitation and feedback management                                             |
| 2.5.2.1 | Evaluation & Reports  | Expert Feedback & Scoring             | Expert reviews, scoring, and evaluation data management                               |
| 2.5.3   | Evaluation & Reports  | Growth Report                         | Final growth and outcome reporting                                                    |
| 2.5.3.1 | Evaluation & Reports  | AI Content Review & Final Grading     | AI content review, editing, final grading, and report issuance                        |
| 3       | Explorers             | Explorers                             | Entry point for learner-facing exploration and collaboration                          |
| 3.1     | Workspace             | Workspace                             | Primary workspace for learner activities                                              |
| 3.1.1   | Dashboard             | Dashboard                             | Overview of learner status and progress                                               |
| 3.1.1.1 | Dashboard             | Identity Hub                          | Display of assigned roles (badges) and today’s missions                               |
| 3.1.1.2 | Dashboard             | Exploration Roadmap (Summary)         | Summary of past/current/future missions with milestone alerts and D+/D- indicators    |
| 3.2     | Collaboration         | N-persona Group Chat                  | Group chat with multiple personas                                                     |
| 3.2.1   | Dynamic Workspace     | Dynamic Workspace                     | Context-aware collaborative workspace                                                 |
| 3.2.1.1 | Dynamic Workspace     | Active Conversation (N Personas)      | Active multi-persona conversation                                                     |
| 3.2.1.2 | Dynamic Workspace     | Previous Conversation History         | Access to past conversation logs                                                      |
| 3.2.1.3 | Dynamic Workspace     | Remaining Goals per Conversation      | Tracking remaining goals and tasks per conversation                                   |
| 3.2.2   | Collaboration Tools   | Mission Briefing & Resources          | Mission briefing with contextual resources                                            |
| 3.2.2.1 | Collaboration Tools   | Driving Questions & RAG Resources     | Personalized resources via driving questions and RAG                                  |
| 3.2.3   | Collaboration Tools   | Group Collaboration Chat              | Real-time collaborative group chat                                                    |
| 3.2.3.1 | Collaboration Tools   | AI Classmate Participation            | Real-time participation of AI classmates and agents                                   |
| 3.2.4   | Collaboration Tools   | Multi-body Search                     | Parallel search across multiple AI agents                                             |
| 3.2.4.1 | Collaboration Tools   | Multi-model Editing & Synthesis       | Editing and synthesis using multiple models and personas                              |
| 3.2.5   | Collaboration Tools   | AI Collaboration Sandbox              | Shared editing and experimentation space                                              |
| 3.2.5.1 | Collaboration Tools   | Live Co-editing & AI Ghost Typing     | Real-time co-editing with AI ghost typing support                                     |
| 3.2.6   | Creation Support      | Data & Content Creation Support       | Support for creating and processing data                                              |
| 3.2.6.1 | Creation Support      | OCR / STT & Media Processing          | Image/audio ingestion, OCR/STT, summarization, and Deep-Dive workflows                |
| 3.2.7   | Creation Support      | Artifact Submission & AI Feedback     | Submission of outputs with rubric-based AI feedback                                   |
| 3.2.7.1 | Creation Support      | Upload & Real-time Feedback           | Output upload and immediate AI feedback                                               |
| 3.3     | Portfolio             | My Portfolio                          | Personal portfolio and achievement tracking                                           |
| 3.3.1   | Portfolio             | Artifact Gallery                      | Gallery of completed project artifacts                                                |
| 3.3.1.1 | Portfolio             | Final Outputs & Auto Curation         | Project-level final outputs with auto-curation from multi-body logs                   |
| 3.3.1.2 | Portfolio             | Project Capability Radar              | Radar chart of capabilities per project                                               |
| 3.3.2   | Portfolio             | Capability Dashboard                  | Dashboard of learner capabilities                                                     |
| 3.3.2.1 | Portfolio             | Cumulative Capability Radar & Deltas  | Cumulative capability radar and growth deltas                                         |
| 3.3.3   | Portfolio             | Achievement Vault                     | Storage of achievements and recognitions                                              |
| 3.3.3.1 | Portfolio             | Final Metrics & Instructor Feedback   | Final metrics (achievement/engagement) and instructor feedback                        |
