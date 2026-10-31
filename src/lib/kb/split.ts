// Split a merged ticket into the problems its reports really hold.
// causes.ts places a report by tenant and channel (parser | hint). The desk's own notes
// (desk-notes.json → oneDayMove) list reports that are not a day/month flip at all: the date
// moved by exactly one day. Those are a third problem, so they get their own place here
// instead of being counted under the cause their tenant would suggest.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  ids: string[];
  tenants: string[];
  channels: Record<string, number>;
  subjects: number;
  firstSeen: string;
  lastSeen: string;
};

export type Split = {
  rows: number; // rows in the export, overlapping pages included
  reports: number; // one id, one report
  groups: ProblemGroup[];
  subjects: { subject: string; reports: number; problems: Problem[] }[];
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): Split {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(rows);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDay);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        ids: rs.map((r) => r.id).sort(),
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        subjects: new Set(rs.map((r) => normSubject(r.subject))).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.ids.length - a.ids.length);

  const bySubject = new Map<string, Report[]>();
  for (const r of merged) bySubject.set(normSubject(r.subject), [...(bySubject.get(normSubject(r.subject)) ?? []), r]);
  const subjects = [...bySubject.entries()]
    .map(([subject, rs]) => ({
      subject,
      reports: rs.length,
      problems: [...new Set(rs.map((r) => problemOf(r, tenantOf(r), oneDay)))].sort(),
    }))
    .sort((a, b) => b.reports - a.reports);

  return { rows: rows.length, reports: merged.length, groups, subjects };
}

// Decision 0001's key: lowercase, punctuation stripped.
export function normSubject(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}
