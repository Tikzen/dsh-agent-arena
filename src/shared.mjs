import { uiMessage, uiError } from './localization.mjs'
export const API_ROOT = '/api/plugins/dsh-agent-arena'

export const MEETING_STAGES = ['discussion', 'planning', 'execution', 'review', 'waiting-human', 'completed']
export const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done', 'blocked', 'paused']
export const ARENA_CAPABILITY_KEYS = ['files', 'terminal', 'network', 'subagents', 'collaboration', 'skillsMcp']
export const COMPRESSION_MODES = ['dsh', 'server']

export function normalizeCompressionMode(value) {
  return COMPRESSION_MODES.includes(value) ? value : 'dsh'
}

export function normalizeCapabilities(value) {
  const source = value && typeof value === 'object' ? value : {}
  return Object.fromEntries(ARENA_CAPABILITY_KEYS.map(key => [key, source[key] !== false]))
}

/** Add the collaborative-workspace fields introduced after the first release.
 * Mutating in place keeps old persisted meetings compatible without rewriting
 * their transcript or participant snapshots. */
export function ensureMeetingWorkspace(meeting) {
  if (!meeting || typeof meeting !== 'object') return meeting
  const fallbackStage = meeting.status === 'completed' ? 'completed' : 'discussion'
  if (!MEETING_STAGES.includes(meeting.collaborationStage)) meeting.collaborationStage = fallbackStage
  if (!Array.isArray(meeting.tasks)) meeting.tasks = []
  if (!Array.isArray(meeting.decisions)) meeting.decisions = []
  if (!Array.isArray(meeting.artifacts)) meeting.artifacts = []
  if (!meeting.contextSettings || typeof meeting.contextSettings !== 'object') meeting.contextSettings = {}
  meeting.contextSettings.autoCompressEnabled = meeting.contextSettings.autoCompressEnabled === true
  const threshold = Number(meeting.contextSettings.autoCompressThreshold)
  meeting.contextSettings.autoCompressThreshold = Number.isFinite(threshold)
    ? Math.max(50, Math.min(95, Math.round(threshold)))
    : 80
  if (typeof meeting.contextSummary !== 'string') meeting.contextSummary = ''
  if (!meeting.contextByProfile || typeof meeting.contextByProfile !== 'object' || Array.isArray(meeting.contextByProfile)) meeting.contextByProfile = {}
  for (const [profileId, raw] of Object.entries(meeting.contextByProfile)) {
    const source = raw && typeof raw === 'object' ? raw : {}
    meeting.contextByProfile[profileId] = {
      summary: typeof source.summary === 'string' ? source.summary.slice(-6000) : '',
      compressedThroughId: typeof source.compressedThroughId === 'string' ? source.compressedThroughId : null,
      compressionCount: Number.isFinite(Number(source.compressionCount)) ? Math.max(0, Math.floor(Number(source.compressionCount))) : 0,
      summaryUpdatedAt: typeof source.summaryUpdatedAt === 'string' ? source.summaryUpdatedAt : null,
    }
  }
  meeting.contextCompressionCount = Number.isFinite(Number(meeting.contextCompressionCount))
    ? Math.max(0, Math.floor(Number(meeting.contextCompressionCount)))
    : 0
  if (!meeting.run || typeof meeting.run !== 'object') meeting.run = {}
  meeting.run = {
    id: typeof meeting.run.id === 'string' && meeting.run.id ? meeting.run.id : null,
    status: typeof meeting.run.status === 'string' ? meeting.run.status : 'idle',
    phase: typeof meeting.run.phase === 'string' ? meeting.run.phase : 'idle',
    currentTaskId: typeof meeting.run.currentTaskId === 'string' ? meeting.run.currentTaskId : null,
    lastTargetIds: Array.isArray(meeting.run.lastTargetIds) ? meeting.run.lastTargetIds.map(String).slice(0, 12) : [],
    attempt: Math.max(0, Number(meeting.run.attempt) || 0),
    startedAt: meeting.run.startedAt || null,
    updatedAt: meeting.run.updatedAt || meeting.updatedAt || null,
  }
  return meeting
}

