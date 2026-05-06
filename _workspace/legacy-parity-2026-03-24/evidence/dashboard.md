# Batch: dashboard

## Legacy commits checked

- `10cccbc85` - `Reduce dashboard-v2 request pressure`
  - Legacy file: `assets/js/components/dashboard-v2.js`
  - Legacy change: deduplicates in-flight dashboard requests, aborts requests from older load tokens, defers marketing loads until the section is visible, and serializes heavier blocks to reduce pressure.

## V2 comparison

- V2 file: `src/features/dashboard/hooks/use-dashboard-sequenced-snapshot.ts`
- V2 file: `src/features/dashboard/components/dashboard-page.tsx`
- V2 already had phase-based loading and viewport-triggered sections through `LazyDashboardSection`.
- Missing parity point: repeated or stale network calls could still continue when a new dashboard cycle started.

## Migration performed

- Added `src/features/dashboard/services/dashboard-request-pressure.ts`.
- Added a stable dashboard snapshot request key.
- Added a request coordinator that:
  - reuses identical in-flight requests in the same cycle;
  - aborts requests from stale cycles;
  - aborts all in-flight requests on unmount.
- Passed `AbortSignal` from the dashboard hook through `appData.dashboard.getSnapshotByBlocks` into `httpClient`.
- Kept the existing v2 UI, visual structure and lazy section behavior unchanged.

## Coverage

- `src/features/dashboard/services/dashboard-request-pressure.test.ts`
  - stable request key;
  - in-flight dedupe;
  - stale-cycle abort.
- `src/features/dashboard/hooks/use-dashboard-sequenced-snapshot.test.tsx`
  - existing phase loading expectations updated to assert `AbortSignal`;
  - added regression for aborting an in-flight request after a dashboard cycle reset.
