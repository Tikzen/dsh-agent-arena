import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARENA_TEMPLATES,
  autonomousMessageFingerprint,
  compactMeetingContext,
  compactMeetingContextFor,
  ensureMeetingWorkspace,
  estimateMeetingContext,
  getMeetingContextState,
  isDuplicateAutonomousMessage,
  isArenaSessionPrompt,
  mentionedProfileIds,
  mentionsAdministrator,
  normalizeCapabilities,
  parseSpeechDirectives,
  renderPersonaTemplate,
  shouldRequirePeerReaction,
  templateById,
  validateMeetingInput,
} from '../src/shared.mjs'

test('protects autonomous messages from exact repeats without imposing a length', () => {
  assert.equal(autonomousMessageFingerprint('  Hello\n world  '), 'hello world')
  assert.equal(isDuplicateAutonomousMessage('Hello   world', ['hello world']), true)
  assert.equal(isDuplicateAutonomousMessage('很长或很短都可以', ['不同内容']), false)
  assert.equal(isDuplicateAutonomousMessage('', []), true)
})

test('hydrates the collaborative workspace on legacy meetings', () => {
  const legacy = { status: 'running', transcript: [] }
  assert.equal(ensureMeetingWorkspace(legacy), legacy)
  assert.equal(legacy.collaborationStage, 'discussion')
  assert.deepEqual(legacy.tasks, [])
  assert.deepEqual(legacy.decisions, [])
  assert.deepEqual(legacy.artifacts, [])
  assert.equal(legacy.contextSettings.autoCompressEnabled, false)
  assert.equal(legacy.run.status, 'idle')

  const completed = ensureMeetingWorkspace({ status: 'completed' })
  assert.equal(completed.collaborationStage, 'completed')
})

test('context compression preserves visible transcript and includes only new messages in future context', () => {
  const meeting = ensureMeetingWorkspace({
    topic: 'Project',
    participants: [{ id: 'a', role: 'Engineer' }],
    transcript: Array.from({ length: 18 }, (_, index) => ({
      id: `m${index}`, kind: 'participant', speaker: 'Engineer', text: `Result ${index}`,
    })),
    activityMonitor: { roles: [{ stats: { lastInputTokens: 4000 } }] },
  })
  const before = JSON.stringify(meeting.transcript)
  assert.equal(estimateMeetingContext(meeting, 8000).estimatedTokens, 4000)
  assert.equal(compactMeetingContext(meeting), true)
  assert.equal(JSON.stringify(meeting.transcript), before)
  assert.equal(meeting.contextCompressedThroughId, 'm5')
  assert.match(meeting.contextSummary, /Result 0/)
  assert.equal(meeting.activityMonitor.roles[0].stats.lastInputTokens, 0)
  assert.equal(estimateMeetingContext(meeting, 1000).uncompressedMessages, 12)
  assert.equal(compactMeetingContext(meeting), false)
  meeting.transcript.push({ id: 'm18', kind: 'user', speaker: 'Human', text: 'New request' })
  assert.equal(estimateMeetingContext(meeting).uncompressedMessages, 13)
})

test('role context compression stays independent', () => {
  const meeting = ensureMeetingWorkspace({
    topic: 'Independent windows',
    participants: [
      { id: 'a', role: 'Engineer' },
      { id: 'b', role: 'Reviewer' },
    ],
    administratorProfile: { id: 'administrator', role: 'Coordinator' },
    transcript: Array.from({ length: 18 }, (_, index) => ({
      id: `r${index}`, kind: 'participant', speaker: 'Member', text: `Message ${index}`,
    })),
    activityMonitor: { roles: [
      { profileId: 'a', stats: { lastInputTokens: 1800 } },
      { profileId: 'b', stats: { lastInputTokens: 4200 } },
    ] },
  })
  assert.equal(compactMeetingContextFor(meeting, 12, 'a'), true)
  assert.equal(getMeetingContextState(meeting, 'a').compressedThroughId, 'r5')
  assert.equal(getMeetingContextState(meeting, 'b').compressedThroughId, null)
  assert.equal(estimateMeetingContext(meeting, 8000, 'a').uncompressedMessages, 12)
  assert.equal(estimateMeetingContext(meeting, 8000, 'b').uncompressedMessages, 18)
  assert.equal(meeting.activityMonitor.roles[0].stats.lastInputTokens, 0)
  assert.equal(meeting.activityMonitor.roles[1].stats.lastInputTokens, 4200)
})

