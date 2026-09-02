import type { Project } from "./types";

/**
 * Public-safe notice derived from a project's public notice text and its
 * current stage. This intentionally exposes ONLY information that is safe for
 * citizens — project name, jurisdiction, stage-based notice category and the
 * RFCTLARR notice text. It never surfaces landowner identities, internal risk
 * parameters, officer names or administrative notes.
 */
export interface PublicNotice {
  id: string;
  /** Internal project id, used only for building links. */
  projectId: string;
  /** Public display reference (LV-####). */
  projectRef: string;
  projectName: string;
  title: string;
  category: string;
  district: string;
  state: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  body: string;
}

const STAGE_TO_NOTICE: Record<string, string> = {
  Notification: "Preliminary Notification",
  Survey: "Survey & Demarcation",
  Valuation: "Valuation Notice",
  Compensation: "Compensation Award",
  "Legal Resolution": "Public Hearing",
  "Rehabilitation & Resettlement": "R&R Notice",
  Possession: "Possession Notice",
  Completion: "Completion Notice",
};

export const NOTICE_CATEGORIES: string[] = [
  ...new Set(Object.values(STAGE_TO_NOTICE)),
];

export function noticeFor(p: Project): PublicNotice {
  const current = p.stages.find((s) => s.stage === p.currentStage);
  const date = current?.plannedDate ?? p.createdAt;
  const category = STAGE_TO_NOTICE[p.currentStage] ?? "Public Notice";
  return {
    id: `${p.projectId}-NOTICE`,
    projectId: p.id,
    projectRef: p.projectId,
    projectName: p.name,
    title: `${category} — ${p.name}`,
    category,
    district: p.district,
    state: p.state,
    date,
    body: p.publicNotice,
  };
}
