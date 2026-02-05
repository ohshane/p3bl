# Information Architecture

| ID      | Category              | Name                                  | Description                                                                |
| ------- | --------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| 1       | Admin Panel           | Admin Panel                           | Entry point for all administrative features                                |
| 1.1     | Dashboard             | System Dashboard                      | High-level overview of system activity, traffic, and AI utilization        |
| 1.2     | User & Org Management | User & Organization Management        | Management of users, organizations, and access control                     |
| 1.2.1   | User & Org Management | Unified Account Management & Roles    | Unified user accounts and role-based access control (SSO)                  |
| 1.2.2   | User & Org Management | IAM Policy Configuration              | Definition and management of IAM policies                                  |
| 1.2.3   | User & Org Management | Bulk User Registration & Account Sync | Bulk user onboarding (CSV/Excel) and account synchronization               |
| 1.2.4   | User & Org Management | Organization & Class Hierarchy Design | Design of organizational (School → Dept → Class) and class hierarchies     |
| 1.3     | Infrastructure        | Infrastructure & Cost Management      | System and infrastructure resource management                              |
| 1.3.1   | Infrastructure        | System Configuration (API Deployment) | System configuration and internal/external API deployment                  |
| 1.3.2   | Infrastructure        | Session-based AI Token & Cost Control | Control of AI token usage and cost per session/project                     |
| 1.4     | Security & Ethics     | Security & Ethics Guidelines          | Security, compliance, and ethical policy management                        |
| 1.4.1   | Security & Ethics     | AI Ethics Compliance                  | Enforcement of AI ethics standards and content guardrails                  |
| 1.4.2   | Security & Ethics     | Terms & Policy Management             | Management of service terms and internal privacy policies                  |
| 1.4.3   | Security & Ethics     | Data Anonymization Protocol           | Personal data anonymization and protection protocols                       |
| 1.5     | Logging & Analytics   | Data Logging & Analytics              | Logging and analytics management                                           |
| 1.5.1   | Logging & Analytics   | Real-time System Logs & Traffic       | Real-time monitoring of system error logs and traffic load                 |
| 1.5.2   | Logging & Analytics   | User-level Analytics Reports          | Analytics, activity reporting, and data export at the user level           |
| 2       | Creators              | Creators                              | Entry point for creator-facing project creation and management             |
| 2.1     | Project Dashboard     | Project Dashboard                     | Overview of active projects and creator activities                         |
| 2.1.1   | Project Dashboard     | Active Projects                       | List of ongoing projects with Status (Draft/Active/Done) and Invite Codes  |
| 2.1.1.1 | Project Dashboard     | Live Project Cards                    | Real-time project progress, signals (Traffic Lights), and risk highlights  |
| 2.1.2   | Project Dashboard     | The Dip Chart & Analytics             | Confidence/engagement trend visualization and AI efficacy gaps             |
| 2.1.3   | People & Org          | People & Organization Management      | AI-assisted team building and member discovery                             |
| 2.1.3.1 | People & Org          | Member / Team Explorer                | Search and discovery of members/teams with detailed capability history     |
| 2.1.3.2 | People & Org          | Bulk Enrollment & Team Formation      | Bulk upload (CSV) for users and automatic AI team allocation               |
| 2.2     | Project Creation      | Project Creation Wizard (Gen AI)      | AI-powered project creation workflow (Manual/Keyword/Document-driven)      |
| 2.2.1   | Project Creation      | Content Analysis & Setup              | RAG-based processing of lecture materials and basic info editor            |
| 2.2.2   | Project Creation      | Persona & Team Design                 | Selection of AI classmates and team size/formation parameters              |
| 2.2.3   | Project Creation      | Asymmetric Timeline Design            | Non-linear timeline configuration and weighted schedule calculation        |
| 2.2.4   | Project Creation      | Activity & Rubric Design              | Definition of sessions, deliverables, and AI-assisted rubric generation    |
| 2.2.5   | Project Creation      | Design Validation & Publish           | Temporary storage, validation summary, and project activation              |
| 2.3     | Monitoring & Assess   | Monitoring & Assessment               | Live monitoring and project evaluation                                     |
| 2.3.1   | Monitoring            | Signal & Risk Center                  | Risk visualization and automatic classification (Inactivity/Conflict)      |
| 2.3.2   | Monitoring            | Proactive AI Intervention             | Dynamic AI-driven intervention with custom policy configuration            |
| 2.3.3   | Assessment            | AI Assessment & Reports               | AI-generated assessment drafts, growth reports, and final grading          |
| 2.3.4   | Recognition           | Hall of Fame Management               | Selection and highlighting of top-performing teams and artifacts           |
| 3       | Explorers             | Explorers                             | Entry point for learner-facing exploration and collaboration               |
| 3.1     | Waiting Lounge        | Project Entry & Onboarding            | Pre-project state: invitations, manual join codes, and bot assistance      |
| 3.2     | Workspace             | Workspace                             | Primary workspace for learner status and project management                |
| 3.2.1   | Workspace             | Project List & Identity               | Active/Completed projects and Identity Hub (Roles/Badges)                  |
| 3.2.2   | Workspace             | Exploration Roadmap                   | Summary of missions with milestone alerts and D-day indicators             |
| 3.3     | Activity Zone         | Activity Zone                         | Core execution area with multi-persona collaboration                       |
| 3.3.1   | Voyage Navigator      | Intelligent Voyage Navigator          | AI-powered navigation through past (Reflection) and future (Preview) nodes |
| 3.3.2   | Collaboration         | Dynamic Multi-persona Chat            | Real-time group chat with peers and AI classmates/personas                 |
| 3.3.3   | Resource Hub          | Resource & Guide Hub                  | Personalized resources (RAG) and instructor-defined guides                 |
| 3.3.4   | Output Builder        | Smart Output Builder                  | AI Copilot (Ghost Typing), template injection, and multimodal processing   |
| 3.3.5   | Feedback Loop         | Feedback & Submission Loop            | AI pre-checks and versioned artifact submission                            |
| 3.4     | Growth Portfolio      | Growth Portfolio                      | Personal portfolio and achievement tracking                                |
| 3.4.1   | Portfolio             | Artifact Gallery                      | Gallery of completed artifacts with auto-curation and shareable links      |
| 3.4.2   | Portfolio             | Competency Dashboard                  | Capability Radar charts with growth deltas and AI insights                 |
| 3.4.3   | Portfolio             | Achievement Archive                   | Badge collection, experience synthesis, and positive feedback history      |
****