test('capability defaults stay open and explicit restrictions are normalized', () => {
  assert.equal(normalizeCapabilities().skillsMcp, true)
  assert.equal(normalizeCapabilities({ network: false, terminal: 0 }).network, false)
  assert.equal(normalizeCapabilities({ network: false, terminal: 0 }).terminal, true)
})

test('ships four useful meeting templates', () => {
  assert.equal(ARENA_TEMPLATES.length, 4)
  assert.equal(templateById('missing').id, 'roundtable')
})

test('normalizes a valid continuous meeting', () => {
  const result = validateMeetingInput({ topic: 'Should we ship?', template: 'courtroom' })
  assert.equal('rounds' in result, false)
  assert.equal(result.participants.length, 3)
  assert.equal(result.participants[0].id, 'speaker-1')
})

test('detects explicit AI and administrator mentions', () => {
  const profiles = [{ id: 'a', name: '小王' }, { id: 'b', name: 'Reviewer' }]
  assert.deepEqual(mentionedProfileIds('请 @Reviewer 看一下', profiles), ['b'])
  assert.equal(mentionsAdministrator('@管理员 重开投票'), true)
  assert.equal(mentionsAdministrator('@群主 修改话题', '群主'), true)
})

test('rejects duplicate participant names', () => {
  assert.throws(() => validateMeetingInput({
    topic: 'A real topic',
    participants: [
      { name: 'Same', role: 'One' },
      { name: 'same', role: 'Two' },
    ],
  }), /名称不能重复/)
})

test('parses natural mute and unmute commands', () => {
  const profiles = [{ id: 'rain', name: '丛雨' }, { id: 'reviewer', name: 'Reviewer' }]
  assert.deepEqual(parseSpeechDirectives('丛雨先别说话', profiles), {
    muteIds: ['rain'], unmuteIds: [], hasDirective: true, commandOnly: true,
  })
  assert.deepEqual(parseSpeechDirectives('@丛雨 可以继续回复了', profiles), {
    muteIds: [], unmuteIds: ['rain'], hasDirective: true, commandOnly: true,
  })
  assert.deepEqual(parseSpeechDirectives('大家都别说话，我先整理一下需求', profiles), {
    muteIds: ['rain', 'reviewer'], unmuteIds: [], hasDirective: true, commandOnly: false,
  })
})

test('renders imported persona placeholders without leaking DSH templates', () => {
  assert.equal(
    renderPersonaTemplate('你是 {{char}}，陪伴 {{user}}。保留 {{mood}}。未闭合 {{user', '丛雨', '四季'),
    '你是 丛雨，陪伴 四季。保留 mood。未闭合 { {user',
  )
})

test('requires a peer reaction after concurrent human-triggered replies', () => {
  assert.equal(shouldRequirePeerReaction('human', 3), true)
  assert.equal(shouldRequirePeerReaction('initial', 2), true)
  assert.equal(shouldRequirePeerReaction('auto', 3), false)
  assert.equal(shouldRequirePeerReaction('human', 1), false)
})

test('recognizes only legacy Agent Arena role prompts for sidebar cleanup', () => {
  assert.equal(isArenaSessionPrompt('你正在“方案评审”协作群中，显示名称是 架构师。'), true)
  assert.equal(isArenaSessionPrompt('你正在社交群聊“开发组”中，显示名称是 小王。'), true)
  assert.equal(isArenaSessionPrompt('你刚在聊天“开发组”里收到一条新消息：开始吧'), true)
  assert.equal(isArenaSessionPrompt('你是群管理员 管理员。人类用户刚刚对你说：换个话题'), true)
  assert.equal(isArenaSessionPrompt('你正在学习如何组织一次协作会议'), false)
  assert.equal(isArenaSessionPrompt('普通用户问：人类用户刚刚对你说了什么？'), false)
})
