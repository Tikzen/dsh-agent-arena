import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import {
  API_ROOT,
  ARENA_TEMPLATES,
  ensureMeetingWorkspace,
  isDuplicateAutonomousMessage,
  isArenaSessionPrompt,
  MEETING_STAGES,
  TASK_STATUSES,
  cleanAvatar,
  mentionedProfileIds,
  mentionsAdministrator,
  parseSpeechDirectives,
  publicMeeting,
  renderPersonaTemplate,
  shouldRequirePeerReaction,
  validateMeetingInput,
} from './shared.mjs'

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}
const BUSY_MEETING_STATUSES = new Set(['queued', 'running', 'pausing'])
const LEGACY_TERMINAL_STATUSES = new Set(['completed', 'stopped', 'failed', 'interrupted'])

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const nowIso = () => new Date().toISOString()
const safeError = error => error instanceof Error ? error.message : String(error)

function createArenaUserMessage(text) {
  return Object.freeze({
    id: randomUUID(),
    role: 'user',
    content: Object.freeze([Object.freeze({ type: 'text', text })]),
    source: Object.freeze({ kind: 'plugin', plugin: 'agent-arena' }),
  })
}

// DSH's model selection is Agent-scoped. Keeping this tiny adapter local avoids
// forcing linked plugins to install a second copy of DSH's runtime packages.
function installArenaModelSelection(agentCtx, selection) {
  const state = { current: selection, assembled: undefined }
  const disposeAssembly = agentCtx.on('system-prompt/assemble', async (_assembly, _context, next) => {
    const selected = state.current
    const assembled = await next()
    state.assembled = selected
    return {
      ...assembled,
      variables: { ...assembled.variables, provider: selected.provider, model: selected.model },
    }
  })
  const disposeRequest = agentCtx.on('agent/request', async (_payload, next) => {
    const resolved = await next()
    const selected = state.assembled
    if (!selected) return resolved
    const { reasoningEffort: _inheritedEffort, ...base } = resolved
    return {
      ...base,
      provider: selected.provider,
      model: selected.model,
      ...(selected.reasoningEffort === undefined ? {} : { reasoningEffort: selected.reasoningEffort }),
    }
  })
  return () => { disposeAssembly(); disposeRequest() }
}

function messageText(output = []) {
  return output
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text.trim())
    .filter(Boolean)
    .join('\n\n')
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 256 * 1024) throw new HttpError(413, '请求体不能超过 256 KB')
    chunks.push(buffer)
  }
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, '请求体不是有效的 JSON')
  }
}

function respond(res, status, body) {
  res.writeHead(status, JSON_HEADERS)
  res.end(JSON.stringify(body))
}

function transcriptText(items, emptyText = '（还没有消息）') {
  const text = items
    .filter(item => item.kind !== 'system')
    .map(item => `${item.speaker ?? item.senderName}: ${item.text}`)
    .join('\n\n')
  return text.length > 24_000 ? text.slice(-24_000) : (text || emptyText)
}

function meetingWorkspaceText(meeting) {
  ensureMeetingWorkspace(meeting)
  const participantName = id => meeting.participants?.find(item => item.id === id)?.name || (id === 'administrator' ? meeting.administratorProfile?.name : '') || '未分配'
  const tasks = meeting.tasks.length
    ? meeting.tasks.map(item => `- [${item.status}] ${item.title}；负责人：${participantName(item.assigneeId)}${item.description ? `；${item.description}` : ''}`).join('\n')
    : '（暂无任务）'
  const decisions = meeting.decisions.length
    ? meeting.decisions.map(item => `- [${item.status}] ${item.title}：${item.options.map(option => `${option.id}=${option.label}`).join(' / ')}${item.selectedOptionId ? `；已选 ${item.selectedOptionId}` : ''}`).join('\n')
    : '（暂无待决策项）'
  const artifacts = meeting.artifacts.length
    ? meeting.artifacts.map(item => `- [${item.status}] ${item.title}${item.location ? `；${item.location}` : ''}${item.description ? `；${item.description}` : ''}`).join('\n')
    : '（暂无成果）'
  return [`当前协作阶段：${meeting.collaborationStage}`, '任务板：', tasks, '决策板：', decisions, '成果板：', artifacts].join('\n')
}

function participantPrompt(meeting, participant, coordinationText = '') {
  return [
    `你正在“${meeting.topic}”协作群中，显示名称是 ${participant.name}。`,
    `你的人格与职责：${participant.role || '独立思考，主动推进问题并给出有依据的建议。'}`,
    '这不是表演式辩论，而是多位 AI 与人类共同讨论并完成工作的长期群聊。完整阅读其他成员的新发言，再决定是回应其具体观点、追问、反驳、补充、交接任务还是继续执行；不要把每次发言都写成互不相干的一次性答案。',
    '如果最近一条实质消息来自另一位 AI，请优先接住其中尚未解决的内容并可直接 @对方；有可执行工作时使用 DSH 提供的工具。不要复述已经说过的内容，也不要为了刷存在感而附和。',
    '你拥有当前 DSH Agent Preset 的完整能力，可按任务需要使用工具、技能和子 Agent。只报告真正完成的操作，不虚构调查、文件修改或外部结果。不要披露隐藏思维过程。',
    '公开发言时使用 arena_send_message。发一条还是多条、每条多长，都由你结合人格、语义和任务自然决定：能一条说清就发一条，需要自然分步、报告真实进度或补交最终结果时可以连续发送。绝对不要按字数、句号或固定模板机械切分。',
    '每次 arena_send_message 调用都会立刻显示在群聊中；调用过后不要在最终回答中重复这些公开内容。不要添加自己的姓名前缀，插件不限制输出 token。',
    '会议右侧有共享协作控制台。需要拆分或认领工作时更新任务板；出现多个可选方案时创建决策并留下理由、风险和信心；产出文件、链接或结论后登记到成果板。不要把这些结构化更新只写在聊天气泡里。',
    coordinationText,
    '',
    '当前协作控制台：',
    meetingWorkspaceText(meeting),
    '',
    '当前群聊记录：',
    transcriptText(meeting.transcript),
  ].join('\n')
}

function chatPrompt(room, profile, coordinationText = '') {
  const otherNames = room.participants.filter(item => item.id !== profile.id).map(item => item.name)
  return [
    `你正在社交群聊“${room.name}”中，显示名称是 ${profile.name}。`,
    `你的人格设定：${profile.role || '自然、友善、清晰地交流，并主动提供有帮助的结果。'}`,
    room.type === 'group'
      ? `群成员还有：${[room.humanProfile.name, ...otherNames, room.administratorProfile?.name].filter(Boolean).join('、')}。`
      : `你正在和 ${room.humanProfile.name} 私聊。`,
    '完整阅读最近的人类与 AI 消息，像真实群友一样判断并回应具体话头；可以点名追问、反驳、补充或承接工作，不要只给与其他成员互不相干的一次性答案。你拥有当前 DSH Agent Preset 的完整能力，可以使用工具、技能和子 Agent 完成用户交办的工作。只报告真实完成的操作，不披露隐藏思维过程。',
    '公开发言时使用 arena_send_message。发一条还是多条、每条多长，都由你结合人格、语义和任务自然决定：能一条说清就发一条，需要自然分步、报告真实进度或补交最终结果时可以连续发送。绝对不要按字数、句号或固定模板机械切分。',
    '每次 arena_send_message 调用都会立刻显示在聊天中；调用过后不要在最终回答中重复这些公开内容。不要添加姓名前缀，插件不限制输出 token。',
    coordinationText,
    '',
    '聊天记录：',
    transcriptText(room.messages),
  ].join('\n')
}

function inferAdminCommand(text) {
  const source = String(text ?? '')
  if (/(重开|重新|撤销).{0,6}(决策|方案|选择)/.test(source)) return { action: 'reopen-decision', topic: '', stage: '' }
  if (/(暂停|先停一下|停止发言)/.test(source)) return { action: 'pause', topic: '', stage: '' }
  if (/(总结并结束|结束会议|收尾|形成总结)/.test(source)) return { action: 'finish', topic: '', stage: '' }
  if (/(继续讨论|继续发言|让大家继续|全员回答)/.test(source)) return { action: 'continue', topic: '', stage: '' }
  const stageMatch = source.match(/(?:进入|切换到|改为)(讨论|规划|执行|评审|等待)(?:阶段)?/)
  if (stageMatch) {
    const stages = { 讨论: 'discussion', 规划: 'planning', 执行: 'execution', 评审: 'review', 等待: 'waiting-human' }
    return { action: 'set-stage', topic: '', stage: stages[stageMatch[1]] }
  }
  if (/(?:更换|修改|切换|改变).{0,4}(?:话题|主题)|(?:话题|主题).{0,4}(?:改为|换成|切换为)/.test(source)) {
    const match = source.match(/(?:话题|主题)(?:改为|修改为|换成|切换为|是|为|：|:)?\s*[“"]?([^”"\n]+)[”"]?$/)
    return { action: 'change-topic', topic: match?.[1]?.trim() ?? '', stage: '' }
  }
  return { action: 'none', topic: '', stage: '' }
}

function adminSchema() {
  return {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      action: { type: 'string', enum: ['none', 'change-topic', 'reopen-decision', 'continue', 'pause', 'finish', 'set-stage'] },
      topic: { type: 'string' },
      stage: { type: 'string', enum: ['', ...MEETING_STAGES.filter(item => item !== 'completed')] },
    },
    required: ['reply', 'action', 'topic', 'stage'],
    additionalProperties: false,
  }
}

function finalSummarySchema() {
  return {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      rationale: { type: 'string' },
      openItems: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['summary', 'rationale', 'openItems'],
    additionalProperties: false,
  }
}

function replyIntentSchema() {
  return {
    type: 'object',
    properties: {
      shouldSpeak: { type: 'boolean' },
      reason: { type: 'string' },
    },
    required: ['shouldSpeak', 'reason'],
    additionalProperties: false,
  }
}

function continuationGuardSchema(container) {
  return {
    type: 'object',
    properties: {
      onTopic: { type: 'boolean' },
      complete: { type: 'boolean' },
      approvedSpeakerIds: {
        type: 'array',
        items: { type: 'string', enum: container.participants.map(item => item.id) },
      },
      reason: { type: 'string' },
    },
    required: ['onTopic', 'complete', 'approvedSpeakerIds', 'reason'],
    additionalProperties: false,
  }
}

export const inject = ['agents', 'agentPresets', 'subagents', 'systemPrompt', 'tools', 'webServer', 'agentDefaultModel', 'llm', 'sessionPersistence', 'workspaceRegistry']

