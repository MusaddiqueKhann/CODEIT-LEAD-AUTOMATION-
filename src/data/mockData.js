
export const TODAY = new Date(2026, 6, 20) // Monday, 20 July 2026

/** What one session costs, in SAR. The Payments page prices top-ups from this. */
export const SESSION_PRICE = 150

const SESSION_TITLE = 'Training session'

export const BANK_DETAILS = {
  bank: 'Al Rajhi Bank',
  accountName: 'CODE Information Technology',
  iban: 'SA44 2000 0001 2345 6789 1234',
  swift: 'RJHISARI',
}

/** Top-up bundles. The discount is why this is a table rather than a multiplier. */
export const SESSION_BUNDLES = [
  { id: 'single', sessions: 1, price: SESSION_PRICE, label: 'Single session' },
  { id: 'five', sessions: 5, price: SESSION_PRICE * 5 - 100, label: '5 sessions' },
  { id: 'ten', sessions: 10, price: SESSION_PRICE * 10 - 300, label: '10 sessions' },
]

/** Past transfers, newest first. */
export const paymentHistory = [
  {
    id: 'p1',
    reference: 'TRF-8842',
    amount: SESSION_PRICE,
    sessions: 1,
    at: new Date(2026, 6, 18),
    status: 'Pending',
  },
  {
    id: 'p2',
    reference: 'TRF-8610',
    amount: SESSION_PRICE * 5 - 100,
    sessions: 5,
    at: new Date(2026, 5, 2),
    status: 'Verified',
  },
  {
    id: 'p3',
    reference: 'TRF-8377',
    amount: SESSION_PRICE,
    sessions: 1,
    at: new Date(2026, 4, 11),
    status: 'Verified',
  },
]

export const SESSION_FORMAT = { minutes: 90, mode: 'Live' }

export const user = {
  name: 'Musaddique Khan',
  initials: 'MK',
  firstName: 'Musaddique',
  lastName: 'Khan',
  email: 'musaddique.khan@example.com',
  phone: '+966 55 123 4567',
  plan: 'Standard plan',
  memberSince: 'March 2026',
  reference: 'CODEIT-MUSADDIQUE',
}

export const allowance = {
  freeLeft: 2,
  freeTotal: 3,
  paidBalance: 1,
  attended: 12,
}

export const initialBookings = [
  {
    id: 'b1',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 20),
    time: '6:00 PM',
    status: 'Free',
    upcoming: true,
  },
  {
    id: 'b2',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 22),
    time: '6:00 PM',
    status: 'Paid',
    upcoming: true,
  },
  {
    id: 'b3',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 15),
    time: '6:00 PM',
    minutes: 90,
    status: 'Completed',
    upcoming: false,
    rated: false,
  },
  {
    id: 'b4',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 13),
    time: '6:00 PM',
    minutes: 90,
    status: 'Completed',
    upcoming: false,
    rated: true,
    rating: 5,
    comment: 'Great pace, really clear explanations.',
  },
  {
    id: 'b5',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 6),
    time: '6:00 PM',
    status: 'Cancelled',
    upcoming: false,
  },
  {
    id: 'b6',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 10),
    time: '6:00 PM',
    minutes: 90,
    status: 'Completed',
    upcoming: false,
    rated: true,
    rating: 4,
  },
  {
    id: 'b7',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 6),
    time: '6:00 PM',
    minutes: 90,
    status: 'Completed',
    upcoming: false,
    rated: true,
    rating: 5,
  },
  {
    id: 'b8',
    title: SESSION_TITLE,
    date: new Date(2026, 6, 1),
    time: '6:00 PM',
    minutes: 60,
    status: 'Completed',
    upcoming: false,
    rated: true,
    rating: 3,
  },
  {
    id: 'b9',
    title: SESSION_TITLE,
    date: new Date(2026, 5, 24),
    time: '6:00 PM',
    minutes: 90,
    status: 'Completed',
    upcoming: false,
    rated: true,
    rating: 4,
  },
]

/**
 * The notification log. Mirrors what the live system would send by email, so a
 * client can always reconcile "did CODE actually tell me that?" in one place.
 */
export const initialNotifications = [
  {
    id: 'n1',
    kind: 'reminder',
    title: 'Session tomorrow at 6:00 PM',
    body: 'Wednesday 22 Jul, 6:00 PM. A reminder was emailed to you.',
    at: 'Today, 9:00 AM',
    read: false,
  },
  {
    id: 'n2',
    kind: 'payment',
    title: 'Payment awaiting verification',
    body: `Your SAR ${SESSION_PRICE} transfer was flagged for review. An admin unlocks the session once verified.`,
    at: 'Sat, 18 Jul',
    read: false,
  },
  {
    id: 'n3',
    kind: 'feedback',
    title: 'How was your session on 15 Jul?',
    body: 'The session was marked complete. Rate it to help CODE tune future sessions.',
    at: 'Wed, 15 Jul',
    read: true,
  },
  {
    id: 'n4',
    kind: 'booking',
    title: 'Booking confirmed',
    body: 'Monday 20 Jul, 6:00 PM.',
    at: 'Mon, 13 Jul',
    read: true,
  },
  {
    id: 'n5',
    kind: 'account',
    title: 'Welcome to CODEIT',
    body: 'Your account was created with 3 free sessions on the Standard plan.',
    at: 'Mar 2026',
    read: true,
  },
]


export const NOTIFICATION_KINDS = {
  booking: { icon: 'calendarPlus', tone: 'brand' },
  reminder: { icon: 'clock', tone: 'warn' },
  payment: { icon: 'wallet', tone: 'success' },
  feedback: { icon: 'chat', tone: 'brand' },
  account: { icon: 'user', tone: 'neutral' },
  cancelled: { icon: 'close', tone: 'danger' },
}
