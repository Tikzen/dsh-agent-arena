import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from 'react'
import { BRAND_LOGOS } from './brand-logos.generated'
import type { BrandLogoId } from './brand-logos.generated'
import { CUSTOM_BRAND_IMAGES } from './custom-brand-images'
import { ARENA_CSS } from './styles'

const API_ROOT = '/api/plugins/dsh-agent-arena'
const OPEN_EVENT = 'dsh-agent-arena:open'
const BUSY_MEETINGS = new Set(['queued', 'running', 'pausing'])

interface Participant {
  id?: string
  profileId?: string
  name: string
  avatar: string
  role: string
  color: string
  provider?: string
  model?: string
  status?: string
}

interface Template {
  id: string
  name: string
  description: string
  participants: Participant[]
}

interface TranscriptItem {
  id: string
  kind: 'system' | 'participant' | 'user' | 'judge' | 'admin'
  round?: number
  turn?: number
  speakerId: string
  speaker: string
  avatar?: string
  text: string
  createdAt: string
  model?: string
  failed?: boolean
  phase?: 'ack' | 'live' | 'result' | 'summary'
  streamId?: string
  sequence?: number
}

interface Verdict {
  winnerId?: string | null
  summary: string
  rationale: string
  scores?: Array<{ participantId: string; score: number; comment: string }>
  openItems?: string[]
}

type ArenaView = 'setup' | 'watch' | 'profiles' | 'settings' | 'create-chat' | 'chat' | 'history'

type MeetingStage = 'discussion' | 'planning' | 'execution' | 'review' | 'waiting-human' | 'completed'
type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'paused'

interface MeetingTask {
  id: string
  title: string
  description: string
  assigneeId: string | null
  status: TaskStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface DecisionOpinion {
  profileId: string
  name: string
  avatar: string
  stance: 'support' | 'oppose' | 'neutral'
  reason: string
  risk: string
  confidence: number
}

interface MeetingDecisionOption {
  id: string
  label: string
  description: string
  opinions: DecisionOpinion[]
}

interface MeetingDecision {
  id: string
  title: string
  description: string
  options: MeetingDecisionOption[]
  status: 'open' | 'decided'
  selectedOptionId: string | null
  selectedBy: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface MeetingArtifact {
  id: string
  title: string
  description: string
  artifactType: 'file' | 'link' | 'note' | 'summary'
  location: string
  ownerId: string | null
  status: 'draft' | 'accepted' | 'rejected'
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface Meeting {
  id: string
  topic: string
  displayName?: string
  template: string
  turnCount?: number
  participants: Participant[]
  administratorProfile?: UserProfile
  status: string
  transcript: TranscriptItem[]
  mutedParticipantIds?: string[]
  humanProfile?: UserProfile
  userVote: string | null
  verdict: Verdict | null
  error: string | null
  createdAt: string
  activityMonitor?: ActivityMonitor
  collaborationStage?: MeetingStage
  tasks?: MeetingTask[]
  decisions?: MeetingDecision[]
  artifacts?: MeetingArtifact[]
}

interface ArenaSettings {
  rateLimitCooldownEnabled: boolean
  channelQueueEnabled: boolean
  channelRequestsPerMinute: number
  cooldownErrorStatuses: number[]
  autoReplyEnabled: boolean
}

const DEFAULT_ARENA_SETTINGS: ArenaSettings = {
  rateLimitCooldownEnabled: false,
  channelQueueEnabled: false,
  channelRequestsPerMinute: 55,
  cooldownErrorStatuses: [429, 500],
  autoReplyEnabled: true,
}

interface UserProfile {
  id: string
  name: string
  avatar: string
  role?: string
  provider?: string
  model?: string
  color?: string
  presetPrompts?: string[]
  autoReplyDisabled?: boolean
}

interface ChatMessage {
  id: string
  kind: 'human' | 'ai' | 'admin' | 'system'
  senderId: string
  senderName: string
  avatar: string
  text: string
  createdAt: string
  model?: string
  phase?: 'ack' | 'live' | 'result' | 'summary'
  streamId?: string
  sequence?: number
}

interface ChatRoom {
  id: string
  type: 'direct' | 'group'
  name: string
  participants: UserProfile[]
  humanProfile: UserProfile
  administratorProfile?: UserProfile | null
  messages: ChatMessage[]
  status: 'idle' | 'responding'
  respondingProfileId: string | null
  respondingProfileIds?: string[]
  mutedParticipantIds?: string[]
  createdAt: string
  updatedAt: string
  activityMonitor?: ActivityMonitor
}

interface RoleActivityEvent {
  id: string
  kind: string
  text: string
  createdAt: string
}

interface RoleActivity {
  profileId: string
  name: string
  avatar: string
  model: string
  status: string
  stage: string
  detail: string
  currentTool: string
  claimedFiles: string[]
  recent: RoleActivityEvent[]
  updatedAt: string
}

interface ActivityMonitor {
  updatedAt: string
  roles: RoleActivity[]
}

interface ModelCatalogEntry {
  id: string
  name: string
  models: Array<{ id: string; name: string; description?: string }>
}

interface ArenaState {
  meetings: Meeting[]
  rooms?: ChatRoom[]
  templates: Template[]
  defaultModel?: { provider: string; model: string }
  profiles?: { human: UserProfile; administrator: UserProfile; aiUsers: UserProfile[] }
  modelCatalog?: ModelCatalogEntry[]
  settings?: ArenaSettings
  cooldowns?: Array<{ key: string; until: number; remainingMs: number }>
}

const FALLBACK_TEMPLATES: Template[] = [
  {
    id: 'roundtable', name: '圆桌会议', description: '架构、风险和用户体验三方讨论。',
    participants: [
      { name: '蓝图', avatar: '🏗️', role: '系统架构师：拆解约束，提出可落地的整体方案。', color: '#5b8cff' },
      { name: '逆鳞', avatar: '🦔', role: '怀疑论者：主动寻找漏洞、反例、成本和隐藏风险。', color: '#ff6b7a' },
      { name: '小满', avatar: '🧑‍💻', role: '用户代表：关注易用性、真实需求、学习成本和体验。', color: '#2cc9a4' },
    ],
  },
  {
    id: 'courtroom', name: 'AI 法庭', description: '正反双方辩论，证据官检查论据。',
    participants: [
      { name: '正方', avatar: '🟦', role: '支持方律师：给出最强支持论证与具体证据。', color: '#5b8cff' },
      { name: '反方', avatar: '🟥', role: '反对方律师：给出最强反驳、失败案例和替代解释。', color: '#ff6b7a' },
      { name: '证据官', avatar: '⚖️', role: '中立证据官：检查事实、假设、逻辑跳跃与可验证性。', color: '#f4b942' },
    ],
  },
  {
    id: 'code-review', name: '代码评审会', description: '实现、审查和安全角色共同评审。',
    participants: [
      { name: 'Builder', avatar: '🔨', role: '实现者：给出最小可行实现、模块边界和验证步骤。', color: '#5b8cff' },
      { name: 'Reviewer', avatar: '🔍', role: '高级审查员：检查正确性、维护性、边界条件和复杂度。', color: '#b482ff' },
      { name: 'Breaker', avatar: '🧨', role: '安全与测试工程师：寻找攻击面、故障路径和可复现测试。', color: '#ff6b7a' },
    ],
  },
  {
    id: 'roast', name: '吐槽大会', description: '认真分析里掺一点节目效果。',
    participants: [
      { name: '夸夸', avatar: '🌈', role: '乐观派产品经理：发现亮点、传播点和增长机会。', color: '#2cc9a4' },
      { name: '毒舌', avatar: '🌶️', role: '尖锐评论员：风趣但不人身攻击地指出尴尬和硬伤。', color: '#ff6b7a' },
      { name: '混沌', avatar: '🌀', role: '混沌工程师：提出意外用法、极端场景和启发性实验。', color: '#f4b942' },
    ],
  },
]

const STATUS_TEXT: Record<string, string> = {
  queued: '排队中', running: '协作中', pausing: '本条后暂停', paused: '等待新消息',
  completed: '等待新消息', stopped: '等待新消息', failed: '等待新消息', interrupted: '等待新消息',
}

const MEETING_STAGE_TEXT: Record<MeetingStage, string> = {
  discussion: '讨论', planning: '规划', execution: '并行执行', review: '交叉评审',
  'waiting-human': '等待你决定', completed: '已完成',
}

const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  todo: '待开始', 'in-progress': '进行中', review: '待评审', done: '已完成', blocked: '受阻', paused: '已暂停',
}

function meetingTitle(meeting: Meeting): string {
  return meeting.displayName?.trim() || meeting.topic
}

const LOGO_PRESETS = [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'qwen', label: '通义千问' },
  { id: 'kimi', label: 'Kimi' },
  { id: 'grok', label: 'Grok' },
  { id: 'doubao', label: '豆包' },
  { id: 'metaai', label: 'Meta AI' },
  { id: 'mistral', label: 'Mistral' },
] as const

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { accept: 'application/json', 'content-type': 'application/json', ...init?.headers },
  })
  const data = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
  return data
}

function openArena(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

function BrandLogo(props: { id: BrandLogoId }): ReactNode {
  if (props.id === 'doubao') {
    return <span className="arena-brand-logo arena-brand-logo--image" data-brand={props.id} style={{ backgroundImage: `url(${CUSTOM_BRAND_IMAGES.doubao})` }} />
  }
  return <span className="arena-brand-logo" data-brand={props.id} dangerouslySetInnerHTML={{ __html: BRAND_LOGOS[props.id] }} />
}

function brandLogoId(value?: string): BrandLogoId | null {
  const id = value?.startsWith('logo:') ? value.slice(5) : ''
  return id && id in BRAND_LOGOS ? id as BrandLogoId : null
}

function Avatar(props: { value?: string; name: string; className?: string }): ReactNode {
  const { value = '🤖', name, className = '' } = props
  const logoId = brandLogoId(value)
  if (logoId) {
    return <span className={`arena-avatar arena-avatar--brand ${className}`} aria-label={`${name} 的头像`}><BrandLogo id={logoId} /></span>
  }
  if (value.startsWith('data:image/')) {
    return <span className={`arena-avatar ${className}`}><img src={value} alt={`${name} 的头像`} /></span>
  }
  return <span className={`arena-avatar ${className}`} aria-label={`${name} 的头像`}>{value || name.slice(0, 1)}</span>
}

interface AvatarCropDraft {
  image: HTMLImageElement
  url: string
}

interface AvatarCropDrag {
  pointerId: number
  startClientX: number
  startClientY: number
  startCropX: number
  startCropY: number
}

const CROP_PREVIEW_SIZE = 240

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function cropDisplayMetrics(draft: AvatarCropDraft, zoom: number): { width: number; height: number; maxX: number; maxY: number } {
  const fit = Math.max(CROP_PREVIEW_SIZE / draft.image.naturalWidth, CROP_PREVIEW_SIZE / draft.image.naturalHeight)
  const scale = fit * zoom
  const width = draft.image.naturalWidth * scale
  const height = draft.image.naturalHeight * scale
  return {
    width,
    height,
    maxX: Math.max(0, (width - CROP_PREVIEW_SIZE) / 2),
    maxY: Math.max(0, (height - CROP_PREVIEW_SIZE) / 2),
  }
}

async function imageFileForCrop(file: File): Promise<AvatarCropDraft> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件')
  if (file.size > 12 * 1024 * 1024) throw new Error('图片不能超过 12 MB')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('无法读取这张图片'))
      image.src = url
    })
    return { image, url }
  } catch (cause) {
    URL.revokeObjectURL(url)
    throw cause
  }
}

function croppedAvatar(draft: AvatarCropDraft, zoom: number, x: number, y: number): string {
  const outputSize = 256
  const { image } = draft
  const fit = Math.max(CROP_PREVIEW_SIZE / image.naturalWidth, CROP_PREVIEW_SIZE / image.naturalHeight)
  const scale = fit * zoom
  const displayWidth = image.naturalWidth * scale
  const displayHeight = image.naturalHeight * scale
  const offsetX = (x / 100) * Math.max(0, (displayWidth - CROP_PREVIEW_SIZE) / 2)
  const offsetY = (y / 100) * Math.max(0, (displayHeight - CROP_PREVIEW_SIZE) / 2)
  const sourceSize = CROP_PREVIEW_SIZE / scale
  const sourceCenterX = image.naturalWidth / 2 + offsetX / scale
  const sourceCenterY = image.naturalHeight / 2 + offsetY / scale
  const sx = Math.max(0, Math.min(image.naturalWidth - sourceSize, sourceCenterX - sourceSize / 2))
  const sy = Math.max(0, Math.min(image.naturalHeight - sourceSize, sourceCenterY - sourceSize / 2))
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持头像处理')
  context.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, outputSize, outputSize)
  return canvas.toDataURL('image/webp', 0.86)
}

