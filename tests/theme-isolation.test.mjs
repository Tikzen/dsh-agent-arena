import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const STYLE_SOURCE = new URL('../src/client/styles.ts', import.meta.url)
const CLIENT_BUNDLE = new URL('../lib/client.js', import.meta.url)

/** ARENA_CSS with its CSS comments stripped, so rules parse cleanly. */
function arenaCss() {
  const source = readFileSync(STYLE_SOURCE, 'utf8')
  const template = source.match(/String\.raw`([\s\S]*)`\s*$/)
  assert.ok(template, 'styles.ts must export ARENA_CSS as a String.raw template')
  return template[1].replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every `selector { declarations }` rule in `css`, in source order. */
function rules(css) {
  const found = []
  const pattern = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = pattern.exec(css)) !== null) {
    found.push({ selector: match[1].trim(), declarations: match[2].trim() })
  }
  return found
}

/** Whitespace- and escape-insensitive form, so a rule can be located in the bundle. */
const normalize = text => text.replace(/\s+/g, '').replace(/\\/g, '')

test('the standalone panel suppresses the shell it covers', () => {
  const isolation = rules(arenaCss()).filter(rule => rule.selector.includes('data-shell-overlay'))
  assert.equal(isolation.length, 1, 'exactly one rule may hook the shell overlay layer')

  const [rule] = isolation
  // The panel is a full-viewport modal, so it hides the shell columns it covers
  // while leaving the overlay layer that contains it alone.
  assert.match(rule.selector, /:has\(/)
  assert.match(rule.selector, />\s*:not\(\[data-shell-overlay\]\)/)
  // Only the standalone panel covers the shell; the embedded view must be excluded.
  assert.match(rule.selector, /:not\(\[data-embedded="true"\]\)/)
  // Hidden rather than removed: no reflow, and nothing outside the frame is touched.
  assert.match(rule.declarations, /visibility:\s*hidden/)

  // lib/ is committed, so the shipped bundle must carry the same rule.
  const bundle = normalize(readFileSync(CLIENT_BUNDLE, 'utf8'))
  assert.ok(bundle.includes(normalize(rule.selector)), 'lib/client.js is stale - run `npm run build`')
  assert.ok(bundle.includes(normalize(rule.declarations)), 'lib/client.js is stale - run `npm run build`')
})

test('the embedded view keeps its transparent backdrop', () => {
  const embedded = rules(arenaCss()).find(rule => rule.selector === '.arena-backdrop[data-embedded="true"]')
  assert.ok(embedded, 'the embedded backdrop rule must exist')
  assert.match(embedded.declarations, /background:\s*transparent/)
})

test('the standalone panel still paints from the theme surface token', () => {
  // Hiding the shell must not be achieved by forcing this panel opaque: themes
  // that show a wallpaper rely on the panel reading the faded surface token so the
  // wallpaper stays visible through it.
  const backdrop = rules(arenaCss()).find(rule => rule.selector === '.arena-backdrop')
  assert.ok(backdrop, 'the standalone backdrop rule must exist')
  assert.match(backdrop.declarations, /background:\s*var\(--dsw-alias-bg-base/)
})

test('the stylesheet stays agnostic to any particular theme plugin', () => {
  const source = readFileSync(STYLE_SOURCE, 'utf8')
  for (const identifier of [
    'dsh-any-background',
    '--dsh-any-',
    'dsh-background-by-model',
    'deepseek-harness-background',
  ]) {
    assert.ok(
      source.includes(identifier) === false,
      `Arena styles must not depend on the "${identifier}" plugin`,
    )
  }
})
