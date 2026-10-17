export function trendDates(year: number, asOf: string, sourceStart: string) {
  return Array.from({ length: 12 }, (_, month) =>
    new Date(Date.UTC(year, month + 1, 0, 12)).toISOString().slice(0, 10),
  )
    .map((day) => (day > asOf && day.slice(0, 7) === asOf.slice(0, 7) ? asOf : day))
    .filter((day) => day <= asOf && day >= sourceStart);
}