function AvatarEditor(props: { value: string; name: string; onChange: (value: string) => void }): ReactNode {
  const { value, name, onChange } = props
  const [error, setError] = useState('')
  const [cropDraft, setCropDraft] = useState<AvatarCropDraft | null>(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropX, setCropX] = useState(0)
  const [cropY, setCropY] = useState(0)
  const cropDragRef = useRef<AvatarCropDrag | null>(null)

  useEffect(() => () => {
    if (cropDraft) URL.revokeObjectURL(cropDraft.url)
  }, [cropDraft])

  const upload = async (file?: File): Promise<void> => {
    if (!file) return
    try {
      const draft = await imageFileForCrop(file)
      setCropDraft(draft)
      setCropZoom(1)
      setCropX(0)
      setCropY(0)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const confirmCrop = (): void => {
    if (!cropDraft) return
    try {
      onChange(croppedAvatar(cropDraft, cropZoom, cropX, cropY))
      setCropDraft(null)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const startCropDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!cropDraft || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    cropDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCropX: cropX,
      startCropY: cropY,
    }
  }

  const moveCropDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = cropDragRef.current
    if (!cropDraft || !drag || drag.pointerId !== event.pointerId) return
    const { maxX, maxY } = cropDisplayMetrics(cropDraft, cropZoom)
    const deltaX = event.clientX - drag.startClientX
    const deltaY = event.clientY - drag.startClientY
    setCropX(maxX ? clamp(drag.startCropX - (deltaX / maxX) * 100, -100, 100) : 0)
    setCropY(maxY ? clamp(drag.startCropY - (deltaY / maxY) * 100, -100, 100) : 0)
  }

  const stopCropDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (cropDragRef.current?.pointerId !== event.pointerId) return
    cropDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const zoomCropAtPointer = (event: ReactWheelEvent<HTMLDivElement>): void => {
    if (!cropDraft) return
    event.preventDefault()
    const nextZoom = clamp(cropZoom * Math.exp(-event.deltaY * 0.0015), 1, 3)
    if (Math.abs(nextZoom - cropZoom) < 0.0001) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - rect.left - CROP_PREVIEW_SIZE / 2
    const pointerY = event.clientY - rect.top - CROP_PREVIEW_SIZE / 2
    const current = cropDisplayMetrics(cropDraft, cropZoom)
    const next = cropDisplayMetrics(cropDraft, nextZoom)
    const currentOffsetX = (cropX / 100) * current.maxX
    const currentOffsetY = (cropY / 100) * current.maxY
    const imageRatioX = (pointerX + current.width / 2 + currentOffsetX) / current.width
    const imageRatioY = (pointerY + current.height / 2 + currentOffsetY) / current.height
    const nextOffsetX = imageRatioX * next.width - pointerX - next.width / 2
    const nextOffsetY = imageRatioY * next.height - pointerY - next.height / 2
    setCropZoom(nextZoom)
    setCropX(next.maxX ? clamp((nextOffsetX / next.maxX) * 100, -100, 100) : 0)
    setCropY(next.maxY ? clamp((nextOffsetY / next.maxY) * 100, -100, 100) : 0)
  }

  const cropStyle = cropDraft ? (() => {
    const { width, height, maxX, maxY } = cropDisplayMetrics(cropDraft, cropZoom)
    const offsetX = (cropX / 100) * maxX
    const offsetY = (cropY / 100) * maxY
    return { width, height, transform: `translate(calc(-50% - ${offsetX}px), calc(-50% - ${offsetY}px))` }
  })() : undefined

  return (
    <>
    <div className="arena-avatar-editor">
      <Avatar value={value} name={name} className="arena-avatar--large" />
      <div>
        <label className="arena-avatar-upload">上传并裁剪<input type="file" accept="image/*" onChange={event => { void upload(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
        <input className="arena-input arena-emoji-input" value={value.startsWith('data:image/') || value.startsWith('logo:') ? '' : value} placeholder="或输入 emoji" maxLength={16} onChange={event => onChange(event.target.value)} />
        {error ? <span className="arena-inline-error">{error}</span> : null}
      </div>
      <div className="arena-logo-library" aria-label="AI 品牌预设头像">
        {LOGO_PRESETS.map(preset => (
          <button type="button" key={preset.id} title={`使用 ${preset.label} 官方品牌图标`} onClick={() => onChange(`logo:${preset.id}`)}>
            <BrandLogo id={preset.id} /><span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
    {cropDraft ? (
      <div className="arena-crop-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCropDraft(null) }}>
        <section className="arena-crop-dialog" role="dialog" aria-modal="true" aria-label="裁剪头像">
          <div className="arena-crop-head"><div><strong>裁剪头像</strong><span>拖动图片调整位置，滚动鼠标滚轮缩放；也可以继续使用下方滑块</span></div><button type="button" aria-label="关闭裁剪" onClick={() => setCropDraft(null)}>×</button></div>
          <div className="arena-crop-stage" aria-label="可拖动的头像裁剪区域" onPointerDown={startCropDrag} onPointerMove={moveCropDrag} onPointerUp={stopCropDrag} onPointerCancel={stopCropDrag} onWheel={zoomCropAtPointer}>
            <img src={cropDraft.url} alt="待裁剪头像" style={cropStyle} />
            <div className="arena-crop-grid" aria-hidden="true"><i /><i /><i /><i /></div>
            <span className="arena-crop-drag-hint" aria-hidden="true">拖动图片 · 滚轮缩放</span>
          </div>
          <div className="arena-crop-sliders">
            <label><span>缩放</span><input type="range" min="1" max="3" step="0.01" value={cropZoom} onChange={event => setCropZoom(Number(event.target.value))} /></label>
            <label><span>水平位置</span><input type="range" min="-100" max="100" step="1" value={cropX} onChange={event => setCropX(Number(event.target.value))} /></label>
            <label><span>垂直位置</span><input type="range" min="-100" max="100" step="1" value={cropY} onChange={event => setCropY(Number(event.target.value))} /></label>
          </div>
          <div className="arena-crop-actions"><button className="arena-control" type="button" onClick={() => setCropDraft(null)}>取消</button><button className="arena-launch" type="button" onClick={confirmCrop}>使用裁剪结果</button></div>
        </section>
      </div>
    ) : null}
    </>
  )
}

export function ArenaHomeLaunch(): ReactNode {
  return (
    <div className="arena-home-launch">
      <button className="arena-home-launch__inner" type="button" onClick={openArena}>
        <span className="arena-home-launch__icon">⚔️</span>
        <span className="arena-home-launch__copy">
          <span className="arena-home-launch__title">进入 AI 协作群</span>
          <span className="arena-home-launch__hint">多 AI 持续讨论与工作 · 支持任务分工、方案决策、成果验收</span>
        </span>
        <span className="arena-home-launch__arrow">→</span>
      </button>
    </div>
  )
}

function WorkingDots(): ReactNode {
  return <span className="arena-working" aria-label="思考中"><i /><i /><i /></span>
}

function SetupView(props: {
  templates: Template[]
  profiles?: ArenaState['profiles']
  onManageProfiles: () => void
  onCreated: (meeting: Meeting) => void
}): ReactNode {
  const { templates, profiles, onManageProfiles, onCreated } = props
  const [topic, setTopic] = useState('')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? 'roundtable')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const selectTemplate = (template: Template): void => {
    setTemplateId(template.id)
    setError('')
    setFieldErrors({})
  }

  const toggleSavedUser = (profile: UserProfile): void => {
    const selected = participants.some(item => item.profileId === profile.id)
    if (selected) {
      setParticipants(items => items.filter(item => item.profileId !== profile.id))
      setError('')
      setFieldErrors(current => ({ ...current, participants: '' }))
      return
    }
    if (participants.length >= 4) {
      setError('一场会议最多选择 4 位 AI 用户。')
      setFieldErrors(current => ({ ...current, participants: '已达到 4 位上限；请先移除一位再选择。' }))
      return
    }
    const next: Participant = {
      id: undefined,
      profileId: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      role: profile.role || '独立思考并给出有依据的观点。',
      color: profile.color || '#6f5ee8',
      provider: profile.provider,
      model: profile.model,
    }
    setParticipants(items => [...items, next])
    setError('')
    setFieldErrors(current => ({ ...current, participants: '' }))
  }

  const launch = async (): Promise<void> => {
    const nextErrors: Record<string, string> = {}
    if (topic.trim().length < 2) nextErrors.topic = '请填写至少 2 个字的会议主题。'
    if (participants.length < 2) nextErrors.participants = `请从 AI 用户库中再选择 ${2 - participants.length} 位参会者。`
    setFieldErrors(nextErrors)
    const firstError = Object.values(nextErrors)[0]
    if (firstError) {
      setError(firstError)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const data = await jsonRequest<{ meeting: Meeting }>('/meetings', {
        method: 'POST',
        body: JSON.stringify({ topic, template: templateId, participants }),
      })
      onCreated(data.meeting)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSubmitting(false)
    }
  }

  const validationMessage = error || Object.values(fieldErrors).find(Boolean) || ''
  const selectionHint = participants.length < 2
    ? `还需选择 ${2 - participants.length} 位 AI 用户才能开始会议。`
    : `已选择 ${participants.length} 位 AI；模型将直接使用各自用户资料中的配置。`

  return (
    <div className="arena-setup">
      <div className="arena-page-scroll">
      <div className="arena-kicker">Agent Arena</div>
      <h2>创建 AI 协作群</h2>
      <p className="arena-lead">像 QQ 群聊一样持续讨论和工作：你可以随时发言、@ 指定 AI 回答，在协作控制台分工、决策并验收成果。会议不会按轮数自动结束。</p>
      {validationMessage ? <div className="arena-page-alert" role="alert">无法开始会议：{validationMessage}</div> : null}

      <label className={`arena-field ${fieldErrors.topic ? 'has-error' : ''}`}>
        <span>他们要讨论什么？</span>
        <textarea
          className="arena-textarea"
          value={topic}
          aria-invalid={Boolean(fieldErrors.topic)}
          onChange={event => { setTopic(event.target.value); setFieldErrors(current => ({ ...current, topic: '' })); setError('') }}
          placeholder="例如：这个多 AI 会议插件怎样设计，才既好玩又真的有用？"
          maxLength={2000}
          autoFocus
        />
        {fieldErrors.topic ? <span className="arena-field-error">{fieldErrors.topic}</span> : null}
      </label>

      <span className="arena-section-title">会议形式</span>
      <div className="arena-template-grid">
        {templates.map(template => (
          <button
            type="button"
            key={template.id}
            className={`arena-template ${template.id === templateId ? 'is-active' : ''}`}
            onClick={() => selectTemplate(template)}
          >
            <strong>{template.name}</strong>
            <span>{template.description}</span>
          </button>
        ))}
      </div>

      <div className="arena-saved-head">
        <span className="arena-section-title">选择参会 AI 用户 · 已选 {participants.length}/4</span>
        <button type="button" onClick={onManageProfiles}>管理 / 创建用户 →</button>
      </div>
      <p className="arena-selection-help">直接选择用户即可。供应商和模型沿用该 AI 用户在用户中心保存的配置，这里不需要再次填写。</p>
      {profiles?.aiUsers.length ? (
        <div className="arena-user-pills">
          {profiles.aiUsers.map(profile => {
            const selected = participants.some(item => item.profileId === profile.id)
            return (
              <button type="button" key={profile.id} className={`arena-user-pill ${selected ? 'is-active' : ''}`} onClick={() => toggleSavedUser(profile)}>
                <Avatar value={profile.avatar} name={profile.name} />
                <span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span>
                <i>{selected ? '✓' : '+'}</i>
              </button>
            )
          })}
        </div>
      ) : (
        <button className="arena-empty-users" type="button" onClick={onManageProfiles}>还没有 AI 用户，请先创建至少 2 个 →</button>
      )}

      <div className="arena-setup-row arena-setup-row--single">
        <div>
          <span className="arena-section-title">本场参会阵容</span>
          {fieldErrors.participants ? <span className="arena-field-error">{fieldErrors.participants}</span> : null}
          {participants.length ? (
            <div className="arena-selected-grid">
              {participants.map(participant => (
                <div className="arena-selected-card" key={participant.profileId}>
                  <Avatar value={participant.avatar} name={participant.name} className="arena-avatar--medium" />
                  <span className="arena-selected-card__copy">
                    <strong>{participant.name}</strong>
                    <small>{participant.role}</small>
                    <em>{participant.provider}/{participant.model}</em>
                  </span>
                  <button type="button" aria-label={`移除 ${participant.name}`} onClick={() => { setParticipants(items => items.filter(item => item.profileId !== participant.profileId)); setError(''); setFieldErrors(current => ({ ...current, participants: '' })) }}>×</button>
                </div>
              ))}
            </div>
          ) : <button className="arena-empty-users" type="button" onClick={onManageProfiles}>请从上方选择 AI 用户；没有用户时先去创建 →</button>}
        </div>
      </div>
      </div>

      <div className="arena-action-dock">
        <span className="arena-action-dock__message" data-error={Boolean(validationMessage) || participants.length < 2}>{validationMessage || selectionHint}</span>
        <button className="arena-launch" type="button" disabled={submitting} onClick={() => void launch()}>
          {submitting ? <><WorkingDots /> 正在召集</> : <>⚔️ 开始会议</>}
        </button>
      </div>
    </div>
  )
}

function ProfilesView(props: {
  profiles?: ArenaState['profiles']
  modelCatalog: ModelCatalogEntry[]
  defaultModel?: ArenaState['defaultModel']
  onHumanSaved: (profile: UserProfile) => void
  onAdministratorSaved: (profile: UserProfile) => void
  onAiSaved: (profile: UserProfile) => void
  onAiDeleted: (id: string) => void
  settings?: ArenaSettings
  onSettingsSaved: (settings: ArenaSettings) => void
}): ReactNode {
  const { profiles, modelCatalog, defaultModel, onHumanSaved, onAdministratorSaved, onAiSaved, onAiDeleted, settings, onSettingsSaved } = props
  const initialProvider = defaultModel?.provider || modelCatalog[0]?.id || ''
  const initialModels = modelCatalog.find(item => item.id === initialProvider)?.models ?? []
  const [human, setHuman] = useState<UserProfile>(profiles?.human ?? { id: 'human', name: '你', avatar: '🧑' })
  const [administrator, setAdministrator] = useState<UserProfile>(profiles?.administrator ?? {
    id: 'administrator', name: '管理员', avatar: '🛡️',
    role: '维护协作秩序，并按人类用户要求调整话题、协作阶段与决策状态。',
    provider: initialProvider, model: defaultModel?.model || initialModels[0]?.id || '',
  })
  const [draft, setDraft] = useState<UserProfile>({
    id: '', name: '', avatar: '🤖', role: '', provider: initialProvider,
    model: defaultModel?.model || initialModels[0]?.id || '', color: '#6f5ee8', presetPrompts: [],
  })
  const [savingHuman, setSavingHuman] = useState(false)
  const [savingAdministrator, setSavingAdministrator] = useState(false)
  const [savingAi, setSavingAi] = useState(false)
  const [message, setMessage] = useState('')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [preferences, setPreferences] = useState<ArenaSettings>(settings ?? { ...DEFAULT_ARENA_SETTINGS })

  useEffect(() => {
    if (profiles?.human) setHuman(profiles.human)
  }, [profiles?.human?.name, profiles?.human?.avatar])

  useEffect(() => {
    if (profiles?.administrator) setAdministrator(profiles.administrator)
  }, [profiles?.administrator?.name, profiles?.administrator?.avatar, profiles?.administrator?.provider, profiles?.administrator?.model])

  useEffect(() => {
    if (settings) setPreferences(settings)
  }, [settings?.rateLimitCooldownEnabled, settings?.channelQueueEnabled, settings?.channelRequestsPerMinute, settings?.cooldownErrorStatuses?.join(','), settings?.autoReplyEnabled])

  useEffect(() => {
    if (draft.provider || modelCatalog.length === 0) return
    const provider = defaultModel?.provider || modelCatalog[0]?.id || ''
    const model = defaultModel?.model || modelCatalog.find(item => item.id === provider)?.models[0]?.id || ''
    setDraft(current => ({ ...current, provider, model }))
  }, [modelCatalog.length, defaultModel?.provider, defaultModel?.model])

  const providerEntry = modelCatalog.find(item => item.id === draft.provider)
  const administratorProviderEntry = modelCatalog.find(item => item.id === administrator.provider)
  const resetDraft = (): void => {
    setDraft({
      id: '', name: '', avatar: '🤖', role: '', provider: initialProvider,
      model: defaultModel?.model || initialModels[0]?.id || '', color: '#6f5ee8', presetPrompts: [],
    })
    setProfileErrors({})
    setMessage('')
  }

  const saveHuman = async (): Promise<void> => {
    if (!human.name.trim()) {
      setProfileErrors(current => ({ ...current, humanName: '请填写你在聊天中显示的名称。' }))
      setMessage('请先补全标红的必填项。')
      return
    }
    setSavingHuman(true)
    setMessage('')
    setProfileErrors(current => ({ ...current, humanName: '', form: '' }))
    try {
      const result = await jsonRequest<{ profile: UserProfile }>('/profiles/human', { method: 'POST', body: JSON.stringify(human) })
      setHuman(result.profile)
      onHumanSaved(result.profile)
      setMessage('你的人类用户资料已保存。')
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause)
      setProfileErrors(current => ({ ...current, form: detail }))
      setMessage(detail)
    } finally { setSavingHuman(false) }
  }

  const saveAdministrator = async (): Promise<void> => {
    const nextErrors: Record<string, string> = {}
    if (!administrator.name.trim()) nextErrors.administratorName = '请填写管理员显示名称。'
    if (!administrator.provider) nextErrors.administratorProvider = '请选择管理员供应商。'
    if (!administrator.model) nextErrors.administratorModel = '请选择管理员模型。'
    if (Object.keys(nextErrors).length) {
      setProfileErrors(current => ({ ...current, ...nextErrors }))
      setMessage('管理员配置还不完整。')
      return
    }
    setSavingAdministrator(true)
    setMessage('')
    try {
      const result = await jsonRequest<{ profile: UserProfile }>('/profiles/administrator', { method: 'POST', body: JSON.stringify(administrator) })
      const settingsResult = await jsonRequest<{ settings: ArenaSettings }>('/settings', { method: 'PATCH', body: JSON.stringify(preferences) })
      setAdministrator(result.profile)
      setPreferences(settingsResult.settings)
      onSettingsSaved(settingsResult.settings)
      onAdministratorSaved(result.profile)
      setProfileErrors(current => ({ ...current, administratorName: '', administratorProvider: '', administratorModel: '', form: '' }))
      setMessage('管理员资料已保存，新建会议和群聊会自动加入它。')
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause)
      setProfileErrors(current => ({ ...current, form: detail }))
      setMessage(detail)
    } finally { setSavingAdministrator(false) }
  }

  const saveAi = async (): Promise<void> => {
    const nextErrors: Record<string, string> = {}
    if (!draft.name.trim()) nextErrors.name = '请给这个 AI 填写显示名称。'
    if (!draft.provider) nextErrors.provider = modelCatalog.length ? '请选择供应商。' : 'DSH 中还没有可用供应商，请先前往系统设置配置模型。'
    if (!draft.model) nextErrors.model = modelCatalog.length ? '请选择模型。' : '配置供应商后才能选择模型。'
    if (Object.keys(nextErrors).length) {
      setProfileErrors(nextErrors)
      setMessage('AI 用户还不能创建，请先补全标红的必填项。')
      return
    }
    setSavingAi(true)
    setMessage('')
    setProfileErrors({})
    try {
      const result = await jsonRequest<{ profile: UserProfile }>('/profiles/ai', { method: 'POST', body: JSON.stringify(draft) })
      onAiSaved(result.profile)
      resetDraft()
      setMessage(`${result.profile.name} 已保存到 AI 用户库。`)
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause)
      setProfileErrors({ form: detail })
      setMessage(detail)
    } finally { setSavingAi(false) }
  }

  const deleteAi = async (profile: UserProfile): Promise<void> => {
    if (!window.confirm(`删除 AI 用户“${profile.name}”？已有会议记录不会被删除。`)) return
    try {
      await jsonRequest<{ ok: boolean }>(`/profiles/ai/${encodeURIComponent(profile.id)}`, { method: 'DELETE' })
      onAiDeleted(profile.id)
      if (draft.id === profile.id) resetDraft()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <div className="arena-profiles">
      <div className="arena-page-scroll">
      <div className="arena-kicker">Social identities</div>
      <h2>用户与头像</h2>
      <p className="arena-lead">这里的“AI 用户”是可重复使用的角色账号。它保存显示名称、头像、角色设定以及 DSH 中已启用的供应商和模型。</p>
      {message ? <div className={`arena-page-alert ${Object.values(profileErrors).some(Boolean) ? '' : 'is-success'}`} role="status">{message}</div> : null}

      <section className="arena-profile-section">
        <div className="arena-profile-section__title"><strong>我的人类用户</strong><span>你的现场插话会使用这套名称和头像</span></div>
        <div className="arena-human-editor">
          <AvatarEditor value={human.avatar} name={human.name} onChange={avatar => setHuman(current => ({ ...current, avatar }))} />
          <label className={`arena-field ${profileErrors.humanName ? 'has-error' : ''}`}><span>显示名称 <b>必填</b></span><input className="arena-input" aria-invalid={Boolean(profileErrors.humanName)} value={human.name} maxLength={24} onChange={event => { setHuman(current => ({ ...current, name: event.target.value })); setProfileErrors(current => ({ ...current, humanName: '' })); setMessage('') }} />{profileErrors.humanName ? <small className="arena-field-error">{profileErrors.humanName}</small> : null}</label>
          <button className="arena-control" type="button" disabled={savingHuman} onClick={() => void saveHuman()}>{savingHuman ? '保存中…' : '保存我的资料'}</button>
        </div>
      </section>

      <section className="arena-profile-section">
        <div className="arena-profile-section__title"><strong>群管理员</strong><span>每个新会议和群聊都会自动加入；在聊天里 @它即可管理话题、协作阶段和决策状态</span></div>
        <div className="arena-admin-editor">
          <AvatarEditor value={administrator.avatar} name={administrator.name} onChange={avatar => setAdministrator(current => ({ ...current, avatar }))} />
          <div className="arena-ai-form">
            <label className={`arena-field ${profileErrors.administratorName ? 'has-error' : ''}`}><span>显示名称 <b>必填</b></span><input className="arena-input" value={administrator.name} maxLength={24} onChange={event => { setAdministrator(current => ({ ...current, name: event.target.value })); setProfileErrors(current => ({ ...current, administratorName: '' })) }} /></label>
            <label className="arena-field"><span>管理员职责</span><textarea className="arena-textarea" value={administrator.role ?? ''} maxLength={16000} onChange={event => setAdministrator(current => ({ ...current, role: event.target.value }))} /></label>
            <label className="arena-toggle arena-toggle--admin"><input type="checkbox" checked={preferences.autoReplyEnabled} onChange={event => setPreferences(current => ({ ...current, autoReplyEnabled: event.target.checked }))} /><span><strong>自动接话总开关</strong><small>开启后沿用旧版分配模式：AI 先判断是否接话，再由管理员选择下一位发言者。<br />关闭后停止 AI 之间的自动接话，但不影响人类发言和明确 @AI。</small></span></label>

            <div className="arena-model-picker">
              <label className={`arena-field ${profileErrors.administratorProvider ? 'has-error' : ''}`}><span>供应商 <b>必填</b></span><select className="arena-select" value={administrator.provider ?? ''} onChange={event => {
                const provider = event.target.value
                const model = modelCatalog.find(item => item.id === provider)?.models[0]?.id || ''
                setAdministrator(current => ({ ...current, provider, model }))
                setProfileErrors(current => ({ ...current, administratorProvider: '', administratorModel: '' }))
              }}>{modelCatalog.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
              <label className={`arena-field ${profileErrors.administratorModel ? 'has-error' : ''}`}><span>模型 <b>必填</b></span><select className="arena-select" value={administrator.model ?? ''} onChange={event => { setAdministrator(current => ({ ...current, model: event.target.value })); setProfileErrors(current => ({ ...current, administratorModel: '' })) }}>{(administratorProviderEntry?.models ?? []).map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label>
              <button className="arena-control arena-admin-save" type="button" disabled={savingAdministrator} onClick={() => void saveAdministrator()}>{savingAdministrator ? '保存中…' : '保存管理员'}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="arena-profile-section">
        <div className="arena-profile-section__title"><strong>AI 用户库</strong><span>点击已有用户可编辑，开会时可直接选择</span></div>
        <div className="arena-ai-library">
          {profiles?.aiUsers.map(profile => (
            <div className={`arena-ai-card ${draft.id === profile.id ? 'is-active' : ''}`} key={profile.id}>
              <button type="button" onClick={() => { setDraft({ ...profile }); setProfileErrors({}); setMessage('') }}>
                <Avatar value={profile.avatar} name={profile.name} className="arena-avatar--medium" />
                <span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span>
              </button>
              <button className="arena-ai-delete" type="button" aria-label={`删除 ${profile.name}`} onClick={() => void deleteAi(profile)}>×</button>
            </div>
          ))}
          <button className="arena-ai-add" type="button" onClick={resetDraft}>＋ 创建新 AI 用户</button>
        </div>

        <div className="arena-ai-editor">
          <AvatarEditor value={draft.avatar} name={draft.name || 'AI'} onChange={avatar => setDraft(current => ({ ...current, avatar }))} />
          <div className="arena-ai-form">
            <label className={`arena-field ${profileErrors.name ? 'has-error' : ''}`}><span>显示名称 <b>必填</b></span><input className="arena-input" aria-invalid={Boolean(profileErrors.name)} value={draft.name} maxLength={24} placeholder="例如：毒舌产品经理" onChange={event => { setDraft(current => ({ ...current, name: event.target.value })); setProfileErrors(current => ({ ...current, name: '' })); setMessage('') }} />{profileErrors.name ? <small className="arena-field-error">{profileErrors.name}</small> : null}</label>
            <label className="arena-field"><span>自定义人格 <em>选填，最多 16000 字</em></span><textarea className="arena-textarea" value={draft.role ?? ''} maxLength={16000} placeholder="可留空；支持导入含 {{user}}、{{char}} 的人格卡" onChange={event => { setDraft(current => ({ ...current, role: event.target.value })); setMessage('') }} /></label>
             <label className="arena-field"><span>预设快捷对话（每行一条，最多 8 条）</span><textarea className="arena-textarea arena-preset-textarea" value={(draft.presetPrompts ?? []).join('\n')} placeholder={'帮我分析这个想法\n用你的风格吐槽一下\n给我三个行动建议'} onChange={event => setDraft(current => ({ ...current, presetPrompts: event.target.value.split('\n').slice(0, 8) }))} /></label>
            <label className="arena-toggle arena-toggle--ai-reply"><input type="checkbox" checked={draft.autoReplyDisabled === true} onChange={event => setDraft(current => ({ ...current, autoReplyDisabled: event.target.checked }))} /><span><strong>关闭此 AI 的自动接话判断</strong><small>仍可自动接话，但不再自行判断是否接话，改由管理员统一分配。<br />关闭此功能可节省 Token。</small></span></label>
            <div className="arena-model-picker">
              <label className={`arena-field ${profileErrors.provider ? 'has-error' : ''}`}>
                <span>供应商 <b>必填</b></span>
                <select className="arena-select" value={draft.provider ?? ''} onChange={event => {
                  const provider = event.target.value
                  const firstModel = modelCatalog.find(item => item.id === provider)?.models[0]?.id || ''
                  setDraft(current => ({ ...current, provider, model: firstModel }))
                  setProfileErrors(current => ({ ...current, provider: '', model: '' }))
                  setMessage('')
                }}>
                  {!modelCatalog.length ? <option value="">暂无可用供应商</option> : null}
                  {modelCatalog.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                </select>
                {profileErrors.provider ? <small className="arena-field-error">{profileErrors.provider}</small> : null}
              </label>
              <label className={`arena-field ${profileErrors.model ? 'has-error' : ''}`}>
                <span>模型 <b>必填</b></span>
                <select className="arena-select" value={draft.model ?? ''} onChange={event => { setDraft(current => ({ ...current, model: event.target.value })); setProfileErrors(current => ({ ...current, model: '' })); setMessage('') }}>
                  {!providerEntry?.models.length ? <option value="">暂无可用模型</option> : null}
                  {(providerEntry?.models ?? []).map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
                {profileErrors.model ? <small className="arena-field-error">{profileErrors.model}</small> : null}
              </label>
              <label className="arena-color-field"><span>主题色</span><input type="color" value={draft.color ?? '#6f5ee8'} onChange={event => setDraft(current => ({ ...current, color: event.target.value }))} /></label>
            </div>
            {!modelCatalog.length ? <div className="arena-error">DSH 暂未报告已启用的模型供应商，请先在 DSH 设置中配置模型。</div> : null}
          </div>
        </div>
      </section>
      </div>
      <div className="arena-action-dock">
        <span className="arena-action-dock__message" data-error={Object.values(profileErrors).some(Boolean)}>{Object.values(profileErrors).some(Boolean) ? (profileErrors.form || message || '请补全标红的必填项。') : (message || (draft.id ? `正在编辑 ${draft.name || '这个 AI 用户'}。` : '名称、供应商和模型填写完整后即可创建；人格可以留空。'))}</span>
        <button className="arena-launch" type="button" disabled={savingAi} onClick={() => void saveAi()}>{savingAi ? '保存中…' : draft.id ? '保存 AI 用户修改' : '创建 AI 用户'}</button>
      </div>
    </div>
  )
}

function CollaborationSettingsView(props: { settings?: ArenaSettings; onSaved: (settings: ArenaSettings) => void }): ReactNode {
  const [settings, setSettings] = useState<ArenaSettings>(props.settings ?? { ...DEFAULT_ARENA_SETTINGS })
  const [statusDraft, setStatusDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (props.settings) setSettings(props.settings)
  }, [props.settings?.rateLimitCooldownEnabled, props.settings?.channelQueueEnabled, props.settings?.channelRequestsPerMinute, props.settings?.cooldownErrorStatuses?.join(','), props.settings?.autoReplyEnabled])
  const addStatus = (): void => {
    const status = Number(statusDraft)
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      setMessage('请输入 100–599 之间的 HTTP 错误码。')
      return
    }
    setSettings(current => current.cooldownErrorStatuses.includes(status)
      ? current
      : { ...current, cooldownErrorStatuses: [...current.cooldownErrorStatuses, status] })
    setStatusDraft('')
    setMessage('')
  }
  const save = async (): Promise<void> => {
    setSaving(true); setMessage('')
    try {
      const result = await jsonRequest<{ settings: ArenaSettings }>('/settings', { method: 'PATCH', body: JSON.stringify(settings) })
      setSettings(result.settings); props.onSaved(result.settings); setMessage('协作行为设置已保存。')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : String(cause)) }
    finally { setSaving(false) }
  }
  return <div className="arena-profiles"><div className="arena-page-scroll"><div className="arena-kicker">Collaboration behavior</div><h2>协作行为设置</h2><p className="arena-lead">统一配置 Arena 中所有模型请求的共享渠道保护策略。</p>{message ? <div className="arena-page-alert is-success" role="status">{message}</div> : null}
    <section className="arena-profile-section"><div className="arena-profile-section__title"><strong>渠道保护</strong><span>按供应商配置共享计算</span></div>
      <label className="arena-toggle"><input type="checkbox" checked={settings.rateLimitCooldownEnabled} onChange={event => setSettings(current => ({ ...current, rateLimitCooldownEnabled: event.target.checked }))} /><span><strong>渠道限流冷却</strong><small>同一供应商配置触发限流后，所有共享角色一起等待；失败请求也计入渠道次数。</small></span></label>
      <div className="arena-setting-control">
        <div><strong>触发冷却的错误码</strong><small>默认 429、500；删除某个错误码后，该状态码将不再触发渠道冷却。</small></div>
        <div className="arena-status-editor">
          <div className="arena-status-chips">{settings.cooldownErrorStatuses.length ? settings.cooldownErrorStatuses.map(status => <span key={status}>{status}<button type="button" aria-label={`删除错误码 ${status}`} onClick={() => setSettings(current => ({ ...current, cooldownErrorStatuses: current.cooldownErrorStatuses.filter(item => item !== status) }))}>×</button></span>) : <em>未配置错误码</em>}</div>
          <div className="arena-status-add"><input className="arena-input" type="number" min={100} max={599} placeholder="例如 503" value={statusDraft} onChange={event => setStatusDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addStatus() } }} /><button className="arena-control" type="button" onClick={addStatus}>添加</button></div>
        </div>
      </div>
      <label className="arena-toggle"><input type="checkbox" checked={settings.channelQueueEnabled} onChange={event => setSettings(current => ({ ...current, channelQueueEnabled: event.target.checked }))} /><span><strong>同渠道请求队列</strong><small>同一供应商下的正式发言、工具续跑、子 Agent 和接话判断统一排队；回复速度可能降低。</small></span></label>
      <label className="arena-setting-control arena-setting-control--inline"><span><strong>每分钟放行次数</strong><small>作用于每个供应商共享队列，可填写 1–10000；保存后从下一次请求开始生效。</small></span><input className="arena-input" type="number" min={1} max={10000} value={settings.channelRequestsPerMinute} onChange={event => setSettings(current => ({ ...current, channelRequestsPerMinute: Number(event.target.value) }))} /></label>
      <details className="arena-setting-help"><summary>为什么按供应商配置计算？</summary><p>Arena 不读取或保存 DSH 中的 API Key，无法按密钥精确分组，因此将同一供应商配置下的不同模型视为共享渠道。</p></details>
    </section>
    <section className="arena-profile-section"><div className="arena-profile-section__title"><strong>说明</strong><span>自动接话设置位于用户中心的群管理员面板</span></div>



    </section><button className="arena-launch" type="button" disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : '保存协作行为设置'}</button>
  </div></div>
}

function CreateChatView(props: {
  profiles?: ArenaState['profiles']
  initialType: 'direct' | 'group'
  onManageProfiles: () => void
  onCreated: (room: ChatRoom) => void
}): ReactNode {
  const { profiles, initialType, onManageProfiles, onCreated } = props
  const [type, setType] = useState<'direct' | 'group'>(initialType)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setType(initialType); setSelected([]); setError('') }, [initialType])

  const toggle = (id: string): void => {
    setError('')
    if (type === 'direct') {
      setSelected([id])
      return
    }
    setSelected(current => current.includes(id)
      ? current.filter(item => item !== id)
      : current.length < 12 ? [...current, id] : current)
  }

  const create = async (): Promise<void> => {
    if ((type === 'direct' && selected.length !== 1) || (type === 'group' && selected.length < 2)) {
      setError(type === 'direct' ? '请选择 1 位 AI 用户。' : '群聊请选择 2–12 位 AI 用户。')
      return
    }
    setBusy(true)
    try {
      const result = await jsonRequest<{ room: ChatRoom }>('/rooms', {
        method: 'POST', body: JSON.stringify({ type, name, profileIds: selected }),
      })
      onCreated(result.room)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusy(false) }
  }

  return (
    <div className="arena-chat-create">
      <div className="arena-page-scroll">
      <div className="arena-kicker">Social chat</div>
      <h2>{type === 'direct' ? '发起私聊' : '创建群聊'}</h2>
      <p className="arena-lead">从 AI 用户库中选择聊天对象。群聊会自动加入管理员；发送消息时可用 @ 精确点名某个 AI。</p>
      {error ? <div className="arena-page-alert" role="alert">{error}</div> : null}
      <div className="arena-chat-type-tabs">
        <button className={type === 'direct' ? 'is-active' : ''} type="button" onClick={() => { setType('direct'); setSelected([]); setError('') }}>💬 一对一私聊</button>
        <button className={type === 'group' ? 'is-active' : ''} type="button" onClick={() => { setType('group'); setSelected([]); setError('') }}>👥 多 AI 群聊</button>
      </div>
      {type === 'group' ? (
        <label className="arena-field"><span>群聊名称（可选）</span><input className="arena-input" value={name} maxLength={60} placeholder="例如：周五灵感局" onChange={event => setName(event.target.value)} /></label>
      ) : null}
      <span className={`arena-section-title ${error ? 'has-error' : ''}`}>选择 AI 用户 · 已选 {selected.length}/{type === 'direct' ? 1 : 12}</span>
      {profiles?.aiUsers.length ? (
        <div className="arena-chat-user-grid">
          {profiles.aiUsers.map(profile => (
            <button type="button" key={profile.id} className={`arena-chat-user ${selected.includes(profile.id) ? 'is-active' : ''}`} onClick={() => toggle(profile.id)}>
              <Avatar value={profile.avatar} name={profile.name} className="arena-avatar--medium" />
              <span><strong>{profile.name}</strong><small>{profile.role || '通用助手（未设置人格）'}</small><em>{profile.provider}/{profile.model}</em></span>
              <i>{selected.includes(profile.id) ? '✓' : '+'}</i>
            </button>
          ))}
        </div>
      ) : (
        <button className="arena-empty-users" type="button" onClick={onManageProfiles}>需要先创建 AI 用户 →</button>
      )}
      </div>
      <div className="arena-action-dock">
        <span className="arena-action-dock__message" data-error={Boolean(error)}>{error || (type === 'direct' ? '选择 1 位 AI，即可开始一对一私聊。' : '选择 2–12 位 AI，即可创建群聊，之后还可以继续邀请。')}</span>
        <button className="arena-launch" type="button" disabled={busy} onClick={() => void create()}>{busy ? '创建中…' : type === 'direct' ? '开始私聊' : '创建群聊'}</button>
      </div>
    </div>
  )
}

