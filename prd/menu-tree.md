# Menu Tree

| ID        | Category                 | Menu / Feature Name                  | Description                                                                    |
| --------- | ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------ |
| A         | Admin Panel              | Admin Panel                          | Entry point for administrative configuration and monitoring                    |
| A.1       | Dashboard                | Dashboard                            | High-level overview of system activity                                         |
| A.1.1     | Dashboard                | Traffic & Active Projects Overview   | Overall traffic, active projects, and AI utilization status                    |
| A.2       | User & Organization      | User & Organization                  | Management of users and organizational structures                              |
| A.2.1     | User & Organization      | Integration                          | External identity and system integration                                       |
| A.2.1.1   | Integration              | SSO & Unified Account Management     | SSO integration and unified user account management                            |
| A.2.2     | User & Organization      | Bulk Action                          | Bulk user management operations                                                |
| A.2.2.1   | Bulk Action              | CSV / Excel User Import & Update     | Bulk user creation and updates via CSV/Excel                                   |
| A.2.3     | User & Organization      | Hierarchy                            | Organizational hierarchy management                                            |
| A.2.3.1   | Hierarchy                | Organization Structure & Roles       | Hierarchical structure (school → department → class) and role assignment       |
| A.3       | Infrastructure & Cost    | Infrastructure & Cost                | Infrastructure, deployment, and cost control                                   |
| A.3.1     | Infrastructure           | Deployment                           | API and system deployment management                                           |
| A.3.1.1   | Deployment               | Internal / External API Deployment   | Deployment and version control of internal and external APIs                   |
| A.3.2     | Infrastructure           | Token Control                        | AI token usage and cost limits                                                 |
| A.3.2.1   | Token Control            | Token Quota & Cost Limits            | Token quotas and cost limits per project or session                            |
| A.3.3     | Infrastructure           | Group Chat                           | Group chat–related AI resource control                                         |
| A.3.3.1   | Group Chat               | AI Token Monitoring & Model Control  | Monitoring AI token usage in group chat and controlling recommended LLM models |
| A.4       | Security & Ethics        | Security & Ethics                    | Security, privacy, and ethical governance                                      |
| A.4.1     | Security & Ethics        | Policy                               | Policy and compliance management                                               |
| A.4.1.1   | Policy                   | Terms & Privacy Policy Management    | Management of service terms, privacy policies, and disclosure settings         |
| A.4.1.2   | Policy                   | AI Ethics & Content Guardrails       | AI ethics compliance (bias, harmful content) and filtering policies            |
| A.4.2     | Security & Ethics        | Anonymization                        | Data anonymization controls                                                    |
| A.4.2.1   | Anonymization            | Personal Data Anonymization          | Anonymization of stored and training data containing personal information      |
| A.5       | Data Logging & Analytics | Data Logging & Analytics             | System logs and analytics                                                      |
| A.5.1     | Data Logging             | System Log                           | System-level logging and monitoring                                            |
| A.5.1.1   | System Log               | Error & Traffic Monitoring           | Real-time system error logs and traffic load monitoring                        |
| A.5.2     | Analytics                | Statistics                           | Usage analytics and reporting                                                  |
| A.5.2.1   | Statistics               | Activity Reports & Export            | Detailed activity reports by user, team, and project with download support     |
| E.0       | Waiting Lounge           | Waiting Lounge                       | Pre-entry state before joining projects                                        |
| E.0.1     | Waiting Lounge           | Invitation Dashboard                 | Fixed list of project invitations                                              |
| E.0.2     | Waiting Lounge           | Manual Join                          | Manual project join entry                                                      |
| E.0.3     | Waiting Lounge           | Floating Bot Assistance              | Floating AI assistant for guidance                                             |
| E.1.0     | State Manager            | State Manager                        | Manages onboarding vs active states                                            |
| E.1.1     | Onboarding               | Invitation Card                      | Fixed project invitation card                                                  |
| E.1.2     | Onboarding               | Manual Code Input                    | Manual invitation code input widget                                            |
| E.1.3     | Onboarding               | Floating Bot Assistance (Onboarding) | AI-guided onboarding assistance                                                |
| E.1.4     | Active State             | Global Project Bar                   | Global project bar with synced notifications                                   |
| E.1       | Workspace                | Workspace                            | Main workspace for active participation                                        |
| E.1.5     | Workspace                | My Project List                      | List of joined projects                                                        |
| E.1.5.1   | Workspace                | Active Projects Tab                  | Tab for active projects                                                        |
| E.1.5.2   | Workspace                | Completed Projects Tab               | Tab for completed projects                                                     |
| E.1.6     | Workspace                | My Profile & Growth                  | User profile, level, badges, and portfolio access                              |
| E.1.7     | Workspace                | Group Chat                           | Always-on fixed group chat panel (peers + AI personas)                         |
| E.1.8     | Workspace                | Hall of Fame                         | Recognition and featured achievements                                          |
| E.2.0     | Activity Zone            | Intelligent Voyage Navigator         | AI-powered learning/navigation guidance                                        |
| E.2       | Activity Zone            | Activity Zone                        | Core activity execution area                                                   |
| E.2.1     | Activity Zone            | Reflection Node (n-1)                | Retrospective reflection on previous activities                                |
| E.2.2     | Activity Zone            | Cockpit (Present)                    | Current activity control panel                                                 |
| E.2.3     | Activity Zone            | Preview Node (n+1)                   | Preview of upcoming activities                                                 |
| E.2.4     | Activity Zone            | Resource & Guide Hub                 | Auto-loaded resources and instructor-defined guides                            |
| E.2.5     | Activity Zone            | Smart Output Builder                 | AI-assisted content creation                                                   |
| E.2.5.1   | Output Builder           | AI Copilot Support                   | Context-aware AI writing and coding assistance                                 |
| E.2.5.2   | Output Builder           | Ghost Typing                         | AI-suggested text/code preview with tab-to-accept                              |
| E.2.5.3   | Output Builder           | Template Injection                   | Instant structured template insertion                                          |
| E.2.5.4   | Output Builder           | Multimodal Upload & PII Masking      | OCR/STT ingestion with automatic PII masking                                   |
| E.2.6     | Activity Zone            | Feedback & Submission Loop           | Evaluation and submission workflow                                             |
| E.2.6.1   | Feedback Loop            | AI Pre-check                         | AI-based pre-evaluation using project rubrics                                  |
| E.2.6.2   | Feedback Loop            | Expert Review                        | External expert feedback and threaded discussion                               |
| E.2.6.3   | Feedback Loop            | Submission Versioning                | Versioned submissions (v1.0, v1.1, etc.)                                       |
| E.3       | Growth Portfolio         | Growth Portfolio                     | Long-term growth and achievement tracking                                      |
| E.3.1     | Growth Portfolio         | Output Gallery                       | Archive of all created outputs                                                 |
| E.3.1.1   | Output Gallery           | Showcase Link                        | Public shareable link with expiration                                          |
| E.3.1.2   | Output Gallery           | Share to Team                        | Share outputs to group chat as rich cards                                      |
| E.3.2     | Growth Portfolio         | Competency Dashboard                 | Visualization of skill development                                             |
| E.3.2.1   | Competency Dashboard     | Radar Chart                          | Radar chart of core competencies                                               |
| E.3.2.2   | Competency Dashboard     | Growth Overlay                       | Pre vs post competency comparison                                              |
| E.3.2.3   | Competency Dashboard     | AI Insights                          | AI-generated textual insights on growth                                        |
| E.3.3     | Growth Portfolio         | Achievement Archive                  | Collection of achievements and recognitions                                    |
| E.3.3.1   | Achievement Archive      | Badge Collection                     | Display of earned digital badges                                               |
| E.3.3.2   | Achievement Archive      | Experience Synthesis                 | Auto-generated experience summary (portfolio/essay use)                        |
| E.3.3.3   | Achievement Archive      | Feedback History                     | Positive AI-reframed growth feedback history                                   |
| C.0       | Creator Home             | Creator Home                         | Global entry point for creators                                                |
| C.0.1     | Navigation               | Creator Navigation                   | Navigation between Dashboard / Monitoring / Assessment                         |
| C.0.2     | Global Action            | + New Project                        | Persistent global action button                                                |
| C.1       | Dashboard                | Dashboard                            | Overview of projects and learner states                                        |
| C.1.0     | Dashboard State          | Empty State                          | Initial state when no active projects exist                                    |
| C.1.0.1   | Dashboard State          | Onboarding Message                   | Welcome illustration and message                                               |
| C.1.0.2   | Dashboard State          | Create Project CTA                   | Highlighted “+ Create Project” button (calls C.2 Wizard)                       |
| C.1.1     | Dashboard                | Project Cards (Card View)            | Card-based project overview                                                    |
| C.1.1.1   | Project Card             | Project Status                       | Draft / Active / Done                                                          |
| C.1.1.2   | Project Card             | Quick Invite Code                    | Invitation code badge with one-click copy                                      |
| C.1.1.3   | Project Card             | Invite Code Management               | Copy / QR view / Reset invitation code                                         |
| C.1.2     | Dashboard Visualization  | Risk Traffic Light                   | Project/team status via red-yellow-green signals                               |
| C.1.3     | Dashboard Visualization  | The Dip Chart                        | Confidence/engagement trend visualization                                      |
| C.1.3.1   | Dip Chart                | AI Efficacy Gap Visualization        | Comparison of traditional vs AI-supported learning curves                      |
| C.1.3.2   | Dip Chart                | Affective Forecast Bars              | Predictive risk bars with AI recovery simulation                               |
| C.1.3.3   | Dip Chart                | AI Intervention Markers              | Event markers showing AI intervention timing                                   |
| C.1.4     | People & Organization    | People & Organization                | Learner, team, and expert management                                           |
| C.1.4.1   | Enrollment               | Bulk Enrollment                      | CSV/Excel bulk enrollment                                                      |
| C.1.4.2   | Explorer                 | Member / Team Explorer               | Filterable list by team, status, risk                                          |
| C.1.4.3   | Student Profile          | Student Growth Profile               | Detailed student profile                                                       |
| C.1.4.3.1 | Student Profile          | Competency Radar                     | Radar chart of core competencies                                               |
| C.1.4.3.2 | Student Profile          | Badge & Medal Collection             | Earned badges and medals                                                       |
| C.1.4.3.3 | Student Profile          | AI Comment Log                       | Timeline of AI feedback and coaching                                           |
| C.1.4.4   | Waiting Room             | Waiting Room                         | Approval list for external invitees                                            |
| C.1.4.5   | Expert Management        | Expert Pool Management               | External mentor database                                                       |
| C.2       | Project Creation         | Project Creation Wizard              | Wizard for creating projects                                                   |
| C.2.0.A   | Wizard Mode              | Manual Builder                       | Fully manual project creation                                                  |
| C.2.0.B   | Wizard Mode              | Keyword Generator                    | Keyword-based AI ideation                                                      |
| C.2.0.C   | Wizard Mode              | AI Generator (Document-driven)       | Auto design from lecture materials                                             |
| C.2.1     | Step 1                   | Content Analysis & Basic Info        | Lecture-driven project grounding                                               |
| C.2.1.1   | Step 1                   | Lecture Upload                       | Upload syllabus/materials (PDF, PPT, etc.)                                     |
| C.2.1.2   | Step 1                   | RAG Processing                       | Extract goals, schedule, assignments                                           |
| C.2.1.3   | Step 1                   | Basic Info Editor                    | Edit title, background, driving question                                       |
| C.2.2     | Step 2                   | AI Classmate Setup                   | Select AI personas for the project                                             |
| C.2.3     | Step 3                   | Scale & Team Setup                   | Team size and formation                                                        |
| C.2.3.1   | Team Setup               | Participant Parameters               | Total N / Team size T                                                          |
| C.2.3.2.A | Team Setup               | Manual Team Creation                 | Invite-based team creation                                                     |
| C.2.3.2.B | Team Setup               | Automatic Team Assignment            | Roster-based AI team allocation                                                |
| C.2.3.3   | Team Setup               | Team Preview                         | Live preview of team composition                                               |
| C.2.4     | Step 4                   | Overall Timeline                     | Project start/end and duration                                                 |
| C.2.5     | Step 5                   | Variable Session Builder             | Add/remove 1–N sessions                                                        |
| C.2.6     | Step 6                   | Asymmetric Timeline                  | Session weight adjustment                                                      |
| C.2.7     | Step 7                   | Session Detail Editor                | Session-level planning                                                         |
| C.2.7.1   | Session Detail           | Topic & Guide                        | Session topic and guide                                                        |
| C.2.7.2   | Session Detail           | Multi-Chatbot Control                | LLM selection per session                                                      |
| C.2.7.3   | Session Detail           | Deliverables & Rubrics               | Submission format and rubric                                                   |
| C.2.8     | Step 8                   | Expert Invitation Decision           | Invite external experts                                                        |
| C.2.9     | Step 9                   | Review & Deployment                  | Final review and activation                                                    |
| C.2.9.1   | Deployment               | Design Summary                       | One-page project preview                                                       |
| C.2.9.2   | Deployment               | Temporary Save                       | Save as idle state                                                             |
| C.2.9.3   | Deployment               | Project Creation                     | Activate project                                                               |
| C.2.9.4   | Deployment               | Success Modal & Invitation           | Idle → Active transition                                                       |
| C.3       | Monitoring & Assess      | Monitoring & Assessment              | Live monitoring and evaluation                                                 |
| C.3.1     | Monitoring               | Live Matrix                          | Group progress and deliverables                                                |
| C.3.2     | Assessment               | AI Assessment Editor                 | Auto-generated assessment drafts                                               |
| C.3.3     | Recognition              | Hall of Fame Selection               | Highlight top-performing teams                                                 |
