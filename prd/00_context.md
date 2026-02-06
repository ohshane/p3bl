# Context

## Implementation Scope

### Phase 1: Explorer-first MVP

The initial implementation focuses exclusively on the **Explorer** role and experience. This includes:

| Scope          | Feature IDs         | Description                                                                              |
| -------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| Waiting Lounge | E.0.1, E.0.2, E.0.3 | Project entry, manual join, floating bot assistance                                      |
| Workspace      | E.1.0 – E.1.8       | State manager, onboarding, active state, project list, profile, group chat, hall of fame |

### Workspace State Logic (E.1.0 State Manager)

The Explorer workspace operates in two modes based on **per-project state**:

| Condition                                             | Mode                | UI Shown                                                                                             |
| ----------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| User has **zero joined projects**                     | Mode A (Onboarding) | E.1.1 Invitation Card, E.1.2 Manual Code Input, E.1.3 Floating Bot                                   |
| User has **one or more joined projects** (any status) | Mode B (Active)     | E.1.4 Global Project Bar, E.1.5 My Project List, E.1.6 Profile, E.1.7 Group Chat, E.1.8 Hall of Fame |

**State transition rules:**

- **A → B**: Triggered when user accepts an invitation (E.1.1) or submits a valid join code (E.1.2)
- **B → A**: Triggered when user has zero joined projects (e.g., all projects are removed/deleted by creator, or user leaves all projects)
- Completed projects **count** toward joined projects — a user with only completed projects remains in Mode B
- Mode B displays both Active and Completed tabs (E.1.5.1, E.1.5.2) regardless of project mix

| Scope            | Feature IDs     | Description                                                                                        |
| ---------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| Activity Zone    | E.2.0 – E.2.6.3 | Voyage navigator, reflection/cockpit/preview nodes, resources, smart output builder, feedback loop |
| Growth Portfolio | E.3.1 – E.3.3.3 | Artifact gallery, competency dashboard, achievement archive                                        |

### Invitation Card (E.0.1, E.1.1) & Manual Code Input (E.0.2, E.1.2)

The project joining experience uses a **minimal quick-join** approach.

#### Invitation Card (E.0.1, E.1.1)

```
┌─────────────────────────────────────┐
│  You're invited!                    │
│                                     │
│  [Project Name]                     │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  Join   │  │ Dismiss │          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
```

| Element        | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| Header         | "You're invited!"                                              |
| Project name   | Name of the project (only detail shown before joining)         |
| Join button    | Primary action — accepts invitation                            |
| Dismiss button | Secondary action — hides the card (invitation remains pending) |

**Invitation Card Behavior:**

- Card appears when user has a pending invitation (from mock data or URL param in Phase 1)
- No preview of project details, team assignment, or description until after joining
- Clicking "Join" immediately processes the invitation and triggers state transition
- Clicking "Dismiss" hides the card; invitation can be accessed again via Manual Code Input or next session

#### Manual Code Input (E.0.2, E.1.2)

```
┌─────────────────────────────────────┐
│  Have a join code?                  │
│                                     │
│  ┌─────────────────────┐  ┌──────┐ │
│  │ ABC123              │  │ Join │ │
│  └─────────────────────┘  └──────┘ │
│                                     │
│  [Error message appears here]       │
└─────────────────────────────────────┘
```

| Element     | Description                                 |
| ----------- | ------------------------------------------- |
| Label       | "Have a join code?"                         |
| Input field | Single text input for 6-character code      |
| Join button | Submits the code for validation             |
| Error area  | Inline error message (hidden when no error) |

#### Join Code Format

| Aspect             | Specification                                         |
| ------------------ | ----------------------------------------------------- |
| Format             | 6-character alphanumeric (uppercase letters + digits) |
| Example            | `ABC123`, `X7Y2Z9`                                    |
| Case sensitivity   | Case-insensitive (input normalized to uppercase)      |
| Allowed characters | A–Z, 0–9 only                                         |

#### Validation Behavior

| Scenario                                  | Behavior                                                              |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Empty input                               | "Join" button disabled                                                |
| Invalid format (< 6 chars, special chars) | Inline error: "Code must be 6 characters (letters and numbers only)"  |
| Invalid code (not found)                  | Toast error: "Invalid code. Please check and try again."              |
| Expired code                              | Toast error: "This code has expired. Please contact your instructor." |
| Valid code                                | Process join, navigate to Activity Zone                               |

#### Rate Limiting

| Aspect           | Specification                                               |
| ---------------- | ----------------------------------------------------------- |
| Attempt limit    | 5 failed attempts within 5 minutes                          |
| Cooldown         | After 5 failures, input disabled for 5 minutes              |
| Cooldown message | "Too many attempts. Please try again in X minutes."         |
| Reset            | Counter resets after successful join or cooldown expiration |

#### Success Behavior

After successful join (via Invitation Card or Manual Code):

1. Display brief success toast: "Welcome to [Project Name]!"
2. Navigate directly to **Activity Zone (E.2)** for the newly joined project
3. Activity Zone opens to the current session's Cockpit panel
4. If user was in Mode A (Onboarding), state transitions to Mode B (Active)

