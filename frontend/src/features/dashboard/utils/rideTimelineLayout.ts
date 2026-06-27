import type { CalendarRide } from '../../../types/DashboardRide'

export type DayTimelineRideLayout = {
  ride: CalendarRide
  startMinutes: number
  endMinutes: number
  column: number
  columnCount: number
}

/**
 * Builds a layout for rides in the day timeline view.
 * Calculates column positions and widths for overlapping rides.
 */
export function buildDayTimelineRideLayout(
  rides: Array<{ ride: CalendarRide; startMinutes: number; endMinutes: number }>,
): DayTimelineRideLayout[] {
  const layouts: DayTimelineRideLayout[] = []
  const activeLayouts: DayTimelineRideLayout[] = []
  let clusterLayouts: DayTimelineRideLayout[] = []
  let clusterColumnCount = 0

  const finalizeCluster = () => {
    clusterLayouts.forEach((layout) => {
      layout.columnCount = clusterColumnCount || 1
    })

    clusterLayouts = []
    clusterColumnCount = 0
  }

  rides.forEach(({ ride, startMinutes, endMinutes }) => {
    for (let index = activeLayouts.length - 1; index >= 0; index -= 1) {
      if (activeLayouts[index].endMinutes <= startMinutes) {
        activeLayouts.splice(index, 1)
      }
    }

    if (activeLayouts.length === 0 && clusterLayouts.length > 0) {
      finalizeCluster()
    }

    const usedColumns = new Set(activeLayouts.map((layout) => layout.column))
    let column = 0

    while (usedColumns.has(column)) {
      column += 1
    }

    const layout: DayTimelineRideLayout = {
      ride,
      startMinutes,
      endMinutes,
      column,
      columnCount: 1,
    }

    activeLayouts.push(layout)
    clusterLayouts.push(layout)
    clusterColumnCount = Math.max(clusterColumnCount, activeLayouts.length)
    layouts.push(layout)
  })

  if (clusterLayouts.length > 0) {
    finalizeCluster()
  }

  return layouts
}
