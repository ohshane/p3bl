# Plan: Rewrite Dip Chart to Show Per-Team Precheck Scores

## Goal

Replace the abstract 4-line DipChart with a chart showing each team precheck scores over time. Save content snapshots with each precheck.

## Changes

### 1. Schema: Add content_snapshot column to precheck_results
File: src/db/schema/artifacts.ts

### 2. Update storePrecheckResults to save content snapshot
File: src/server/api/artifacts.ts

### 3. Update activityStore.runPreCheck to pass content
File: src/stores/activityStore.ts

### 4. Update DipChartDataPoint type
File: src/types/index.ts

### 5. Rewrite getLearningMetrics server function
File: src/server/api/creator.ts

### 6. Update creator store
File: src/stores/creatorStore.ts

### 7. Rewrite DipChart component
File: src/components/creator/DipChart.tsx

### 8. Verify TypeScript compiles
