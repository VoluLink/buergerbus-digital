import { addDays, startOfWeek } from "./dateUtils";

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

const dayDialogFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function buildMonthDays(currentMonth: Date): CalendarDay[] {
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const startDate = startOfWeek(firstDayOfMonth);

  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(startDate, index);

    days.push({
      date,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
    });
  }

  return days;
}

export function buildWeekDays(selectedDate: Date): CalendarDay[] {
  const weekStart = startOfWeek(selectedDate);
  const days: CalendarDay[] = [];

  for (let index = 0; index < 7; index += 1) {
    const date = addDays(weekStart, index);

    days.push({
      date,
      isCurrentMonth: true,
    });
  }

  return days;
}

export function formatMonthHeading(date: Date) {
  const heading = monthFormatter.format(date);
  return heading.charAt(0).toUpperCase() + heading.slice(1);
}

export function formatDialogHeading(date: Date) {
  const heading = dayDialogFormatter.format(date);
  return heading.charAt(0).toUpperCase() + heading.slice(1);
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}
