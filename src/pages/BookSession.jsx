import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/index.js'
import { Button } from '../components/ui/index.js'
import {
  ConfirmScreen,
  MonthCalendar,
  MoveBanner,
  SlotList,
  StatsRibbon,
  StepHeader,
  StepRail,
  sessionCost,
} from '../components/booking/index.js'
import { useBookings } from '../context/BookingContext.jsx'
import { SESSION_FORMAT, TODAY } from '../data/mockData.js'
import { formatLong, formatShort, isSameDay } from '../lib/format.js'
import { ROUTES } from '../lib/nav.js'
import { bookableDays, hasClash, SESSION_TIMES } from '../lib/schedule.js'

export default function BookSession() {
  const {
    allowance,
    bookings,
    bookSession,
    rescheduleBooking,
    reschedulingBooking,
    cancelReschedule,
    totalAvailable,
    nextSession,
  } = useBookings()
  const navigate = useNavigate()

  const days = useMemo(() => bookableDays(TODAY, 20), [])

  const [step, setStep] = useState(1)
  const [date, setDate] = useState(() => reschedulingBooking?.date ?? days[0])
  const [time, setTime] = useState(reschedulingBooking?.time ?? null)

  const moving = Boolean(reschedulingBooking)
  const exceptId = reschedulingBooking?.id ?? null

  const isTaken = (slot) => hasClash(bookings, { date, time: slot, exceptId })

  const openSlots = SESSION_TIMES.filter((slot) => !isTaken(slot)).length

  const pickDate = (next) => {
    setDate(next)
    if (time && hasClash(bookings, { date: next, time, exceptId })) setTime(null)
  }

  const openByDay = useMemo(() => {
    const map = new Map()
    for (const day of days) {
      const open = SESSION_TIMES.filter(
        (slot) => !hasClash(bookings, { date: day, time: slot, exceptId }),
      ).length
      map.set(day.getTime(), open)
    }
    return map
  }, [bookings, days, exceptId])

  const unchanged =
    moving && isSameDay(date, reschedulingBooking.date) && time === reschedulingBooking.time

  const canSubmit = Boolean(time) && !unchanged && (moving || totalAvailable > 0)

  const chosen = Boolean(time)
  const outOfSessions = !moving && totalAvailable === 0

  const stepValues = [formatShort(date), time ?? '—']

  const cost = sessionCost({ moving, allowance, from: reschedulingBooking })
  const hints = [
    `Sun–Thu · up to ${formatShort(days.at(-1))}`,
    `${openSlots} of ${SESSION_TIMES.length} slots open · ${SESSION_FORMAT.minutes} min`,
    unchanged ? 'Same slot as now' : cost.title,
  ]

  /* Quick picks — each is a real open (day, slot) pair, never a guess:
     the first open slot in the window, the user's most-booked time on its
     next open day, and the same slot a week after their next session. */
  const suggestions = useMemo(() => {
    const open = (day, slot) => !hasClash(bookings, { date: day, time: slot, exceptId })
    const firstOpen = (slot) => days.find((day) => open(day, slot))
    const picks = []

    for (const day of days) {
      const slot = SESSION_TIMES.find((t) => open(day, t))
      if (slot) {
        picks.push({ icon: 'clock', label: 'Next available', date: day, time: slot })
        break
      }
    }

    const counts = new Map()
    for (const b of bookings) {
      if (b.status !== 'Cancelled') counts.set(b.time, (counts.get(b.time) ?? 0) + 1)
    }
    const usual = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const usualDay = usual && firstOpen(usual)
    if (usualDay)
      picks.push({ icon: 'user', label: 'Your usual time', date: usualDay, time: usual })

    const anchor = reschedulingBooking ?? nextSession
    if (anchor) {
      const weekOn = new Date(anchor.date)
      weekOn.setDate(weekOn.getDate() + 7)
      const day = days.find((d) => isSameDay(d, weekOn))
      if (day && open(day, anchor.time)) {
        picks.push({ icon: 'refresh', label: 'Same time next week', date: day, time: anchor.time })
      }
    }

    const seen = new Set()
    return picks.filter((p) => {
      const key = `${p.date.getTime()}|${p.time}`
      return seen.has(key) ? false : seen.add(key)
    })
  }, [bookings, days, exceptId, nextSession, reschedulingBooking])

  const applyPick = (pick) => {
    setDate(pick.date)
    setTime(pick.time)
    setStep(3)
  }

  const submit = () => {
    const ok = moving
      ? rescheduleBooking({ date, time })
      : bookSession({ date, time, title: 'Training session' })

    if (ok) navigate(ROUTES.bookings)
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-7rem)]">
      <PageHeader
        title={moving ? 'Move your session' : 'Book a session'}
        subtitle={
          moving
            ? 'Pick a new slot — your existing booking moves to it.'
            : `${SESSION_FORMAT.minutes}-minute ${SESSION_FORMAT.mode.toLowerCase()} sessions, Sunday to Thursday.`
        }
        action={null}
      />

      {moving && <MoveBanner from={reschedulingBooking} onCancel={cancelReschedule} />}

      <StatsRibbon allowance={allowance} onAddSessions={() => navigate(ROUTES.payments)} />

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:gap-8">
        <StepRail
          step={step}
          values={stepValues}
          hints={hints}
          onStep={setStep}
          picks={suggestions}
          onPick={applyPick}
        />

        <div className="flex min-h-0 flex-col">
          <section key={step} className="fade-in flex min-h-0 flex-1 flex-col">
            {step === 1 && (
              <MonthCalendar
                className="flex min-h-0 w-full max-w-[700px] flex-1 flex-col self-end"
                days={days}
                value={date}
                onChange={pickDate}
                openSlots={openByDay}
                today={TODAY}
              />
            )}

            {step === 2 && (
              <div className="flex min-h-0 flex-col">
                <StepHeader
                  className="shrink-0"
                  title={formatLong(date)}
                  meta={
                    openSlots === 0
                      ? 'No slots left on this day.'
                      : `${openSlots} of ${SESSION_TIMES.length} slots open`
                  }
                />

                <SlotList
                  className="scrollbar-slim -mx-1.5 min-h-0 flex-1 overflow-y-auto px-1.5 py-0.5"
                  times={SESSION_TIMES}
                  value={time}
                  onChange={setTime}
                  isTaken={isTaken}
                  minutes={SESSION_FORMAT.minutes}
                  mode={SESSION_FORMAT.mode}
                />
              </div>
            )}

            {step === 3 && (
              <ConfirmScreen
                onEdit={setStep}
                date={date}
                time={time}
                moving={moving}
                cost={cost}
                unchanged={unchanged}
              />
            )}
          </section>

          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 pt-4">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  size="md"
                  icon="chevronLeft"
                  className="h-10"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {step === 3 && outOfSessions && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate(ROUTES.payments)}
                  className="h-10"
                >
                  Add sessions
                </Button>
              )}

              {step < 3 ? (
                <Button
                  size="md"
                  iconRight="chevronRight"
                  className="h-10 min-w-36"
                  disabled={step === 2 && !chosen}
                  onClick={() => setStep(step + 1)}
                >
                  {step === 2 && !chosen ? 'Select a time' : 'Continue'}
                </Button>
              ) : (
                <Button
                  size="md"
                  icon={moving ? 'refresh' : 'check'}
                  className="h-10 min-w-36"
                  disabled={!canSubmit}
                  onClick={submit}
                >
                  {unchanged ? 'Already booked' : moving ? 'Move session' : 'Confirm booking'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
