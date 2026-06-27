import { snapTimeToFiveMinuteStep, buildTimeFromParts } from '../utils/timeUtils'

type FiveMinuteTimeFieldProps = {
  value: string
  onChange: (value: string) => void
  wrapperClassName?: string
  fieldClassName?: string
}

const hourTimeOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minuteTimeOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

export function FiveMinuteTimeField({
  value,
  onChange,
  wrapperClassName = 'mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2',
  fieldClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none',
}: FiveMinuteTimeFieldProps) {
  const normalizedValue = snapTimeToFiveMinuteStep(value)
  const [hours = '', minutes = ''] = normalizedValue.split(':')
  const selectedMinutes = hours ? (minutes || '00') : ''

  return (
    <div className={wrapperClassName}>
      <select
        value={hours}
        onChange={(event) => {
          const nextHours = event.target.value

          if (!nextHours) {
            onChange('')
            return
          }

          onChange(buildTimeFromParts(nextHours, selectedMinutes || '00'))
        }}
        className={fieldClassName}
      >
        <option value="">Stunde</option>
        {hourTimeOptions.map((hourValue) => (
          <option key={`hour-${hourValue}`} value={hourValue}>
            {hourValue}
          </option>
        ))}
      </select>

      <span className="text-sm font-semibold text-slate-400">:</span>

      <select
        value={selectedMinutes}
        onChange={(event) => {
          if (!hours) {
            return
          }

          onChange(buildTimeFromParts(hours, event.target.value || '00'))
        }}
        disabled={!hours}
        className={fieldClassName}
      >
        <option value="">Minute</option>
        {minuteTimeOptions.map((minuteValue) => (
          <option key={`minute-${minuteValue}`} value={minuteValue}>
            {minuteValue}
          </option>
        ))}
      </select>
    </div>
  )
}
