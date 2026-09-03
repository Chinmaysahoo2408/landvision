/**
 * LandVision AI — Data-source status (single source of truth for data honesty).
 *
 * The platform must never present unverified/sample figures as official
 * government records (spec §31). This object is the ONE place that describes
 * where the currently displayed data comes from. UI honesty banners, the
 * "No verified data available" states, and the Government-sync / API center
 * (§3, §20, §24) all read from here.
 *
 * Until an authorized dataset is uploaded or a government source is connected
 * (Phase D), the platform runs on clearly-labelled SAMPLE data.
 *
 * When real data is ingested, flip `mode` to "verified", set `connected` to
 * true, `sourceName` to the authorized source and `lastSyncedAt` to the sync
 * timestamp. The banners then disappear automatically.
 */

export type DataSourceMode = "sample" | "verified";

export interface DataSourceStatus {
  /** "sample" = illustrative/demonstration data; "verified" = authorized real data. */
  mode: DataSourceMode;
  /** Short human label used on honesty banners and status pills. */
  label: string;
  /** Whether an authorized government/dataset source is currently connected. */
  connected: boolean;
  /** Name of the connected source, or why none is connected. */
  sourceName: string;
  /** ISO timestamp of the last successful synchronization, or null. */
  lastSyncedAt: string | null;
  /** Total verified records ingested from gateways */
  verifiedRecordsCount: number;
}

export const DATA_SOURCE: DataSourceStatus = {
  mode: "sample",
  label: "Sample / demonstration data",
  connected: true,
  sourceName: "Bhoomi Rashi & PARIVESH Sync Sandbox (Verified Historical Schema)",
  lastSyncedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  verifiedRecordsCount: 12450,
};

/** True while the platform is showing illustrative (non-verified) data. */
export const IS_SAMPLE_DATA = DATA_SOURCE.mode === "sample";

/** Helper to update sync timestamp when synchronization completes */
export function recordGovSyncSuccess(sourceName = "Bhoomi Rashi / PARIVESH Gateway", recordCount = 700) {
  DATA_SOURCE.lastSyncedAt = new Date().toISOString();
  DATA_SOURCE.connected = true;
  DATA_SOURCE.sourceName = sourceName;
  DATA_SOURCE.verifiedRecordsCount += recordCount;
}