const ROLE_ACTIVITY_TEXT: Record<string, string> = {
  idle: '空闲', acknowledging: '确认消息', thinking: '思考中', working: '工作中', tool: '使用工具',
  editing: '编辑文件', testing: '测试中', researching: '查阅中', delegating: '调度子 Agent', waiting: '等待协作',
  error: '发生错误', muted: '已静默',
}

const ACTIVE_ROLE_ACTIVITY = new Set(['acknowledging', 'thinking', 'working', 'tool', 'editing', 'testing', 'researching', 'delegating', 'waiting'])

function compactFilePath(value: string): string {
  const parts = value.replaceAll('\\', '/').split('/').filter(Boolean)
  return parts.length > 3 ? `…/${parts.slice(-3).join('/')}` : value
}

function activityTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function RoleMonitor(props: { monitor?: ActivityMonitor }): ReactNode {
  const roles = props.monitor?.roles ?? []
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpanded(current => {
      let changed = false
      const next = { ...current }
      for (const role of roles) {
        if (role.status === 'error' && next[role.profileId] !== true) {
          next[role.profileId] = true
          changed = true
          continue
        }
        if (next[role.profileId] !== undefined) continue
        next[role.profileId] = ACTIVE_ROLE_ACTIVITY.has(role.status)
        changed = true
      }
      return changed ? next : current
    })
  }, [roles.map(role => `${role.profileId}:${role.status}`).join('|')])

  const activeCount = roles.filter(role => ACTIVE_ROLE_ACTIVITY.has(role.status)).length
  const errorCount = roles.filter(role => role.status === 'error').length

  return (
    <section className="arena-role-monitor">
      <div className="arena-role-monitor__head">
        <div><h3>角色动态</h3><p>实时协作板 · 角色之间可互相查看</p></div>
        <span data-active={activeCount > 0} data-error={errorCount > 0}>{errorCount ? `${errorCount} 个错误` : activeCount ? `${activeCount} 工作中` : '均空闲'}</span>
      </div>
      <div className="arena-role-monitor__list">
        {roles.map(role => {
          const isOpen = expanded[role.profileId] ?? false
          return (
            <article className="arena-role-activity" data-status={role.status} key={role.profileId}>
              <button className="arena-role-activity__toggle" type="button" aria-expanded={isOpen} onClick={() => setExpanded(current => ({ ...current, [role.profileId]: !isOpen }))}>
                <Avatar value={role.avatar} name={role.name} />
                <span><strong>{role.name}</strong><small>{role.stage || ROLE_ACTIVITY_TEXT[role.status] || role.status}</small></span>
                <i className="arena-role-activity__status"><b />{ROLE_ACTIVITY_TEXT[role.status] || role.status}</i>
                <em>{isOpen ? '−' : '+'}</em>
              </button>
              {isOpen ? (
                <div className="arena-role-activity__body">
                  {role.detail ? <p>{role.detail}</p> : <p className="is-muted">暂无更多细节。</p>}
                  {role.currentTool ? <div className="arena-role-tool"><span>当前工具</span><code>{role.currentTool}</code></div> : null}
                  {role.claimedFiles.length ? <div className="arena-role-files"><span>已锁定文件</span>{role.claimedFiles.map(file => <code key={file} title={file}>🔒 {compactFilePath(file)}</code>)}</div> : null}
                  {role.recent.length ? <div className="arena-role-events"><span>最近动作</span>{[...role.recent].reverse().slice(0, 6).map(event => <div data-kind={event.kind} key={event.id}><i /><p>{event.text}</p><time>{activityTime(event.createdAt)}</time></div>)}</div> : null}
                  <div className="arena-role-updated">最后更新 {activityTime(role.updatedAt)}</div>
                </div>
              ) : null}
            </article>
          )
        })}
        {!roles.length ? <div className="arena-role-monitor__empty">尚无角色运行数据。</div> : null}
      </div>
      <div className="arena-role-monitor__note">文件编辑采用角色锁；冲突文件会在工具执行前被阻止。</div>
    </section>
  )
}