#### Empty State (No Invitations, Mode A)

When user is in Mode A with no pending invitations:

- Invitation Card section hidden
- Manual Code Input prominently displayed
- Floating Bot available for assistance
- Message: "Enter a join code from your instructor to get started"

### Group Chat Model (E.1.7)

Group Chat is **team-scoped** with the following specifications:

| Aspect                 | Specification                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Scope**              | One chat room per team (not per project)                                               |
| **Human participants** | All members of the team                                                                |
| **AI participants**    | AI personas assigned to the project by the Creator                                     |
| **AI behavior**        | AI personas respond automatically to relevant messages (no explicit @mention required) |
| **Persistence**        | Messages are persisted; chat history is loaded when user enters the chat               |
| **Visibility**         | Team members can only see their own team's chat; no cross-team visibility              |

**AI auto-response rules:**

- AI personas monitor all messages in the team chat
- AI determines relevance based on message content and current activity/session context
- AI may proactively offer guidance, answer questions, or prompt discussion
- Specific AI response triggering logic (e.g., keywords, silence detection, sentiment) is defined by the Creator during project setup (out of scope for Phase 1 — use default behavior in mock data)

### Intelligent Voyage Navigator (E.2.0)

The Intelligent Voyage Navigator uses a **three-panel simultaneous view** layout displaying Reflection, Cockpit, and Preview nodes.

#### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────┐  ┌─────────────────────┐  ┌───────────────┐  │
│  │  Reflection   │  │                     │  │    Preview    │  │
│  │    (n-1)      │  │      Cockpit        │  │     (n+1)     │  │
│  │               │  │     (Present)       │  │               │  │
│  │  [Compact]    │  │                     │  │  [Compact]    │  │
│  │               │  │    [Expanded]       │  │               │  │
│  └───────────────┘  └─────────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Panel Specifications

| Panel             | Default State        | Content                                                                         | Click Behavior                                                      |
| ----------------- | -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Reflection (n-1)  | Compact (20% width)  | Previous session summary, completed deliverables, AI feedback received          | Expands to show full reflection details; Cockpit and Preview shrink |
| Cockpit (Present) | Expanded (60% width) | Current session topic, active deliverables, progress indicators, action buttons | Always interactive; contains primary workspace controls             |
| Preview (n+1)     | Compact (20% width)  | Upcoming session overview, expected deliverables, preparation hints             | Expands to show full preview details; Cockpit and Reflection shrink |

#### Navigation Behavior

- **Focus/Expand**: Click any panel to expand it and make it the focus. Other panels shrink but remain visible.
- **Return to default**: Click the currently expanded panel (or a "back" control) to return to default layout with Cockpit expanded.
- **Session switching**: Users can navigate to any session via a session dropdown/selector in the header. Selecting a different session updates all three panels relative to the selected session.
- **Boundary behavior**:
  - First session: Reflection panel shows "Project Start" placeholder with project overview
  - Last session: Preview panel shows "Project Completion" placeholder with final submission info

#### Node Content Details

| Node                  | Content Elements                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reflection (n-1)**  | Session title, completion date, submitted artifacts (thumbnails/links), AI feedback summary, self-reflection prompts                                     |
| **Cockpit (Present)** | Session title, due date/D-day indicator, session guide/instructions, deliverable checklist, "Enter Smart Output Builder" button, team progress indicator |
| **Preview (n+1)**     | Session title, scheduled date, topic overview, expected deliverables list, preparation checklist, "What to expect" AI-generated summary                  |

### Smart Output Builder (E.2.5)

The Smart Output Builder uses a **rich text editor** for document deliverables.

#### Supported Deliverable Types (Phase 1)

| Deliverable Type | Editor Mode         | Description                                                |
| ---------------- | ------------------- | ---------------------------------------------------------- |
| None             | N/A                 | Session has no deliverable requirement                     |
| Document         | Rich text (WYSIWYG) | TipTap or similar rich text editor with formatting toolbar |

> **Note**: Additional deliverable types (code, markdown, presentation, mixed) may be added in future phases.

#### Editor Mode Selection

- The deliverable type is defined by the Creator during project setup (C.2.7.3)
- For Phase 1: Only `none` and `document` deliverable types are supported
- If no deliverable type is specified, default to **document** (Rich text WYSIWYG)

#### Ghost Typing (E.2.5.2) Behavior

| Aspect         | Specification                                                                         |
| -------------- | ------------------------------------------------------------------------------------- |
| **Trigger**    | 2 seconds of typing inactivity (no keystrokes)                                        |
| **Appearance** | Suggested text appears inline in grayed/dimmed style after cursor position            |
| **Accept**     | Press `Tab` to accept the full suggestion                                             |
| **Dismiss**    | Continue typing to dismiss, or press `Escape`                                         |
| **Context**    | AI uses current document content, session topic, rubric, and chat history for context |

#### Template Injection (E.2.5.3)

- Templates are defined by the Creator per session/deliverable (provided in mock data for Phase 1)
- User triggers template injection via a button or keyboard shortcut (`Cmd/Ctrl + Shift + T`)
- Template is inserted at cursor position
- If multiple templates are available, show a dropdown picker

