/**
 * Every reusable piece of the UI, from one place. Views and routes import from '@/components' and
 * nowhere else in this folder. Inside it, a component imports its siblings by file (never this
 * file), which keeps the import graph free of cycles.
 *
 *   ui/       primitives: Button, Field, Modal, Badge, Tabs…
 *   layout/   the app's frame: AppShell, Sidebar, PageHeader, the splash pages, toasts
 *   shared/   app pieces two or more pages use; a piece only one page uses lives in that page's folder
 *   Icon, cx (class names), TONES (the colour tones)
 *
 * Conventions (layers.check.js holds the folder rules):
 *   classes  every component stamps ui-<block>, ui-<block>--<variant> and ui-<block>__<part>. They name
 *            things for tests and tools; no CSS is written for them (Tailwind styles everything).
 *            The shell puts v-<page> on <main>; a repeated item carries v-<page>__<item>.
 *   ids      every interactive element has one: <file>-<thing>[-<row key>], from stable keys only,
 *            never translated words, so they match in English and Arabic. A component takes `id`
 *            and passes it on, or names its parts from it (<id>-close, <id>-<key>).
 *   views    use these components for every control; a hand-styled one uses `bare`
 *            (Button, Input, Select, Textarea). Colours come from the tokens in index.css.
 */
export { cx } from './cx.js'
export { default as Icon } from './Icon.jsx'
export { TONES, TONE_DOT } from './tones.js'

export { Avatar } from './ui/Avatar.jsx'
export { Badge } from './ui/Badge.jsx'
export { Button } from './ui/Button.jsx'
export { Card } from './ui/Card.jsx'
export { Field, Input, Select, Textarea } from './ui/Field.jsx'
export { IconButton } from './ui/IconButton.jsx'
export { ListHead, ListRow, RowArrow } from './ui/List.jsx'
export { ConfirmDialog, Modal } from './ui/Modal.jsx'
export { Notice } from './ui/Notice.jsx'
export { Panel, PanelActions } from './ui/Panel.jsx'
export { ReasonDialog } from './ui/ReasonDialog.jsx'
export { Switch } from './ui/Switch.jsx'
export { Tabs } from './ui/Tabs.jsx'
export { Tick, TickPill } from './ui/Tick.jsx'

export { AppShell } from './layout/AppShell.jsx'
export { FormBar } from './layout/FormBar.jsx'
export { FullScreenMessage } from './layout/FullScreenMessage.jsx'
export { LanguageSwitch } from './layout/LanguageSwitch.jsx'
export { PageHeader } from './layout/PageHeader.jsx'
export { Sidebar } from './layout/Sidebar.jsx'
export { SplashCard } from './layout/SplashCard.jsx'
export { SplashPanel } from './layout/SplashPanel.jsx'
export { Toasts } from './layout/Toasts.jsx'

export { AccountForm } from './shared/AccountForm.jsx'
export { Chips } from './shared/Chips.jsx'
export { CompanyForm } from './shared/CompanyForm.jsx'
export { DocumentsPanel } from './shared/DocumentsPanel.jsx'
export { FeaturesList } from './shared/FeaturesList.jsx'
export { FileViewer } from './shared/FileViewer.jsx'
export { HardwareField } from './shared/HardwareField.jsx'
export { HoursEditor, TimeSelect } from './shared/HoursEditor.jsx'
export { IntegrationsBox } from './shared/IntegrationsBox.jsx'
export { LeaveDialog } from './shared/LeaveDialog.jsx'
export { MemberAvatar } from './shared/MemberAvatar.jsx'
export { Option } from './shared/Option.jsx'
export { Pair } from './shared/Pair.jsx'
export { PasswordResult } from './shared/PasswordResult.jsx'
export { PersonPicker } from './shared/PersonPicker.jsx'
export { PickTimeSection } from './shared/PickTimeSection.jsx'
export { ReadField } from './shared/ReadField.jsx'
export { ReadyBy } from './shared/ReadyBy.jsx'
export { RequirementsForm } from './shared/RequirementsForm.jsx'
export { Row } from './shared/Row.jsx'
export { SearchBox } from './shared/SearchBox.jsx'
export { Section } from './shared/Section.jsx'
export { SlotPicker } from './shared/SlotPicker.jsx'
export { StatTile } from './shared/StatTile.jsx'
export { StepBadge } from './shared/StepBadge.jsx'
export { TextField } from './shared/TextField.jsx'
export { UploadDialog } from './shared/UploadDialog.jsx'
