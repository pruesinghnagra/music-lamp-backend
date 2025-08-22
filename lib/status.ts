export const VALID_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type EssayStatus = typeof VALID_STATUSES[number];

export function isValidStatus(value: any): value is EssayStatus {
    return VALID_STATUSES.includes(value);
}
