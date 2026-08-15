export const API_ROOT = '/api/plugins/dsh-agent-arena'

export const MEETING_STAGES = ['discussion', 'planning', 'execution', 'review', 'waiting-human', 'completed']
export const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done', 'blocked', 'paused']

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
  return meeting
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
    throw new TypeError('请求体必须是 JSON 对象')
  }

  const topic = cleanString(raw.topic, 2000)
  if (topic.length < 2) throw new TypeError('会议主题至少需要 2 个字符')

  const template = templateById(cleanString(raw.template, 40))
  const sourceParticipants = Array.isArray(raw.participants) ? raw.participants : template.participants
  if (sourceParticipants.length < 2 || sourceParticipants.length > 4) {
    throw new TypeError('参会 AI 数量必须在 2 到 4 个之间')
  }

  const names = new Set()
  const participants = sourceParticipants.map((source, index) => {
    const fallback = template.participants[index % template.participants.length]
    const name = cleanString(source?.name, 24) || fallback.name
    const key = name.toLocaleLowerCase()
    if (names.has(key)) throw new TypeError(`参会者名称不能重复：${name}`)
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
  '不要再说话', '不要说话', '先别说话', '别说话', '不要再回复', '不要回复', '先别回复', '别回复',
  '暂停发言', '停止发言', '保持安静', '闭嘴',
]

const UNMUTE_PHRASES = [
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
  const allNames = '(?:大家|所有人|所有AI|全部AI|你们|全员)'
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
  for (const phrase of [...UNMUTE_PHRASES, ...MUTE_PHRASES]) remainder = remainder.replaceAll(phrase, '')
  remainder = remainder
    .replace(/大家|所有人|所有AI|全部AI|你们|全员/gi, '')
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