function ChatView(props: {
  room: ChatRoom
  profiles?: ArenaState['profiles']
  onSend: (text: string) => Promise<void>
  onRetry: () => Promise<void>
  onRename: (name: string) => Promise<void>
  onInvite: (profileIds: string[]) => Promise<void>
  onDelete: () => Promise<void>
}): ReactNode {
  const { room, profiles, onSend, onRetry, onRename, onInvite, onDelete } = props
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [roomName, setRoomName] = useState(room.name)
  const [inviteIds, setInviteIds] = useState<string[]>([])
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const respondingIds = room.respondingProfileIds?.length ? room.respondingProfileIds : room.respondingProfileId ? [room.respondingProfileId] : []
  const responding = room.participants.filter(item => respondingIds.includes(item.id))
  const respondingNames = responding.map(item => item.name).join('、')
  const mutedIds = new Set(room.mutedParticipantIds ?? [])
  const mentionable = [...room.participants, ...(room.administratorProfile ? [room.administratorProfile] : [])]
  const presets = [...new Set(room.participants.flatMap(item => item.presetPrompts ?? []))].slice(0, 12)
  const availableInvitees = (profiles?.aiUsers ?? []).filter(profile => !room.participants.some(item => item.id === profile.id))

  useEffect(() => { setRoomName(room.name) }, [room.name])

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [room.messages.length, room.status, respondingIds.join('|')])

  const send = async (): Promise<void> => {
    const content = text.trim()
    if (!content || busy) return
    setBusy(true)
    setError('')
    try {
      await onSend(content)
      setText('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusy(false) }
  }

  const retry = async (): Promise<void> => {
    if (busy || room.status === 'responding') return
    setBusy(true)
    setError('')
    try {
      await onRetry()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusy(false) }
  }

  const saveRoomName = async (): Promise<void> => {
    if (!roomName.trim()) { setSettingsError('聊天名称不能为空。'); return }
    setSettingsBusy(true)
    setSettingsError('')
    try { await onRename(roomName.trim()) } catch (cause) {
      setSettingsError(cause instanceof Error ? cause.message : String(cause))
    } finally { setSettingsBusy(false) }
  }

  const inviteMembers = async (): Promise<void> => {
    if (!inviteIds.length) { setSettingsError('请至少选择一位要邀请的 AI 用户。'); return }
    setSettingsBusy(true)
    setSettingsError('')
    try {
      await onInvite(inviteIds)
      setInviteIds([])
    } catch (cause) {
      setSettingsError(cause instanceof Error ? cause.message : String(cause))
    } finally { setSettingsBusy(false) }
  }

  return (
    <div className="arena-chat-layout">
    <div className="arena-chat">
      <header className="arena-chat-head">
        <div className="arena-chat-stack">
          {room.administratorProfile ? <span style={{ zIndex: 6 }}><Avatar value={room.administratorProfile.avatar} name={room.administratorProfile.name} /></span> : null}
          {room.participants.slice(0, 4).map((profile, index) => <span style={{ zIndex: 4 - index }} key={profile.id}><Avatar value={profile.avatar} name={profile.name} /></span>)}
        </div>
        <div><strong>{room.name}</strong><span>{room.type === 'direct' ? '私聊' : `${room.participants.length} 个 AI + 管理员`}</span></div>
        <div className="arena-chat-head__actions"><button className="arena-control" type="button" onClick={() => { setSettingsOpen(current => !current); setSettingsError('') }}>{settingsOpen ? '关闭设置' : room.type === 'group' ? '群设置' : '聊天设置'}</button><button className="arena-control arena-control--danger" type="button" onClick={() => { if (window.confirm(room.type === 'group' ? `解散群聊“${room.name}”？全部群聊记录将被删除。` : `删除聊天“${room.name}”？`)) void onDelete() }}>{room.type === 'group' ? '解散群聊' : '删除聊天'}</button></div>
      </header>
      {settingsOpen ? (
        <aside className="arena-chat-settings" aria-label={room.type === 'group' ? '群设置' : '聊天设置'}>
          <div className="arena-chat-settings__head"><div><strong>{room.type === 'group' ? '群设置' : '聊天设置'}</strong><span>修改名称{room.type === 'group' ? '并邀请新的 AI 用户' : ''}</span></div><button type="button" aria-label="关闭设置" onClick={() => setSettingsOpen(false)}>×</button></div>
          <label className="arena-field"><span>{room.type === 'group' ? '群聊名称' : '聊天名称'}</span><div className="arena-settings-name"><input className="arena-input" value={roomName} maxLength={80} onChange={event => setRoomName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void saveRoomName() }} /><button className="arena-control arena-control--primary" type="button" disabled={settingsBusy || roomName.trim() === room.name} onClick={() => void saveRoomName()}>保存名称</button></div></label>
          {room.type === 'group' ? <section><div className="arena-chat-settings__section"><strong>邀请 AI 用户</strong><span>当前 {room.participants.length}/12 位 AI</span></div>{availableInvitees.length ? <div className="arena-invite-list">{availableInvitees.map(profile => <button type="button" key={profile.id} className={inviteIds.includes(profile.id) ? 'is-active' : ''} onClick={() => setInviteIds(current => current.includes(profile.id) ? current.filter(id => id !== profile.id) : room.participants.length + current.length < 12 ? [...current, profile.id] : current)}><Avatar value={profile.avatar} name={profile.name} /><span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span><i>{inviteIds.includes(profile.id) ? '✓' : '+'}</i></button>)}</div> : <div className="arena-invite-empty">AI 用户库中没有可邀请的新成员。</div>}<button className="arena-launch arena-invite-submit" type="button" disabled={settingsBusy || !inviteIds.length} onClick={() => void inviteMembers()}>{settingsBusy ? '处理中…' : `邀请选中的 ${inviteIds.length || ''} 位成员`}</button></section> : null}
          {settingsError ? <div className="arena-error">{settingsError}</div> : null}
        </aside>
      ) : null}
      <div className="arena-chat-scroll" ref={scrollRef}>
        {room.messages.length === 0 ? (
          <div className="arena-chat-welcome">
            <div className="arena-chat-stack arena-chat-stack--large">{room.participants.map(profile => <span key={profile.id}><Avatar value={profile.avatar} name={profile.name} className="arena-avatar--large" /></span>)}</div>
            <strong>{room.type === 'direct' ? `你和 ${room.participants[0]?.name} 的私聊` : room.name}</strong>
            <span>发一条消息开始聊天，AI 会按自己的自定义人格回复。</span>
          </div>
        ) : null}
        {room.messages.map(message => message.kind === 'system' ? (
          <div className="arena-chat-system" key={message.id}>{message.text}</div>
        ) : (
          <div className="arena-message-row" data-kind={message.kind === 'human' ? 'user' : message.kind === 'admin' ? 'admin' : 'participant'} key={message.id}>
            <Avatar value={message.avatar} name={message.senderName} className="arena-avatar--message" />
            <div className="arena-message" data-kind={message.kind === 'human' ? 'user' : message.kind === 'admin' ? 'admin' : 'participant'}>
              <div className="arena-message__head"><strong>{message.senderName}</strong><span>{message.model ?? (message.kind === 'human' ? '你' : '')}{message.phase === 'ack' ? ' · 开始处理' : ''}</span></div>
              <div className="arena-message__text">{message.text}</div>
            </div>
          </div>
        ))}
        {room.status === 'responding' ? (
          <div className="arena-chat-typing"><div className="arena-typing-stack">{responding.slice(0, 4).map(profile => <Avatar key={profile.id} value={profile.avatar} name={profile.name} />)}</div><span>{respondingNames || 'AI'} 正在同时处理</span><WorkingDots /></div>
        ) : null}
        {error ? <div className="arena-error">{error}</div> : null}
      </div>
      <footer className="arena-chat-compose">
        {room.status === 'idle' && room.messages.some(message => message.kind === 'human') ? <div className="arena-chat-retry"><span>上一条没有收到回复或想重新请求？</span><button className="arena-control" type="button" disabled={busy} onClick={() => void retry()}>↻ 重试上一条</button></div> : null}
        {presets.length ? <div className="arena-preset-chips">{presets.map(preset => <button type="button" key={preset} onClick={() => setText(preset)}>{preset}</button>)}</div> : null}
        <div className="arena-mention-bar"><span>点名：</span>{mentionable.map(profile => { const muted = mutedIds.has(profile.id); return <button type="button" key={profile.id} className={muted ? 'is-muted' : profile.id === 'administrator' ? 'is-admin' : ''} title={muted ? `${profile.name} 已静默，点击生成恢复指令` : `@${profile.name}`} onClick={() => setText(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${profile.name} ${muted ? '可以继续说话了 ' : ''}`)}><Avatar value={profile.avatar} name={profile.name} />@{profile.name}{muted ? ' · 静默' : ''}</button> })}</div>
        <div><textarea className="arena-textarea" value={text} maxLength={4000} placeholder={room.status === 'responding' ? `${respondingNames || 'AI'} 正在并行处理，你仍可继续发言或 @其他成员…` : '发送消息；不 @ 时所有未静默的 AI 会同时回应；也可说“某某别说话”'} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} /><button className="arena-send" type="button" disabled={busy || !text.trim()} onClick={() => void send()}>发送</button></div>
      </footer>
    </div>
    <aside className="arena-chat-side"><RoleMonitor monitor={room.activityMonitor} /></aside>
    </div>
  )
}

type HistoryFilter = 'meeting' | 'direct' | 'group'

function HistoryView(props: {
  meetings: Meeting[]
  rooms: ChatRoom[]
  filter: HistoryFilter
  onFilter: (filter: HistoryFilter) => void
  onOpenMeeting: (id: string) => void
  onOpenRoom: (id: string) => void
  onRenameMeeting: (id: string, name: string) => Promise<void>
  onRenameRoom: (id: string, name: string) => Promise<void>
  onDeleteMeeting: (id: string) => Promise<void>
  onDeleteRoom: (id: string) => Promise<void>
}): ReactNode {
  const { meetings, rooms, filter, onFilter, onOpenMeeting, onOpenRoom, onRenameMeeting, onRenameRoom, onDeleteMeeting, onDeleteRoom } = props
  const [editing, setEditing] = useState<{ kind: 'meeting' | 'room'; id: string; name: string } | null>(null)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const filteredRooms = rooms.filter(room => room.type === filter)

  const saveName = async (): Promise<void> => {
    if (!editing || !editing.name.trim()) {
      setError('名称不能为空。')
      return
    }
    setBusyId(editing.id)
    setError('')
    try {
      if (editing.kind === 'meeting') await onRenameMeeting(editing.id, editing.name.trim())
      else await onRenameRoom(editing.id, editing.name.trim())
      setEditing(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusyId('') }
  }

  const removeMeeting = async (meeting: Meeting): Promise<void> => {
    if (BUSY_MEETINGS.has(meeting.status)) {
      setError('AI 正在工作，请先停止当前工作再删除会议。')
      return
    }
    if (!window.confirm(`永久删除会议记录“${meetingTitle(meeting)}”？此操作无法撤销。`)) return
    setBusyId(meeting.id)
    setError('')
    try { await onDeleteMeeting(meeting.id) } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusyId('') }
  }

  const removeRoom = async (room: ChatRoom): Promise<void> => {
    if (!window.confirm(`永久删除${room.type === 'direct' ? '私聊' : '群聊'}“${room.name}”及全部消息？此操作无法撤销。`)) return
    setBusyId(room.id)
    setError('')
    try { await onDeleteRoom(room.id) } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusyId('') }
  }

  const dateText = (value: string): string => {
    try { return new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  return (
    <div className="arena-history">
      <div className="arena-page-scroll">
        <div className="arena-kicker">History manager</div>
        <h2>历史记录管理</h2>
        <p className="arena-lead">会议名称与实际讨论主题分开保存。你可以放心重命名记录，不会改变会议内容。</p>
        <div className="arena-history-tabs">
          <button type="button" className={filter === 'meeting' ? 'is-active' : ''} onClick={() => { onFilter('meeting'); setEditing(null); setError('') }}>协作会议 <i>{meetings.length}</i></button>
          <button type="button" className={filter === 'direct' ? 'is-active' : ''} onClick={() => { onFilter('direct'); setEditing(null); setError('') }}>AI 私聊 <i>{rooms.filter(room => room.type === 'direct').length}</i></button>
          <button type="button" className={filter === 'group' ? 'is-active' : ''} onClick={() => { onFilter('group'); setEditing(null); setError('') }}>AI 群聊 <i>{rooms.filter(room => room.type === 'group').length}</i></button>
        </div>
        {error ? <div className="arena-page-alert" role="alert">{error}</div> : null}
        <div className="arena-history-list">
          {filter === 'meeting' ? meetings.map(meeting => (
            <article className="arena-history-card" key={meeting.id}>
              <div className="arena-history-avatars">{meeting.participants.slice(0, 3).map((participant, index) => <span key={participant.id} style={{ zIndex: 4 - index }}><Avatar value={participant.avatar} name={participant.name} /></span>)}</div>
              <button className="arena-history-open" type="button" onClick={() => onOpenMeeting(meeting.id)}>
                <strong>{meetingTitle(meeting)}</strong>
                <span>{meeting.displayName ? `原主题：${meeting.topic}` : meeting.topic}</span>
                <small>{STATUS_TEXT[meeting.status] ?? meeting.status} · {dateText(meeting.createdAt)} · {meeting.transcript.filter(item => item.kind !== 'system').length} 条消息</small>
              </button>
              <div className="arena-history-actions"><button type="button" onClick={() => { setEditing({ kind: 'meeting', id: meeting.id, name: meetingTitle(meeting) }); setError('') }}>重命名</button><button className="is-danger" type="button" disabled={BUSY_MEETINGS.has(meeting.status) || busyId === meeting.id} title={BUSY_MEETINGS.has(meeting.status) ? '请先停止当前 AI 工作' : '删除会议'} onClick={() => void removeMeeting(meeting)}>删除</button></div>
              {editing?.kind === 'meeting' && editing.id === meeting.id ? <div className="arena-history-editor"><input className="arena-input" value={editing.name} maxLength={80} autoFocus onChange={event => setEditing({ ...editing, name: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') void saveName(); if (event.key === 'Escape') setEditing(null) }} /><button className="arena-send" type="button" disabled={busyId === meeting.id} onClick={() => void saveName()}>保存</button><button className="arena-control" type="button" onClick={() => setEditing(null)}>取消</button></div> : null}
            </article>
          )) : filteredRooms.map(room => (
            <article className="arena-history-card" key={room.id}>
              <div className="arena-history-avatars">{room.participants.slice(0, 3).map((participant, index) => <span key={participant.id} style={{ zIndex: 4 - index }}><Avatar value={participant.avatar} name={participant.name} /></span>)}</div>
              <button className="arena-history-open" type="button" onClick={() => onOpenRoom(room.id)}><strong>{room.name}</strong><span>{room.type === 'direct' ? `与 ${room.participants[0]?.name || 'AI'} 的私聊` : `${room.participants.length} 位 AI + 管理员`}</span><small>{room.status === 'responding' ? '回复中' : '空闲'} · {dateText(room.updatedAt)} · {room.messages.length} 条消息</small></button>
              <div className="arena-history-actions"><button type="button" onClick={() => { setEditing({ kind: 'room', id: room.id, name: room.name }); setError('') }}>重命名</button><button className="is-danger" type="button" disabled={busyId === room.id} onClick={() => void removeRoom(room)}>删除</button></div>
              {editing?.kind === 'room' && editing.id === room.id ? <div className="arena-history-editor"><input className="arena-input" value={editing.name} maxLength={80} autoFocus onChange={event => setEditing({ ...editing, name: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') void saveName(); if (event.key === 'Escape') setEditing(null) }} /><button className="arena-send" type="button" disabled={busyId === room.id} onClick={() => void saveName()}>保存</button><button className="arena-control" type="button" onClick={() => setEditing(null)}>取消</button></div> : null}
            </article>
          ))}
          {filter === 'meeting' && !meetings.length ? <div className="arena-history-empty">还没有会议记录。</div> : null}
          {filter !== 'meeting' && !filteredRooms.length ? <div className="arena-history-empty">还没有{filter === 'direct' ? '私聊' : '群聊'}记录。</div> : null}
        </div>
      </div>
    </div>
  )
}

type WorkspaceTab = 'activity' | 'tasks' | 'decisions' | 'artifacts'

function CollaborationConsole(props: {
  meeting: Meeting
  busy: boolean
  active: boolean
  onAction: (body: object) => Promise<boolean>
  onCompose: (text: string) => void
}): ReactNode {
  const { meeting, busy, active, onAction, onCompose } = props
  const [tab, setTab] = useState<WorkspaceTab>('activity')
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [decisionFormOpen, setDecisionFormOpen] = useState(false)
  const [decisionTitle, setDecisionTitle] = useState('')
  const [decisionDescription, setDecisionDescription] = useState('')
  const [decisionOptions, setDecisionOptions] = useState('')
  const [artifactFormOpen, setArtifactFormOpen] = useState(false)
  const [artifactTitle, setArtifactTitle] = useState('')
  const [artifactDescription, setArtifactDescription] = useState('')
  const [artifactLocation, setArtifactLocation] = useState('')
  const [artifactType, setArtifactType] = useState<MeetingArtifact['artifactType']>('note')
  const tasks = meeting.tasks ?? []
  const decisions = meeting.decisions ?? []
  const artifacts = meeting.artifacts ?? []
  const stage = meeting.collaborationStage ?? (meeting.status === 'completed' ? 'completed' : 'discussion')
  const administrator = meeting.administratorProfile ?? { id: 'administrator', name: '管理员', avatar: '🛡️' }
  const human = meeting.humanProfile ?? { id: 'human', name: '你', avatar: '🧑' }
  const mutedIds = new Set(meeting.mutedParticipantIds ?? [])
  const owners = [{ id: 'administrator', name: administrator.name }, ...meeting.participants.map(item => ({ id: item.id || '', name: item.name }))]
  const ownerName = (id: string | null): string => owners.find(item => item.id === id)?.name || '未分配'
  const blockers = tasks.filter(item => item.status === 'blocked')

  const createTask = async (): Promise<void> => {
    if (!taskTitle.trim()) return
    if (await onAction({ action: 'task-create', title: taskTitle, description: taskDescription, assigneeId: taskAssignee })) {
      setTaskTitle(''); setTaskDescription(''); setTaskAssignee(''); setTaskFormOpen(false)
    }
  }

  const createDecision = async (): Promise<void> => {
    const options = decisionOptions.split('\n').map(item => item.trim()).filter(Boolean)
    if (!decisionTitle.trim() || options.length < 2) return
    if (await onAction({ action: 'decision-create', title: decisionTitle, description: decisionDescription, options })) {
      setDecisionTitle(''); setDecisionDescription(''); setDecisionOptions(''); setDecisionFormOpen(false)
    }
  }

  const createArtifact = async (): Promise<void> => {
    if (!artifactTitle.trim()) return
    if (await onAction({ action: 'artifact-create', title: artifactTitle, description: artifactDescription, location: artifactLocation, artifactType })) {
      setArtifactTitle(''); setArtifactDescription(''); setArtifactLocation(''); setArtifactType('note'); setArtifactFormOpen(false)
    }
  }

  return (
    <aside className="arena-workspace-panel">
      <div className="arena-workspace-stage">
        <span><small>会议阶段</small><strong>{MEETING_STAGE_TEXT[stage]}</strong></span>
        <select value={stage} disabled={busy || stage === 'completed'} onChange={event => void onAction({ action: 'set-stage', stage: event.target.value })}>
          {(Object.keys(MEETING_STAGE_TEXT) as MeetingStage[]).filter(item => item !== 'completed').map(item => <option value={item} key={item}>{MEETING_STAGE_TEXT[item]}</option>)}
          {stage === 'completed' ? <option value="completed">已完成</option> : null}
        </select>
      </div>
      <div className="arena-workspace-tabs" role="tablist" aria-label="协作控制台">
        <button type="button" className={tab === 'activity' ? 'is-active' : ''} onClick={() => setTab('activity')}><span>动态</span><i>{meeting.activityMonitor?.roles.filter(item => !['idle', 'muted'].includes(item.status)).length || 0}</i></button>
        <button type="button" className={tab === 'tasks' ? 'is-active' : ''} onClick={() => setTab('tasks')}><span>任务</span><i>{tasks.length}</i></button>
        <button type="button" className={tab === 'decisions' ? 'is-active' : ''} onClick={() => setTab('decisions')}><span>决策</span><i>{decisions.filter(item => item.status === 'open').length}</i></button>
        <button type="button" className={tab === 'artifacts' ? 'is-active' : ''} onClick={() => setTab('artifacts')}><span>成果</span><i>{artifacts.length}</i></button>
      </div>

      <div className="arena-workspace-scroll">
        {tab === 'activity' ? <>
          <RoleMonitor monitor={meeting.activityMonitor} />
          <section className="arena-workspace-members">
            <h3>会议成员</h3>
            <div className="arena-member"><Avatar value={human.avatar} name={human.name} /><span><strong>{human.name}</strong><small>人类用户 · 最终决策者</small></span></div>
            <div className="arena-member"><Avatar value={administrator.avatar} name={administrator.name} /><span><strong>{administrator.name}</strong><small>{administrator.model || '会议管理员'}</small></span></div>
            {meeting.participants.map(participant => <div className="arena-member" data-muted={mutedIds.has(participant.id)} key={participant.id}><Avatar value={participant.avatar} name={participant.name} /><span><strong>{participant.name}</strong><small>{mutedIds.has(participant.id) ? '已静默' : participant.status === 'working' || participant.status === 'thinking' ? '正在工作…' : participant.model}</small></span></div>)}
          </section>
        </> : null}

        {tab === 'tasks' ? <section className="arena-workspace-section">
          <div className="arena-workspace-section__head"><span><h3>任务板</h3><p>{blockers.length ? `${blockers.length} 项受阻，需要处理` : '分配负责人并跟踪交付状态'}</p></span><button type="button" onClick={() => setTaskFormOpen(value => !value)}>＋ 新建</button></div>
          {taskFormOpen ? <div className="arena-workspace-form">
            <input className="arena-input" value={taskTitle} maxLength={160} placeholder="任务标题" onChange={event => setTaskTitle(event.target.value)} />
            <textarea className="arena-textarea" value={taskDescription} maxLength={1600} placeholder="完成标准、依赖或补充说明（可选）" onChange={event => setTaskDescription(event.target.value)} />
            <select value={taskAssignee} onChange={event => setTaskAssignee(event.target.value)}><option value="">未分配</option>{owners.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
            <div><button className="is-primary" type="button" disabled={busy || !taskTitle.trim()} onClick={() => void createTask()}>创建任务</button><button type="button" onClick={() => setTaskFormOpen(false)}>取消</button></div>
          </div> : null}
          <div className="arena-task-list">{tasks.map(task => <article className="arena-task-card" data-status={task.status} key={task.id}>
            <div className="arena-task-card__head"><strong>{task.title}</strong><em>{TASK_STATUS_TEXT[task.status]}</em></div>
            {task.description ? <p>{task.description}</p> : null}
            <div className="arena-task-card__fields">
              <select aria-label="任务负责人" value={task.assigneeId || ''} disabled={busy} onChange={event => void onAction({ action: 'task-update', taskId: task.id, assigneeId: event.target.value })}><option value="">未分配</option>{owners.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
              <select aria-label="任务状态" value={task.status} disabled={busy} onChange={event => void onAction({ action: 'task-update', taskId: task.id, status: event.target.value })}>{(Object.keys(TASK_STATUS_TEXT) as TaskStatus[]).map(status => <option value={status} key={status}>{TASK_STATUS_TEXT[status]}</option>)}</select>
            </div>
            <div className="arena-card-actions">
              {task.status === 'todo' ? <button className="is-primary" type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'in-progress' })}>▶ 开始任务</button> : null}
              {task.status === 'paused' ? <button className="is-primary" type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'in-progress' })}>▶ 继续任务</button> : null}
              {task.status === 'in-progress' ? <button type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'paused' })}>Ⅱ 暂停任务</button> : null}
              {task.status === 'blocked' ? <><button className="is-primary" type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'in-progress' })}>↻ 重新处理</button><button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: `受阻任务“${task.title}”` })}>发起复核</button></> : null}
              <button className="is-danger" type="button" disabled={busy} onClick={() => { if (window.confirm(`删除任务“${task.title}”？`)) void onAction({ action: 'task-delete', taskId: task.id }) }}>删除</button>
            </div>
          </article>)}</div>
          {!tasks.length ? <div className="arena-workspace-empty">还没有任务。人类或 AI 都可以把工作拆到这里。</div> : null}
        </section> : null}

        {tab === 'decisions' ? <section className="arena-workspace-section">
          <div className="arena-workspace-section__head"><span><h3>决策板</h3><p>比较方案与风险，由你做最终选择</p></span><button type="button" onClick={() => setDecisionFormOpen(value => !value)}>＋ 新建</button></div>
          {decisionFormOpen ? <div className="arena-workspace-form">
            <input className="arena-input" value={decisionTitle} maxLength={160} placeholder="要决定什么？" onChange={event => setDecisionTitle(event.target.value)} />
            <textarea className="arena-textarea" value={decisionDescription} maxLength={1600} placeholder="背景和约束（可选）" onChange={event => setDecisionDescription(event.target.value)} />
            <textarea className="arena-textarea" value={decisionOptions} placeholder={'每行一个方案，至少两行\n方案 A\n方案 B'} onChange={event => setDecisionOptions(event.target.value)} />
            <div><button className="is-primary" type="button" disabled={busy || !decisionTitle.trim() || decisionOptions.split('\n').filter(item => item.trim()).length < 2} onClick={() => void createDecision()}>创建决策</button><button type="button" onClick={() => setDecisionFormOpen(false)}>取消</button></div>
          </div> : null}
          <div className="arena-decision-list">{decisions.map(decision => <article className="arena-decision-card" data-status={decision.status} key={decision.id}>
            <div className="arena-decision-card__head"><span><strong>{decision.title}</strong><small>{decision.status === 'decided' ? '已决定' : '等待你选择'}</small></span>{decision.status === 'decided' ? <button type="button" disabled={busy} onClick={() => void onAction({ action: 'decision-reopen', decisionId: decision.id })}>重开讨论</button> : null}</div>
            {decision.description ? <p>{decision.description}</p> : null}
            <div className="arena-option-list">{decision.options.map(option => {
              const selected = decision.selectedOptionId === option.id
              return <div className={selected ? 'arena-option is-selected' : 'arena-option'} key={option.id}>
                <div className="arena-option__head"><span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span><button type="button" disabled={busy || selected} onClick={() => void onAction({ action: 'decision-choose', decisionId: decision.id, optionId: option.id })}>{selected ? '✓ 已选择' : decision.status === 'decided' ? '改选' : '选择方案'}</button></div>
                {(option.opinions ?? []).map(opinion => <div className="arena-opinion" data-stance={opinion.stance} key={opinion.profileId}><Avatar value={opinion.avatar} name={opinion.name} /><span><strong>{opinion.name} · {opinion.stance === 'support' ? '支持' : opinion.stance === 'oppose' ? '反对' : '中立'} · 信心 {opinion.confidence}%</strong><p>{opinion.reason || '未填写理由'}</p>{opinion.risk ? <small>风险：{opinion.risk}</small> : null}</span></div>)}
              </div>
            })}</div>
            <div className="arena-card-actions"><button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: `决策“${decision.title}”` })}>要求证据</button><button className="is-danger" type="button" disabled={busy} onClick={() => { if (window.confirm(`删除决策“${decision.title}”？`)) void onAction({ action: 'decision-delete', decisionId: decision.id }) }}>删除</button></div>
          </article>)}</div>
          {!decisions.length ? <div className="arena-workspace-empty">出现多个可行方案时，把它们放到这里比较理由、风险与可行性。</div> : null}
        </section> : null}

        {tab === 'artifacts' ? <section className="arena-workspace-section">
          <div className="arena-workspace-section__head"><span><h3>成果库</h3><p>文件、链接、结论与阶段总结</p></span><button type="button" onClick={() => setArtifactFormOpen(value => !value)}>＋ 添加</button></div>
          {artifactFormOpen ? <div className="arena-workspace-form">
            <input className="arena-input" value={artifactTitle} maxLength={160} placeholder="成果标题" onChange={event => setArtifactTitle(event.target.value)} />
            <textarea className="arena-textarea" value={artifactDescription} maxLength={2400} placeholder="内容或验收说明" onChange={event => setArtifactDescription(event.target.value)} />
            <div className="arena-form-row"><select value={artifactType} onChange={event => setArtifactType(event.target.value as MeetingArtifact['artifactType'])}><option value="note">结论</option><option value="file">文件</option><option value="link">链接</option><option value="summary">总结</option></select><input className="arena-input" value={artifactLocation} maxLength={1600} placeholder="文件路径或 URL（可选）" onChange={event => setArtifactLocation(event.target.value)} /></div>
            <div><button className="is-primary" type="button" disabled={busy || !artifactTitle.trim()} onClick={() => void createArtifact()}>登记成果</button><button type="button" onClick={() => setArtifactFormOpen(false)}>取消</button></div>
          </div> : null}
          <div className="arena-artifact-list">{artifacts.map(artifact => <article className="arena-artifact-card" data-status={artifact.status} key={artifact.id}>
            <div className="arena-artifact-card__head"><span>{artifact.artifactType === 'file' ? '📄' : artifact.artifactType === 'link' ? '🔗' : artifact.artifactType === 'summary' ? '📋' : '💡'}</span><div><strong>{artifact.title}</strong><small>{artifact.status === 'accepted' ? '已验收' : artifact.status === 'rejected' ? '已驳回' : '待验收'} · {ownerName(artifact.ownerId)}</small></div></div>
            {artifact.description ? <p>{artifact.description}</p> : null}
            {artifact.location ? (/^https?:\/\//i.test(artifact.location) ? <a href={artifact.location} target="_blank" rel="noreferrer">{artifact.location}</a> : <code>{artifact.location}</code>) : null}
            <div className="arena-card-actions"><button type="button" disabled={busy || artifact.status === 'accepted'} onClick={() => void onAction({ action: 'artifact-update', artifactId: artifact.id, status: 'accepted' })}>验收</button><button type="button" disabled={busy || artifact.status === 'rejected'} onClick={() => void onAction({ action: 'artifact-update', artifactId: artifact.id, status: 'rejected' })}>驳回结果</button><button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: `成果“${artifact.title}”` })}>要求证据</button><button className="is-danger" type="button" disabled={busy} onClick={() => { if (window.confirm(`删除成果“${artifact.title}”？`)) void onAction({ action: 'artifact-delete', artifactId: artifact.id }) }}>删除</button></div>
          </article>)}</div>
          {!artifacts.length ? <div className="arena-workspace-empty">AI 完成文件、调研、链接或结论后，会沉淀在这里等待你验收。</div> : null}
        </section> : null}
      </div>

      <div className="arena-workspace-quick">
        <button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: '当前方案与成果' })}>🔎 要求全员补证据</button>
        <button type="button" onClick={() => onCompose(`@${administrator.name} 把话题改为：`)}>✎ 更换话题</button>
      </div>
    </aside>
  )
}

function WatchView(props: { meeting: Meeting; profiles: ArenaState['profiles']; onAction: (body: object) => Promise<void> }): ReactNode {
  const { meeting, profiles, onAction } = props
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteIds, setInviteIds] = useState<string[]>([])
  const stageRef = useRef<HTMLDivElement>(null)
  const active = true
  const busyMeeting = BUSY_MEETINGS.has(meeting.status)
  const administrator = meeting.administratorProfile ?? { id: 'administrator', name: '管理员', avatar: '🛡️' }
  const human = meeting.humanProfile ?? { id: 'human', name: '你', avatar: '🧑' }
  const working = meeting.participants.filter(item => item.status === 'thinking' || item.status === 'acknowledging' || item.status === 'working')
  const mutedIds = new Set(meeting.mutedParticipantIds ?? [])
  const availableInvitees = (profiles?.aiUsers ?? []).filter(profile => !meeting.participants.some(participant => participant.id === profile.id))

  useEffect(() => {
    const element = stageRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [meeting.transcript.length, meeting.status])

  const act = async (body: object): Promise<boolean> => {
    setBusy(true)
    setError('')
    try {
      await onAction(body)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return false
    } finally { setBusy(false) }
  }

  const send = async (): Promise<void> => {
    const text = message.trim()
    if (!text) return
    if (await act({ action: 'intervene', text })) setMessage('')
  }

  const mention = (name: string, suffix = ''): void => setMessage(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${name} ${suffix}`)

  const inviteMembers = async (): Promise<void> => {
    if (!inviteIds.length) { setError('请至少选择一位要邀请的 AI 用户。'); return }
    if (await act({ action: 'invite-members', profileIds: inviteIds })) {
      setInviteIds([])
      setInviteOpen(false)
    }
  }

  return (
    <div className="arena-watch">
      <div className="arena-watch-head">
        <div className="arena-watch-head__title">
          <h2 title={meeting.topic}>{meetingTitle(meeting)}</h2>
          <div className="arena-meta">
            <span>{meeting.participants.length + 2} 位群成员</span>
            <span>长期协作 · 随时继续</span>
          </div>
        </div>
        <div className="arena-watch-head__actions">
          <button className="arena-control" type="button" onClick={() => { setInviteOpen(value => !value); setError('') }}>{inviteOpen ? '关闭邀请' : '＋ 邀请成员'}</button>
          <span className="arena-status" data-status={meeting.status}>{STATUS_TEXT[meeting.status] ?? meeting.status}</span>
        </div>
      </div>

      {inviteOpen ? (
        <aside className="arena-chat-settings arena-meeting-invite" aria-label="邀请会议成员">
          <div className="arena-chat-settings__head"><div><strong>邀请 AI 用户</strong><span>当前 {meeting.participants.length}/12 位；加入后可以被 @，也会参与后续全员讨论</span></div><button type="button" aria-label="关闭邀请" onClick={() => setInviteOpen(false)}>×</button></div>
          {availableInvitees.length ? <div className="arena-invite-list">{availableInvitees.map(profile => <button type="button" key={profile.id} className={inviteIds.includes(profile.id) ? 'is-active' : ''} onClick={() => setInviteIds(current => current.includes(profile.id) ? current.filter(id => id !== profile.id) : meeting.participants.length + current.length < 12 ? [...current, profile.id] : current)}><Avatar value={profile.avatar} name={profile.name} /><span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span><i>{inviteIds.includes(profile.id) ? '✓' : '+'}</i></button>)}</div> : <div className="arena-invite-empty">AI 用户库中没有可邀请的新成员。</div>}
          <button className="arena-launch arena-invite-submit" type="button" disabled={busy || !inviteIds.length} onClick={() => void inviteMembers()}>{busy ? '处理中…' : `邀请选中的 ${inviteIds.length || ''} 位成员`}</button>
        </aside>
      ) : null}

        <div className="arena-collab-layout">
        <div className="arena-stage" ref={stageRef}>
          {meeting.transcript.length === 0 ? <div className="arena-empty"><div><strong>{meeting.status === 'queued' ? '正在等候入群' : 'AI 成员正在准备发言'}</strong><WorkingDots /></div></div> : (
            <div className="arena-transcript">
              {meeting.transcript.map(item => {
                if (item.kind === 'system') return /^第\s*\d+\s*轮/.test(item.text)
                  ? null
                  : <div className="arena-round-label" key={item.id}>{item.text}</div>
                const participant = meeting.participants.find(entry => entry.id === item.speakerId)
                const avatar = item.avatar || participant?.avatar || (item.kind === 'user' ? human.avatar : item.kind === 'admin' ? administrator.avatar : '🤖')
                return (
                  <div className="arena-message-row" data-kind={item.kind} key={item.id}>
                    <Avatar value={avatar} name={item.speaker} className="arena-avatar--message" />
                    <div className="arena-message" data-kind={item.kind}>
                      <div className="arena-message__head"><strong>{item.speaker}</strong><span>{item.model ?? (item.kind === 'user' ? '我' : item.kind === 'admin' ? '群管理员' : '')}{item.phase === 'ack' ? ' · 开始处理' : ''}</span></div>
                      <div className="arena-message__text">{item.text}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {working.length ? <div className="arena-chat-typing"><div className="arena-typing-stack">{working.slice(0, 4).map(participant => <Avatar key={participant.id} value={participant.avatar} name={participant.name} />)}</div><span>{working.map(item => item.name).join('、')} 正在并行处理</span><WorkingDots /></div> : null}
          {meeting.status === 'paused' && active ? <div className="arena-chat-system">当前无人发言，会议仍在。你可以发送消息、@成员，或点击“让全员继续”。</div> : null}
          {meeting.error ? <div className="arena-error">{meeting.error}</div> : null}
          {error ? <div className="arena-error">{error}</div> : null}
        </div>

        <CollaborationConsole meeting={meeting} busy={busy} active={active} onAction={act} onCompose={setMessage} />
      </div>

      <div className="arena-controls">
        <div className="arena-intervene arena-intervene--chat">
          <div className="arena-mention-bar"><span>点名：</span>{meeting.participants.map(participant => { const muted = mutedIds.has(participant.id); return <button type="button" key={participant.id} className={muted ? 'is-muted' : ''} title={muted ? `${participant.name} 已静默，点击生成恢复指令` : `@${participant.name}`} onClick={() => mention(participant.name, muted ? '可以继续说话了 ' : '')}><Avatar value={participant.avatar} name={participant.name} />@{participant.name}{muted ? ' · 静默' : ''}</button> })}<button type="button" className="is-admin" onClick={() => mention(administrator.name)}><Avatar value={administrator.avatar} name={administrator.name} />@{administrator.name}</button></div>
          <div><textarea className="arena-textarea" value={message} placeholder="自由发言；不 @ 时未静默的 AI 会同时工作；也可说“某某别说话”…" maxLength={4000} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} /><button className="arena-send" type="button" disabled={busy || !message.trim()} onClick={() => void send()}>发送</button></div>
        </div>
        {meeting.status === 'paused' ? (
          <button className="arena-control" type="button" disabled={busy} onClick={() => void act({ action: 'resume' })}>▶ 让全员继续</button>
        ) : meeting.status === 'running' ? <button className="arena-control" type="button" disabled={busy} onClick={() => void act({ action: 'pause' })}>Ⅱ 本轮后暂停</button> : null}
        <button className="arena-control" type="button" disabled={busy} onClick={() => void act({ action: 'summarize' })}>📋 生成阶段总结</button>
        <button className="arena-control arena-control--danger" type="button" disabled={busy || !busyMeeting} onClick={() => void act({ action: 'stop' })}>■ 停止当前工作</button>
      </div>
    </div>
  )
}

export function ArenaOverlay({ embedded = false }: { embedded?: boolean } = {}): ReactNode {
  const [open, setOpen] = useState(embedded)
  const [state, setState] = useState<ArenaState>({
    meetings: [],
    rooms: [],
    templates: FALLBACK_TEMPLATES,
    profiles: {
      human: { id: 'human', name: '你', avatar: '🧑' },
      administrator: { id: 'administrator', name: '管理员', avatar: '🛡️' },
      aiUsers: [],
    },
    modelCatalog: [],
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('meeting')
  const [view, setView] = useState<ArenaView>('setup')
  const [loadError, setLoadError] = useState('')

  const selected = useMemo(
    () => state.meetings.find(meeting => meeting.id === selectedId) ?? null,
    [state.meetings, selectedId],
  )
  const selectedRoom = useMemo(
    () => state.rooms?.find(room => room.id === selectedRoomId) ?? null,
    [state.rooms, selectedRoomId],
  )
  const activeCount = state.meetings.filter(meeting => BUSY_MEETINGS.has(meeting.status)).length

  useEffect(() => {
    const listener = (): void => setOpen(true)
    window.addEventListener(OPEN_EVENT, listener)
    return () => window.removeEventListener(OPEN_EVENT, listener)
  }, [])

  useEffect(() => {
    if (!open) return
    let alive = true
    const refresh = async (): Promise<void> => {
      try {
        const data = await jsonRequest<ArenaState>('/state')
        if (!alive) return
        setState(data)
        setLoadError('')
      } catch (cause) {
        if (alive) setLoadError(cause instanceof Error ? cause.message : String(cause))
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 900)
    return () => { alive = false; window.clearInterval(timer) }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (embedded) return
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, embedded])

  const runAction = async (body: object): Promise<void> => {
    if (!selected) return
    const result = await jsonRequest<{ meeting: Meeting }>(`/meetings/${encodeURIComponent(selected.id)}/actions`, {
      method: 'POST', body: JSON.stringify(body),
    })
    setState(current => ({ ...current, meetings: current.meetings.map(item => item.id === result.meeting.id ? result.meeting : item) }))
  }

  const created = (meeting: Meeting): void => {
    setState(current => ({ ...current, meetings: [meeting, ...current.meetings] }))
    setSelectedId(meeting.id)
    setView('watch')
  }

  const humanSaved = (profile: UserProfile): void => setState(current => ({
    ...current,
    profiles: {
      human: profile,
      administrator: current.profiles?.administrator ?? { id: 'administrator', name: '管理员', avatar: '🛡️' },
      aiUsers: current.profiles?.aiUsers ?? [],
    },
  }))

  const administratorSaved = (profile: UserProfile): void => setState(current => ({
    ...current,
    profiles: {
      human: current.profiles?.human ?? { id: 'human', name: '你', avatar: '🧑' },
      administrator: profile,
      aiUsers: current.profiles?.aiUsers ?? [],
    },
  }))

  const aiSaved = (profile: UserProfile): void => setState(current => {
    const human = current.profiles?.human ?? { id: 'human', name: '你', avatar: '🧑' }
    const aiUsers = [...(current.profiles?.aiUsers ?? [])]
    const index = aiUsers.findIndex(item => item.id === profile.id)
    if (index >= 0) aiUsers.splice(index, 1, profile)
    else aiUsers.push(profile)
    const administrator = current.profiles?.administrator ?? { id: 'administrator', name: '管理员', avatar: '🛡️' }
    return { ...current, profiles: { human, administrator, aiUsers } }
  })

  const aiDeleted = (id: string): void => setState(current => ({
    ...current,
    profiles: {
      human: current.profiles?.human ?? { id: 'human', name: '你', avatar: '🧑' },
      administrator: current.profiles?.administrator ?? { id: 'administrator', name: '管理员', avatar: '🛡️' },
      aiUsers: (current.profiles?.aiUsers ?? []).filter(item => item.id !== id),
    },
  }))

  const roomCreated = (room: ChatRoom): void => {
    setState(current => ({ ...current, rooms: [room, ...(current.rooms ?? [])] }))
    setSelectedRoomId(room.id)
    setView('chat')
  }

  const renameMeetingRecord = async (id: string, name: string): Promise<void> => {
    const result = await jsonRequest<{ meeting: Meeting }>(`/meetings/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    setState(current => ({ ...current, meetings: current.meetings.map(meeting => meeting.id === id ? result.meeting : meeting) }))
  }

  const deleteMeetingRecord = async (id: string): Promise<void> => {
    await jsonRequest<{ ok: boolean }>(`/meetings/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setState(current => ({ ...current, meetings: current.meetings.filter(meeting => meeting.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }

  const renameRoomRecord = async (id: string, name: string): Promise<void> => {
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(room => room.id === id ? result.room : room) }))
  }

  const deleteRoomRecord = async (id: string): Promise<void> => {
    await jsonRequest<{ ok: boolean }>(`/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).filter(room => room.id !== id) }))
    if (selectedRoomId === id) setSelectedRoomId(null)
  }

  const sendRoomMessage = async (content: string): Promise<void> => {
    if (!selectedRoom) return
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}/messages`, {
      method: 'POST', body: JSON.stringify({ text: content }),
    })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(room => room.id === result.room.id ? result.room : room) }))
  }

  const retrySelectedRoom = async (): Promise<void> => {
    if (!selectedRoom) return
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}/retry`, { method: 'POST' })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(room => room.id === result.room.id ? result.room : room) }))
  }

  const renameSelectedRoom = async (name: string): Promise<void> => {
    if (!selectedRoom) return
    await renameRoomRecord(selectedRoom.id, name)
  }

  const inviteRoomMembers = async (profileIds: string[]): Promise<void> => {
    if (!selectedRoom) return
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}/members`, { method: 'POST', body: JSON.stringify({ profileIds }) })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(room => room.id === result.room.id ? result.room : room) }))
  }

  const deleteRoom = async (): Promise<void> => {
    if (!selectedRoom) return
    await deleteRoomRecord(selectedRoom.id)
    setView('create-chat')
  }

  const openCreateChat = (type: 'direct' | 'group'): void => {
    setChatType(type)
    setSelectedRoomId(null)
    setView('create-chat')
  }

  const activeMode: 'meeting' | 'direct' | 'group' | 'profiles' = view === 'profiles' || view === 'settings'
    ? 'profiles'
    : view === 'history'
      ? historyFilter
    : view === 'chat' && selectedRoom
      ? selectedRoom.type
      : view === 'create-chat'
        ? chatType
        : 'meeting'

  const switchMode = (mode: typeof activeMode): void => {
    if (mode === 'meeting') {
      setSelectedId(null)
      setView('setup')
    } else if (mode === 'profiles') {
      setView('profiles')
    } else {
      openCreateChat(mode)
    }
  }

  const modeRooms = (state.rooms ?? []).filter(room => room.type === activeMode)

  const openHistory = (): void => {
    if (activeMode !== 'profiles') setHistoryFilter(activeMode)
    setView('history')
  }

  return (
    <>
      {open ? (
        <div className="arena-backdrop" data-embedded={embedded} role="presentation" onMouseDown={event => { if (!embedded && event.target === event.currentTarget) setOpen(false) }}>
          <section className="arena-modal" role="dialog" aria-modal={!embedded} aria-label="Agent Arena">
            <header className="arena-header">
              <div className="arena-topbar">
                <div className="arena-brand">
                  <span className="arena-brand__mark">⚔</span>
                  <span className="arena-brand__text"><strong>Agent Arena</strong><span>AI 社交与多模型会议模式</span></span>
                </div>
                <div className="arena-topbar__spacer" />
                {activeCount > 0 ? <span className="arena-running-badge">● {activeCount} 场会议进行中</span> : null}
                {!embedded ? <button className="arena-exit" type="button" onClick={() => setOpen(false)}>退出 Arena</button> : null}
              </div>
              <nav className="arena-mode-nav" aria-label="Arena 模式切换">
                <button type="button" className={view !== 'history' && activeMode === 'meeting' ? 'is-active' : ''} onClick={() => switchMode('meeting')}>
                  <span>⚔️</span><strong>协作会议</strong><small>多 AI 讨论与工作</small>
                </button>
                <button type="button" className={view !== 'history' && activeMode === 'direct' ? 'is-active' : ''} onClick={() => switchMode('direct')}>
                  <span>💬</span><strong>AI 私聊</strong><small>与一个角色对话</small>
                </button>
                <button type="button" className={view !== 'history' && activeMode === 'group' ? 'is-active' : ''} onClick={() => switchMode('group')}>
                  <span>👥</span><strong>AI 群聊</strong><small>2–12 个 AI 同场</small>
                </button>
                <button type="button" className={view !== 'history' && activeMode === 'profiles' ? 'is-active' : ''} onClick={() => switchMode('profiles')}>
                  <span>🪪</span><strong>用户中心</strong><small>头像、人格与模型</small>
                </button>
                <button type="button" className={view === 'settings' ? 'is-active' : ''} onClick={() => setView('settings')}>
                  <span>⚙️</span><strong>协作设置</strong><small>限流与自动接话</small>
                </button>
                <button type="button" className={view === 'history' ? 'is-active' : ''} onClick={openHistory}>
                  <span>🗂️</span><strong>历史管理</strong><small>重命名与删除</small>
                </button>
              </nav>
              {view !== 'history' && activeMode !== 'profiles' && ((activeMode === 'meeting' && state.meetings.length > 0) || (activeMode !== 'meeting' && modeRooms.length > 0)) ? (
                <div className="arena-recent-strip">
                  <span>最近</span>
                  {activeMode === 'meeting' ? state.meetings.slice(0, 8).map(meeting => (
                    <button type="button" key={meeting.id} className={view === 'watch' && selectedId === meeting.id ? 'is-active' : ''} onClick={() => { setSelectedId(meeting.id); setView('watch') }}>
                      <i className="arena-dot" data-active={BUSY_MEETINGS.has(meeting.status)} />{meetingTitle(meeting)}
                    </button>
                  )) : modeRooms.slice(0, 8).map(room => (
                    <button type="button" key={room.id} className={view === 'chat' && selectedRoomId === room.id ? 'is-active' : ''} onClick={() => { setSelectedRoomId(room.id); setView('chat') }}>
                      <i className="arena-dot" data-active={room.status === 'responding'} />{room.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </header>
            <div className="arena-body">
              <main className="arena-main">
                {loadError ? <div className="arena-global-alert" role="alert">连接 Arena 服务失败：{loadError}</div> : null}
                {view === 'history' ? (
                  <HistoryView
                    meetings={state.meetings}
                    rooms={state.rooms ?? []}
                    filter={historyFilter}
                    onFilter={setHistoryFilter}
                    onOpenMeeting={id => { setSelectedId(id); setView('watch') }}
                    onOpenRoom={id => { setSelectedRoomId(id); setView('chat') }}
                    onRenameMeeting={renameMeetingRecord}
                    onRenameRoom={renameRoomRecord}
                    onDeleteMeeting={deleteMeetingRecord}
                    onDeleteRoom={deleteRoomRecord}
                  />
                ) : view === 'profiles' ? (
                  <ProfilesView
                    profiles={state.profiles}
                    modelCatalog={state.modelCatalog ?? []}
                    defaultModel={state.defaultModel}
                    onHumanSaved={humanSaved}
                    onAdministratorSaved={administratorSaved}
                    onAiSaved={aiSaved}
                    onAiDeleted={aiDeleted}
                    settings={state.settings}
                    onSettingsSaved={settings => setState(current => ({ ...current, settings }))}
                  />
                ) : view === 'settings' ? (
                   <CollaborationSettingsView settings={state.settings} onSaved={settings => setState(current => ({ ...current, settings }))} />
                 ) : view === 'create-chat' ? (
                  <CreateChatView profiles={state.profiles} initialType={chatType} onManageProfiles={() => setView('profiles')} onCreated={roomCreated} />
                ) : view === 'chat' && selectedRoom ? (
                  <ChatView room={selectedRoom} profiles={state.profiles} onSend={sendRoomMessage} onRetry={retrySelectedRoom} onRename={renameSelectedRoom} onInvite={inviteRoomMembers} onDelete={deleteRoom} />
                ) : view === 'setup' || !selected ? (
                  <SetupView
                    templates={state.templates.length ? state.templates : FALLBACK_TEMPLATES}
                    profiles={state.profiles}
                    onManageProfiles={() => setView('profiles')}
                    onCreated={created}
                  />
                ) : (
                  <WatchView meeting={selected} profiles={state.profiles} onAction={runAction} />
                )}
              </main>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export const inject = ['slots']

export function apply(ctx: any): void {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.dshAgentArena = ''
    style.textContent = ARENA_CSS
    document.head.append(style)
    return () => style.remove()
  }, 'agent-arena: styles')

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'agent-arena-home',
    order: 5,
  }, ArenaHomeLaunch))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'agent-arena-overlay',
    order: 50,
  }, ArenaOverlay))

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'agent-arena',
    order: 5,
    label: 'AI 协作',
  }, () => <ArenaOverlay embedded />))
}
