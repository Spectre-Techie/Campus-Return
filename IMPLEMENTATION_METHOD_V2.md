# Local Lost & Found - Implementation Method V2

Date: 2026-03-22
Owner: Engineering
Status: Active

## 1. Product Logic (Single Source of Truth)

### Roles and permissions
- Any authenticated user can be both a finder and a claimer at different times.
- Finder is the user who created the item post.
- Claimer is any non-finder user who submits a claim for an active item.
- Admin is for moderation and safety operations, not normal claim approval.

### Claim approval authority
- Claim approval/rejection is performed by the finder for that item.
- Admin can only intervene for abuse moderation (future phase), not routine claim decisions.

### Lifecycle
- Item statuses: active -> claimed (or expired later by policy).
- Claim statuses: pending -> approved/rejected.
- Approving one pending claim must reject all other pending claims on the same item.

## 2. Architecture Guardrails

### Identity model
- Client auth identity: Clerk user id.
- Server primary relation identity: internal database user id.
- API responses needed by the client for ownership checks must include finder.clerkId.

### API consistency contract
- Ownership checks in UI must compare Clerk id to Clerk id.
- Authorization checks in API must compare internal db user id to internal db user id.

### Error handling
- User-facing pages must show explicit server messages where possible.
- Silent console-only errors are not acceptable for core workflows.

## 3. Delivery Workflow (Senior-level execution)

### Rule A: Vertical slices only
Each feature ships as:
1) schema + service logic
2) route/controller + authz
3) UI state and happy path
4) error states + edge cases
5) manual test protocol

### Rule B: No hidden assumptions
- Every ownership or role decision must be explicit in code and documented.
- If one identity namespace is converted into another, the conversion point must be visible and tested.

### Rule C: Stability first
- If runtime has stale-process behavior, reset ports and relaunch before diagnosing code.
- Distinguish code bugs from environment/process issues.

## 4. Immediate Build Plan (Re-baselined)

### Phase 1 complete baseline
- Item posting and search working.
- Claims routes and claim UI flow implemented.

### Phase 1 hardening next
- Add clear in-UI error banners for feed fetch failures.
- Add route-level smoke tests for item detail and claims endpoints.
- Add robust owner-state loading to avoid transient wrong-action UI.

### Phase 2
- Private chat after approved claim.
- Notifications (claim received, claim updated).

### Phase 3
- Admin moderation tools and analytics.
- Expiry/background cleanup jobs.

## 5. Manual Verification Protocol

### Scenario A (finder)
1. Finder logs in and posts item.
2. Finder opens item detail and sees claim review panel, not claim button.

### Scenario B (claimer)
1. Another account opens same item.
2. Sees claim button and submits verification text.
3. Finder reloads and sees pending claim.
4. Finder approves claim.
5. Item status changes to claimed.

### Scenario C (constraints)
- Claimer cannot claim own item.
- Same user cannot create duplicate pending claim on same item.
- Non-finder cannot review claims.

## 6. UX Direction Reset

Current UI is functional but not acceptable as final product quality.

Landing page redesign requirements:
- Hero with explicit value proposition and real flow preview.
- Sectioned trust model explanation (how verification works).
- Two user-path blocks: "I found an item" and "I lost an item".
- Campus map/search CTA above fold.
- Better typography, spacing, and visual hierarchy.

Design and implementation should preserve current architecture and focus on clarity, trust, and conversion.