### Feedback & Submission Loop (E.2.6)

The submission workflow uses a **mandatory with soft gate** model where AI pre-check is required before first submission but does not hard-block users.

#### Submission States

| State                  | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| **Draft**              | Work in progress, auto-saved. Not yet submitted.                |
| **Pre-check Pending**  | AI pre-check has been requested and is processing.              |
| **Pre-check Complete** | AI pre-check results are available. User can review and submit. |
| **Submitted**          | Artifact has been submitted for review. Creates a new version.  |
| **Under Review**       | Submission is being reviewed.                                   |
| **Needs Revision**     | Changes have been requested. User can edit and resubmit.        |
| **Approved**           | Submission accepted. Final for this version.                    |

#### AI Pre-check (E.2.6.1) Workflow

1. **First submission requirement**: AI pre-check is mandatory before the first submission of a deliverable.
2. **Trigger**: User clicks "Run Pre-check" button or "Submit" (which auto-triggers pre-check if not yet run).
3. **Processing**: AI evaluates artifact against session rubric. Shows loading state.
4. **Results display**: Pre-check results shown in a panel with:
   - Overall readiness score (e.g., "Ready", "Needs Work", "Critical Issues")
   - Rubric-aligned feedback items (categorized by severity: Critical, Warning, Suggestion)
   - Specific inline annotations in the editor (if applicable)
5. **Soft gate behavior**:
   - If **no critical issues**: User can submit directly.
   - If **critical issues found**: User sees a confirmation dialog: "AI found critical issues. Are you sure you want to submit?" with options "Review Issues" or "Submit Anyway".
6. **Subsequent submissions**: After the first submission, pre-check is optional. User can submit directly or run pre-check again.

#### Versioning (E.2.6.3) Rules

| Event                                       | Version Created? | Version Number   |
| ------------------------------------------- | ---------------- | ---------------- |
| Auto-save (draft)                           | No               | —                |
| Manual save (draft)                         | No               | —                |
| First submission                            | Yes              | v1.0             |
| Resubmission after revision                 | Yes              | v1.1, v1.2, etc. |
| Major revision (after approval, if allowed) | Yes              | v2.0             |

- Each submission creates a new immutable version.
- Previous versions remain accessible in version history.
- Version comparison (diff view) available for text-based artifacts.

#### Expert Review (E.2.6.2)

- Expert review is optional per session (defined by Creator in project setup; provided in mock data for Phase 1).
- If enabled, submission triggers notification to assigned expert(s).
- Expert provides feedback via threaded comments attached to the submission.
- Expert can mark submission as "Approved" or "Needs Revision".
- Explorer receives notification of expert feedback.
- For Phase 1: Expert review UI is out of scope (expert side). Explorer sees review status and feedback when provided via mock data.

### Competency Dashboard (E.3.2)

The Competency Dashboard uses **fixed global competencies** with AI-derived scores.

#### Core Competencies

The platform defines a fixed set of 5 core competencies displayed on the radar chart:

| Competency            | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| **Critical Thinking** | Ability to analyze, evaluate, and synthesize information to form judgments |
| **Communication**     | Clarity, coherence, and effectiveness in written and verbal expression     |
| **Collaboration**     | Contribution to team dynamics, responsiveness, and peer support            |
| **Creativity**        | Originality, innovation, and novel approaches in problem-solving           |
| **Problem Solving**   | Ability to identify issues, develop solutions, and implement effectively   |

#### Score Calculation

| Data Source               | Weight | Description                                                      |
| ------------------------- | ------ | ---------------------------------------------------------------- |
| Artifact content analysis | 50%    | AI analyzes submitted artifacts for evidence of each competency  |
| AI feedback history       | 25%    | Aggregated AI feedback from pre-checks and coaching interactions |
| Activity engagement       | 25%    | Participation in chat, session completion rate, timeliness       |

- Scores are calculated on a scale of 0–100 for each competency.
- Scores update after each artifact submission and at session completion.
- AI generates a brief textual insight for each competency explaining the score.

#### Growth Overlay (E.3.2.2)

| Comparison   | Description                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| **Baseline** | Scores at time of first submission in the project                               |
| **Current**  | Latest calculated scores                                                        |
| **Display**  | Radar chart shows both baseline (dashed line) and current (solid line) overlaid |

- Growth delta is shown numerically next to each competency label (e.g., "+12" or "-3").
- If no baseline exists (no submissions yet), radar chart shows current scores only with "No baseline yet" indicator.

#### AI Insights (E.3.2.3)

- AI generates 2–3 sentences of growth insights per competency.
- Insights reference specific artifacts or activities that influenced the score.
- Insights include actionable suggestions for improvement.
- Insights regenerate after each score update.

### Artifact Gallery (E.3.1)

The Artifact Gallery uses a **project-grouped chronological** organization model.

#### Gallery Organization

| Level                 | Organization                                          |
| --------------------- | ----------------------------------------------------- |
| **Primary grouping**  | By project (collapsible sections)                     |
| **Secondary sorting** | By submission date within each project (newest first) |
| **Display modes**     | List view (default) / Grid view (toggle)              |

#### Gallery Item Display

Each artifact item shows:

