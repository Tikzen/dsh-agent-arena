import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { setTimeout as sleep } from 'node:timers/promises'
import { apply } from '../src/index.mjs'
import { conversationSettingsPatch, normalizeRoomWorkdir, normalizeCoordinationFile, runtimeWorkdir } from '../src/workspace.mjs'
import { formatMessage } from '../src/localization.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'arena-workdir-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const blue = join(root, 'blue 项目')
  const red = join(root, 'red 项目')
  await mkdir(blue)
  await mkdir(red)
  return { root, blue, red }
}

test('workspace accepts existing absolute directories and an empty reset', async t => {
  const { blue } = await fixture(t)
  assert.equal(await normalizeRoomWorkdir(` ${blue} `), blue)
  assert.equal(await normalizeRoomWorkdir(''), '')
  assert.equal(await normalizeRoomWorkdir(null), '')
  assert.equal(runtimeWorkdir({}), process.cwd())
})

test('workspace rejects relative, missing, file and non-string values', async t => {
  const { root } = await fixture(t)
  const file = join(root, 'file.txt')
  await writeFile(file, 'test')
  for (const value of ['relative/path', join(root, 'missing'), file, {}, 42]) {
    await assert.rejects(normalizeRoomWorkdir(value), { status: 400 })
  }
  if (process.platform === 'win32') {
    for (const value of ['D:relative', '\\root-relative']) await assert.rejects(normalizeRoomWorkdir(value), { status: 400 })
  }
})

test('settings validation is atomic and allows workdir-only changes', async t => {
  const { blue } = await fixture(t)
  assert.deepEqual(await conversationSettingsPatch({ workdir: blue }), { workdir: blue })
  assert.deepEqual(await conversationSettingsPatch({ name: ' New name ', workdir: '' }, 'displayName'), { displayName: 'New name', workdir: '' })
  for (const body of [{ name: '', workdir: blue }, {}, null, []]) {
    await assert.rejects(conversationSettingsPatch(body), { status: 400 })
  }
})

test('relative and absolute file claims resolve to the same room target', async t => {
  const { blue, red } = await fixture(t)
  const relative = normalizeCoordinationFile('src/task.js', blue)
  assert.deepEqual(relative, normalizeCoordinationFile(resolve(blue, 'src/task.js'), blue))
  assert.notEqual(relative.key, normalizeCoordinationFile('src/task.js', red).key)
  if (process.platform === 'win32') assert.equal(relative.key, normalizeCoordinationFile(relative.path.toUpperCase(), blue).key)
})

