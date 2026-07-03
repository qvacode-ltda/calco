export const meta = {
  name: 'clone-sections',
  description: 'Source-first section rebuild: reconstruct a page frame + sections from the captured real HTML, batched at 3 concurrent, with auto-retry on agent failure',
  whenToUse: 'After Phase 0 (fetch-source) + slicing: pass the frame prompt and the per-section source slices to fan out astro-builder agents that reproduce the real markup verbatim.',
  phases: [
    { title: 'Frame' },
    { title: 'Sections' },
    { title: 'Retry' },
  ],
}

// args = {
//   prettyPath: 'docs/research/<host>/raw/index.pretty.html',
//   assetsPath: 'docs/research/<host>/assets.json',
//   frame: { prompt: '<full builder prompt for BaseLayout/global.css>' } | null,
//   sections: [ { name, file, start, len, notes } ],   // start/len = line range in prettyPath
// }
const a = args || {}
const prettyPath = a.prettyPath || 'docs/research/<host>/raw/index.pretty.html'
const assetsPath = a.assetsPath || 'docs/research/<host>/assets.json'
const sections = a.sections || []

const COMMON = `
SOURCE-FIRST RULES:
- Source of truth = the REAL rendered DOM in ${prettyPath}. Read ONLY your line range (Read offset/limit; read extra segments if truncated).
- We are Tailwind v4 and so is the target: PRESERVE the exact class strings verbatim. Convert React-isms (className->class, self-close void tags, drop RSC $L.. placeholders by rebuilding that child from the visible DOM).
- Reproduce PERSONALITY as CODE, never a screenshot: inline <svg>, dashed/sparkle borders, hatch patterns, gradients, rotated gutter eyebrows, before/after 200vw hairlines, animated code editors, brand logos. Only genuine photos/product screenshots become <img>.
- Real images: map /_next/.../media/<hash> -> /images/<name> using ${assetsPath}; add width/height + loading="lazy". You may run: node scripts/inspection/rewrite-media.mjs <yourfile> ${assetsPath}
- If a block contains literal { } (e.g. code editors) that Astro would parse as expressions, emit it via <Fragment set:html={\`...\`} /> with the raw HTML (verify no backticks/\${} inside).
- GOTCHA: source section roots may carry frame-placement classes (col-start-2, row-start-N). They only work as direct children of the frame grid — inside a flex/other parent they are inert (that is fine). Do NOT introduce an intermediate CSS grid that would turn those into implicit tracks.
- Static .astro, self-contained (NO required props). Do NOT run astro check/npm/build (the foreman verifies).
Return: file path + one-line note.`

// ---- Frame (optional barrier) ---------------------------------------------
phase('Frame')
if (a.frame && a.frame.prompt) {
  await agent(`${a.frame.prompt}\n${COMMON}`, {
    phase: 'Frame',
    agentType: 'astro-builder',
    label: 'frame',
  })
}

// ---- Sections in batches of 3 ---------------------------------------------
phase('Sections')
const prompt = (s) =>
  `Rebuild src/components/${s.file} from the REAL source.
Read ${prettyPath} starting near line ${s.start} for about ${s.len} lines — that range is the ${s.name} section's rendered DOM.
${s.notes || ''}
${COMMON}`

const done = []
const failed = []
for (let i = 0; i < sections.length; i += 3) {
  const batch = sections.slice(i, i + 3)
  const results = await parallel(
    batch.map((s) => () =>
      agent(prompt(s), { phase: 'Sections', agentType: 'astro-builder', label: `section:${s.name}` })
        .then((r) => ({ s, r }))
    )
  )
  for (const item of results) {
    if (!item || item.r == null) failed.push((item && item.s) || null)
    else done.push(item.s.file)
  }
}

// ---- Retry failures once (batches of 3) -----------------------------------
phase('Retry')
const stillFailed = []
const retryList = failed.filter(Boolean)
if (retryList.length) log(`retrying ${retryList.length} failed section(s): ${retryList.map((s) => s.name).join(', ')}`)
for (let i = 0; i < retryList.length; i += 3) {
  const batch = retryList.slice(i, i + 3)
  const results = await parallel(
    batch.map((s) => () =>
      agent(prompt(s), { phase: 'Retry', agentType: 'astro-builder', label: `retry:${s.name}` })
        .then((r) => ({ s, r }))
    )
  )
  for (const item of results) {
    if (!item || item.r == null) stillFailed.push((item && item.s && item.s.name) || 'unknown')
    else done.push(item.s.file)
  }
}

return { built: done, failed: stillFailed }
