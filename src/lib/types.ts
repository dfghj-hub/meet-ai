/** API 契约：阶段 1 & 2 共用 */

export interface ActionItem {
  owner: string;
  task: string;
  due?: string;
}

export interface SummarizeResult {
  summary: string;
  actionItems: ActionItem[];
  minutes: string;
}

export const MAX_TEXT_LENGTH = 100_000;
