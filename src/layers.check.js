// node src/layers.check.js — the folder rules (README → Where things are) hold in every file.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const root = new URL('.', import.meta.url).pathname
const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : /\.jsx?$/.test(f) ? [join(dir, f)] : []))
const PORTALS = ['admin', 'sales', 'account', 'integration', 'onboarding', 'signin', 'customer']
const portalOf = (p) => (p.startsWith('views/') ? p.split('/')[1] : null)

const broken = []
for (const file of files(root)) {
  const from = relative(root, file)
  const text = readFileSync(file, 'utf8')
  if (/^import [^\n]*from '@\/components'/m.test(text) && !/^(views|routes)\//.test(from)) broken.push(`${from}: only views and routes import '@/components'`)
  // Views take every control from the components (Button, Input, Select, Textarea, with `bare` for a hand-styled one).
  if (from.startsWith('views/')) for (const [, tag] of text.matchAll(/^(?!\s*(?:\*|\/\/)).*<(button|input|select|textarea)[\s>]/gm)) broken.push(`${from}: a raw <${tag}>; use the component`)
  for (const [, spec] of text.matchAll(/(?:from|import)\s*\(?\s*'(\.{1,2}\/[^']+)'/g)) {
    const to = relative(root, resolve(dirname(file), spec))
    const say = (rule) => broken.push(`${from} → ${to}: ${rule}`)
    if ((from.startsWith('views/') || from.startsWith('components/')) && (to.startsWith('models/data/') || to === 'controllers/shared/useRows.js')) {
      say('views and components load data through a controller hook')
    }
    if (/^(views|routes)\//.test(from) && to.startsWith('components/')) say("views and routes take UI from '@/components', in one import")
    if (from.startsWith('components/') && to === 'components/index.js') say('a component imports its siblings by file, never the module')
    if (from.startsWith('models/') && /^(controllers|views|components|routes)\//.test(to)) say('models never import screens or state')
    if (from.startsWith('controllers/') && /^(views|components)\//.test(to)) say('controllers never import screens')
    if (from.startsWith('views/shared/') && PORTALS.includes(portalOf(to))) say('shared views never reach into a portal (the routes pass portal parts in)')
    const a = portalOf(from)
    const b = portalOf(to)
    if (PORTALS.includes(a) && PORTALS.includes(b) && a !== b) say('one portal never imports another')
  }
}
assert.deepEqual(broken, [], `folder rules broken:\n${broken.join('\n')}`)
console.log('layers ok')