function contextState(meeting, profileId) {
  ensureMeetingWorkspace(meeting)
  const key = String(profileId || '').trim()
  if (!key) return {
    summary: meeting.contextSummary,
    compressedThroughId: meeting.contextCompressedThroughId,
    compressionCount: meeting.contextCompressionCount,
    summaryUpdatedAt: meeting.contextSummaryUpdatedAt || null,
  }
  if (!meeting.contextByProfile[key]) {
    meeting.contextByProfile[key] = {
      summary: meeting.contextSummary,
      compressedThroughId: meeting.contextCompressedThroughId || null,
      compressionCount: meeting.contextCompressionCount,
      summaryUpdatedAt: meeting.contextSummaryUpdatedAt || null,
    }
  }
  return meeting.contextByProfile[key]
}

export function getMeetingContextState(meeting, profileId) {
  const state = contextState(meeting, profileId)
  return { ...state }
}

export function estimateMeetingContext(meeting, contextWindow = null, profileId = null) {
  ensureMeetingWorkspace(meeting)
  const visible = (meeting.transcript ?? []).filter(item => item.kind !== 'system')
  const state = contextState(meeting, profileId)
  const checkpoint = state.compressedThroughId
  const checkpointIndex = checkpoint ? visible.findIndex(item => item.id === checkpoint) : -1
  const recent = checkpointIndex >= 0 ? visible.slice(checkpointIndex + 1) : visible
  const conversationText = recent.map(item => `${item.speaker ?? item.senderName ?? ''}: ${item.text ?? ''}`).join('\n\n')
  const selectedProfile = profileId
    ? (profileId === 'administrator' ? meeting.administratorProfile : (meeting.participants ?? []).find(item => item.id === profileId))
    : null
  const characters = {
    topic: String(meeting.topic ?? '').length,
    personas: selectedProfile
      ? String(selectedProfile.role ?? '').length
      : (meeting.participants ?? []).reduce((sum, item) => sum + String(item.role ?? '').length, 0),
    summary: state.summary.length,
    conversation: Math.min(conversationText.length, 24_000),
    workspace: JSON.stringify({ tasks: meeting.tasks, decisions: meeting.decisions, artifacts: meeting.artifacts }).length,
  }
  const breakdown = Object.fromEntries(Object.entries(characters).map(([key, value]) => [key, Math.ceil(value / 3)]))
  const promptEstimate = Object.values(breakdown).reduce((sum, value) => sum + value, 0)
  const activityRoles = profileId
    ? (meeting.activityMonitor?.roles ?? []).filter(item => item.profileId === profileId)
    : (meeting.activityMonitor?.roles ?? [])
  const lastInputTokens = Math.max(0, ...activityRoles.map(item => Number(item.stats?.lastInputTokens) || 0))
  if (lastInputTokens > promptEstimate) breakdown.session = lastInputTokens - promptEstimate
  const estimatedTokens = Math.max(promptEstimate, lastInputTokens)
  return {
    estimatedTokens, breakdown, contextWindow: Number(contextWindow) > 0 ? Number(contextWindow) : null,
    percent: Number(contextWindow) > 0 ? Math.round(estimatedTokens / Number(contextWindow) * 100) : null,
    totalMessages: visible.length, uncompressedMessages: recent.length,
  }
}

export function compactMeetingContext(meeting, keepRecent = 12) {
  return compactMeetingContextFor(meeting, keepRecent, null)
}

export function compactMeetingContextFor(meeting, keepRecent = 12, profileId = null) {
  ensureMeetingWorkspace(meeting)
  const visible = (meeting.transcript ?? []).filter(item => item.kind !== 'system')
  const state = contextState(meeting, profileId)
  const checkpointIndex = state.compressedThroughId
    ? visible.findIndex(item => item.id === state.compressedThroughId)
    : -1
  const newEnd = visible.length - Math.max(1, keepRecent)
  if (newEnd <= checkpointIndex + 1) return false
  const earlier = visible.slice(checkpointIndex + 1, newEnd)
  // Keep a compact, attributed record, including the previous summary. The
  // visible transcript is never altered; only subsequent prompts use this.
  const lines = earlier.map(item => {
    const text = String(item.text ?? '').replace(/\s+/g, ' ').trim()
    return `${item.speaker ?? item.senderName ?? '成员'}：${text.slice(0, 260)}${text.length > 260 ? '…' : ''}`
  })
  const merged = [state.summary, ...lines].filter(Boolean).join('\n')
  state.summary = merged.slice(-6000)
  state.compressedThroughId = visible[newEnd - 1].id
  state.summaryUpdatedAt = new Date().toISOString()
  state.compressionCount += 1
  if (!profileId) {
    meeting.contextSummary = state.summary
    meeting.contextCompressedThroughId = state.compressedThroughId
    meeting.contextSummaryUpdatedAt = state.summaryUpdatedAt
    meeting.contextCompressionCount += 1
  } else {
    meeting.contextCompressionCount += 1
  }
  for (const role of meeting.activityMonitor?.roles ?? []) {
    if (role.stats && (!profileId || role.profileId === profileId)) role.stats.lastInputTokens = 0
  }
  return true
}