| Element           | Description                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| Thumbnail/Icon    | Preview image for documents, language icon for code, file type icon for others |
| Title             | Artifact title (deliverable name + version)                                    |
| Project & Session | Project name and session name badges                                           |
| Submission date   | Relative time (e.g., "2 days ago") or absolute date                            |
| Status badge      | Approved / Under Review / Needs Revision                                       |
| Quick actions     | View, Share, Download                                                          |

#### Showcase Link (E.3.1.1)

| Aspect                   | Specification                                               |
| ------------------------ | ----------------------------------------------------------- |
| **Default expiration**   | 30 days from creation                                       |
| **Configurable options** | 7 days, 30 days, 90 days, Never expires                     |
| **Link format**          | Public URL accessible without login                         |
| **Content**              | Read-only view of the artifact with project/session context |
| **Revocation**           | User can manually revoke/disable a link at any time         |

#### Share to Team (E.3.1.2)

When sharing to team chat, a **rich card** is posted containing:

| Element         | Description                                          |
| --------------- | ---------------------------------------------------- |
| Artifact title  | Clickable link to open the artifact                  |
| Thumbnail       | Small preview image (if applicable)                  |
| Author          | Name of the Explorer who shared                      |
| Session context | "From [Session Name]"                                |
| Snippet         | First 100 characters of text content (if text-based) |
| Action button   | "View Full Artifact"                                 |

#### Empty State

When the gallery has no artifacts:

- Display illustration with message: "No artifacts yet"
- Subtext: "Complete your first deliverable to see it here"
- Link to current active session (if any)

### Achievement Archive (E.3.3)

The Achievement Archive uses **fixed platform badges with auto-award** and AI-generated experience synthesis.

#### Badge Collection (E.3.3.1)

##### Badge Categories

| Category          | Badge Name             | Criteria                                           | Icon Style  |
| ----------------- | ---------------------- | -------------------------------------------------- | ----------- |
| **Milestone**     | First Steps            | Submit first artifact in any project               | Footprints  |
| **Milestone**     | Project Pioneer        | Complete first project                             | Flag        |
| **Milestone**     | Seasoned Explorer      | Complete 3 projects                                | Compass     |
| **Milestone**     | Master Explorer        | Complete 5 projects                                | Star        |
| **Engagement**    | Early Bird             | Submit artifact 24+ hours before deadline          | Sun         |
| **Engagement**    | Consistent Contributor | Submit on-time for 5 consecutive sessions          | Calendar    |
| **Engagement**    | Team Player            | Send 50+ chat messages across all projects         | Chat bubble |
| **Collaboration** | Helping Hand           | Share 5+ artifacts to team chat                    | Hand        |
| **Collaboration** | Feedback Friend        | Receive "helpful" reactions on 3+ shared artifacts | Heart       |
| **Competency**    | Critical Thinker       | Reach 70+ in Critical Thinking competency          | Brain       |
| **Competency**    | Communicator           | Reach 70+ in Communication competency              | Megaphone   |
| **Competency**    | Collaborator           | Reach 70+ in Collaboration competency              | People      |
| **Competency**    | Creative Mind          | Reach 70+ in Creativity competency                 | Lightbulb   |
| **Competency**    | Problem Solver         | Reach 70+ in Problem Solving competency            | Puzzle      |

##### Badge Award Behavior

- Badges are awarded automatically when criteria are met.
- User receives a notification when a new badge is earned.
- Badges display with earned date and the project/context where earned.
- Badges cannot be revoked once earned.

##### Badge Display

- Badges shown in a grid layout, grouped by category.
- Earned badges are full color; unearned badges are grayed/locked with progress indicator (if applicable).
- Clicking a badge shows detail modal with description, earned date, and context.

#### Experience Synthesis (E.3.3.2)

| Aspect          | Specification                                                                             |
| --------------- | ----------------------------------------------------------------------------------------- |
| **Format**      | Single AI-generated paragraph (150–250 words) summarizing the Explorer's learning journey |
| **Content**     | Projects completed, key artifacts, competency growth highlights, notable badges           |
| **Generation**  | Auto-generated; regenerates when new project is completed or on-demand                    |
| **Editability** | Non-editable by user (AI-generated content only)                                          |
| **Export**      | Copy to clipboard button for use in portfolios/applications                               |

#### Feedback History (E.3.3.3)

| Aspect        | Specification                                                                       |
| ------------- | ----------------------------------------------------------------------------------- |
| **Source**    | All AI feedback from pre-checks, coaching, and reviews                              |
| **Reframing** | AI transforms critical/negative feedback into constructive growth-oriented language |
| **Display**   | Chronological list (newest first) with project/session context                      |
| **Filtering** | Filter by project, competency area, or date range                                   |

##### Positive Reframing Examples

| Original Feedback                          | Reframed Version                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| "Your argument lacks supporting evidence." | "You have a strong thesis. Adding more supporting evidence will make your argument even more compelling."   |
| "The code has several bugs."               | "Your code demonstrates good logic flow. Debugging these areas will strengthen your implementation skills." |

### Floating Bot Assistance (E.0.3, E.1.3)

