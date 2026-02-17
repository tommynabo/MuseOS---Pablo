# Implementation Plan - Improved Keyword Search (MuseOS - Pablo)

## Goal
Improve the quality and relevance of LinkedIn search results for "MuseOS - Pablo", focusing on financial advisory/wealth management content.

## Proposed Changes

### 1. Context-Aware Query Expansion (`server/services/openaiService.ts`)
- **Current**: Generates generic boolean queries.
- **Change**: Update `expandSearchQuery` to accept an optional `context` parameter (e.g., "Financial Advisor", "Wealth Management").
- **Logic**: Use this context in the prompt: "Transform topic '${topic}' into boolean queries specifically for a ${context} audience".

### 2. Iterative Search & Fallback (`server/routes.ts`)
- **Current**: Runs one search attempt per keyword.
- **Change**: Implement a retry loop.
  - Attempt 1: Specific query.
  - Attempt 2 (if < 2 results): Broader query.

### 3. Relevance Filtering (`server/services/openaiService.ts`)
- **Current**: Filters only by engagement metrics.
- **Change**: Add `verifyPostRelevance(postText, topic)` function.
- **Logic**: Use LLM to check: "Does this post actually discuss '${topic}' from a financial perspective? Yes/No". discard 'No'.

### 4. Date Filtering (`server/services/apifyService.ts`)
- **Current**: Implicit default.
- **Change**: Explicitly set `timeframe: "month"` in `searchLinkedInPosts` to ensure freshness.

## Verification
- Run `POST /workflow/generate` with a financial keyword (e.g., "Inversión Pasiva").
- Check logs for "Expanded queries" to confirm context usage.
- Verify returned posts are recent (within 1 month) and relevant.
