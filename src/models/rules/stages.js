/*
 * What a person sees: four steps, in order. The server keeps finer stages (collecting,
 * integration, setup, session, recording, closed) because its due dates, timers and permissions
 * need them; every screen shows the step a stage belongs to. Setup is the Account Member creating
 * the CODEIT account, which runs alongside Sales. Closed is not a step: it is where a member ends,
 * shown on its header. These are design, not data: the names a person reads come from the `step`
 * options list.
 */
export const STEPS = ['sales', 'setup', 'integration', 'onboarding']

const STEP_OF_STAGE = {
  collecting: 'sales',
  integration: 'integration',
  setup: 'onboarding',
  session: 'onboarding',
  recording: 'onboarding',
  closed: 'closed',
}

/** The step a server stage belongs to. */
export const stepOfStage = (stage) => STEP_OF_STAGE[stage]

/** Whether a member is at a step now. Setup: Sales has it and its CODEIT account isn't made yet. */
export const atStep = (m, step) => (step === 'setup' ? m.stage === 'collecting' && !m.accountCreatedAt : stepOfStage(m.stage) === step)

export const STEP_TONE = {
  sales: 'brand',
  setup: 'indigo',
  integration: 'violet',
  onboarding: 'success',
  closed: 'neutral',
  lost: 'danger',
  cancelled: 'danger',
}

/** Where a member is: 'lost' or 'cancelled' once it left the path, else its step. */
export const statusOf = (m) => m.outcome ?? stepOfStage(m.stage)

/** The role that works on each step (Closed has nobody). */
export const STEP_ROLE = { sales: 'sales', setup: 'account', integration: 'integration', onboarding: 'onboarding' }

/** Where a step stands for a member: 'done', 'now' or 'todo'. Sales and Setup can both be 'now'. */
export function stepState(m, step) {
  if (step === 'setup') return m.accountCreatedAt ? 'done' : m.stage === 'collecting' && !m.outcome ? 'now' : 'todo'
  const at = STEPS.indexOf(stepOfStage(m.stage))
  const i = STEPS.indexOf(step)
  if (i < at || m.stage === 'closed') return 'done'
  return i === at && !m.outcome ? 'now' : 'todo'
}

/* Which tab of the member page carries each button. Cancel and Reopen sit above the tabs. */
const ACTION_TAB = {
  edit: 'sales', book: 'sales', transfer: 'sales', mark_lost: 'sales', hardware: 'sales',
  set_account: 'setup', unset_account: 'setup', customer_signin: 'setup',
  integration: 'integration',
  setup: 'onboarding', finish: 'onboarding', join: 'onboarding', send_recording: 'onboarding', extend_link: 'onboarding',
  change_person: 'overview', note: 'overview',
}

/** The tab an action's button belongs on. Send back follows the step the member is at. */
export function tabOfAction(action, m) {
  if (action === 'send_back') return m.stage === 'integration' ? 'integration' : 'onboarding'
  return ACTION_TAB[action]
}
