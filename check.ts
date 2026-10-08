/**
 * Checks sponsor.json and its pictures as Lumovi checks what it reads (rules.ts, a copy of the
 * app's own rules), so nothing that would make the app show its own card instead gets in.
 *
 *   node check.ts
 */
import { existsSync, readFileSync } from 'node:fs'
import { checkFile, checkPicture, endOf } from './rules.ts'

const problems: string[] = []
const file = checkFile(readFileSync('sponsor.json', 'utf8'))
if (!file.ok) {
  problems.push(`sponsor.json: ${file.why}`)
} else {
  const { mode, sponsor } = file.value
  if (sponsor) {
    for (const [scheme, name] of Object.entries(sponsor.image)) {
      if (!existsSync(name)) {
        problems.push(`${name} (sponsor.image.${scheme}) isn’t in the repository`)
        continue
      }
      const picture = checkPicture(new Uint8Array(readFileSync(name)))
      if (!picture.ok) problems.push(`${name} (sponsor.image.${scheme}): ${picture.why}`)
    }
  }
  // Past its last day isn't wrong, but Lumovi shows its own card instead.
  const ended = mode === 'sponsor' && sponsor!.until && Date.now() >= endOf(sponsor!.until)
  if (ended) console.log(`::warning::${sponsor!.name}’s card ended on ${sponsor!.until}`)
  const shows =
    mode === 'sponsor' && !ended
      ? `the card is ${sponsor!.name}’s`
      : mode === 'none'
        ? 'there’s no card'
        : 'the card is Lumovi’s own'
  if (!problems.length) console.log(`Checked: ${shows}.`)
}
for (const problem of problems) console.log(`::error::${problem}`)
process.exitCode = problems.length ? 1 : 0