export const ARENA_TEMPLATES = [
  {
    id: 'roundtable',
    name: '圆桌会议',
    description: '从架构、风险和用户体验三个角度讨论。',
    participants: [
      { name: '蓝图', avatar: '🏗️', role: '系统架构师：拆解约束，提出可落地的整体方案。', color: '#5b8cff' },
      { name: '逆鳞', avatar: '🦔', role: '怀疑论者：主动寻找漏洞、反例、成本和隐藏风险。', color: '#ff6b7a' },
      { name: '小满', avatar: '🧑‍💻', role: '用户代表：关注易用性、真实需求、学习成本和体验。', color: '#2cc9a4' },
    ],
  },
  {
    id: 'courtroom',
    name: 'AI 法庭',
    description: '正反双方辩论，由证据官检查论据质量。',
    participants: [
      { name: '正方', avatar: '🟦', role: '支持方律师：给出最强支持论证与具体证据。', color: '#5b8cff' },
      { name: '反方', avatar: '🟥', role: '反对方律师：给出最强反驳、失败案例和替代解释。', color: '#ff6b7a' },
      { name: '证据官', avatar: '⚖️', role: '中立证据官：检查事实、假设、逻辑跳跃与可验证性。', color: '#f4b942' },
    ],
  },
  {
    id: 'code-review',
    name: '代码评审会',
    description: '实现、审查和安全三个角色共同评审技术方案。',
    participants: [
      { name: 'Builder', avatar: '🔨', role: '实现者：给出最小可行实现、模块边界和验证步骤。', color: '#5b8cff' },
      { name: 'Reviewer', avatar: '🔍', role: '高级审查员：检查正确性、维护性、边界条件和复杂度。', color: '#b482ff' },
      { name: 'Breaker', avatar: '🧨', role: '安全与测试工程师：寻找攻击面、故障路径和可复现测试。', color: '#ff6b7a' },
    ],
  },
  {
    id: 'roast',
    name: '吐槽大会',
    description: '认真分析里掺一点节目效果，适合产品点子和脑暴。',
    participants: [
      { name: '夸夸', avatar: '🌈', role: '乐观派产品经理：发现亮点、传播点和增长机会。', color: '#2cc9a4' },
      { name: '毒舌', avatar: '🌶️', role: '尖锐评论员：用风趣但不人身攻击的方式指出尴尬和硬伤。', color: '#ff6b7a' },
      { name: '混沌', avatar: '🌀', role: '混沌工程师：提出意外用法、极端场景和荒诞但有启发的实验。', color: '#f4b942' },
    ],
  },
]

export function templateById(id) {
  return ARENA_TEMPLATES.find(item => item.id === id) ?? ARENA_TEMPLATES[0]
}

function cleanString(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function cleanAvatar(value, fallback = '🤖') {
  const avatar = typeof value === 'string' ? value.trim() : ''
  if (/^logo:(?:deepseek|openai|claude|gemini|qwen|kimi|grok|doubao|metaai|mistral)$/.test(avatar)) {
    return avatar
  }
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(avatar) && avatar.length <= 180_000) {
    return avatar
  }
  return avatar && avatar.length <= 16 ? avatar : fallback
}

