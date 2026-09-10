export type Schedule = { day?: unknown; time?: unknown };
export type Lesson = {
  id?: unknown;
  name?: unknown;
  platform?: unknown;
  schedules?: unknown;
  reminderMode?: unknown;
  reminderLeads?: unknown;
};

export const REMINDER_LEAD_OPTIONS = [5, 10, 15, 30, 60] as const;
export const DEFAULT_REMINDER_LEADS = [60, 15] as const;

const DAY_NAMES: Record<string, string> = {
  Mon: "الاثنين",
  Tue: "الثلاثاء",
  Wed: "الأربعاء",
  Thu: "الخميس",
  Fri: "الجمعة",
  Sat: "السبت",
  Sun: "الأحد"
};

export function timeParts(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    const get = (type: string) => parts.find(part => part.type === type)?.value || "";
    return { day: DAY_NAMES[get("weekday")] || "", time: `${get("hour")}:${get("minute")}` };
  } catch {
    return { day: "", time: "" };
  }
}

export function validLessons(value: unknown): Lesson[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === "object") as Lesson[] : [];
}

export function matchingLessons(lessons: Lesson[], day: string, time: string): Lesson[] {
  return lessons.filter(lesson => {
    const schedules = Array.isArray(lesson.schedules) ? lesson.schedules as Schedule[] : [];
    return schedules.some(schedule => schedule?.day === day && schedule?.time === time);
  });
}

export function displayTime(time: string): string {
  const [rawHour, minute] = time.split(":").map(Number);
  const suffix = rawHour >= 12 ? "م" : "ص";
  const hour = rawHour % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function normalizeReminderLeads(value: unknown, fallback: readonly number[] = DEFAULT_REMINDER_LEADS): number[] {
  const values = Array.isArray(value) ? value : [value];
  const normalized = [...new Set(values
    .map(Number)
    .filter(item => REMINDER_LEAD_OPTIONS.includes(item as typeof REMINDER_LEAD_OPTIONS[number])))]
    .sort((left, right) => right - left)
    .slice(0, 3);
  if (normalized.length) return normalized;
  return [...new Set(fallback
    .map(Number)
    .filter(item => REMINDER_LEAD_OPTIONS.includes(item as typeof REMINDER_LEAD_OPTIONS[number])))]
    .sort((left, right) => right - left)
    .slice(0, 3);
}

export function lessonReminderLeads(lesson: Lesson, deviceDefaults: readonly number[]): number[] {
  if (lesson.reminderMode === "off") return [];
  if (lesson.reminderMode === "custom") return normalizeReminderLeads(lesson.reminderLeads, [15]);
  return normalizeReminderLeads(deviceDefaults);
}

export function reminderCandidates(
  baseMinute: Date,
  leadMinutes: number,
  retryWindow = Math.min(10, Math.max(0, leadMinutes))
): Date[] {
  return Array.from({ length: retryWindow + 1 }, (_, delayMinutes) =>
    new Date(baseMinute.getTime() + (leadMinutes - delayMinutes) * 60000)
  );
}