export function apply(ctx, config = {}) {
  const stateDir = resolve(String(config.stateDir || join(process.cwd(), '.dsh-agent-arena')))
  const stateFile = join(stateDir, 'meetings.json')
  const maxConcurrentMeetings = Math.max(1, Math.min(3, Number(config.maxConcurrentMeetings) || 1))
  const meetings = new Map()
  const rooms = new Map()
  const profiles = {
    human: { id: 'human', name: '你', avatar: '🧑' },
    administrator: {
      id: 'administrator',
      name: '管理员',
      avatar: '🛡️',
      role: '维护协作秩序，并按人类用户的要求安全地调整话题、协作阶段与决策状态。',
      provider: '',
      model: '',
    },
    aiUsers: [],
  }
  const queue = []
  const runtimes = new Map()
  const pendingMeetingStarts = new Map()
  const roomRuntimes = new Map()
  let activeCount = 0
  let disposed = false
  let persistChain = Promise.resolve()
  let catalogCache = { expiresAt: 0, value: [] }
  const migrations = { archivedLegacyArenaSessions: false }

  function monitorProfiles(container) {
    return [
      ...(container.administratorProfile ? [container.administratorProfile] : []),
      ...(Array.isArray(container.participants) ? container.participants : []),
    ].filter(profile => profile?.id && profile?.name)
  }

  function ensureActivityMonitor(container) {
    const previous = new Map((container.activityMonitor?.roles ?? []).map(role => [role.profileId, role]))
    const muted = new Set(Array.isArray(container.mutedParticipantIds) ? container.mutedParticipantIds : [])
    const roles = monitorProfiles(container).map(profile => {
      const current = previous.get(profile.id)
      return {
        profileId: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        model: profile.model || '',
        status: current?.status || (muted.has(profile.id) ? 'muted' : 'idle'),
        stage: current?.stage || (muted.has(profile.id) ? '已静默' : '等待任务'),
        detail: current?.detail || '',
        currentTool: current?.currentTool || '',
        claimedFiles: Array.isArray(current?.claimedFiles) ? current.claimedFiles.slice(0, 20) : [],
        recent: Array.isArray(current?.recent) ? current.recent.slice(-10) : [],
        updatedAt: current?.updatedAt || nowIso(),
      }
    })
    container.activityMonitor = {
      updatedAt: container.activityMonitor?.updatedAt || nowIso(),
      roles,
    }
    return container.activityMonitor
  }

  function workspaceSnapshot(meeting) {
    ensureMeetingWorkspace(meeting)
    return {
      stage: meeting.collaborationStage,
      tasks: meeting.tasks,
      decisions: meeting.decisions,
      artifacts: meeting.artifacts,
    }
  }

  function workspaceText(value, maxLength = 1200) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
  }

  function workspaceAssignee(meeting, value, allowEmpty = true) {
    const id = workspaceText(value, 80)
    if (!id && allowEmpty) return null
    if (!meeting.participants.some(item => item.id === id) && id !== 'administrator') throw new HttpError(400, '负责人不在本场会议中')
    return id
  }

  function createWorkspaceTask(meeting, raw, createdBy = 'human') {
    ensureMeetingWorkspace(meeting)
    const title = workspaceText(raw?.title, 160)
    if (!title) throw new HttpError(400, '任务标题不能为空')
    const timestamp = nowIso()
    const task = {
      id: randomUUID(), title, description: workspaceText(raw?.description, 1600),
      assigneeId: workspaceAssignee(meeting, raw?.assigneeId), status: 'todo', createdBy,
      createdAt: timestamp, updatedAt: timestamp,
    }
    meeting.tasks.push(task)
    if (meeting.collaborationStage === 'discussion') meeting.collaborationStage = 'planning'
    return task
  }

  function updateWorkspaceTask(meeting, raw) {
    ensureMeetingWorkspace(meeting)
    const task = meeting.tasks.find(item => item.id === String(raw?.taskId ?? ''))
    if (!task) throw new HttpError(404, '没有找到这个任务')
    if (Object.hasOwn(raw ?? {}, 'title')) {
      const title = workspaceText(raw.title, 160)
      if (!title) throw new HttpError(400, '任务标题不能为空')
      task.title = title
    }
    if (Object.hasOwn(raw ?? {}, 'description')) task.description = workspaceText(raw.description, 1600)
    if (Object.hasOwn(raw ?? {}, 'assigneeId')) task.assigneeId = workspaceAssignee(meeting, raw.assigneeId)
    if (Object.hasOwn(raw ?? {}, 'status')) {
      const status = String(raw.status ?? '')
      if (!TASK_STATUSES.includes(status)) throw new HttpError(400, '任务状态无效')
      task.status = status
      if (status === 'in-progress') meeting.collaborationStage = 'execution'
      else if (status === 'review') meeting.collaborationStage = 'review'
    }
    task.updatedAt = nowIso()
    return task
  }

  function deleteWorkspaceTask(meeting, raw) {
    ensureMeetingWorkspace(meeting)
    const index = meeting.tasks.findIndex(item => item.id === String(raw?.taskId ?? ''))
    if (index < 0) throw new HttpError(404, '没有找到这个任务')
    return meeting.tasks.splice(index, 1)[0]
  }

  function normalizeDecisionOptions(rawOptions) {
    const values = Array.isArray(rawOptions) ? rawOptions : []
    const options = values.map(value => {
      const label = workspaceText(typeof value === 'string' ? value : value?.label, 160)
      const description = workspaceText(typeof value === 'object' ? value?.description : '', 1000)
      return label ? { id: randomUUID(), label, description, opinions: [] } : null
    }).filter(Boolean).slice(0, 6)
    if (options.length < 2) throw new HttpError(400, '决策至少需要两个有效选项')
    return options
  }

  function createWorkspaceDecision(meeting, raw, createdBy = 'human') {
    ensureMeetingWorkspace(meeting)
    const title = workspaceText(raw?.title, 160)
    if (!title) throw new HttpError(400, '决策标题不能为空')
    const timestamp = nowIso()
    const decision = {
      id: randomUUID(), title, description: workspaceText(raw?.description, 1600),
      options: normalizeDecisionOptions(raw?.options), status: 'open', selectedOptionId: null,
      selectedBy: null, createdBy, createdAt: timestamp, updatedAt: timestamp,
    }
    meeting.decisions.push(decision)
    if (meeting.collaborationStage === 'discussion') meeting.collaborationStage = 'planning'
    return decision
  }

  function addDecisionOpinion(meeting, raw, profile) {
    ensureMeetingWorkspace(meeting)
    const decision = meeting.decisions.find(item => item.id === String(raw?.decisionId ?? ''))
    if (!decision) throw new HttpError(404, '没有找到这个决策')
    const option = decision.options.find(item => item.id === String(raw?.optionId ?? ''))
    if (!option) throw new HttpError(404, '没有找到这个决策选项')
    const stance = ['support', 'oppose', 'neutral'].includes(String(raw?.stance)) ? String(raw.stance) : 'neutral'
    const confidence = Math.max(0, Math.min(100, Number(raw?.confidence) || 0))
    const opinion = {
      profileId: profile.id, name: profile.name, avatar: profile.avatar, stance,
      reason: workspaceText(raw?.description ?? raw?.reason, 1200), risk: workspaceText(raw?.risk, 800), confidence,
      updatedAt: nowIso(),
    }
    option.opinions = Array.isArray(option.opinions) ? option.opinions : []
    const previous = option.opinions.findIndex(item => item.profileId === profile.id)
    if (previous >= 0) option.opinions.splice(previous, 1, opinion)
    else option.opinions.push(opinion)
    decision.updatedAt = nowIso()
    return opinion
  }

  function chooseWorkspaceDecision(meeting, raw, selectedBy = 'human') {
    ensureMeetingWorkspace(meeting)
    const decision = meeting.decisions.find(item => item.id === String(raw?.decisionId ?? ''))
    if (!decision) throw new HttpError(404, '没有找到这个决策')
    const optionId = String(raw?.optionId ?? '')
    if (!decision.options.some(item => item.id === optionId)) throw new HttpError(400, '决策选项无效')
    decision.selectedOptionId = optionId
    decision.selectedBy = selectedBy
    decision.status = 'decided'
    decision.updatedAt = nowIso()
    meeting.collaborationStage = 'execution'
    return decision
  }

  function reopenWorkspaceDecision(meeting, raw) {
    ensureMeetingWorkspace(meeting)
    const decision = meeting.decisions.find(item => item.id === String(raw?.decisionId ?? ''))
    if (!decision) throw new HttpError(404, '没有找到这个决策')
    decision.selectedOptionId = null
    decision.selectedBy = null
    decision.status = 'open'
    decision.updatedAt = nowIso()
    meeting.collaborationStage = 'discussion'
    return decision
  }

  function deleteWorkspaceDecision(meeting, raw) {
    ensureMeetingWorkspace(meeting)
    const index = meeting.decisions.findIndex(item => item.id === String(raw?.decisionId ?? ''))
    if (index < 0) throw new HttpError(404, '没有找到这个决策')
    return meeting.decisions.splice(index, 1)[0]
  }

  function createWorkspaceArtifact(meeting, raw, createdBy = 'human') {
    ensureMeetingWorkspace(meeting)
    const title = workspaceText(raw?.title, 160)
    if (!title) throw new HttpError(400, '成果标题不能为空')
    const artifactType = ['file', 'link', 'note', 'summary'].includes(String(raw?.artifactType)) ? String(raw.artifactType) : 'note'
    const timestamp = nowIso()
    const artifact = {
      id: randomUUID(), title, description: workspaceText(raw?.description, 2400),
      artifactType, location: workspaceText(raw?.location, 1600), ownerId: workspaceAssignee(meeting, raw?.ownerId),
      status: 'draft', createdBy, createdAt: timestamp, updatedAt: timestamp,
    }
    meeting.artifacts.push(artifact)
    meeting.collaborationStage = 'review'
    return artifact
  }

  function updateWorkspaceArtifact(meeting, raw) {
    ensureMeetingWorkspace(meeting)
    const artifact = meeting.artifacts.find(item => item.id === String(raw?.artifactId ?? ''))
    if (!artifact) throw new HttpError(404, '没有找到这个成果')
    if (Object.hasOwn(raw ?? {}, 'status')) {
      const status = String(raw.status ?? '')
      if (!['draft', 'accepted', 'rejected'].includes(status)) throw new HttpError(400, '成果状态无效')
      artifact.status = status
    }
    if (Object.hasOwn(raw ?? {}, 'title')) artifact.title = workspaceText(raw.title, 160) || artifact.title
    if (Object.hasOwn(raw ?? {}, 'description')) artifact.description = workspaceText(raw.description, 2400)
    if (Object.hasOwn(raw ?? {}, 'location')) artifact.location = workspaceText(raw.location, 1600)
    artifact.updatedAt = nowIso()
    return artifact
  }

  function deleteWorkspaceArtifact(meeting, raw) {
    ensureMeetingWorkspace(meeting)
    const index = meeting.artifacts.findIndex(item => item.id === String(raw?.artifactId ?? ''))
    if (index < 0) throw new HttpError(404, '没有找到这个成果')
    return meeting.artifacts.splice(index, 1)[0]
  }

  function roleActivity(container, profile) {
    const monitor = ensureActivityMonitor(container)
    let role = monitor.roles.find(item => item.profileId === profile.id)
    if (!role) {
      role = {
        profileId: profile.id, name: profile.name, avatar: profile.avatar, model: profile.model || '',
        status: 'idle', stage: '等待任务', detail: '', currentTool: '', claimedFiles: [], recent: [], updatedAt: nowIso(),
      }
      monitor.roles.push(role)
    }
    return role
  }

  function setRoleActivity(container, profile, patch = {}, eventText = '', eventKind = 'info', eventTime) {
    if (!container || !profile?.id) return
    const role = roleActivity(container, profile)
    const timestamp = eventTime ? new Date(eventTime).toISOString() : nowIso()
    Object.assign(role, patch, {
      name: profile.name,
      avatar: profile.avatar,
      model: profile.model || role.model || '',
      updatedAt: timestamp,
    })
    if (eventText) {
      const text = String(eventText).trim().slice(0, 320)
      const last = role.recent.at(-1)
      if (!last || last.text !== text || last.kind !== eventKind) {
        role.recent.push({ id: randomUUID(), kind: eventKind, text, createdAt: timestamp })
        role.recent = role.recent.slice(-10)
      }
    }
    container.activityMonitor.updatedAt = timestamp
  }

  function normalizeCoordinationFile(value) {
    const text = String(value ?? '').trim()
    if (!text || text.length > 1000) return null
    const absolute = resolve(process.cwd(), text)
    return { key: process.platform === 'win32' ? absolute.toLocaleLowerCase() : absolute, path: absolute }
  }

  function coordinationBoard(runtime, selfId) {
    const monitor = ensureActivityMonitor(runtime.container)
    return monitor.roles.map(role => ({
      profileId: role.profileId,
      name: role.name,
      status: role.status,
      stage: role.stage,
      detail: role.detail,
      currentTool: role.currentTool,
      claimedFiles: role.claimedFiles,
      isSelf: role.profileId === selfId,
    }))
  }

  function releaseRoleClaims(runtime, profileId, requestedFiles = []) {
    runtime.fileClaims ??= new Map()
    const requested = requestedFiles.map(normalizeCoordinationFile).filter(Boolean)
    const keys = requested.length ? new Set(requested.map(item => item.key)) : null
    for (const [key, claim] of runtime.fileClaims) {
      if (claim.ownerId === profileId && (!keys || keys.has(key))) runtime.fileClaims.delete(key)
    }
    const profile = monitorProfiles(runtime.container).find(item => item.id === profileId)
    if (profile) {
      const claimedFiles = [...runtime.fileClaims.values()].filter(claim => claim.ownerId === profileId).map(claim => claim.path)
      setRoleActivity(runtime.container, profile, { claimedFiles })
    }
  }

  function claimRoleFiles(runtime, profile, requestedFiles) {
    runtime.fileClaims ??= new Map()
    const files = [...new Map(requestedFiles.map(normalizeCoordinationFile).filter(Boolean).map(item => [item.key, item])).values()].slice(0, 20)
    const conflicts = files.flatMap(file => {
      const claim = runtime.fileClaims.get(file.key)
      if (!claim || claim.ownerId === profile.id) return []
      return [{ file: file.path, ownerId: claim.ownerId, ownerName: claim.ownerName }]
    })
    if (conflicts.length) return { ok: false, files, conflicts }
    for (const file of files) runtime.fileClaims.set(file.key, { ownerId: profile.id, ownerName: profile.name, path: file.path })
    const claimedFiles = [...runtime.fileClaims.values()].filter(claim => claim.ownerId === profile.id).map(claim => claim.path)
    setRoleActivity(runtime.container, profile, { status: 'editing', stage: '已锁定文件，准备编辑', claimedFiles }, files.length ? `锁定 ${files.length} 个文件` : '')
    return { ok: true, files, conflicts: [] }
  }

  function mutationTargets(toolName, rawArguments) {
    const name = String(toolName || '').toLocaleLowerCase()
    const args = rawArguments && typeof rawArguments === 'object' ? rawArguments : {}
    if (name === 'write' || name === 'edit') return [args.file_path]
    if (name === 'str_replace_editor' && args.command !== 'view') return [args.path]
    if (name === 'apply_patch') {
      const patch = String(args.patch ?? args.input ?? '')
      return [...patch.matchAll(/^\*\*\* (?:Update|Add|Delete) File:\s*(.+)$/gm)].map(match => match[1])
    }
    return []
  }

  function coordinationTool(runtime, profile) {
    return {
      name: 'arena_coordination',
      description: '查看其他角色动态与会议协作控制台；更新自己的状态；创建或推进任务；提出决策、对方案发表意见；登记成果；编辑前原子锁定文件。',
      parameters: {
        type: 'object', additionalProperties: false,
        properties: {
          action: { type: 'string', enum: ['view', 'update', 'claim', 'release', 'task-create', 'task-update', 'decision-create', 'decision-opinion', 'artifact-add'] },
          summary: { type: 'string', description: '正在做什么，简短说明。' },
          files: { type: 'array', items: { type: 'string' }, description: '需要锁定或释放的文件路径。' },
          taskId: { type: 'string', description: '要更新的任务 ID。' },
          decisionId: { type: 'string', description: '要评论的决策 ID。' },
          optionId: { type: 'string', description: '要评论的方案 ID。' },
          title: { type: 'string', description: '任务、决策或成果标题。' },
          description: { type: 'string', description: '详细说明或方案理由。' },
          assigneeId: { type: 'string', description: '负责人 ID；留空表示未分配。' },
          status: { type: 'string', enum: TASK_STATUSES },
          options: { type: 'array', items: { type: 'string' }, description: '创建决策时的 2 到 6 个候选方案。' },
          stance: { type: 'string', enum: ['support', 'oppose', 'neutral'] },
          risk: { type: 'string', description: '方案风险。' },
          confidence: { type: 'number', description: '对该判断的信心，0 到 100。' },
          artifactType: { type: 'string', enum: ['file', 'link', 'note', 'summary'] },
          location: { type: 'string', description: '文件路径或链接。' },
        },
        required: ['action'],
      },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            ok: { type: 'boolean' },
            message: { type: 'string' },
            conflicts: {
              type: 'array', items: {
                type: 'object', additionalProperties: false,
                properties: { file: { type: 'string' }, ownerId: { type: 'string' }, ownerName: { type: 'string' } },
                required: ['file', 'ownerId', 'ownerName'],
              },
            },
            workspaceJson: { type: 'string', description: '当前会议任务、决策、成果和阶段的 JSON 快照；普通聊天中为空对象。' },
            roles: {
              type: 'array', items: {
                type: 'object', additionalProperties: false,
                properties: {
                  profileId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string' }, stage: { type: 'string' },
                  detail: { type: 'string' }, currentTool: { type: 'string' }, claimedFiles: { type: 'array', items: { type: 'string' } }, isSelf: { type: 'boolean' },
                },
                required: ['profileId', 'name', 'status', 'stage', 'detail', 'currentTool', 'claimedFiles', 'isSelf'],
              },
            },
          },
          required: ['ok', 'message', 'conflicts', 'roles', 'workspaceJson'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      async execute(raw) {
        const action = String(raw?.action || 'view')
        const summary = String(raw?.summary || '').trim().slice(0, 280)
        const files = Array.isArray(raw?.files) ? raw.files.map(String).slice(0, 20) : []
        let ok = true
        let message = '已返回实时协作板。'
        let conflicts = []
        if (action === 'update') {
          setRoleActivity(runtime.container, profile, { status: 'working', stage: summary || '正在推进任务', detail: summary }, summary || '更新了工作状态')
          message = '工作状态已更新。'
        } else if (action === 'claim') {
          const result = claimRoleFiles(runtime, profile, files)
          ok = result.ok
          conflicts = result.conflicts
          if (ok) {
            if (summary) setRoleActivity(runtime.container, profile, { detail: summary, stage: summary })
            message = files.length ? '文件已锁定；完成编辑后请 release。' : '没有提供可锁定的文件。'
          } else {
            const owners = [...new Set(conflicts.map(item => item.ownerName))].join('、')
            setRoleActivity(runtime.container, profile, { status: 'waiting', stage: '等待文件锁', detail: `${owners} 正在编辑冲突文件` }, `检测到文件冲突：${owners}`, 'warning')
            message = `锁定失败：${owners} 正在编辑这些文件。不要修改冲突文件；请等待、换任务或与对方协调。`
          }
        } else if (action === 'release') {
          releaseRoleClaims(runtime, profile.id, files)
          setRoleActivity(runtime.container, profile, { status: 'working', stage: summary || '已释放文件锁', detail: summary }, '释放了文件锁')
          message = '文件锁已释放。'
        } else if (action === 'task-create' && runtime.isMeeting) {
          const task = createWorkspaceTask(runtime.container, raw, profile.id)
          setRoleActivity(runtime.container, profile, { status: 'working', stage: `已创建任务：${task.title}`, detail: task.description }, `创建任务：${task.title}`)
          message = `任务已创建，ID：${task.id}`
        } else if (action === 'task-update' && runtime.isMeeting) {
          const task = updateWorkspaceTask(runtime.container, raw)
          setRoleActivity(runtime.container, profile, { status: task.status === 'blocked' ? 'waiting' : 'working', stage: `任务“${task.title}”：${task.status}`, detail: task.description }, `更新任务：${task.title} → ${task.status}`, task.status === 'blocked' ? 'warning' : 'info')
          message = `任务已更新：${task.title}`
        } else if (action === 'decision-create' && runtime.isMeeting) {
          const decision = createWorkspaceDecision(runtime.container, raw, profile.id)
          message = `决策已创建，ID：${decision.id}；请相关成员用 decision-opinion 对具体方案留下理由、风险与信心。`
        } else if (action === 'decision-opinion' && runtime.isMeeting) {
          addDecisionOpinion(runtime.container, raw, profile)
          message = '方案意见已记录，最终方案由人类用户选择。'
        } else if (action === 'artifact-add' && runtime.isMeeting) {
          const artifact = createWorkspaceArtifact(runtime.container, { ...raw, ownerId: profile.id }, profile.id)
          setRoleActivity(runtime.container, profile, { status: 'working', stage: `已登记成果：${artifact.title}`, detail: artifact.location || artifact.description }, `登记成果：${artifact.title}`, 'success')
          message = `成果已登记，ID：${artifact.id}`
        } else if (!['view', 'update', 'claim', 'release'].includes(action)) {
          ok = false
          message = runtime.isMeeting ? '协作控制台操作参数无效。' : '任务、决策和成果只在协作会议中可用。'
        } else {
          setRoleActivity(runtime.container, profile, { stage: summary || '查看协作动态', detail: summary })
        }
        return {
          ok, message, conflicts, roles: coordinationBoard(runtime, profile.id),
          workspaceJson: JSON.stringify(runtime.isMeeting ? workspaceSnapshot(runtime.container) : {}),
        }
      },
    }
  }

  function autonomousMessageTool(runtime, profile) {
    return {
      name: 'arena_send_message',
      description: '立即向当前 Agent Arena 会议、群聊或私聊发送一条公开消息。你自己决定是否调用、调用几次以及每条多长；不要按字数机械切分。适合自然回应、阶段性进度和最终结果。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string', description: '现在要公开发送的完整消息。不要添加自己的姓名前缀。' },
        },
        required: ['text'],
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean' },
            message: { type: 'string' },
            messageId: { type: 'string' },
          },
          required: ['ok', 'message', 'messageId'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      async execute(raw) {
        const turn = runtime.messageTurns?.get(profile.id)
        if (!turn || turn.phase !== 'work') {
          return { ok: false, message: '当前不在公开发言阶段；不要在确认或内部判断阶段发送群消息。', messageId: '' }
        }
        if (runtime.abort.signal.aborted || runtime.cancelCurrentWork || isMuted(runtime.container, profile.id)) {
          return { ok: false, message: '本轮已停止或你已被静默，消息没有发送。', messageId: '' }
        }
        const text = typeof raw?.text === 'string' ? raw.text.trim() : ''
        if (!text) return { ok: false, message: '空消息不会发送。', messageId: '' }
        if (isDuplicateAutonomousMessage(text, turn.sentTexts)) {
          return { ok: false, message: '这条内容在本轮已经发送过，请不要重复；继续工作或发送真正的新内容。', messageId: '' }
        }
        const message = appendAutonomousMessage(runtime.container, profile, runtime, text, turn)
        turn.sentTexts.push(text)
        turn.messageIds.push(message.id)
        setRoleActivity(runtime.container, profile, {
          status: 'working', stage: '已发送一条消息，仍在继续处理', detail: text.slice(0, 180), currentTool: '',
        }, '自主发送了一条公开消息', 'message')
        await persist()
        return {
          ok: true,
          message: '消息已立即显示。需要继续工作就继续；有新的自然内容或最终结果时可以再次调用，不要重复已发送内容。',
          messageId: message.id,
        }
      },
    }
  }

  function installCoordinationPlane(agentCtx, runtime, profile) {
    agentCtx.tools.register(coordinationTool(runtime, profile))
    agentCtx.tools.register(autonomousMessageTool(runtime, profile))
    agentCtx.tools.guard(exec => {
      const files = mutationTargets(exec.name, exec.arguments).map(normalizeCoordinationFile).filter(Boolean)
      if (!files.length) return undefined
      runtime.fileClaims ??= new Map()
      for (const file of files) {
        const claim = runtime.fileClaims.get(file.key)
        if (claim?.ownerId === profile.id) continue
        if (claim) {
          setRoleActivity(runtime.container, profile, { status: 'waiting', stage: '检测到编辑冲突', detail: `${claim.ownerName} 正在编辑 ${file.path}` }, `阻止了冲突编辑：${file.path}`, 'warning')
          return `Agent Arena 已阻止编辑冲突：${claim.ownerName} 正在编辑 ${file.path}。请通过 arena_coordination 查看协作板并等待或改做其他任务。`
        }
        return `为避免多角色编辑冲突，请先调用 arena_coordination，action=claim，files 包含 ${file.path}；锁定成功后再编辑。`
      }
      return undefined
    })
  }

  function coordinationPrompt(runtime, selfId) {
    const peers = coordinationBoard(runtime, selfId)
      .filter(role => !role.isSelf)
      .map(role => `${role.name}：${role.stage}${role.claimedFiles.length ? `；已锁定 ${role.claimedFiles.join('、')}` : ''}`)
      .join('\n') || '当前没有其他 AI 角色。'
    return [
      '',
      '实时协作规则：你可以使用 arena_coordination 查看其他角色和协作控制台。开始实质工作时先 update；可用 task-create/task-update 拆分、认领和推进任务，用 decision-create 提出备选方案，用 decision-opinion 写明立场、理由、风险和信心，用 artifact-add 登记真实成果。修改文件前必须先用 claim 原子锁定目标文件，发生冲突时不得覆盖对方修改；完成后 release。不得用 Shell 写入命令绕过文件锁。公开聊天使用 arena_send_message，由你按人格和实际语义决定自然的消息边界，不要机械切分，也不要每轮都先发套话确认。',
      '其他角色当前动态（开始本轮时的快照，随时用 arena_coordination view 刷新）：',
      peers,
    ].join('\n')
  }

  const persist = () => {
    const payload = JSON.stringify({ version: 3, meetings: [...meetings.values()], rooms: [...rooms.values()], profiles, migrations }, null, 2)
    persistChain = persistChain.catch(() => undefined).then(async () => {
      await mkdir(stateDir, { recursive: true })
      await writeFile(stateFile, `${payload}\n`, 'utf8')
    })
    return persistChain
  }

  async function archiveArenaAgent(handle) {
    try {
      await ctx.workspaceRegistry.archiveSession(handle.agent.id)
      return handle
    } catch (error) {
      await handle.dispose().catch(() => undefined)
      throw error
    }
  }

  async function archiveLegacyArenaSessions() {
    const archived = new Set(ctx.workspaceRegistry.archivedSessionIds)
    const headers = await ctx.sessionPersistence.list()
    let complete = true
    for (const header of headers) {
      if (header.origin === 'subagent' || archived.has(header.id)) continue
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(header.id))) continue
      try {
        const inspection = await ctx.sessionPersistence.inspect(header.id)
        const belongsToArena = inspection.events.some(event => (
          event.type === 'user/message'
          && isArenaSessionPrompt(messageText(event.data?.content))
        ))
        if (!belongsToArena) continue
        await ctx.workspaceRegistry.archiveSession(header.id)
        archived.add(header.id)
      } catch {
        complete = false
      }
    }
    return complete
  }

  function defaultModel() {
    return ctx.agentDefaultModel.currentSelection()
  }

  function administratorSnapshot() {
    const selection = defaultModel()
    return {
      ...profiles.administrator,
      provider: profiles.administrator.provider || selection.provider,
      model: profiles.administrator.model || selection.model,
    }
  }

  const hydrated = (async () => {
    await mkdir(stateDir, { recursive: true })
    let recovered = false
    try {
      const stored = JSON.parse(await readFile(stateFile, 'utf8'))
      migrations.archivedLegacyArenaSessions = stored?.migrations?.archivedLegacyArenaSessions === true
      if (stored?.profiles?.human) {
        profiles.human = {
          id: 'human',
          name: String(stored.profiles.human.name || '你').slice(0, 24),
          avatar: cleanAvatar(stored.profiles.human.avatar, '🧑'),
        }
      }
      if (stored?.profiles?.administrator) profiles.administrator = { ...profiles.administrator, ...stored.profiles.administrator, id: 'administrator' }
      if (Array.isArray(stored?.profiles?.aiUsers)) profiles.aiUsers = stored.profiles.aiUsers.filter(item => item?.id && item?.name && item?.provider && item?.model)
      for (const room of Array.isArray(stored?.rooms) ? stored.rooms : []) {
        if (!room?.id) continue
        if (room.type === 'group' && !room.administratorProfile) {
          recovered = true
          room.administratorProfile = administratorSnapshot()
        }
        if (room.status === 'responding') {
          recovered = true
          room.status = 'idle'
          room.respondingProfileId = null
          room.respondingProfileIds = []
          room.messages = Array.isArray(room.messages) ? room.messages : []
          room.messages.push({ id: randomUUID(), kind: 'system', senderId: 'system', senderName: '系统', avatar: 'ℹ️', text: 'DSH 重启中断了上次回复，请重新发送消息。', createdAt: nowIso() })
        }
        room.mutedParticipantIds = Array.isArray(room.mutedParticipantIds) ? room.mutedParticipantIds : []
        room.respondingProfileIds = Array.isArray(room.respondingProfileIds) ? room.respondingProfileIds : []
        const roomMonitor = ensureActivityMonitor(room)
        for (const role of roomMonitor.roles) {
          role.status = room.mutedParticipantIds.includes(role.profileId) ? 'muted' : 'idle'
          role.stage = role.status === 'muted' ? '已静默' : '等待任务'
          role.currentTool = ''
          role.claimedFiles = []
        }
        rooms.set(room.id, room)
      }
      for (const meeting of Array.isArray(stored?.meetings) ? stored.meetings : []) {
        if (!meeting?.id) continue
        if (!Array.isArray(meeting.tasks) || !Array.isArray(meeting.decisions) || !Array.isArray(meeting.artifacts) || !MEETING_STAGES.includes(meeting.collaborationStage)) recovered = true
        ensureMeetingWorkspace(meeting)
        if (BUSY_MEETING_STATUSES.has(meeting.status) || LEGACY_TERMINAL_STATUSES.has(meeting.status)) {
          recovered = true
          meeting.status = 'paused'
          meeting.error = null
          if (meeting.collaborationStage === 'completed') meeting.collaborationStage = 'waiting-human'
          meeting.updatedAt = nowIso()
          meeting.participants = (meeting.participants ?? []).map(item => ({ ...item, status: 'idle' }))
        }
        meeting.mutedParticipantIds = Array.isArray(meeting.mutedParticipantIds) ? meeting.mutedParticipantIds : []
        const meetingMonitor = ensureActivityMonitor(meeting)
        for (const role of meetingMonitor.roles) {
          role.status = meeting.mutedParticipantIds.includes(role.profileId) ? 'muted' : 'idle'
          role.stage = role.status === 'muted' ? '已静默' : '等待任务'
          role.currentTool = ''
          role.claimedFiles = []
        }
        meetings.set(meeting.id, meeting)
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    if (!migrations.archivedLegacyArenaSessions && await archiveLegacyArenaSessions()) {
      migrations.archivedLegacyArenaSessions = true
      recovered = true
    }
    if (recovered) await persist()
  })()

  async function modelCatalog() {
    if (catalogCache.expiresAt > Date.now()) return catalogCache.value
    const selection = defaultModel()
    const value = await Promise.all(ctx.llm.listProviders().map(async provider => {
      let models = []
      try { models = await ctx.llm.listModels(provider.id) } catch { models = [] }
      if (provider.id === selection.provider && !models.some(model => model.id === selection.model)) {
        models.unshift({ provider: provider.id, id: selection.model, name: selection.model })
      }
      return { id: provider.id, name: provider.name, models: models.map(model => ({ id: model.id, name: model.name, description: model.description })) }
    }))
    catalogCache = { expiresAt: Date.now() + 10_000, value }
    return value
  }

  function validateProfileBase(raw, fallbackAvatar) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, '用户资料必须是 JSON 对象')
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) : ''
    if (!name) throw new HttpError(400, '显示名称不能为空')
    return { name, avatar: cleanAvatar(raw.avatar, fallbackAvatar) }
  }

  function validateModel(raw) {
    const provider = typeof raw.provider === 'string' ? raw.provider.trim().slice(0, 100) : ''
    const model = typeof raw.model === 'string' ? raw.model.trim().slice(0, 160) : ''
    if (!provider || !model) throw new HttpError(400, '请选择供应商和模型')
    if (!ctx.llm.listProviders().some(item => item.id === provider)) throw new HttpError(400, '所选供应商当前未在 DSH 中启用')
    return { provider, model }
  }

  async function saveHumanProfile(raw) {
    profiles.human = { id: 'human', ...validateProfileBase(raw, '🧑') }
    await persist()
    return profiles.human
  }

  async function saveAdministratorProfile(raw) {
    const base = validateProfileBase(raw, '🛡️')
    const model = validateModel(raw)
    profiles.administrator = {
      id: 'administrator',
      ...base,
      ...model,
      role: typeof raw.role === 'string' ? raw.role.trim().slice(0, 16_000) : '',
      updatedAt: nowIso(),
    }
    await persist()
    return profiles.administrator
  }

  async function saveAiProfile(raw) {
    const base = validateProfileBase(raw, '🤖')
    const model = validateModel(raw)
    const requestedId = typeof raw.id === 'string' ? raw.id.trim() : ''
    const existingIndex = profiles.aiUsers.findIndex(item => item.id === requestedId)
    const profile = {
      id: existingIndex >= 0 ? requestedId : randomUUID(),
      ...base,
      ...model,
      role: typeof raw.role === 'string' ? raw.role.trim().slice(0, 16_000) : '',
      presetPrompts: (Array.isArray(raw.presetPrompts) ? raw.presetPrompts : []).map(item => typeof item === 'string' ? item.trim().slice(0, 240) : '').filter(Boolean).slice(0, 8),
      color: /^#[0-9a-f]{6}$/i.test(String(raw.color ?? '')) ? String(raw.color) : '#6f5ee8',
      updatedAt: nowIso(),
    }
    if (existingIndex >= 0) profiles.aiUsers.splice(existingIndex, 1, profile)
    else profiles.aiUsers.push(profile)
    for (const room of rooms.values()) {
      const participantIndex = room.participants.findIndex(item => item.id === profile.id)
      if (participantIndex < 0) continue
      room.participants.splice(participantIndex, 1, { ...profile })
      ensureActivityMonitor(room)
      room.updatedAt = nowIso()
    }
    await persist()
    return profile
  }

  async function deleteAiProfile(id) {
    const index = profiles.aiUsers.findIndex(item => item.id === id)
    if (index < 0) throw new HttpError(404, '没有找到这个 AI 用户')
    profiles.aiUsers.splice(index, 1)
    await persist()
  }

  async function resolveAgentPreset() {
    const presets = ctx.get('agentPresets')
    if (!presets) return { presets: undefined, id: undefined }
    const preset = await presets.resolve()
    return { presets, id: preset.id }
  }

  function modelSelection(profile) {
    const selection = defaultModel()
    return {
      ...selection,
      ...(profile?.provider ? { provider: profile.provider } : {}),
      ...(profile?.model ? { model: profile.model } : {}),
    }
  }

  async function createParent(label, signal) {
    const composition = await resolveAgentPreset()
    const selection = modelSelection()
    const handle = await ctx.agents.create({
      sessionId: randomUUID(),
      meta: { cwd: process.cwd(), ...(composition.id ? { agentPreset: composition.id } : {}) },
      agentOptions: selection,
      signal,
      async setup(agentCtx) {
        installArenaModelSelection(agentCtx, selection)
        agentCtx.systemPrompt.section({ name: 'deployment:persona', order: 0, text: `You coordinate ${label}. Use the mounted DSH Agent Preset and its complete capabilities when needed.` })
        if (composition.presets) await composition.presets.mount(agentCtx, composition.id)
      },
    })
    return archiveArenaAgent(handle)
  }

  async function startRoleRun({ label, prompt, persona, profile, parent, runtime, outputSchema }) {
    const selection = modelSelection(profile)
    const run = await ctx.subagents.start('spawn', {
      label,
      prompt: [{ type: 'text', text: prompt }],
      parent: parent.agent,
      signal: runtime.abort.signal,
      persona: renderPersonaTemplate(persona, profile?.name || label, profiles.human.name),
      ...(outputSchema ? { outputSchema } : {}),
      agentOptions: selection,
    })
    runtime.activeRuns.add(run)
    try { return await run.result } finally {
      runtime.activeRuns.delete(run)
      await run.dispose().catch(() => undefined)
    }
  }

  function summarizeAgentTurn(events, firstSeq) {
    let text = ''
    let stopReason = 'completed'
    let error = ''
    for (const event of events) {
      if (event.seq < firstSeq) continue
      if (event.type === 'assistant/message') {
        const joined = messageText(event.data?.message?.content)
        if (joined) text = joined
      } else if (event.type === 'turn/end') {
        stopReason = String(event.data?.reason?.kind || event.data?.reason || 'completed')
        if (event.data?.reason?.kind === 'error') error = String(event.data.reason.error?.message || 'Agent 运行失败')
      }
    }
    return { text, stopReason, error }
  }

  async function createFullRoleAgent({ label, profile, runtime }) {
    const composition = await resolveAgentPreset()
    const selection = modelSelection(profile)
    const handle = await ctx.agents.create({
      sessionId: randomUUID(),
      meta: { cwd: process.cwd(), ...(composition.id ? { agentPreset: composition.id } : {}) },
      agentOptions: selection,
      signal: runtime.abort.signal,
      async setup(agentCtx) {
        installArenaModelSelection(agentCtx, selection)
        agentCtx.systemPrompt.section({
          name: 'agent-arena:identity',
          order: -20,
          text: [
            `你是 Agent Arena 中的独立 AI 用户 ${profile.name}。`,
            profile.role ? `你的人格、说话方式与长期职责：${renderPersonaTemplate(profile.role, profile.name, profiles.human.name)}` : '用户没有指定固定人格，请自然、独立地交流和工作。',
            '你是完整的 DSH Agent：可以按任务需要使用当前 Agent Preset 提供的工具、技能和子 Agent。只汇报真实完成的操作，不要把工具调用伪装成普通文本。',
            '你和其他角色共享 Agent Arena 实时协作控制台。开始工作时使用 arena_coordination 更新动态和任务；比较方案时留下结构化意见；完成文件、链接或结论后登记成果。编辑文件前必须先原子锁定文件，遇到其他角色占用时等待、换任务或协调，绝不能覆盖对方修改，也不得用 Shell 写入命令绕过文件锁。',
            '公开聊天使用 arena_send_message。发一条还是多条、每条长短都由你结合人格、话题和任务自然决定；能一条说清就不要拆，需要自然分步、真实进度或最终结果时可以继续发送。不要按长度、句号或固定节奏机械切分，也不要每轮都先说“收到”或“我开始了”。',
            '每次 arena_send_message 都会立即对人类和其他成员可见。调用过后不要在最终回答中重复已发送内容；公开回复不要添加自己的姓名前缀，也不要泄露隐藏思维过程。',
          ].join('\n'),
        })
        if (composition.presets) await composition.presets.mount(agentCtx, composition.id)
        installCoordinationPlane(agentCtx, runtime, profile)
      },
    })
    await archiveArenaAgent(handle)
    runtime.agentHandles.add(handle)
    runtime.abort.signal.addEventListener('abort', () => handle.agent.cancel({ kind: 'user' }), { once: true })
    return handle
  }

  async function roleAgent(runtime, key, label, profile) {
    let pending = runtime.roleAgents.get(key)
    if (!pending) {
      pending = createFullRoleAgent({ label, profile, runtime })
      runtime.roleAgents.set(key, pending)
    }
    return pending
  }

  function parsedToolArguments(value) {
    if (value && typeof value === 'object') return value
    if (typeof value !== 'string') return {}
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return { input: value }
    }
  }

  function toolActivity(toolName, rawArguments) {
    const name = String(toolName || 'tool')
    const lower = name.toLocaleLowerCase()
    const args = parsedToolArguments(rawArguments)
    const detailValue = args.file_path ?? args.path ?? args.query ?? args.url ?? args.task ?? args.action ?? args.cmd ?? args.command ?? ''
    const detail = String(detailValue || '').replace(/\s+/g, ' ').trim().slice(0, 180)
    if (name === 'arena_send_message') return { status: 'working', stage: '正在发送群消息', label: '发送消息', detail: String(args.text || '').replace(/\s+/g, ' ').trim().slice(0, 180) }
    if (name === 'arena_coordination') return { status: 'working', stage: '同步协作状态', label: '协作板', detail }
    if (/subagent|spawn_agent|create_thread|workflow/.test(lower)) return { status: 'delegating', stage: '正在调度子 Agent', label: name, detail }
    if (mutationTargets(name, args).length) return { status: 'editing', stage: '正在编辑文件', label: name, detail }
    if (/test|check|lint|build/.test(lower) || /(?:npm|pnpm|yarn).{0,12}(?:test|check|build)|pytest|vitest|jest/.test(String(args.cmd ?? ''))) {
      return { status: 'testing', stage: '正在运行检查或测试', label: name, detail }
    }
    if (/read|search|find|grep|glob|list|view/.test(lower)) return { status: 'researching', stage: '正在查看资料或代码', label: name, detail }
    if (/web|browser|fetch|open_url/.test(lower)) return { status: 'researching', stage: '正在浏览外部资料', label: name, detail }
    if (/run_code|exec|bash|pwsh|command|terminal/.test(lower)) return { status: 'tool', stage: '正在执行命令或代码', label: name, detail }
    return { status: 'tool', stage: `正在使用 ${name}`, label: name, detail }
  }

  function observeAgentEvents(handle, firstSeq, runtime, profile) {
    let lastSeq = firstSeq - 1
    const calls = new Map()
    const scan = () => {
      for (const event of handle.agent.session.events) {
        if (event.seq < firstSeq || event.seq <= lastSeq) continue
        lastSeq = Math.max(lastSeq, event.seq)
        if (event.type === 'assistant/chunk') {
          if (event.data?.chunk?.type === 'reasoning-delta' || event.data?.chunk?.type === 'text-delta') {
            setRoleActivity(runtime.container, profile, { status: 'thinking', stage: '正在思考并组织回复', currentTool: '' })
          }
        } else if (event.type === 'tool/call') {
          const activity = toolActivity(event.data?.name, event.data?.arguments)
          calls.set(String(event.data?.callId || ''), activity)
          setRoleActivity(runtime.container, profile, { status: activity.status, stage: activity.stage, detail: activity.detail, currentTool: activity.label }, `${activity.stage}${activity.detail ? `：${activity.detail}` : ''}`, 'tool', event.time)
        } else if (event.type === 'tool/code-dispatch-start') {
          const activity = toolActivity(event.data?.name, event.data?.arguments)
          calls.set(String(event.data?.subCallId || ''), activity)
          setRoleActivity(runtime.container, profile, { status: activity.status, stage: activity.stage, detail: activity.detail, currentTool: activity.label }, `${activity.stage}${activity.detail ? `：${activity.detail}` : ''}`, 'tool', event.time)
        } else if (event.type === 'tool/result') {
          const activity = calls.get(String(event.data?.message?.callId || ''))
          if (activity) setRoleActivity(runtime.container, profile, { status: 'working', stage: event.data?.message?.isError ? `${activity.label} 执行失败` : `正在分析 ${activity.label} 的结果`, currentTool: '' }, `${activity.label}${event.data?.message?.isError ? ' 执行失败' : ' 已完成'}`, event.data?.message?.isError ? 'error' : 'success', event.time)
        } else if (event.type === 'tool/code-dispatch') {
          const activity = calls.get(String(event.data?.subCallId || '')) || toolActivity(event.data?.name, event.data?.arguments)
          setRoleActivity(runtime.container, profile, { status: 'working', stage: event.data?.isError ? `${activity.label} 执行失败` : `正在分析 ${activity.label} 的结果`, currentTool: '' }, `${activity.label}${event.data?.isError ? ' 执行失败' : ' 已完成'}`, event.data?.isError ? 'error' : 'success', event.time)
        } else if (event.type === 'assistant/message') {
          setRoleActivity(runtime.container, profile, { status: 'working', stage: '已生成阶段回复', currentTool: '' }, '生成了一条阶段回复', 'message', event.time)
        }
      }
    }
    scan()
    const timer = setInterval(scan, 240)
    timer.unref?.()
    return () => { clearInterval(timer); scan() }
  }

  async function runFullAgentTurn(handle, prompt, runtime, profile, phase = 'work') {
    if (runtime.abort.signal.aborted) throw new Error('任务已终止')
    await handle.agent.whenIdle()
    const firstSeq = handle.agent.session.seq
    const messageTurn = phase === 'work' ? {
      id: randomUUID(), phase, sentTexts: [], messageIds: [],
    } : null
    if (messageTurn) {
      runtime.messageTurns ??= new Map()
      runtime.messageTurns.set(profile.id, messageTurn)
    }
    setRoleActivity(runtime.container, profile, {
      status: phase === 'ack' ? 'acknowledging' : 'thinking',
      stage: phase === 'ack' ? '正在确认新消息' : '正在理解任务并规划',
      detail: '', currentTool: '',
    }, phase === 'ack' ? '开始确认新消息' : '开始处理任务')
    handle.agent.followup(createArenaUserMessage(prompt))
    const stopObserving = observeAgentEvents(handle, firstSeq, runtime, profile)
    try { await handle.agent.whenIdle() } finally {
      stopObserving()
      if (messageTurn && runtime.messageTurns?.get(profile.id) === messageTurn) runtime.messageTurns.delete(profile.id)
    }
    const outcome = summarizeAgentTurn(handle.agent.session.events, firstSeq)
    if (outcome.error) {
      setRoleActivity(runtime.container, profile, { status: 'error', stage: '本轮运行失败', detail: outcome.error, currentTool: '' }, outcome.error, 'error')
      throw new Error(outcome.error)
    }
    setRoleActivity(runtime.container, profile, { status: 'working', stage: phase === 'ack' ? '已确认，准备正式工作' : '本轮工作已完成', currentTool: '' })
    return { ...outcome, autonomousMessageIds: [...(messageTurn?.messageIds ?? [])] }
  }

  function latestHumanRequest(container, isMeeting) {
    const items = isMeeting ? container.transcript : container.messages
    const latest = [...items].reverse().find(item => item.kind === 'user' || item.kind === 'human')
    return latest?.text || (isMeeting ? container.topic : '')
  }

  function adminPrompt(container, command, isMeeting) {
    const admin = container.administratorProfile
    return [
      `你是群管理员 ${admin.name}。人类用户刚刚对你说：${command}`,
      `你的职责：${admin.role || '维护秩序，并按人类授权调整当前协作。'}`,
      isMeeting ? `当前会议话题：${container.topic}` : `当前群聊：${container.name}`,
      '判断是否执行一个安全的管理动作。action 只能是 none、change-topic、reopen-decision、continue、pause、finish、set-stage。finish 表示生成阶段总结并继续保留会议，不会关闭输入；change-topic 时 topic 填新话题；set-stage 时 stage 选择 discussion、planning、execution、review、waiting-human；其他字段为空。',
      '只响应人类明确要求。不得修改模型、密钥、权限或文件。reply 是要在群里公开显示的简洁确认。',
      '',
      '最近记录：',
      transcriptText(isMeeting ? container.transcript : container.messages),
    ].join('\n')
  }

  async function askAdministrator(container, command, parent, runtime, isMeeting) {
    const admin = container.administratorProfile
    const hint = inferAdminCommand(command)
    const result = await startRoleRun({
      label: `arena:${container.id}:administrator`,
      prompt: adminPrompt(container, command, isMeeting),
      persona: `你是 ${admin.name}，只执行人类用户明确授权的安全群管理操作。`,
      profile: admin,
      parent,
      runtime,
      outputSchema: adminSchema(),
    })
    const structured = result.structured && typeof result.structured === 'object' ? result.structured : {}
    return {
      reply: String(structured.reply || messageText(result.output) || '管理员已收到。'),
      action: hint.action !== 'none' ? hint.action : String(structured.action || 'none'),
      topic: hint.topic || String(structured.topic || '').trim(),
      stage: hint.stage || String(structured.stage || ''),
    }
  }

  function appendSystem(container, text, isMeeting) {
    const item = { id: randomUUID(), kind: 'system', text, createdAt: nowIso() }
    if (isMeeting) container.transcript.push({ ...item, speakerId: 'system', speaker: '系统' })
    else container.messages.push({ ...item, senderId: 'system', senderName: '系统', avatar: 'ℹ️' })
  }

  function appendAutonomousMessage(container, profile, runtime, text, turn) {
    const common = {
      id: randomUUID(), text, avatar: profile.avatar, createdAt: nowIso(), model: profile.model || defaultModel().model,
      phase: 'live', streamId: turn.id, sequence: turn.messageIds.length + 1,
    }
    if (runtime.isMeeting) {
      const item = {
        ...common, kind: 'participant', turn: container.turnCount, speakerId: profile.id, speaker: profile.name,
      }
      container.transcript.push(item)
      container.updatedAt = common.createdAt
      return item
    }
    const item = { ...common, kind: 'ai', senderId: profile.id, senderName: profile.name }
    container.messages.push(item)
    container.updatedAt = common.createdAt
    return item
  }

  function mutedSet(container) {
    return new Set(Array.isArray(container.mutedParticipantIds) ? container.mutedParticipantIds : [])
  }

  function isMuted(container, id) {
    return mutedSet(container).has(id)
  }

  function applySpeechControls(container, text, runtime, isMeeting) {
    const directives = parseSpeechDirectives(text, container.participants)
    if (!directives.hasDirective) return directives
    const muted = mutedSet(container)
    const newlyMuted = []
    const newlyUnmuted = []
    for (const id of directives.muteIds) {
      if (!muted.has(id)) newlyMuted.push(id)
      muted.add(id)
      const pending = runtime?.roleAgents?.get(id)
      if (pending) void pending.then(handle => handle.agent.cancel({ kind: 'user' }, { keepInbox: true })).catch(() => undefined)
      runtime?.targetIds?.delete(id)
    }
    for (const id of directives.unmuteIds) {
      if (muted.delete(id)) newlyUnmuted.push(id)
    }
    container.mutedParticipantIds = [...muted]
    const names = ids => ids.map(id => container.participants.find(item => item.id === id)?.name).filter(Boolean).join('、')
    for (const id of newlyMuted) {
      const profile = container.participants.find(item => item.id === id)
      if (profile) setRoleActivity(container, profile, { status: 'muted', stage: '已静默', detail: '', currentTool: '', claimedFiles: [] }, '被人类用户设为静默')
      if (runtime) releaseRoleClaims(runtime, id)
    }
    for (const id of newlyUnmuted) {
      const profile = container.participants.find(item => item.id === id)
      if (profile) setRoleActivity(container, profile, { status: 'idle', stage: '已恢复，等待消息', detail: '', currentTool: '' }, '恢复发言')
    }
    if (newlyMuted.length) appendSystem(container, `${names(newlyMuted)} 已静默；在恢复发言前不会再被请求，也不会发送正在进行任务的结果。`, isMeeting)
    if (newlyUnmuted.length) appendSystem(container, `${names(newlyUnmuted)} 已恢复发言。`, isMeeting)
    if (runtime) runtime.skipAutoContinuation = directives.commandOnly
    return directives
  }

  function wakeRuntime(container, runtime) {
    if (!runtime) return
    runtime.pauseRequested = false
    if (container.status === 'paused' || container.status === 'pausing') container.status = 'running'
  }

  async function applyMeetingAdminAction(meeting, runtime, result) {
    if (result.action === 'change-topic') {
      if (result.topic.length < 2) appendSystem(meeting, '管理员没有识别到有效的新话题，请用“把话题改为：……”再试一次。', true)
      else {
        meeting.topic = result.topic.slice(0, 2000)
        runtime.targetIds = new Set(meeting.participants.map(item => item.id))
        appendSystem(meeting, `管理员已将话题更改为：${meeting.topic}`, true)
      }
    } else if (result.action === 'reopen-decision') {
      ensureMeetingWorkspace(meeting)
      const latest = [...meeting.decisions].reverse().find(item => item.status === 'decided')
      if (latest) {
        reopenWorkspaceDecision(meeting, { decisionId: latest.id })
        appendSystem(meeting, `管理员已重开决策“${latest.title}”。`, true)
      } else appendSystem(meeting, '当前没有可以重开的已决策事项。', true)
    } else if (result.action === 'continue') {
      meeting.participants.filter(item => !isMuted(meeting, item.id)).forEach(item => runtime.targetIds.add(item.id))
    } else if (result.action === 'pause') {
      runtime.pauseRequested = true
    } else if (result.action === 'finish') {
      runtime.summaryRequested = true
    } else if (result.action === 'set-stage' && MEETING_STAGES.includes(result.stage) && result.stage !== 'completed') {
      meeting.collaborationStage = result.stage
      appendSystem(meeting, `管理员已将协作阶段切换为：${result.stage}`, true)
    }
  }

  async function runMeetingAdmin(meeting, command, runtime) {
    const admin = meeting.administratorProfile
    setRoleActivity(meeting, admin, { status: 'working', stage: '正在处理管理指令', detail: command.slice(0, 240), currentTool: '' }, '开始处理管理指令')
    try {
      const result = await askAdministrator(meeting, command, runtime.parent, runtime, true)
      meeting.transcript.push({
        id: randomUUID(), kind: 'admin', speakerId: 'administrator', speaker: meeting.administratorProfile.name,
        avatar: meeting.administratorProfile.avatar, text: result.reply, createdAt: nowIso(), model: meeting.administratorProfile.model,
      })
      await applyMeetingAdminAction(meeting, runtime, result)
    } catch (error) {
      appendSystem(meeting, `管理员处理失败：${safeError(error)}`, true)
      setRoleActivity(meeting, admin, { status: 'error', stage: '管理指令处理失败', detail: safeError(error) }, safeError(error), 'error')
    } finally {
      setRoleActivity(meeting, admin, { status: 'idle', stage: '等待管理指令', currentTool: '' })
    }
  }

  async function checkpoint(meeting, runtime) {
    if (runtime.abort.signal.aborted) throw new Error('会议运行已停止')
    if (!runtime.pauseRequested) return true
    meeting.status = 'paused'
    meeting.updatedAt = nowIso()
    await persist()
    return false
  }

  async function runOne(meeting, participant, runtime) {
    if (isMuted(meeting, participant.id)) return
    participant.status = 'working'
    meeting.updatedAt = nowIso()
    await persist()
    try {
      const handle = await roleAgent(runtime, participant.id, `arena:${meeting.id}:${participant.name}`, participant)
      if (runtime.abort.signal.aborted || runtime.cancelCurrentWork || isMuted(meeting, participant.id)) return
      participant.status = 'working'
      meeting.updatedAt = nowIso()
      await persist()
      const result = await runFullAgentTurn(handle, participantPrompt(meeting, participant, coordinationPrompt(runtime, participant.id)), runtime, participant, 'work')
      if (runtime.abort.signal.aborted || runtime.cancelCurrentWork) return
      if (isMuted(meeting, participant.id)) return
      if (!result.autonomousMessageIds.length) {
        meeting.transcript.push({
          id: randomUUID(), kind: 'participant', phase: 'result', turn: meeting.turnCount, speakerId: participant.id,
          speaker: participant.name, avatar: participant.avatar,
          text: result.text || `（${participant.name} 没有产生可展示文本，结束原因：${result.stopReason}）`,
          createdAt: nowIso(), model: participant.model || defaultModel().model, stopReason: result.stopReason,
        })
      }
    } catch (error) {
      if (runtime.cancelCurrentWork || runtime.abort.signal.aborted) return
      setRoleActivity(meeting, participant, { status: 'error', stage: '本轮工作失败', detail: safeError(error), currentTool: '' }, safeError(error), 'error')
      if (!runtime.abort.signal.aborted && !isMuted(meeting, participant.id)) meeting.transcript.push({
        id: randomUUID(), kind: 'participant', turn: meeting.turnCount, speakerId: participant.id,
        speaker: participant.name, avatar: participant.avatar, text: `发言失败：${safeError(error)}`,
        createdAt: nowIso(), failed: true,
      })
    } finally {
      releaseRoleClaims(runtime, participant.id)
      participant.status = 'idle'
      setRoleActivity(meeting, participant, isMuted(meeting, participant.id)
        ? { status: 'muted', stage: '已静默', detail: '', currentTool: '', claimedFiles: [] }
        : { status: 'idle', stage: '等待后续消息', detail: '', currentTool: '', claimedFiles: [] })
      meeting.updatedAt = nowIso()
      await persist().catch(() => undefined)
    }
  }

  async function collectReplyIntents(container, completedIds, runtime, isMeeting, requirePeerReaction) {
    const records = isMeeting ? container.transcript : container.messages
    const focus = latestHumanRequest(container, isMeeting)
    const completedNames = completedIds.map(id => container.participants.find(item => item.id === id)?.name).filter(Boolean).join('、')
    const available = container.participants.filter(item => !isMuted(container, item.id))
    return Promise.all(available.map(async profile => {
      setRoleActivity(container, profile, { status: 'thinking', stage: '正在判断是否需要接话', detail: '', currentTool: '' })
      try {
        const result = await startRoleRun({
          label: `arena:${container.id}:reply-intent:${profile.id}`,
          prompt: [
            `你是群聊中的 ${profile.name}。你的人格与职责：${profile.role || '自然、独立地交流并推进问题。'}`,
            `当前由人类确定的讨论焦点：${focus}`,
            `刚刚产生新消息的成员：${completedNames || '人类用户'}`,
            requirePeerReaction
              ? '这些 AI 消息刚才是并发产生的，同批成员回复时看不到彼此。现在你已经能看到全部内容，请认真检查是否有一个具体观点、遗漏、分歧、问题、玩笑或工作衔接值得你继续回应。不要因为自己刚说过一次就自动选择沉默。'
              : '现在请结合新消息、你自己已经说过的话和你的人格，判断你是否还应该自然接话。每批新发言后都要重新独立判断。',
            'shouldSpeak=true 仅限：有人点名/询问你；你能回应一条具体新观点；需要纠错、反驳、补充关键遗漏；你有真实进度/结果；或你能明确推进尚未完成的协作。',
            'shouldSpeak=false：你的观点已经说过；只能礼貌附和或重复；必须等待人类提供信息；话头已经收束；或准备说的内容偏离人类当前焦点。尤其不要为了热闹而继续。',
            '连续自己接自己的话只在补交真实工作进度或结果时合理。reason 只写一句内部判断依据，不要在这里生成真正的群聊回复。',
            ...(isMeeting ? ['', '协作控制台：', meetingWorkspaceText(container)] : []),
            '', '完整群聊记录：', transcriptText(records),
          ].join('\n'),
          persona: `你是 ${profile.name}。${profile.role || '保持自然，并只在有实质内容时继续发言。'}`,
          profile,
          parent: runtime.parent,
          runtime,
          outputSchema: replyIntentSchema(),
        })
        const intent = result.structured && typeof result.structured === 'object' ? result.structured : {}
        return { profile, shouldSpeak: intent.shouldSpeak === true, reason: String(intent.reason || '').trim().slice(0, 500) }
      } catch (error) {
        setRoleActivity(container, profile, { status: 'error', stage: '接话判断失败', detail: safeError(error), currentTool: '' }, safeError(error), 'error')
        return { profile, shouldSpeak: false, reason: `判断失败：${safeError(error)}` }
      } finally {
        setRoleActivity(container, profile, { status: 'idle', stage: '等待后续消息', detail: '', currentTool: '' })
      }
    }))
  }

  async function guardContinuation(container, intents, runtime, isMeeting) {
    if (!intents.length) return { onTopic: true, complete: true, approvedSpeakerIds: [], reason: '没有角色希望继续接话。' }
    const admin = container.administratorProfile
    const focus = latestHumanRequest(container, isMeeting)
    setRoleActivity(container, admin, { status: 'working', stage: '正在检查跑题与刷屏风险', detail: '', currentTool: '' }, '复核角色接话意愿')
    try {
      const result = await startRoleRun({
        label: `arena:${container.id}:continuation-guard`,
        prompt: [
          `你是群管理员 ${admin.name}。角色已经各自判断是否接话，你只负责防止跑题、重复和刷屏，不替他们决定观点。`,
          `人类当前讨论焦点：${focus}`,
          ...(isMeeting ? [`会议主题：${container.topic}`] : [`群聊名称：${container.name}`]),
          '候选角色及其内部理由：',
          intents.map(item => `- ${item.profile.name} (${item.profile.id})：${item.reason || '未说明'}`).join('\n'),
          '如果候选发言会明显偏离人类最近的焦点，onTopic=false、complete=true、approvedSpeakerIds=[]，停止本次自动接话并等待人类。相关子问题、必要的澄清和任务执行不算跑题。',
          '如果只是重复、附和、抢话或没有实际推进，也应 complete=true。否则 onTopic=true、complete=false，并且只批准最适合接下一句话的 1 位。这样该角色发言后，所有角色会基于这条新消息再次独立判断。',
          'approvedSpeakerIds 只能来自上面的候选角色。',
          '', '完整群聊记录：', transcriptText(isMeeting ? container.transcript : container.messages),
        ].join('\n'),
        persona: `你是 ${admin.name}。${admin.role || '负责让群聊保持聚焦、自然且不刷屏。'}`,
        profile: admin,
        parent: runtime.parent,
        runtime,
        outputSchema: continuationGuardSchema(container),
      })
      const decision = result.structured && typeof result.structured === 'object' ? result.structured : {}
      return {
        onTopic: decision.onTopic !== false,
        complete: decision.complete !== false,
        approvedSpeakerIds: Array.isArray(decision.approvedSpeakerIds) ? decision.approvedSpeakerIds.map(String) : [],
        reason: String(decision.reason || '').trim(),
      }
    } catch (error) {
      return { onTopic: true, complete: false, approvedSpeakerIds: [intents[0].profile.id], reason: `管理员复核失败，采用首位角色的独立判断：${safeError(error)}` }
    } finally {
      setRoleActivity(container, admin, { status: 'idle', stage: '等待管理指令', detail: '', currentTool: '' })
    }
  }

  async function evaluateMeetingContinuation(meeting, completedIds, runtime, requirePeerReaction = false) {
    if (runtime.summaryRequested || runtime.pauseRequested || runtime.cancelCurrentWork || runtime.abort.signal.aborted) return
    const admin = meeting.administratorProfile
    setRoleActivity(meeting, admin, { status: 'working', stage: '等待各角色判断是否接话', detail: '', currentTool: '' }, '启动逐角色接话判断')
    try {
      const intents = (await collectReplyIntents(meeting, completedIds, runtime, true, requirePeerReaction)).filter(item => item.shouldSpeak)
      const decision = await guardContinuation(meeting, intents, runtime, true)
      if (decision.complete || !decision.onTopic) {
        appendSystem(meeting, decision.onTopic
          ? '当前任务已自然告一段落，AI 成员正在等待你的新消息。'
          : '接话方向开始偏离人类当前焦点，已停止 AI 自动接话并等待你的下一步指示。', true)
        return
      }
      const candidates = new Set(intents.map(item => item.profile.id))
      const next = decision.approvedSpeakerIds.filter(id => candidates.has(id) && !isMuted(meeting, id)).slice(0, 1)
      for (const id of next.length ? next : intents.slice(0, 1).map(item => item.profile.id)) runtime.targetIds.add(id)
      runtime.triggerSource = 'auto'
    } catch (error) {
      appendSystem(meeting, `逐角色接话判断失败，已先等待你的下一条消息：${safeError(error)}`, true)
    } finally {
      setRoleActivity(meeting, admin, { status: 'idle', stage: '等待管理指令', detail: '', currentTool: '' })
    }
  }

  async function runStageSummary(meeting, runtime) {
    const admin = meeting.administratorProfile
    setRoleActivity(meeting, admin, { status: 'working', stage: '正在整理阶段总结', detail: '', currentTool: '' }, '开始整理阶段总结')
    const result = await startRoleRun({
      label: `arena:${meeting.id}:stage-summary`,
      prompt: [
        `你是 ${admin.name}，请为仍将继续的协作会议生成一份阶段总结。话题：${meeting.topic}`,
        'summary 总结截至目前已经达成的共识、完成的工作和可直接使用的成果；rationale 写清关键依据、风险和取舍；openItems 列出仍需人类决定或后续处理的事项。不要宣告会议结束，不要评选获胜角色。',
        '', '协作控制台：', meetingWorkspaceText(meeting),
        '', '完整公开记录：', transcriptText(meeting.transcript),
      ].join('\n'),
      persona: `你是中立的会议管理员 ${admin.name}。`,
      profile: admin,
      parent: runtime.parent,
      runtime,
      outputSchema: finalSummarySchema(),
    })
    const fallback = messageText(result.output)
    const summary = result.structured && typeof result.structured === 'object'
      ? result.structured
      : { summary: fallback || '当前阶段暂时没有可总结的内容。', rationale: '', openItems: [] }
    meeting.summaryCount = Number(meeting.summaryCount || 0) + 1
    const summaryText = [
      summary.summary,
      summary.rationale,
      Array.isArray(summary.openItems) && summary.openItems.length ? `仍需处理：\n${summary.openItems.map(item => `- ${item}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n')
    meeting.transcript.push({
      id: randomUUID(), kind: 'admin', speakerId: 'administrator', speaker: admin.name, avatar: admin.avatar,
      text: summaryText, phase: 'summary', createdAt: nowIso(), model: admin.model,
    })
    createWorkspaceArtifact(meeting, {
      title: `阶段总结 ${meeting.summaryCount}`, description: summaryText,
      artifactType: 'summary', ownerId: 'administrator',
    }, 'administrator').status = 'accepted'
    meeting.collaborationStage = 'waiting-human'
    setRoleActivity(meeting, admin, { status: 'idle', stage: '阶段总结已生成，等待后续消息', detail: '', currentTool: '' }, '完成阶段总结', 'success')
  }

  async function runMeeting(meeting) {
    const pending = pendingMeetingStarts.get(meeting.id)
    pendingMeetingStarts.delete(meeting.id)
    const initialTargets = pending
      ? pending.targetIds
      : meeting.participants.filter(item => !isMuted(meeting, item.id)).map(item => item.id)
    const runtime = {
      abort: new AbortController(), activeRuns: new Set(), pauseRequested: false, cancelCurrentWork: false,
      summaryRequested: pending?.summaryRequested === true, targetIds: new Set(initialTargets), adminCommands: [...(pending?.adminCommands ?? [])], parent: undefined,
      roleAgents: new Map(), agentHandles: new Set(), skipAutoContinuation: false,
      triggerSource: pending?.triggerSource || 'initial', container: meeting, isMeeting: true, fileClaims: new Map(),
    }
    runtimes.set(meeting.id, runtime)
    ensureActivityMonitor(meeting)
    meeting.status = 'running'
    meeting.updatedAt = nowIso()
    await persist()
    try {
      runtime.parent = await createParent('Agent Arena collaborative meeting', runtime.abort.signal)
      while (!runtime.abort.signal.aborted) {
        if (!await checkpoint(meeting, runtime)) break
        while (runtime.adminCommands.length) {
          await runMeetingAdmin(meeting, runtime.adminCommands.shift(), runtime)
          await persist()
          if (runtime.pauseRequested) break
        }
        if (runtime.pauseRequested) continue
        if (runtime.summaryRequested && !runtime.targetIds.size) {
          runtime.summaryRequested = false
          await runStageSummary(meeting, runtime).catch(error => {
            setRoleActivity(meeting, meeting.administratorProfile, { status: 'error', stage: '阶段总结失败', detail: safeError(error), currentTool: '' }, safeError(error), 'error')
            appendSystem(meeting, `阶段总结失败：${safeError(error)}`, true)
          })
          await persist()
          runtime.pauseRequested = true
          continue
        }
        const ids = [...runtime.targetIds].filter(id => !isMuted(meeting, id))
        runtime.targetIds.clear()
        if (!ids.length) {
          runtime.pauseRequested = true
          continue
        }
        meeting.turnCount = Number(meeting.turnCount || 0) + 1
        const triggerSource = runtime.triggerSource
        runtime.triggerSource = 'auto'
        await Promise.all(ids.map(async id => {
          const participant = meeting.participants.find(item => item.id === id)
          if (participant) await runOne(meeting, participant, runtime)
        }))
        if (runtime.cancelCurrentWork) {
          runtime.cancelCurrentWork = false
          runtime.pauseRequested = true
          continue
        }
        if (!runtime.summaryRequested && !runtime.pauseRequested && !runtime.targetIds.size && !runtime.adminCommands.length) {
          if (runtime.skipAutoContinuation) runtime.skipAutoContinuation = false
          else await evaluateMeetingContinuation(meeting, ids, runtime, shouldRequirePeerReaction(triggerSource, ids.length))
        }
      }
    } catch (error) {
      meeting.error = runtime.abort.signal.aborted ? null : safeError(error)
    } finally {
      const restartRequest = !runtime.abort.signal.aborted && !runtime.pauseRequested && (
        runtime.targetIds.size || runtime.adminCommands.length || runtime.summaryRequested
      ) ? {
          targetIds: [...runtime.targetIds], adminCommands: [...runtime.adminCommands],
          summaryRequested: runtime.summaryRequested, triggerSource: runtime.triggerSource || 'human',
        } : null
      await Promise.allSettled([...runtime.activeRuns].map(run => run.dispose()))
      await Promise.allSettled([...runtime.agentHandles].map(handle => handle.dispose()))
      if (runtime.parent) await runtime.parent.dispose().catch(() => undefined)
      runtimes.delete(meeting.id)
      if (restartRequest) enqueueMeetingRun(meeting, restartRequest)
      else meeting.status = 'paused'
      meeting.participants = meeting.participants.map(item => ({ ...item, status: 'idle' }))
      meeting.updatedAt = nowIso()
      await persist().catch(() => undefined)
      if (restartRequest) pumpQueue()
    }
  }

  function pumpQueue() {
    if (disposed) return
    while (activeCount < maxConcurrentMeetings && queue.length) {
      const meeting = meetings.get(queue.shift())
      if (!meeting || meeting.status !== 'queued') continue
      activeCount += 1
      void runMeeting(meeting).finally(() => { activeCount -= 1; pumpQueue() })
    }
  }

  function enqueueMeetingRun(meeting, request = {}) {
    const previous = pendingMeetingStarts.get(meeting.id)
    const targetIds = new Set([...(previous?.targetIds ?? []), ...(request.targetIds ?? [])])
    const adminCommands = [...(previous?.adminCommands ?? []), ...(request.adminCommands ?? [])]
    pendingMeetingStarts.set(meeting.id, {
      targetIds: [...targetIds],
      adminCommands,
      summaryRequested: previous?.summaryRequested === true || request.summaryRequested === true,
      triggerSource: request.triggerSource || previous?.triggerSource || 'human',
    })
    meeting.status = 'queued'
    meeting.error = null
    if (meeting.collaborationStage === 'completed') meeting.collaborationStage = 'waiting-human'
    if (!queue.includes(meeting.id)) queue.push(meeting.id)
  }

  async function createMeeting(raw) {
    let input
    try { input = validateMeetingInput(raw) } catch (error) { throw new HttpError(400, safeError(error)) }
    const createdAt = nowIso()
    const meeting = {
      id: randomUUID(), ...input, participants: input.participants.map(item => ({ ...item, status: 'idle' })),
      administratorProfile: administratorSnapshot(), humanProfile: { ...profiles.human }, status: 'queued', turnCount: 0,
      createdAt, updatedAt: createdAt, transcript: [], mutedParticipantIds: [], userVote: null, verdict: null, error: null,
      collaborationStage: 'discussion', tasks: [], decisions: [], artifacts: [],
    }
    ensureActivityMonitor(meeting)
    meetings.set(meeting.id, meeting)
    queue.push(meeting.id)
    await persist()
    pumpQueue()
    return meeting
  }

  function addMeetingMembers(meeting, raw) {
    const requestedIds = [...new Set(Array.isArray(raw?.profileIds) ? raw.profileIds.map(String) : [])]
    const existingIds = new Set(meeting.participants.map(item => item.id))
    const newIds = requestedIds.filter(id => !existingIds.has(id))
    if (!newIds.length) throw new HttpError(400, '请选择尚未加入会议的 AI 用户')
    if (meeting.participants.length + newIds.length > 12) throw new HttpError(400, '一场会议最多允许 12 位 AI 用户')
    const invited = newIds.map(id => profiles.aiUsers.find(item => item.id === id))
    if (invited.some(item => !item)) throw new HttpError(400, '邀请列表中包含已不存在的 AI 用户')
    meeting.participants.push(...invited.map(item => ({ ...item, status: 'idle' })))
    ensureActivityMonitor(meeting)
    appendSystem(meeting, `${invited.map(item => item.name).join('、')} 加入了会议。`, true)
    return meeting
  }

  async function actOnMeeting(meeting, body) {
    const action = String(body?.action ?? '')
    const runtime = runtimes.get(meeting.id)
    let shouldPump = false
    if (action === 'pause') {
      if (!runtime || meeting.status !== 'running') throw new HttpError(409, '当前没有正在进行的 AI 发言')
      runtime.pauseRequested = true
      meeting.status = 'pausing'
    } else if (action === 'resume' || action === 'reopen') {
      const targets = meeting.participants.filter(item => !isMuted(meeting, item.id)).map(item => item.id)
      if (runtime) {
        runtime.triggerSource = 'human'
        targets.forEach(id => runtime.targetIds.add(id))
        wakeRuntime(meeting, runtime)
      } else {
        enqueueMeetingRun(meeting, { targetIds: targets, triggerSource: 'human' })
        shouldPump = true
      }
    } else if (action === 'finish' || action === 'summarize') {
      if (runtime) {
        runtime.summaryRequested = true
        wakeRuntime(meeting, runtime)
      } else {
        enqueueMeetingRun(meeting, { summaryRequested: true, triggerSource: 'human' })
        shouldPump = true
      }
    } else if (action === 'stop') {
      if (!BUSY_MEETING_STATUSES.has(meeting.status)) throw new HttpError(409, '当前没有需要停止的 AI 工作')
      if (!runtime && meeting.status === 'queued') {
        pendingMeetingStarts.delete(meeting.id)
        for (let index = queue.length - 1; index >= 0; index -= 1) if (queue[index] === meeting.id) queue.splice(index, 1)
        meeting.status = 'paused'
      } else if (runtime) {
        runtime.cancelCurrentWork = true
        runtime.pauseRequested = true
        runtime.summaryRequested = false
        runtime.targetIds.clear()
        runtime.adminCommands.length = 0
        meeting.status = 'pausing'
        for (const run of runtime.activeRuns) void run.dispose().catch(() => undefined)
        for (const pending of runtime.roleAgents.values()) {
          void pending.then(handle => handle.agent.cancel({ kind: 'user' }, { keepInbox: false })).catch(() => undefined)
        }
      } else {
        throw new HttpError(409, '当前工作状态已经变化，请稍后重试')
      }
      appendSystem(meeting, '人类用户停止了当前 AI 工作；会议仍然保留，可以随时发送下一条消息。', true)
    } else if (action === 'intervene' || action === 'send') {
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 4000) : ''
      if (!text) throw new HttpError(400, '消息不能为空')
      meeting.transcript.push({
        id: randomUUID(), kind: 'user', speakerId: 'human', speaker: profiles.human.name,
        avatar: profiles.human.avatar, text, createdAt: nowIso(),
      })
      meeting.humanProfile = { ...profiles.human }
      const directives = applySpeechControls(meeting, text, runtime, true)
      const targets = mentionedProfileIds(text, meeting.participants)
      const adminMentioned = mentionsAdministrator(text, meeting.administratorProfile?.name)
      const availableTargets = targets.filter(id => !isMuted(meeting, id))
      const requestedTargets = directives.commandOnly
        ? []
        : availableTargets.length
          ? availableTargets
          : adminMentioned
            ? []
            : meeting.participants.filter(item => !isMuted(meeting, item.id)).map(item => item.id)
      if (runtime) {
        runtime.triggerSource = 'human'
        if (adminMentioned) runtime.adminCommands.push(text)
        requestedTargets.forEach(id => runtime.targetIds.add(id))
        if (runtime.targetIds.size || runtime.adminCommands.length) wakeRuntime(meeting, runtime)
      } else if (requestedTargets.length || adminMentioned) {
        enqueueMeetingRun(meeting, {
          targetIds: requestedTargets,
          adminCommands: adminMentioned ? [text] : [],
          triggerSource: 'human',
        })
        shouldPump = true
      } else {
        meeting.status = 'paused'
      }
    } else if (action === 'invite-members') {
      addMeetingMembers(meeting, body)
    } else if (action === 'set-stage') {
      const stage = String(body.stage ?? '')
      if (!MEETING_STAGES.includes(stage) || stage === 'completed') throw new HttpError(400, '协作阶段无效')
      meeting.collaborationStage = stage
    } else if (action === 'task-create') {
      createWorkspaceTask(meeting, body, 'human')
    } else if (action === 'task-update') {
      updateWorkspaceTask(meeting, body)
    } else if (action === 'task-delete') {
      deleteWorkspaceTask(meeting, body)
    } else if (action === 'decision-create') {
      createWorkspaceDecision(meeting, body, 'human')
    } else if (action === 'decision-choose') {
      const decision = chooseWorkspaceDecision(meeting, body, 'human')
      const selected = decision.options.find(item => item.id === decision.selectedOptionId)
      appendSystem(meeting, `人类用户为“${decision.title}”选择了方案：${selected?.label || '未知方案'}。`, true)
    } else if (action === 'decision-reopen') {
      const decision = reopenWorkspaceDecision(meeting, body)
      appendSystem(meeting, `人类用户重开了决策“${decision.title}”。`, true)
    } else if (action === 'decision-delete') {
      deleteWorkspaceDecision(meeting, body)
    } else if (action === 'artifact-create') {
      createWorkspaceArtifact(meeting, body, 'human')
    } else if (action === 'artifact-update') {
      const artifact = updateWorkspaceArtifact(meeting, body)
      if (artifact.status === 'rejected') appendSystem(meeting, `人类用户驳回了成果“${artifact.title}”，需要继续修改。`, true)
    } else if (action === 'artifact-delete') {
      deleteWorkspaceArtifact(meeting, body)
    } else if (action === 'request-evidence') {
      const subject = workspaceText(body.subject, 240) || '当前方案与成果'
      const text = `请为${subject}补充可核查的证据、来源、测试结果或文件位置；不确定的内容请明确说明。`
      meeting.transcript.push({
        id: randomUUID(), kind: 'user', speakerId: 'human', speaker: profiles.human.name,
        avatar: profiles.human.avatar, text, createdAt: nowIso(),
      })
      if (runtime) {
        runtime.triggerSource = 'human'
        meeting.participants.filter(item => !isMuted(meeting, item.id)).forEach(item => runtime.targetIds.add(item.id))
        wakeRuntime(meeting, runtime)
      } else {
        enqueueMeetingRun(meeting, {
          targetIds: meeting.participants.filter(item => !isMuted(meeting, item.id)).map(item => item.id),
          triggerSource: 'human',
        })
        shouldPump = true
      }
    } else if (action === 'vote') {
      const participantId = String(body.participantId ?? '')
      if (!meeting.participants.some(item => item.id === participantId)) throw new HttpError(400, '投票目标无效')
      meeting.userVote = participantId
    } else throw new HttpError(400, '未知操作')
    meeting.updatedAt = nowIso()
    await persist()
    if (shouldPump) pumpQueue()
    return meeting
  }

  function roomOrThrow(id) {
    const room = rooms.get(id)
    if (!room) throw new HttpError(404, '没有找到这个聊天')
    return room
  }

  async function runRoomAi(room, profile, runtime) {
    if (isMuted(room, profile.id)) return
    room.respondingProfileIds = [...new Set([...(room.respondingProfileIds ?? []), profile.id])]
    room.respondingProfileId = room.respondingProfileIds[0] ?? null
    await persist()
    try {
      const handle = await roleAgent(runtime, profile.id, `arena-chat:${room.id}:${profile.name}`, profile)
      if (runtime.abort.signal.aborted || isMuted(room, profile.id)) return
      await persist()
      const result = await runFullAgentTurn(handle, chatPrompt(room, profile, coordinationPrompt(runtime, profile.id)), runtime, profile, 'work')
      if (!runtime.abort.signal.aborted && !isMuted(room, profile.id)) {
        if (!result.autonomousMessageIds.length) {
          if (!result.text) throw new Error(`本轮没有产生可展示文本，结束原因：${result.stopReason}`)
          room.messages.push({
            id: randomUUID(), kind: 'ai', senderId: profile.id, senderName: profile.name,
            avatar: profile.avatar, text: result.text, phase: 'result', createdAt: nowIso(), model: profile.model,
          })
        }
      }
    } catch (error) {
      setRoleActivity(room, profile, { status: 'error', stage: '本轮回复失败', detail: safeError(error), currentTool: '' }, safeError(error), 'error')
      if (!runtime.abort.signal.aborted && !isMuted(room, profile.id)) appendSystem(room, `${profile.name} 回复失败：${safeError(error)}`, false)
    } finally {
      releaseRoleClaims(runtime, profile.id)
      setRoleActivity(room, profile, isMuted(room, profile.id)
        ? { status: 'muted', stage: '已静默', detail: '', currentTool: '', claimedFiles: [] }
        : { status: 'idle', stage: '等待后续消息', detail: '', currentTool: '', claimedFiles: [] })
      room.respondingProfileIds = (room.respondingProfileIds ?? []).filter(id => id !== profile.id)
      room.respondingProfileId = room.respondingProfileIds[0] ?? null
      room.updatedAt = nowIso()
      await persist().catch(() => undefined)
    }
  }

  async function runRoomAdmin(room, command, runtime) {
    const admin = room.administratorProfile
    setRoleActivity(room, admin, { status: 'working', stage: '正在处理管理指令', detail: command.slice(0, 240), currentTool: '' }, '开始处理管理指令')
    try {
      const result = await askAdministrator(room, command, runtime.parent, runtime, false)
      room.messages.push({
        id: randomUUID(), kind: 'admin', senderId: 'administrator', senderName: room.administratorProfile.name,
        avatar: room.administratorProfile.avatar, text: result.reply, createdAt: nowIso(), model: room.administratorProfile.model,
      })
      if (result.action === 'change-topic' && result.topic.length >= 2) {
        room.name = result.topic.slice(0, 60)
        appendSystem(room, `管理员已将群聊话题更改为：${room.name}`, false)
      } else if (result.action === 'continue') room.participants.filter(item => !isMuted(room, item.id)).forEach(item => runtime.targetIds.add(item.id))
    } catch (error) {
      appendSystem(room, `管理员处理失败：${safeError(error)}`, false)
      setRoleActivity(room, admin, { status: 'error', stage: '管理指令处理失败', detail: safeError(error) }, safeError(error), 'error')
    } finally {
      setRoleActivity(room, admin, { status: 'idle', stage: '等待管理指令', detail: '', currentTool: '' })
    }
  }

  async function evaluateRoomContinuation(room, completedIds, runtime, requirePeerReaction = false) {
    if (room.type !== 'group' || runtime.abort.signal.aborted) return
    const admin = room.administratorProfile
    setRoleActivity(room, admin, { status: 'working', stage: '等待各角色判断是否接话', detail: '', currentTool: '' }, '启动逐角色接话判断')
    try {
      const intents = (await collectReplyIntents(room, completedIds, runtime, false, requirePeerReaction)).filter(item => item.shouldSpeak)
      const decision = await guardContinuation(room, intents, runtime, false)
      if (decision.complete || !decision.onTopic) {
        if (!decision.onTopic) appendSystem(room, '接话方向开始偏离人类当前焦点，AI 已停止自动接话。', false)
        return
      }
      const candidates = new Set(intents.map(item => item.profile.id))
      const next = decision.approvedSpeakerIds.filter(id => candidates.has(id) && !isMuted(room, id)).slice(0, 1)
      for (const id of next.length ? next : intents.slice(0, 1).map(item => item.profile.id)) runtime.targetIds.add(id)
    } catch (error) {
      appendSystem(room, `逐角色接话判断失败，已先等待你的下一条消息：${safeError(error)}`, false)
    } finally {
      setRoleActivity(room, admin, { status: 'idle', stage: '等待管理指令', detail: '', currentTool: '' })
    }
  }

  async function runRoomReplies(room, runtime) {
    runtime.running = true
    room.status = 'responding'
    room.updatedAt = nowIso()
    await persist()
    try {
      runtime.parent = await createParent('Agent Arena social chat', runtime.abort.signal)
      while (!runtime.abort.signal.aborted) {
        while (runtime.adminCommands.length) await runRoomAdmin(room, runtime.adminCommands.shift(), runtime)
        const ids = [...runtime.targetIds].filter(id => !isMuted(room, id))
        runtime.targetIds.clear()
        if (!ids.length) break
        const triggerSource = runtime.triggerSource || 'auto'
        runtime.triggerSource = 'auto'
        await Promise.all(ids.map(async id => {
          const profile = room.participants.find(item => item.id === id)
          if (profile) await runRoomAi(room, profile, runtime)
        }))
        if (room.type === 'group' && !runtime.targetIds.size && !runtime.adminCommands.length) {
          if (runtime.skipAutoContinuation) runtime.skipAutoContinuation = false
          else await evaluateRoomContinuation(room, ids, runtime, shouldRequirePeerReaction(triggerSource, ids.length))
        }
      }
    } catch (error) {
      if (!runtime.abort.signal.aborted) appendSystem(room, `回复流程失败：${safeError(error)}`, false)
    } finally {
      room.status = 'idle'
      room.respondingProfileId = null
      room.respondingProfileIds = []
      room.updatedAt = nowIso()
      await persist().catch(() => undefined)
      await Promise.allSettled([...runtime.activeRuns].map(run => run.dispose()))
      await Promise.allSettled([...runtime.agentHandles].map(handle => handle.dispose()))
      if (runtime.parent) await runtime.parent.dispose().catch(() => undefined)
      runtime.running = false
      if (runtime.targetIds.size || runtime.adminCommands.length) {
        const nextRuntime = {
          abort: new AbortController(), activeRuns: new Set(),
          targetIds: new Set(runtime.targetIds), adminCommands: [...runtime.adminCommands],
          parent: undefined, running: false, roleAgents: new Map(), agentHandles: new Set(), skipAutoContinuation: false,
          container: room, isMeeting: false, fileClaims: new Map(), triggerSource: runtime.triggerSource || 'auto',
        }
        roomRuntimes.set(room.id, nextRuntime)
        void runRoomReplies(room, nextRuntime)
      } else roomRuntimes.delete(room.id)
    }
  }

  function queueRoomReplies(room, text, directives) {
    if (directives?.commandOnly) return
    let runtime = roomRuntimes.get(room.id)
    if (!runtime) {
      runtime = {
        abort: new AbortController(), activeRuns: new Set(), targetIds: new Set(), adminCommands: [], parent: undefined, running: false,
        roleAgents: new Map(), agentHandles: new Set(), skipAutoContinuation: false, container: room, isMeeting: false, fileClaims: new Map(), triggerSource: 'human',
      }
      roomRuntimes.set(room.id, runtime)
    }
    runtime.triggerSource = 'human'
    const targets = mentionedProfileIds(text, room.participants)
    const adminMentioned = room.type === 'group' && mentionsAdministrator(text, room.administratorProfile?.name)
    if (adminMentioned) runtime.adminCommands.push(text)
    const availableTargets = targets.filter(id => !isMuted(room, id))
    if (availableTargets.length) availableTargets.forEach(id => runtime.targetIds.add(id))
    else if (!adminMentioned) room.participants.filter(item => !isMuted(room, item.id)).forEach(item => runtime.targetIds.add(item.id))
    if (!runtime.running) void runRoomReplies(room, runtime)
  }

  async function createRoom(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, '聊天配置必须是 JSON 对象')
    const type = raw.type === 'group' ? 'group' : 'direct'
    const profileIds = [...new Set(Array.isArray(raw.profileIds) ? raw.profileIds.map(String) : [])]
    if ((type === 'direct' && profileIds.length !== 1) || (type === 'group' && (profileIds.length < 2 || profileIds.length > 12))) {
      throw new HttpError(400, type === 'direct' ? '私聊必须选择 1 个 AI 用户' : '群聊必须选择 2 到 12 个 AI 用户')
    }
    const participants = profileIds.map(id => profiles.aiUsers.find(item => item.id === id))
    if (participants.some(item => !item)) throw new HttpError(400, '聊天中包含已不存在的 AI 用户')
    const nameInput = typeof raw.name === 'string' ? raw.name.trim().slice(0, 60) : ''
    const createdAt = nowIso()
    const room = {
      id: randomUUID(), type,
      name: nameInput || (type === 'direct' ? participants[0].name : `${participants.map(item => item.name).join('、')}的小群`),
      participants: participants.map(item => ({ ...item })), humanProfile: { ...profiles.human },
      administratorProfile: type === 'group' ? administratorSnapshot() : null,
      messages: [], mutedParticipantIds: [], status: 'idle', respondingProfileId: null, respondingProfileIds: [], createdAt, updatedAt: createdAt,
    }
    ensureActivityMonitor(room)
    rooms.set(room.id, room)
    await persist()
    return room
  }

  async function sendRoomMessage(room, raw) {
    const text = typeof raw?.text === 'string' ? raw.text.trim().slice(0, 4000) : ''
    if (!text) throw new HttpError(400, '消息不能为空')
    room.messages.push({ id: randomUUID(), kind: 'human', senderId: 'human', senderName: profiles.human.name, avatar: profiles.human.avatar, text, createdAt: nowIso() })
    room.humanProfile = { ...profiles.human }
    const runtime = roomRuntimes.get(room.id)
    const directives = applySpeechControls(room, text, runtime, false)
    room.updatedAt = nowIso()
    await persist()
    queueRoomReplies(room, text, directives)
    return room
  }

  async function retryRoomMessage(room) {
    if (roomRuntimes.has(room.id) || room.status === 'responding') throw new HttpError(409, 'AI 正在处理当前消息，请稍候')
    const latest = [...room.messages].reverse().find(item => item.kind === 'human')
    if (!latest) throw new HttpError(400, '这个聊天里还没有可重试的人类消息')
    const directives = parseSpeechDirectives(latest.text, room.participants)
    if (directives.commandOnly) throw new HttpError(400, '上一条消息只是发言控制指令，不需要重试')
    appendSystem(room, '正在重新请求上一条消息。', false)
    room.updatedAt = nowIso()
    await persist()
    queueRoomReplies(room, latest.text, directives)
    return room
  }

  async function renameRoom(room, raw) {
    const name = typeof raw?.name === 'string' ? raw.name.trim().slice(0, 80) : ''
    if (!name) throw new HttpError(400, '聊天名称不能为空')
    room.name = name
    room.updatedAt = nowIso()
    await persist()
    return room
  }

  async function addRoomMembers(room, raw) {
    if (room.type !== 'group') throw new HttpError(409, '只有群聊可以邀请新成员')
    const requestedIds = [...new Set(Array.isArray(raw?.profileIds) ? raw.profileIds.map(String) : [])]
    const existingIds = new Set(room.participants.map(item => item.id))
    const newIds = requestedIds.filter(id => !existingIds.has(id))
    if (!newIds.length) throw new HttpError(400, '请选择尚未加入群聊的 AI 用户')
    if (room.participants.length + newIds.length > 12) throw new HttpError(400, '一个群聊最多允许 12 位 AI 用户')
    const invited = newIds.map(id => profiles.aiUsers.find(item => item.id === id))
    if (invited.some(item => !item)) throw new HttpError(400, '邀请列表中包含已不存在的 AI 用户')
    room.participants.push(...invited.map(item => ({ ...item })))
    ensureActivityMonitor(room)
    appendSystem(room, `${invited.map(item => item.name).join('、')} 加入了群聊。`, false)
    room.updatedAt = nowIso()
    await persist()
    return room
  }

  async function renameMeeting(meeting, raw) {
    const name = typeof raw?.name === 'string' ? raw.name.trim().slice(0, 80) : ''
    if (!name) throw new HttpError(400, '会议名称不能为空')
    meeting.displayName = name
    meeting.updatedAt = nowIso()
    await persist()
    return meeting
  }

  async function deleteMeeting(meeting) {
    if (BUSY_MEETING_STATUSES.has(meeting.status) || runtimes.has(meeting.id)) {
      throw new HttpError(409, 'AI 正在工作，请先停止当前工作再删除会议')
    }
    pendingMeetingStarts.delete(meeting.id)
    meetings.delete(meeting.id)
    await persist()
  }

  function meetingOrThrow(id) {
    const meeting = meetings.get(id)
    if (!meeting) throw new HttpError(404, '没有找到这场会议')
    return meeting
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix', path: API_ROOT,
    handler: async (req, res) => {
      try {
        await hydrated
        const url = new URL(req.url ?? '/', 'http://dsh.internal')
        const method = String(req.method ?? 'GET').toUpperCase()
        const suffix = url.pathname.slice(API_ROOT.length) || '/'
        if (method === 'GET' && suffix === '/state') {
          respond(res, 200, {
            meetings: [...meetings.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(publicMeeting),
            rooms: [...rooms.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map(publicMeeting),
            templates: ARENA_TEMPLATES,
            profiles: publicMeeting({ ...profiles, administrator: administratorSnapshot() }),
            modelCatalog: await modelCatalog(), defaultModel: defaultModel(), limits: { maxConcurrentMeetings },
          })
          return
        }
        if (method === 'POST' && suffix === '/profiles/human') {
          respond(res, 200, { profile: publicMeeting(await saveHumanProfile(await readJsonBody(req))) }); return
        }
        if (method === 'POST' && suffix === '/profiles/administrator') {
          respond(res, 200, { profile: publicMeeting(await saveAdministratorProfile(await readJsonBody(req))) }); return
        }
        if (method === 'POST' && suffix === '/profiles/ai') {
          respond(res, 200, { profile: publicMeeting(await saveAiProfile(await readJsonBody(req))) }); return
        }
        const profileMatch = /^\/profiles\/ai\/([^/]+)$/.exec(suffix)
        if (method === 'DELETE' && profileMatch) {
          await deleteAiProfile(decodeURIComponent(profileMatch[1])); respond(res, 200, { ok: true }); return
        }
        if (method === 'POST' && suffix === '/meetings') {
          respond(res, 201, { meeting: publicMeeting(await createMeeting(await readJsonBody(req))) }); return
        }
        if (method === 'POST' && suffix === '/rooms') {
          respond(res, 201, { room: publicMeeting(await createRoom(await readJsonBody(req))) }); return
        }
        const roomMatch = /^\/rooms\/([^/]+)(?:\/(messages|members|retry))?$/.exec(suffix)
        if (roomMatch) {
          const room = roomOrThrow(decodeURIComponent(roomMatch[1]))
          if (method === 'GET' && !roomMatch[2]) { respond(res, 200, { room: publicMeeting(room) }); return }
          if (method === 'PATCH' && !roomMatch[2]) { respond(res, 200, { room: publicMeeting(await renameRoom(room, await readJsonBody(req))) }); return }
          if (method === 'POST' && suffix.endsWith('/messages')) { respond(res, 202, { room: publicMeeting(await sendRoomMessage(room, await readJsonBody(req))) }); return }
          if (method === 'POST' && suffix.endsWith('/members')) { respond(res, 200, { room: publicMeeting(await addRoomMembers(room, await readJsonBody(req))) }); return }
          if (method === 'POST' && suffix.endsWith('/retry')) { respond(res, 202, { room: publicMeeting(await retryRoomMessage(room)) }); return }
          if (method === 'DELETE' && !roomMatch[2]) {
            const runtime = roomRuntimes.get(room.id)
            if (runtime) runtime.abort.abort(new Error('Deleted by user'))
            rooms.delete(room.id); await persist(); respond(res, 200, { ok: true }); return
          }
        }
        const match = /^\/meetings\/([^/]+)(?:\/actions)?$/.exec(suffix)
        if (match) {
          const meeting = meetingOrThrow(decodeURIComponent(match[1]))
          if (method === 'GET' && !suffix.endsWith('/actions')) { respond(res, 200, { meeting: publicMeeting(meeting) }); return }
          if (method === 'PATCH' && !suffix.endsWith('/actions')) { respond(res, 200, { meeting: publicMeeting(await renameMeeting(meeting, await readJsonBody(req))) }); return }
          if (method === 'DELETE' && !suffix.endsWith('/actions')) { await deleteMeeting(meeting); respond(res, 200, { ok: true }); return }
          if (method === 'POST' && suffix.endsWith('/actions')) { respond(res, 200, { meeting: publicMeeting(await actOnMeeting(meeting, await readJsonBody(req))) }); return }
        }
        throw new HttpError(404, '接口不存在')
      } catch (error) {
        respond(res, Number(error?.status) || 500, { error: safeError(error) })
      }
    },
  }), 'agent-arena: HTTP API')

  ctx.effect(() => () => {
    disposed = true
    for (const runtime of runtimes.values()) {
      runtime.abort.abort(new Error('Agent Arena plugin disposed'))
    }
    for (const runtime of roomRuntimes.values()) runtime.abort.abort(new Error('Agent Arena plugin disposed'))
  }, 'agent-arena: stop active meetings')
}

export default { name: 'agent-arena', inject, apply }