export function validateMeetingInput(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw uiError(uiMessage("validatemeetinginput.the.request.body.must.be.a.json.object"), 400, TypeError)
  }

  const topic = cleanString(raw.topic, 2000)
  if (topic.length < 2) throw uiError(uiMessage("validatemeetinginput.the.meeting.topic.must.contain.at.least.2.characters"), 400, TypeError)

  const template = templateById(cleanString(raw.template, 40))
  const sourceParticipants = Array.isArray(raw.participants) ? raw.participants : template.participants
  if (sourceParticipants.length < 2 || sourceParticipants.length > 4) {
    throw uiError(uiMessage("validatemeetinginput.a.meeting.must.start.with.2.4.ai.participants"), 400, TypeError)
  }

  const names = new Set()
  const participants = sourceParticipants.map((source, index) => {
    const fallback = template.participants[index % template.participants.length]
    const name = cleanString(source?.name, 24) || fallback.name
    const key = name.toLocaleLowerCase()
    if (names.has(key)) throw uiError(uiMessage("validatemeetinginput.participant.names.must.be.unique.value", { p0: name }), 400, TypeError)
    names.add(key)
    const role = cleanString(source?.role, 16_000) || fallback.role
    const provider = cleanString(source?.provider, 100)
    const model = cleanString(source?.model, 160)
    const color = /^#[0-9a-f]{6}$/i.test(String(source?.color ?? ''))
      ? String(source.color)
      : fallback.color
    return {
      id: cleanString(source?.profileId, 80) || `speaker-${index + 1}`,
      ...(cleanString(source?.profileId, 80) ? { profileId: cleanString(source.profileId, 80) } : {}),
      name,
      avatar: cleanAvatar(source?.avatar, fallback.avatar),
      role,
      color,
      ...(provider ? { provider } : {}),
      ...(model ? { model } : {}),
      compressionMode: normalizeCompressionMode(source?.compressionMode),
      capabilities: normalizeCapabilities(source?.capabilities),
    }
  })

  return { topic, template: template.id, participants }
}

export function mentionedProfileIds(text, profiles) {
  const source = String(text ?? '').toLocaleLowerCase()
  return profiles
    .filter(profile => profile?.id && profile?.name)
    .filter(profile => source.includes(`@${String(profile.name).toLocaleLowerCase()}`))
    .map(profile => profile.id)
}

export function mentionsAdministrator(text, administratorName = '管理员') {
  const source = String(text ?? '').toLocaleLowerCase()
  return source.includes('@管理员')
    || source.includes('@admin')
    || (administratorName && source.includes(`@${String(administratorName).toLocaleLowerCase()}`))
}

/** Resolve common role-card placeholders before text enters DSH's strict
 * system-prompt renderer. Unknown placeholders are kept as readable labels
 * without template braces, so imported character cards cannot break a turn. */
export function renderPersonaTemplate(value, profileName, humanName = '用户') {
  return String(value ?? '')
    .replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, rawName) => {
      const name = String(rawName).trim()
      const key = name.toLocaleLowerCase()
      if (/(?:user|human|player|用户|玩家|主人)/i.test(key)) return humanName
      if (/(?:char|character|assistant|bot|role|角色|助手)/i.test(key)) return profileName
      return name
    })
    .replaceAll('{{', '{ {')
    .replaceAll('}}', '} }')
}

/** Normalize only for exact-repeat protection. Message length and punctuation
 * are deliberately preserved for display; the Agent decides its own message
 * boundaries instead of the plugin slicing prose mechanically. */
