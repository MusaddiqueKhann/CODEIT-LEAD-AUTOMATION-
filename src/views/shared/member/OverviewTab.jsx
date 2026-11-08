import { JourneyCard } from './JourneyCard.jsx'
import { NotesChat } from './NotesChat.jsx'
import { OverviewTiles } from './OverviewTiles.jsx'
import { PeopleCard } from './PeopleCard.jsx'
import { RequirementsGlance } from './RequirementsGlance.jsx'

/** The member at a glance: four numbers, the journey, who is on it, what they asked for, and the notes. */
export function OverviewTab({ member, can, act, activity, onTab }) {
  return (
    <>
      <OverviewTiles member={member} onTab={onTab} />
      <div className="flex flex-wrap items-stretch gap-4">
        <JourneyCard member={member} lines={activity.data} />
        <PeopleCard member={member} can={can} act={act} />
      </div>
      <RequirementsGlance member={member} onTab={onTab} openFile={act.openFile} />
      <NotesChat lines={activity.data} canNote={can.has('note')} onNote={act.note} />
    </>
  )
}