The Floating Bot uses a **chat bubble widget** design pattern.

#### Visual Design

| Aspect       | Specification                                                                            |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Form**     | Circular floating button (48px diameter) with bot avatar icon                            |
| **Position** | Fixed to bottom-right corner of viewport (24px from edges)                               |
| **Z-index**  | Above all content, below modals                                                          |
| **States**   | Default (idle), Hover (slight scale), Active (chat open), Notification (pulse animation) |

#### Chat Panel

When the bot button is clicked, a chat panel expands:

| Aspect       | Specification                                                  |
| ------------ | -------------------------------------------------------------- |
| **Size**     | 360px wide × 480px tall (desktop); full-width × 60vh (mobile)  |
| **Position** | Anchored to bottom-right, expands upward and leftward          |
| **Header**   | Bot name ("Learning Assistant"), minimize button, close button |
| **Body**     | Scrollable message area with bot and user messages             |
| **Input**    | Text input field with send button at bottom                    |

#### Interaction Model

| Trigger                 | Behavior                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **First visit**         | Bot automatically opens after 3 seconds with proactive greeting: "Hi! I'm here to help you get started. Have a join code or invitation link?" |
| **Click bot button**    | Toggle chat panel open/closed                                                                                                                 |
| **Click outside panel** | Panel remains open (explicit close required)                                                                                                  |
| **Press Escape**        | Close chat panel                                                                                                                              |
| **Submit message**      | Bot responds with AI-generated answer                                                                                                         |

#### Bot Capabilities

| Capability               | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| **Join code help**       | Explain where to find join codes, how to enter them             |
| **Invitation link help** | Explain how invitation links work                               |
| **Platform navigation**  | Answer questions about how to use the platform                  |
| **General Q&A**          | Answer general questions about learning, projects, and features |
| **Escalation**           | If unable to help, suggest contacting instructor/support        |

#### Availability

| Context                       | Bot Available?                                    |
| ----------------------------- | ------------------------------------------------- |
| Waiting Lounge (E.0)          | Yes                                               |
| Workspace Mode A (Onboarding) | Yes                                               |
| Workspace Mode B (Active)     | No — Group Chat with AI personas serves this role |
| Activity Zone                 | No — AI Copilot serves this role                  |
| Growth Portfolio              | No                                                |

### Resource & Guide Hub (E.2.4)

The Resource & Guide Hub uses a **static instructor resources** model with no AI personalization.

#### Layout Structure