export function autonomousMessageFingerprint(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function isDuplicateAutonomousMessage(value, previousValues = []) {
  const fingerprint = autonomousMessageFingerprint(value)
  if (!fingerprint) return true
  return previousValues.some(previous => autonomousMessageFingerprint(previous) === fingerprint)
}

/** A batch answering one human message runs concurrently, so those agents may
 * not see one another's same-batch replies. Schedule a semantic peer-reaction
 * check before allowing the conversation to become idle. */
export function shouldRequirePeerReaction(triggerSource, participantCount) {
  return triggerSource !== 'auto' && Number(participantCount) > 1
}

/** Identify prompts written by older Agent Arena builds before their DSH
 * sessions were automatically archived. Keep this deliberately specific so a
 * one-time migration cannot hide an ordinary user conversation by accident. */
export function isArenaSessionPrompt(value) {
  const text = String(value ?? '')
  return (
    (text.startsWith('你正在“') && text.includes('协作群中，显示名称是'))
    || (text.startsWith('你正在社交群聊“') && text.includes('显示名称是'))
    || (text.startsWith('你刚在') && text.includes('里收到一条新消息：'))
    || (text.startsWith('你是群管理员 ') && (
      text.includes('人类用户刚刚对你说：')
      || text.includes('角色已经各自判断是否接话')
    ))
  )
}

const MUTE_PHRASES = [
  'stop talking', 'stop replying', 'stay quiet', 'be quiet', 'mute',
  '不要再说话', '不要说话', '先别说话', '别说话', '不要再回复', '不要回复', '先别回复', '别回复',
  '暂停发言', '停止发言', '保持安静', '闭嘴',
]

const UNMUTE_PHRASES = [
  'you can speak again', 'resume speaking', 'resume replying', 'unmute',
  '可以继续说话了', '可以说话了', '继续说话', '恢复说话', '可以继续回复了', '可以回复了',
  '继续回复', '恢复回复', '恢复发言', '解除静默', '取消静默',
]

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function phrasePattern(phrases) {
  return phrases.map(escapeRegExp).join('|')
}

/**
 * Parse human-friendly speech controls such as “小王先别说话” and
 * “@小王 可以继续回复了”.  Unmute wins if one message contains both forms.
 */
export function parseSpeechDirectives(text, profiles) {
  const source = String(text ?? '').trim()
  const muteIds = new Set()
  const unmuteIds = new Set()
  const mutePattern = phrasePattern(MUTE_PHRASES)
  const unmutePattern = phrasePattern(UNMUTE_PHRASES)
  const allNames = '(?:大家|所有人|所有AI|全部AI|你们|全员|everyone|all AI users|all members)'
  const muteAll = new RegExp(`${allNames}.{0,8}(?:${mutePattern})|(?:${mutePattern}).{0,8}${allNames}`, 'i').test(source)
  const unmuteAll = new RegExp(`${allNames}.{0,8}(?:${unmutePattern})|(?:${unmutePattern}).{0,8}${allNames}`, 'i').test(source)
  const ordered = [...profiles]
    .filter(profile => profile?.id && profile?.name)
    .sort((a, b) => String(b.name).length - String(a.name).length)

  for (const profile of ordered) {
    const name = `@?${escapeRegExp(profile.name)}`
    if (new RegExp(`(?:${name}).{0,10}(?:${mutePattern})|(?:${mutePattern}).{0,10}(?:${name})`, 'i').test(source)) muteIds.add(profile.id)
    if (new RegExp(`(?:${name}).{0,10}(?:${unmutePattern})|(?:${unmutePattern}).{0,10}(?:${name})`, 'i').test(source)) unmuteIds.add(profile.id)
  }

  if (muteAll) ordered.forEach(profile => muteIds.add(profile.id))
  if (unmuteAll) ordered.forEach(profile => unmuteIds.add(profile.id))
  unmuteIds.forEach(id => muteIds.delete(id))

  const hasDirective = muteIds.size > 0 || unmuteIds.size > 0
  let remainder = source
  for (const profile of ordered) remainder = remainder.replace(new RegExp(`@?${escapeRegExp(profile.name)}`, 'gi'), '')
  for (const phrase of [...UNMUTE_PHRASES, ...MUTE_PHRASES]) remainder = remainder.replace(new RegExp(escapeRegExp(phrase), 'gi'), '')
  remainder = remainder
    .replace(/大家|所有人|所有AI|全部AI|你们|全员/gi, '')
    .replace(/\b(?:everyone|all AI users|all members|please)\b/gi, '')
    .replace(/请|麻烦|让|叫|我|你|他|她|它|就|也|再|先|一下|暂时|现在|已经|了|吧|哦|哈/g, '')
    .replace(/[\s，。！？、,.!?:：；;~～“”"'（）()]+/g, '')

  return {
    muteIds: profiles.filter(profile => muteIds.has(profile?.id)).map(profile => profile.id),
    unmuteIds: profiles.filter(profile => unmuteIds.has(profile?.id)).map(profile => profile.id),
    hasDirective,
    commandOnly: hasDirective && remainder.length === 0,
  }
}

export function publicMeeting(meeting) {
  return JSON.parse(JSON.stringify(meeting))
}