async function harness(t) {
  const dirs = await fixture(t)
  const a = { id: 'a', name: 'Alpha', provider: 'test', model: 'test', avatar: 'A' }
  const b = { id: 'b', name: 'Beta', provider: 'test', model: 'test', avatar: 'B' }
  const admin = { id: 'administrator', name: 'Admin', provider: 'test', model: 'test', avatar: 'C' }
  const stateDir = join(dirs.root, 'state')
  await mkdir(stateDir)
  await writeFile(join(stateDir, 'meetings.json'), JSON.stringify({
    migrations: { archivedLegacyArenaSessions: true },
    profiles: { aiUsers: [a, b], administrator: admin, settings: { autoReplyEnabled: false } },
    rooms: [
      { id: 'r1', type: 'group', name: 'Room One', workdir: dirs.blue, participants: [a, b], administratorProfile: admin, messages: [], status: 'idle' },
      { id: 'r2', type: 'direct', name: 'Legacy', participants: [b], messages: [], status: 'idle' },
    ],
    meetings: [{ id: 'm1', topic: 'Meeting', status: 'paused', participants: [a, b], administratorProfile: admin, transcript: [], permissions: {} }],
  }))
  let handler
  let hold
  const created = []
  const cleanups = []
  const ctx = {
    get() { return undefined },
    on() { return () => {} },
    effect(fn) { const cleanup = fn(); if (typeof cleanup === 'function') cleanups.push(cleanup) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    workspaceRegistry: { archiveSession: async () => {}, archivedSessionIds: [] },
    sessionPersistence: { list: async () => [] },
    llm: { listProviders: () => [], listModels: async () => [] },
    webServer: { register(route) { handler = route.handler; return () => {} } },
    subagents: { start() { throw new Error('Unexpected model/subagent call in test') } },
    agents: {
      async create(options) {
        const tools = new Map()
        const guards = []
        const session = { events: [], nextSeq: 1, append(type, data) { this.events.push({ seq: this.nextSeq++, type, data }) } }
        let idle = Promise.resolve()
        const handle = {
          agent: {
            id: options.sessionId, session,
            followup() {
              const gate = hold
              hold = undefined
              idle = (gate?.promise ?? Promise.resolve()).then(() => {
                session.append('assistant/message', { message: { content: [{ type: 'text', text: 'Test completed' }] } })
                session.append('turn/end', { reason: 'completed' })
              })
            },
            whenIdle: () => idle,
            cancel() {},
          },
          async dispose() {},
        }
        await options.setup({
          on: () => () => {},
          systemPrompt: { section() {} },
          tools: { register(tool) { tools.set(tool.name, tool) }, guard(fn) { guards.push(fn) } },
        })
        created.push({ options, tools, guards, handle })
        return handle
      },
    },
  }
  apply(ctx, { stateDir })
  t.after(async () => {
    hold?.resolve()
    for (const cleanup of cleanups.reverse()) cleanup()
    await sleep(50)
  })
  const request = async (method, path, body) => {
    const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
    req.method = method
    req.url = '/api/plugins/dsh-agent-arena' + path
    let status
    let data
    await handler(req, { writeHead(value) { status = value }, end(value) { data = JSON.parse(value) } })
    return { status, data }
  }
  await request('GET', '/state')
  return {
    ...dirs, request, created, stateDir,
    holdNextTurn() {
      let resolveGate
      const promise = new Promise(resolve => { resolveGate = resolve })
      hold = { promise, resolve: resolveGate }
      return resolveGate
    },
  }
}

async function eventually(check) {
  for (let i = 0; i < 200; i++) {
    if (await check()) return
    await sleep(10)
  }
  assert.fail('Timed out waiting for test runtime')
}

test('room and meeting settings persist independently; legacy rooms and reset work', async t => {
  const h = await harness(t)
  assert.equal((await h.request('GET', '/rooms/r2')).data.room.workdir, '')
  assert.equal((await h.request('PATCH', '/rooms/r1', { workdir: h.red })).status, 200)
  assert.equal((await h.request('PATCH', '/meetings/m1', { workdir: h.blue })).status, 200)
  const stored = JSON.parse(await readFile(join(h.stateDir, 'meetings.json'), 'utf8'))
  assert.equal(stored.rooms.find(r => r.id === 'r1').workdir, h.red)
  assert.equal(stored.meetings[0].workdir, h.blue)
  assert.equal((await h.request('PATCH', '/rooms/r1', { workdir: '' })).data.room.workdir, '')
})

test('rejected PATCH leaves both live state and disk unchanged', async t => {
  const h = await harness(t)
  for (const path of ['/rooms/r1', '/meetings/m1']) {
    const before = await h.request('GET', path)
    const diskBefore = await readFile(join(h.stateDir, 'meetings.json'), 'utf8')
    assert.equal((await h.request('PATCH', path, { name: '', workdir: h.red })).status, 400)
    assert.deepEqual((await h.request('GET', path)).data, before.data)
    assert.equal(await readFile(join(h.stateDir, 'meetings.json'), 'utf8'), diskBefore)
    assert.equal((await h.request('PATCH', path, { name: 'Changed', workdir: 'relative' })).status, 400)
    assert.deepEqual((await h.request('GET', path)).data, before.data)
  }
})

test('a running batch keeps its cwd and file locks; the next batch uses the saved cwd', async t => {
  const h = await harness(t)
  const release = h.holdNextTurn()
  t.after(release)
  assert.equal((await h.request('POST', '/rooms/r1/messages', { text: '@Alpha test' })).status, 202)
  await eventually(() => h.created.some(item => item.tools.has('arena_coordination')))
  const role = h.created.find(item => item.tools.has('arena_coordination'))
  const claim = await role.tools.get('arena_coordination').execute({ action: 'claim', files: ['task.txt'] })
  assert.equal(claim.ok, true)
  assert.equal(role.guards[0]({ name: 'write', arguments: { file_path: join(h.blue, 'task.txt') } }), undefined)
  assert.match(role.guards[0]({ name: 'write', arguments: { file_path: join(h.red, 'task.txt') } }), /claim/)
  await h.request('PATCH', '/rooms/r1', { workdir: h.red })
  await h.request('POST', '/rooms/r1/messages', { text: '@Beta test' })
  release()
  await eventually(async () => (await h.request('GET', '/rooms/r1')).data.room.status === 'idle')
  assert.equal(h.created.length, 3)
  assert.ok(h.created.every(item => item.options.meta.cwd === h.blue))
  await h.request('POST', '/rooms/r1/messages', { text: '@Alpha next batch' })
  await eventually(async () => h.created.length >= 5 && (await h.request('GET', '/rooms/r1')).data.room.status === 'idle')
  assert.ok(h.created.slice(3).every(item => item.options.meta.cwd === h.red))
})

test('meeting parent and role agents receive the configured cwd', async t => {
  const h = await harness(t)
  await h.request('PATCH', '/meetings/m1', { workdir: h.red })
  assert.equal((await h.request('POST', '/meetings/m1/actions', { action: 'intervene', text: '@Alpha test' })).status, 200)
  await eventually(async () => h.created.length >= 2 && (await h.request('GET', '/meetings/m1')).data.meeting.status === 'paused')
  assert.ok(h.created.every(item => item.options.meta.cwd === h.red))
})

test('API errors and system events carry descriptors without changing user messages', async t => {
  const h = await harness(t)
  const invalid = await h.request('PATCH', '/rooms/r1', { workdir: 'relative/path' })
  assert.equal(invalid.status, 400)
  assert.match(invalid.data.error, /绝对路径/)
  assert.match(formatMessage(invalid.data.errorI18n.key, invalid.data.errorI18n.params, 'en'), /absolute directory/)
  const text = '@Alpha stop talking'
  const muted = await h.request('POST', '/rooms/r1/messages', { text })
  assert.equal(muted.status, 202)
  const messages = (await h.request('GET', '/rooms/r1')).data.room.messages
  assert.equal(messages.find(item => item.kind === 'human').text, text)
  const system = messages.find(item => item.kind === 'system' && item.i18n)
  assert.ok(system)
  assert.match(formatMessage(system.i18n.key, system.i18n.params, 'en'), /Alpha has been muted/)
  assert.equal(h.created.length, 0, 'a speech-control-only message must not call a model')
})

test('activity records keep readable original text and translatable descriptors', async t => {
  const h = await harness(t)
  const release = h.holdNextTurn()
  t.after(release)
  await h.request('POST', '/rooms/r1/messages', { text: '@Alpha test' })
  await eventually(() => h.created.some(item => item.tools.has('arena_coordination')))
  const agent = h.created.find(item => item.tools.has('arena_coordination'))
  await agent.tools.get('arena_coordination').execute({ action: 'claim', files: ['test.txt'] })
  let room = (await h.request('GET', '/rooms/r1')).data.room
  const role = room.activityMonitor.roles.find(item => item.profileId === 'a')
  assert.equal(typeof role.stage, 'string')
  assert.equal(role.stage, '已锁定文件，准备编辑')
  assert.ok(role.stageI18n)
  const event = role.history.at(-1)
  assert.equal(formatMessage(event.i18n.key, event.i18n.params, 'en'), 'Locked 1 files')
  // AI-supplied summaries are content, even when they equal a UI string.
  await agent.tools.get('arena_coordination').execute({ action: 'update', summary: '等待任务' })
  room = (await h.request('GET', '/rooms/r1')).data.room
  const updated = room.activityMonitor.roles.find(item => item.profileId === 'a')
  assert.equal(updated.stage, '等待任务')
  assert.equal(updated.stageI18n, null)
  release()
  await eventually(async () => (await h.request('GET', '/rooms/r1')).data.room.status === 'idle')
})