```
┌─────────────────────────────────────────┐
│  Resource & Guide Hub                   │
├─────────────────────────────────────────┤
│  📖 Session Guide                       │
│  ┌─────────────────────────────────────┐│
│  │ [Expandable text content]           ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  📁 Resources                           │
│  ┌─────────────────────────────────────┐│
│  │ • Resource 1 (PDF)         [Open]   ││
│  │ • Resource 2 (Link)        [Open]   ││
│  │ • Resource 3 (Video)       [Play]   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

#### Session Guide

| Aspect            | Specification                                                           |
| ----------------- | ----------------------------------------------------------------------- |
| **Source**        | Instructor-defined text per session (provided in mock data for Phase 1) |
| **Format**        | Rich text content displayed in expandable section                       |
| **Default state** | Expanded on first visit to session, collapsed on subsequent visits      |
| **Content types** | Text, formatted headings, bullet lists, embedded images                 |

#### Resources

| Aspect              | Specification                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Source**          | Instructor-uploaded files and links per session (provided in mock data for Phase 1)                            |
| **Supported types** | PDF, Word, PowerPoint, external links, YouTube/video embeds, images                                            |
| **Display**         | List format with file type icon, title, and action button                                                      |
| **Actions by type** | PDF/Docs: Open in new tab or embedded viewer; Links: Open in new tab; Videos: Play in modal or embedded player |

#### Resource Item Display

Each resource item shows:

| Element       | Description                                                |
| ------------- | ---------------------------------------------------------- |
| Icon          | File type icon (PDF, link, video, document)                |
| Title         | Resource name (instructor-defined)                         |
| Type badge    | Small label indicating type (e.g., "PDF", "Video", "Link") |
| Action button | "Open", "Play", or "View" depending on type                |

#### Scope & Context

| Aspect          | Specification                                                                 |
| --------------- | ----------------------------------------------------------------------------- |
| **Scope**       | Resources are session-specific; each session has its own set                  |
| **Access**      | All resources for a session are available immediately (no progressive unlock) |
| **Persistence** | Resources from past sessions remain accessible via session navigation         |

#### Empty State

When a session has no resources:

- Display message: "No resources for this session"
- Subtext: "Your instructor hasn't added any materials yet"

### My Profile & Growth (E.1.6)

My Profile & Growth is a **navigation card to Growth Portfolio** — a compact summary card in the Workspace that links to the full Growth Portfolio (E.3).

#### Card Layout

```
┌─────────────────────────────────────┐
│  ┌──────┐                           │
│  │Avatar│  [User Name]              │
│  └──────┘  Level 3 Explorer         │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │Badge│ │Badge│ │Badge│  +2 more   │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  [View Full Portfolio →]            │
└─────────────────────────────────────┘
```

#### Card Content

| Element        | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| Avatar         | User's profile picture (from account settings) or default avatar |
| Name           | User's display name (from account settings)                      |
| Level          | Current Explorer level with label (e.g., "Level 3 Explorer")     |
| Recent badges  | Up to 3 most recently earned badges displayed as icons           |
| Badge overflow | "+N more" text if user has more than 3 badges                    |
| CTA link       | "View Full Portfolio" links to Growth Portfolio (E.3)            |

#### Level System

| Level | Name      | XP Required | XP Sources |
| ----- | --------- | ----------- | ---------- |
| 1     | Newcomer  | 0           | —          |
| 2     | Learner   | 100         | —          |
| 3     | Explorer  | 300         | —          |
| 4     | Navigator | 600         | —          |
| 5     | Pioneer   | 1000        | —          |
| 6     | Master    | 1500        | —          |

##### XP Earning

| Activity               | XP Awarded         |
| ---------------------- | ------------------ |
| Submit artifact        | +20 XP             |
| Artifact approved      | +30 XP             |
| Complete session       | +25 XP             |
| Complete project       | +100 XP            |
| Earn badge             | +15 XP             |
| Send chat message      | +1 XP (max 10/day) |
| Share artifact to team | +5 XP              |

- XP is cumulative and never decreases.
- Level progress bar shown on hover/tap of level label.
- Level-up triggers a celebratory notification.

#### Profile Editing

- Profile avatar and name are managed in **Account Settings** (global, not part of E.1.6).
- No editable fields within My Profile & Growth card itself.
- For Phase 1: Account settings UI is out of scope; use mock user data.

#### Click Behavior

- Clicking anywhere on the card (except the CTA link) does nothing.
- Clicking "View Full Portfolio" navigates to Growth Portfolio (E.3).

### My Project List (E.1.5) & Global Project Bar (E.1.4)

The Workspace uses a **card grid with embedded notifications** model. There is no separate Global Project Bar component — project context and notifications are embedded within project cards.

#### My Project List Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  My Projects                                                    │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Active    │  │  Completed  │                              │
│  └─────────────┘  └─────────────┘                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ 🔔 2            │  │                 │  │                 │ │
│  │ [Project Card]  │  │ [Project Card]  │  │ [Project Card]  │ │
│  │ ★ Current       │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab Behavior (E.1.5.1, E.1.5.2)

| Tab                  | Content                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Active** (default) | Projects with status "In Progress" — user has not completed all sessions                  |
| **Completed**        | Projects with status "Completed" — user has submitted final deliverables for all sessions |

- Tab shows count badge (e.g., "Active (3)", "Completed (2)").
- Empty tab shows: "No [active/completed] projects" with appropriate illustration.

#### Project Card Content

Each project card displays:

| Element                | Description                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Notification badge** | Red circle with count in top-right corner (if notifications > 0)                    |
| **Project name**       | Title of the project                                                                |
| **Creator name**       | "By [Instructor Name]"                                                              |
| **Current session**    | "Session 3 of 6" or "Completed"                                                     |
| **Due date**           | Next deliverable due date with D-day indicator (e.g., "Due in 2 days" or "Overdue") |
| **Progress bar**       | Visual indicator of sessions completed vs total                                     |
| **Team name**          | "Team: [Team Name]"                                                                 |
| **Current indicator**  | Star icon (★) if this is the most recently accessed project                         |

#### Card States

| State                     | Visual Treatment                                     |
| ------------------------- | ---------------------------------------------------- |
| **Current (most recent)** | Highlighted border, star icon, appears first in grid |
| **Has notifications**     | Red notification badge with count                    |
| **Overdue**               | Red due date text, warning icon                      |
| **On track**              | Normal appearance                                    |
| **Completed**             | Checkmark overlay, muted colors                      |

#### Notification Types

| Type                  | Trigger                                      | Display                                |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| **New feedback**      | Expert or AI feedback received on submission | "New feedback on [Artifact Name]"      |
| **Review complete**   | Submission approved or needs revision        | "Submission [approved/needs revision]" |
| **Session unlocked**  | New session becomes available                | "Session [N] is now available"         |
| **Deadline reminder** | 24 hours before due date                     | "Deadline tomorrow: [Deliverable]"     |
| **Team message**      | @mention in team chat                        | "[Name] mentioned you in chat"         |

- Notification count on card is aggregate of all unread notifications for that project.
- Clicking notification badge opens notification dropdown (see below).

#### Notification Dropdown

When notification badge is clicked:

```
┌─────────────────────────────────────┐
│  Notifications (2)         [Clear] │
├─────────────────────────────────────┤
│  🔔 New feedback on Essay v1.0     │
│     2 hours ago                     │
├─────────────────────────────────────┤
│  🔔 Session 4 is now available     │
│     1 day ago                       │
└─────────────────────────────────────┘
```

- Clicking a notification navigates to relevant location (artifact, session, chat).
- "Clear" marks all as read.

#### Click Behavior

| Target                                            | Action                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Project card (anywhere except notification badge) | Navigate to Activity Zone (E.2) for that project, current session |
| Notification badge                                | Open notification dropdown                                        |
| Notification item                                 | Navigate to relevant content                                      |

#### Global Project Bar (E.1.4) — Clarification

E.1.4 "Global Project Bar" is **not a separate persistent component**. Instead:

- The "current project" concept is tracked by the system (most recently accessed project).
- The current project card is visually highlighted and sorted first in the grid.
- When in Activity Zone (E.2), a breadcrumb/header shows the current project context.

### Hall of Fame (E.1.8)

The Hall of Fame displays **global top performers** based on AI/system selection with anonymized rankings and opt-in participation.

#### Display Format

Hall of Fame is displayed as a **leaderboard section** within the Workspace (Mode B).

```
┌─────────────────────────────────────────────────┐
│  Hall of Fame                          [Opt In] │
├─────────────────────────────────────────────────┤
│  🏆 Top Explorers This Month                    │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. Explorer_A123    Level 5   1,250 XP     ││
│  │ 2. Explorer_B456    Level 5   1,180 XP     ││
│  │ 3. Explorer_C789    Level 4     920 XP     ││
│  │ ...                                         ││
│  │ 15. You (opt-in to see rank)               ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [View Full Leaderboard]                        │
└─────────────────────────────────────────────────┘
```

#### Selection Criteria

| Metric                    | Weight | Description                                        |
| ------------------------- | ------ | -------------------------------------------------- |
| XP earned (current month) | 50%    | Total XP accumulated in the current calendar month |
| Competency growth         | 30%    | Average improvement across 5 competencies          |
| Project completions       | 20%    | Number of projects completed in current month      |

- Rankings are calculated daily and updated at midnight (UTC).
- Top 50 performers are included in the leaderboard.
- Rankings reset on the 1st of each month.

#### Anonymization & Privacy

| Aspect              | Specification                                                                     |
| ------------------- | --------------------------------------------------------------------------------- |
| **Display name**    | Anonymized username (e.g., "Explorer_A123") — NOT real name                       |
| **Opt-in required** | Users must opt-in via profile settings to appear on leaderboard                   |
| **Default state**   | Opted-out (user does not appear until they opt-in)                                |
| **Self-visibility** | User always sees their own rank (if opted-in) or "Opt-in to see your rank" prompt |

#### Opt-In Flow

1. User clicks "Opt In" button in Hall of Fame section header.
2. Confirmation modal explains: "Your anonymized username and ranking will be visible to other learners. Your real name is never shown."
3. User confirms or cancels.
4. If confirmed, user appears in next daily ranking update.
5. User can opt-out anytime via the same button (changes to "Opt Out").

#### Leaderboard Content

Each leaderboard entry shows:

| Element         | Description                                           |
| --------------- | ----------------------------------------------------- |
| Rank            | Position (1, 2, 3, etc.) with medal icons for top 3   |
| Anonymized name | System-generated display name (e.g., "Explorer_X123") |
| Level           | Current Explorer level                                |
| XP (this month) | XP earned in current calendar month                   |

#### Full Leaderboard View

- "View Full Leaderboard" opens a modal or dedicated page showing top 50 performers.
- Includes filters: This Month / All Time.
- User's own position highlighted if opted-in.

#### Empty State (New Month)

When a new month begins:

- Message: "A new month begins! Rankings are being calculated."
- Previous month's top 3 shown as "Last Month's Champions."

### Responsive Design (Phase 1)

Phase 1 uses a **desktop-only MVP** approach.

#### Target Device

| Aspect                   | Specification                                    |
| ------------------------ | ------------------------------------------------ |
| **Primary target**       | Desktop browsers (Chrome, Firefox, Safari, Edge) |
| **Minimum viewport**     | 1024px width                                     |
| **Recommended viewport** | 1280px+ width                                    |

#### Mobile/Tablet Behavior

| Viewport           | Behavior                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **< 1024px width** | Display blocking message: "P3BL works best on desktop. Please switch to a device with a larger screen for the full experience." |
| **1024px+ width**  | Full application rendered                                                                                                       |

#### Blocking Message UI

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [P3BL Logo]                        │
│                                                 │
│    P3BL works best on desktop.                  │
│                                                 │
│    Please switch to a device with a             │
│    larger screen for the full experience.       │
│                                                 │
│    Minimum screen width: 1024px                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Centered vertically and horizontally
- Simple, clean design with logo
- No navigation or other UI elements shown
- Message displays on any device/browser below 1024px viewport width

#### Phase 2 Consideration

Mobile and tablet support is explicitly deferred to Phase 2. When implemented, it will require:

- Responsive layouts for all specified features
- Touch-optimized interactions
- Mobile-specific adaptations for complex UIs (Voyage Navigator, Smart Output Builder)

### Authentication (Phase 1)

Phase 1 uses **mock authentication** — real authentication is deferred to Phase 2.

#### Mock Authentication Behavior

| Aspect                  | Specification                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **Login flow**          | Auto-login as a predefined test user on app load                                             |
| **User selection**      | Developer can switch between test users via a dev toolbar (not visible in production builds) |
| **Session persistence** | Mock session persists in localStorage; cleared on explicit logout or browser clear           |
| **Logout**              | "Logout" button available in header; clears mock session and reloads as default test user    |

#### Test User Profiles

For Phase 1, provide at least 3 mock user profiles:

| User ID    | Name            | State               | Projects                            |
| ---------- | --------------- | ------------------- | ----------------------------------- |
| `user_001` | Alex Explorer   | Active (Mode B)     | 2 active projects, 1 completed      |
| `user_002` | Jordan Newcomer | Onboarding (Mode A) | 0 projects (has pending invitation) |
| `user_003` | Sam Veteran     | Active (Mode B)     | 0 active, 3 completed projects      |

#### Invitation Link Handling (Phase 1)

- Invitation links in Phase 1 are simulated via URL parameters (e.g., `?invite=PROJECT123`).
- On app load, if `invite` param exists, simulate invitation acceptance flow.
- No real authentication check — user is already "logged in" as mock user.

#### Dev Toolbar (Development Only)

A collapsible toolbar in development builds allows:

- Switch between test users
- Reset user state to defaults
- Trigger specific scenarios (e.g., "new badge earned", "notification received")

#### Phase 2 Authentication

Real authentication implementation in Phase 2 will include:

- Email/password registration and login
- SSO integration (Google, Microsoft, institutional)
- Invitation link flow with authentication gate
- Password reset and account management

**Out of scope for Phase 1:**

- Admin Panel (A.x) — all features
- Creators (C.x) — all features
- Mobile/tablet responsive layouts (viewport < 1024px)

**Data strategy for Phase 1:**

- Projects, teams, AI personas, and instructor content will be provided via mock/stub data
- No project creation or administrative configuration UI will be implemented

---

## Goals

- Develop an AI-driven learning platform that personalizes educational content based on individual learner needs and preferences
- Create an interactive learning environment that fosters engagement through gamification, quizzes, and real-time feedback
- Ensure accessibility for learners of all backgrounds, including those with disabilities
- Integrate collaborative spaces like the Activity Zone for peer-to-peer learning and multi-persona collaboration

## Non-Goals

- Building a traditional Learning Management System (LMS) without AI capabilities
- Focusing solely on content delivery without interactive elements or learner engagement features
- Targeting only a specific age group or educational level; the platform aims to be versatile for all learners

## Definitions

| Term                             | Definition                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Admin Panel                      | Entry point for system-wide configuration, monitoring, and administrative control.                     |
| System Dashboard                 | High-level overview of system activity, traffic, and AI utilization metrics.                           |
| User & Organization Management   | Management of users, organizational hierarchies (School → Dept → Class), and access control (SSO/IAM). |
| Infrastructure & Cost Management | Control of system resources, API deployments, and AI token usage/quotas per session or project.        |
| Security & Ethics Guidelines     | Enforcement of AI ethics standards, content guardrails, and data anonymization protocols.              |
| Data Logging & Analytics         | Collection of system logs and user-level activity reports for auditing and performance analysis.       |
| Creators                         | Users (instructors/designers) who design and manage projects using generative AI tools.                |
| Project Dashboard                | Overview of active projects, featuring live progress cards and risk signaling.                         |
| The Dip Chart                    | Visualization of learner confidence/engagement trends and AI efficacy gaps.                            |
| People & Org Management          | AI-assisted tools for team building, enrollment, and member/team discovery.                            |
| Project Creation Wizard          | AI-powered workflow for generating projects from keywords, documents, or manual inputs.                |
| Monitoring & Assessment          | Real-time tracking of project health (Signal & Risk Center) and AI-assisted evaluation/grading.        |
| Signal & Risk Center             | Visualization of project/team risks using a "Traffic Light" system (Red/Yellow/Green).                 |
| Explorers                        | Learners who participate in missions, collaboration, and personal growth tracking.                     |
| Waiting Lounge                   | Pre-project state for invitation management, manual join codes, and onboarding assistance.             |
| Workspace                        | Primary area for learners to manage their projects, identity (roles/badges), and exploration roadmap.  |
| Exploration Roadmap              | Summary of past, current, and future missions with milestone alerts and D-day indicators.              |
| Activity Zone                    | Core execution area featuring multi-persona collaboration and AI-assisted content creation.            |
| Intelligent Voyage Navigator     | AI-powered guidance system for navigating through reflection (past) and preview (future) nodes.        |
| Smart Output Builder             | Collaborative space with AI Copilot (Ghost Typing) and multimodal processing for artifact creation.    |
| Feedback & Submission Loop       | Integrated workflow for AI pre-checks and versioned artifact submission.                               |
| Growth Portfolio                 | Personal archive for tracking achievements, artifacts, and competency growth over time.                |
| Artifact Gallery                 | Curated collection of completed project outputs with auto-curation and shareable links.                |
| Competency Dashboard             | Visualization of skill development using Radar Charts and AI-generated growth insights.                |
| Achievement Archive              | Storage of earned badges, experience synthesis, and positive feedback history.                         |
| Persona                          | AI or learner role definition (badges/roles) used in multi-body collaboration.                         |
| Artifact                         | Any submitted output or deliverable created within the Smart Output Builder.                           |
| RAG                              | Retrieval-augmented generation used to provide personalized resources from uploaded materials.         |
