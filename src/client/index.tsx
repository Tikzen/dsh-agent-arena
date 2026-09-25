import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from 'react'
import { BRAND_LOGOS } from './brand-logos.generated'
import type { BrandLogoId } from './brand-logos.generated'
import { CUSTOM_BRAND_IMAGES } from './custom-brand-images'
import { ARENA_CSS } from './styles'
import { t, useArenaLocale, installArenaLocale, localeTag, systemText, errorText, templateText, ArenaRequestError, captureError, notice } from './i18n'
import type { MessageDescriptor, UiNotice } from './i18n'

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
  i18n?: MessageDescriptor
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
  approval?: ApprovalRequest
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
  workdir?: string
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
  permissions?: Record<string, string>
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

interface ApprovalRequest {
  id: string
  toolName: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  note?: string
  options?: string[]
}

interface ChatMessage {
  i18n?: MessageDescriptor
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
  approval?: ApprovalRequest
}

interface ChatRoom {
  id: string
  workdir?: string
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
  permissions?: Record<string, string>
}

interface RoleActivityEvent {
  i18n?: MessageDescriptor
  id: string
  kind: string
  text: string
  createdAt: string
}

interface RoleActivity {
  stageI18n?: MessageDescriptor
  detailI18n?: MessageDescriptor
  currentToolI18n?: MessageDescriptor
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
  history?: RoleActivityEvent[]
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

function STATUS_TEXT(): Record<string, string> { return {
  queued: t("status.queued"), running: t("status.collaborating"), pausing: t("status.pausing.after.this.message"), paused: t("status.waiting.for.a.new.message"),
  completed: t("status.waiting.for.a.new.message"), stopped: t("status.waiting.for.a.new.message"), failed: t("status.waiting.for.a.new.message"), interrupted: t("status.waiting.for.a.new.message"),
} }

function MEETING_STAGE_TEXT(): Record<MeetingStage, string> { return {
  discussion: t("meeting_stage.discussion"), planning: t("meeting_stage.planning"), execution: t("meeting_stage.parallel.execution"), review: t("meeting_stage.peer.review"),
  'waiting-human': t("meeting_stage.awaiting.your.decision"), completed: t("meeting_stage.completed"),
} }

function TASK_STATUS_TEXT(): Record<TaskStatus, string> { return {
  todo: t("task_status.not.started"), 'in-progress': t("task_status.in.progress"), review: t("task_status.awaiting.review"), done: t("meeting_stage.completed"), blocked: t("task_status.blocked"), paused: t("task_status.paused"),
} }

function meetingTitle(meeting: Meeting): string {
  return meeting.displayName?.trim() || meeting.topic
}

function LOGO_PRESETS() { return [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'qwen', label: t("logo.qwen") },
  { id: 'kimi', label: 'Kimi' },
  { id: 'grok', label: 'Grok' },
  { id: 'doubao', label: t("logo.doubao") },
  { id: 'metaai', label: 'Meta AI' },
  { id: 'mistral', label: 'Mistral' },
] as const }

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { accept: 'application/json', 'content-type': 'application/json', ...init?.headers },
  })
  const data = await response.json() as T & { error?: string; errorI18n?: MessageDescriptor }
  if (!response.ok) throw new ArenaRequestError(data.error || `HTTP ${response.status}`, data.errorI18n)
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
    return <span className={`arena-avatar arena-avatar--brand ${className}`} aria-label={t("avatar.value.s.avatar", { p0: name })}><BrandLogo id={logoId} /></span>
  }
  if (value.startsWith('data:image/')) {
    return <span className={`arena-avatar ${className}`}><img src={value} alt={t("avatar.value.s.avatar", { p0: name })} /></span>
  }
  return <span className={`arena-avatar ${className}`} aria-label={t("avatar.value.s.avatar", { p0: name })}>{value || name.slice(0, 1)}</span>
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
  if (!file.type.startsWith('image/')) throw new Error(t("avatar.please.select.an.image.file"))
  if (file.size > 12 * 1024 * 1024) throw new Error(t("avatar.the.image.must.not.exceed.12.mb"))
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error(t("avatar.unable.to.read.this.image")))
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
  if (!context) throw new Error(t("avatar.your.browser.does.not.support.avatar.processing"))
  context.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, outputSize, outputSize)
  return canvas.toDataURL('image/webp', 0.86)
}

function AvatarEditor(props: { value: string; name: string; onChange: (value: string) => void }): ReactNode {
  const { value, name, onChange } = props
  const [error, setError] = useState<UiNotice>('')
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
      setError(captureError(cause))
    }
  }

  const confirmCrop = (): void => {
    if (!cropDraft) return
    try {
      onChange(croppedAvatar(cropDraft, cropZoom, cropX, cropY))
      setCropDraft(null)
      setError('')
    } catch (cause) {
      setError(captureError(cause))
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
        <label className="arena-avatar-upload">{t("avatar.upload.and.crop")}<input type="file" accept="image/*" onChange={event => { void upload(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
        <input className="arena-input arena-emoji-input" value={value.startsWith('data:image/') || value.startsWith('logo:') ? '' : value} placeholder={t("avatar.or.enter.an.emoji")} maxLength={16} onChange={event => onChange(event.target.value)} />
        {error ? <span className="arena-inline-error">{errorText(error)}</span> : null}
      </div>
      <div className="arena-logo-library" aria-label={t("avatar.ai.brand.avatars")}>
        {LOGO_PRESETS().map(preset => (
          <button type="button" key={preset.id} title={t("avatar.use.the.official.value.brand.icon", { p0: preset.label })} onClick={() => onChange(`logo:${preset.id}`)}>
            <BrandLogo id={preset.id} /><span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
    {cropDraft ? (
      <div className="arena-crop-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCropDraft(null) }}>
        <section className="arena-crop-dialog" role="dialog" aria-modal="true" aria-label={t("avatar.crop.avatar")}>
          <div className="arena-crop-head"><div><strong>{t("avatar.crop.avatar")}</strong><span>{t("avatar.drag.the.image.to.position.it.and.scroll.to")}</span></div><button type="button" aria-label={t("avatar.close.crop.editor")} onClick={() => setCropDraft(null)}>×</button></div>
          <div className="arena-crop-stage" aria-label={t("avatar.draggable.avatar.crop.area")} onPointerDown={startCropDrag} onPointerMove={moveCropDrag} onPointerUp={stopCropDrag} onPointerCancel={stopCropDrag} onWheel={zoomCropAtPointer}>
            <img src={cropDraft.url} alt={t("avatar.image.to.crop")} style={cropStyle} />
            <div className="arena-crop-grid" aria-hidden="true"><i /><i /><i /><i /></div>
            <span className="arena-crop-drag-hint" aria-hidden="true">{t("avatar.drag.to.move.scroll.to.zoom")}</span>
          </div>
          <div className="arena-crop-sliders">
            <label><span>{t("avatar.zoom")}</span><input type="range" min="1" max="3" step="0.01" value={cropZoom} onChange={event => setCropZoom(Number(event.target.value))} /></label>
            <label><span>{t("avatar.horizontal.position")}</span><input type="range" min="-100" max="100" step="1" value={cropX} onChange={event => setCropX(Number(event.target.value))} /></label>
            <label><span>{t("avatar.vertical.position")}</span><input type="range" min="-100" max="100" step="1" value={cropY} onChange={event => setCropY(Number(event.target.value))} /></label>
          </div>
          <div className="arena-crop-actions"><button className="arena-control" type="button" onClick={() => setCropDraft(null)}>{t("avatar.cancel")}</button><button className="arena-launch" type="button" onClick={confirmCrop}>{t("avatar.use.cropped.image")}</button></div>
        </section>
      </div>
    ) : null}
    </>
  )
}

export function ArenaHomeLaunch(): ReactNode {
  useArenaLocale()
  return (
    <div className="arena-home-launch">
      <button className="arena-home-launch__inner" type="button" onClick={openArena}>
        <span className="arena-home-launch__icon">⚔️</span>
        <span className="arena-home-launch__copy">
          <span className="arena-home-launch__title">{t("home.enter.ai.collaboration")}</span>
          <span className="arena-home-launch__hint">{t("home.ongoing.multi.ai.discussion.and.work.tasks.decisions.and")}</span>
        </span>
        <span className="arena-home-launch__arrow">→</span>
      </button>
    </div>
  )
}

function WorkingDots(): ReactNode {
  return <span className="arena-working" aria-label={t("activity.thinking")}><i /><i /><i /></span>
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
  const [error, setError] = useState<UiNotice>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, UiNotice>>({})

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
      setError(notice("meeting.a.meeting.can.start.with.up.to.4.ai"))
      setFieldErrors(current => ({ ...current, participants: notice("meeting.the.limit.is.4.remove.a.participant.before.adding") }))
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
    const nextErrors: Record<string, UiNotice> = {}
    if (topic.trim().length < 2) nextErrors.topic = notice("meeting.please.enter.a.meeting.topic.with.at.least.2")
    if (participants.length < 2) nextErrors.participants = notice("meeting.select.value.more.participants.from.the.ai.user.library", { p0: 2 - participants.length })
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
      setError(captureError(cause))
    } finally {
      setSubmitting(false)
    }
  }

  const validationMessage = error || Object.values(fieldErrors).find(Boolean) || ''
  const selectionHint = participants.length < 2
    ? t("meeting.select.value.more.ai.users.to.start.the.meeting", { p0: 2 - participants.length })
    : t("meeting.value.ai.users.selected.each.will.use.the.model", { p0: participants.length })

  return (
    <div className="arena-setup">
      <div className="arena-page-scroll">
      <div className="arena-kicker">Agent Arena</div>
      <h2>{t("meeting.create.an.ai.collaboration.group")}</h2>
      <p className="arena-lead">{t("meeting.discuss.and.work.together.in.an.ongoing.group.chat")}</p>
      {validationMessage ? <div className="arena-page-alert" role="alert">{t("meeting.unable.to.start.meeting")}{errorText(validationMessage)}</div> : null}

      <label className={`arena-field ${fieldErrors.topic ? 'has-error' : ''}`}>
        <span>{t("meeting.what.should.they.discuss")}</span>
        <textarea
          className="arena-textarea"
          value={topic}
          aria-invalid={Boolean(fieldErrors.topic)}
          onChange={event => { setTopic(event.target.value); setFieldErrors(current => ({ ...current, topic: '' })); setError('') }}
          placeholder={t("meeting.for.example.how.can.this.multi.ai.meeting.plugin")}
          maxLength={2000}
          autoFocus
        />
        {fieldErrors.topic ? <span className="arena-field-error">{errorText(fieldErrors.topic)}</span> : null}
      </label>

      <span className="arena-section-title">{t("meeting.meeting.format")}</span>
      <div className="arena-template-grid">
        {templates.map(template => (
          <button
            type="button"
            key={template.id}
            className={`arena-template ${template.id === templateId ? 'is-active' : ''}`}
            onClick={() => selectTemplate(template)}
          >
            <strong>{templateText(template, 'name')}</strong>
            <span>{templateText(template, 'description')}</span>
          </button>
        ))}
      </div>

      <div className="arena-saved-head">
        <span className="arena-section-title">{t("counts.selectedParticipants", { count: participants.length })}</span>
        <button type="button" onClick={onManageProfiles}>{t("meeting.manage.create.users")}</button>
      </div>
      <p className="arena-selection-help">{t("meeting.choose.users.directly.each.ai.uses.the.provider.and")}</p>
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
        <button className="arena-empty-users" type="button" onClick={onManageProfiles}>{t("meeting.no.ai.users.yet.create.at.least.2.first")}</button>
      )}

      <div className="arena-setup-row arena-setup-row--single">
        <div>
          <span className="arena-section-title">{t("meeting.meeting.participants")}</span>
          {fieldErrors.participants ? <span className="arena-field-error">{errorText(fieldErrors.participants)}</span> : null}
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
                  <button type="button" aria-label={t("meeting.remove.value", { p0: participant.name })} onClick={() => { setParticipants(items => items.filter(item => item.profileId !== participant.profileId)); setError(''); setFieldErrors(current => ({ ...current, participants: '' })) }}>×</button>
                </div>
              ))}
            </div>
          ) : <button className="arena-empty-users" type="button" onClick={onManageProfiles}>{t("meeting.choose.ai.users.above.or.create.some.first")}</button>}
        </div>
      </div>
      </div>

      <div className="arena-action-dock">
        <span className="arena-action-dock__message" data-error={Boolean(validationMessage) || participants.length < 2}>{errorText(validationMessage || selectionHint)}</span>
        <button className="arena-launch" type="button" disabled={submitting} onClick={() => void launch()}>
          {submitting ? <><WorkingDots /> {t("meeting.gathering.participants")}</> : <>{t("meeting.start.meeting")}</>}
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
  const [human, setHuman] = useState<UserProfile>(profiles?.human ?? { id: 'human', name: t("users.you"), avatar: '🧑' })
  const [administrator, setAdministrator] = useState<UserProfile>(profiles?.administrator ?? {
    id: 'administrator', name: t("users.administrator"), avatar: '🛡️',
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
  const [message, setMessage] = useState<UiNotice>('')
  const [profileErrors, setProfileErrors] = useState<Record<string, UiNotice>>({})
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
      setProfileErrors(current => ({ ...current, humanName: notice("users.please.enter.your.display.name") }))
      setMessage(notice("users.please.complete.the.required.fields.highlighted.in.red"))
      return
    }
    setSavingHuman(true)
    setMessage('')
    setProfileErrors(current => ({ ...current, humanName: '', form: '' }))
    try {
      const result = await jsonRequest<{ profile: UserProfile }>('/profiles/human', { method: 'POST', body: JSON.stringify(human) })
      setHuman(result.profile)
      onHumanSaved(result.profile)
      setMessage(notice("users.your.profile.has.been.saved"))
    } catch (cause) {
      const detail = captureError(cause)
      setProfileErrors(current => ({ ...current, form: detail }))
      setMessage(detail)
    } finally { setSavingHuman(false) }
  }

  const saveAdministrator = async (): Promise<void> => {
    const nextErrors: Record<string, UiNotice> = {}
    if (!administrator.name.trim()) nextErrors.administratorName = notice("users.please.enter.the.administrator.s.display.name")
    if (!administrator.provider) nextErrors.administratorProvider = notice("users.please.choose.a.provider.for.the.administrator")
    if (!administrator.model) nextErrors.administratorModel = notice("users.please.choose.a.model.for.the.administrator")
    if (Object.keys(nextErrors).length) {
      setProfileErrors(current => ({ ...current, ...nextErrors }))
      setMessage(notice("users.the.administrator.configuration.is.incomplete"))
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
      setMessage(notice("users.administrator.saved.it.will.automatically.join.new.meetings.and"))
    } catch (cause) {
      const detail = captureError(cause)
      setProfileErrors(current => ({ ...current, form: detail }))
      setMessage(detail)
    } finally { setSavingAdministrator(false) }
  }

  const saveAi = async (): Promise<void> => {
    const nextErrors: Record<string, UiNotice> = {}
    if (!draft.name.trim()) nextErrors.name = notice("users.please.enter.a.display.name.for.this.ai")
    if (!draft.provider) nextErrors.provider = modelCatalog.length ? notice("users.please.choose.a.provider") : notice("users.no.providers.are.available.in.dsh.configure.a.model")
    if (!draft.model) nextErrors.model = modelCatalog.length ? notice("users.please.choose.a.model") : notice("users.configure.a.provider.before.choosing.a.model")
    if (Object.keys(nextErrors).length) {
      setProfileErrors(nextErrors)
      setMessage(notice("users.the.ai.user.cannot.be.created.yet.complete.the"))
      return
    }
    setSavingAi(true)
    setMessage('')
    setProfileErrors({})
    try {
      const result = await jsonRequest<{ profile: UserProfile }>('/profiles/ai', { method: 'POST', body: JSON.stringify(draft) })
      onAiSaved(result.profile)
      resetDraft()
      setMessage(notice("users.value.has.been.saved.to.the.ai.user.library", { p0: result.profile.name }))
    } catch (cause) {
      const detail = captureError(cause)
      setProfileErrors({ form: detail })
      setMessage(detail)
    } finally { setSavingAi(false) }
  }

  const deleteAi = async (profile: UserProfile): Promise<void> => {
    if (!window.confirm(t("users.delete.ai.user.value.existing.meeting.records.will.not", { p0: profile.name }))) return
    try {
      await jsonRequest<{ ok: boolean }>(`/profiles/ai/${encodeURIComponent(profile.id)}`, { method: 'DELETE' })
      onAiDeleted(profile.id)
      if (draft.id === profile.id) resetDraft()
    } catch (cause) {
      setMessage(captureError(cause))
    }
  }

  return (
    <div className="arena-profiles">
      <div className="arena-page-scroll">
      <div className="arena-kicker">{t("users.users.and.avatars")}</div>
      <h2>{t("users.users.and.avatars")}</h2>
      <p className="arena-lead">{t("users.an.ai.user.is.a.reusable.character.profile.containing")}</p>
      {message ? <div className={`arena-page-alert ${Object.values(profileErrors).some(Boolean) ? '' : 'is-success'}`} role="status">{errorText(message)}</div> : null}

      <section className="arena-profile-section">
        <div className="arena-profile-section__title"><strong>{t("users.my.human.profile")}</strong><span>{t("users.your.messages.will.use.this.name.and.avatar")}</span></div>
        <div className="arena-human-editor">
          <AvatarEditor value={human.avatar} name={human.name} onChange={avatar => setHuman(current => ({ ...current, avatar }))} />
          <label className={`arena-field ${profileErrors.humanName ? 'has-error' : ''}`}><span>{t("users.display.name")} <b>{t("users.required")}</b></span><input className="arena-input" aria-invalid={Boolean(profileErrors.humanName)} value={human.name} maxLength={24} onChange={event => { setHuman(current => ({ ...current, name: event.target.value })); setProfileErrors(current => ({ ...current, humanName: '' })); setMessage('') }} />{profileErrors.humanName ? <small className="arena-field-error">{errorText(profileErrors.humanName)}</small> : null}</label>
          <button className="arena-control" type="button" disabled={savingHuman} onClick={() => void saveHuman()}>{savingHuman ? t("users.saving") : t("users.save.my.profile")}</button>
        </div>
      </section>

      <section className="arena-profile-section">
        <div className="arena-profile-section__title"><strong>{t("users.group.administrator")}</strong><span>{t("users.automatically.joins.new.meetings.and.group.chats.mention.it")}</span></div>
        <div className="arena-admin-editor">
          <AvatarEditor value={administrator.avatar} name={administrator.name} onChange={avatar => setAdministrator(current => ({ ...current, avatar }))} />
          <div className="arena-ai-form">
            <label className={`arena-field ${profileErrors.administratorName ? 'has-error' : ''}`}><span>{t("users.display.name")} <b>{t("users.required")}</b></span><input className="arena-input" value={administrator.name} maxLength={24} onChange={event => { setAdministrator(current => ({ ...current, name: event.target.value })); setProfileErrors(current => ({ ...current, administratorName: '' })) }} /></label>
            <label className="arena-field"><span>{t("users.administrator.responsibilities")}</span><textarea className="arena-textarea" value={administrator.role ?? ''} maxLength={16000} onChange={event => setAdministrator(current => ({ ...current, role: event.target.value }))} /></label>
            <label className="arena-toggle arena-toggle--admin"><input type="checkbox" checked={preferences.autoReplyEnabled} onChange={event => setPreferences(current => ({ ...current, autoReplyEnabled: event.target.checked }))} /><span><strong>{t("users.automatic.follow.up.replies")}</strong><small>{t("users.when.enabled.the.original.allocation.flow.is.used.ai")}<br />{t("users.turning.this.off.stops.automatic.ai.to.ai.follow")}</small></span></label>

            <div className="arena-model-picker">
              <label className={`arena-field ${profileErrors.administratorProvider ? 'has-error' : ''}`}><span>{t("users.provider")} <b>{t("users.required")}</b></span><select className="arena-select" value={administrator.provider ?? ''} onChange={event => {
                const provider = event.target.value
                const model = modelCatalog.find(item => item.id === provider)?.models[0]?.id || ''
                setAdministrator(current => ({ ...current, provider, model }))
                setProfileErrors(current => ({ ...current, administratorProvider: '', administratorModel: '' }))
              }}>{modelCatalog.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
              <label className={`arena-field ${profileErrors.administratorModel ? 'has-error' : ''}`}><span>{t("users.model")} <b>{t("users.required")}</b></span><select className="arena-select" value={administrator.model ?? ''} onChange={event => { setAdministrator(current => ({ ...current, model: event.target.value })); setProfileErrors(current => ({ ...current, administratorModel: '' })) }}>{(administratorProviderEntry?.models ?? []).map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label>
              <button className="arena-control arena-admin-save" type="button" disabled={savingAdministrator} onClick={() => void saveAdministrator()}>{savingAdministrator ? t("users.saving") : t("users.save.administrator")}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="arena-profile-section">
        <div className="arena-profile-section__title"><strong>{t("users.ai.user.library")}</strong><span>{t("users.select.an.existing.user.to.edit.it.then.choose")}</span></div>
        <div className="arena-ai-library">
          {profiles?.aiUsers.map(profile => (
            <div className={`arena-ai-card ${draft.id === profile.id ? 'is-active' : ''}`} key={profile.id}>
              <button type="button" onClick={() => { setDraft({ ...profile }); setProfileErrors({}); setMessage('') }}>
                <Avatar value={profile.avatar} name={profile.name} className="arena-avatar--medium" />
                <span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span>
              </button>
              <button className="arena-ai-delete" type="button" aria-label={t("users.delete.value", { p0: profile.name })} onClick={() => void deleteAi(profile)}>×</button>
            </div>
          ))}
          <button className="arena-ai-add" type="button" onClick={resetDraft}>{t("users.create.ai.user")}</button>
        </div>

        <div className="arena-ai-editor">
          <AvatarEditor value={draft.avatar} name={draft.name || 'AI'} onChange={avatar => setDraft(current => ({ ...current, avatar }))} />
          <div className="arena-ai-form">
            <label className={`arena-field ${profileErrors.name ? 'has-error' : ''}`}><span>{t("users.display.name")} <b>{t("users.required")}</b></span><input className="arena-input" aria-invalid={Boolean(profileErrors.name)} value={draft.name} maxLength={24} placeholder={t("users.for.example.a.blunt.product.manager")} onChange={event => { setDraft(current => ({ ...current, name: event.target.value })); setProfileErrors(current => ({ ...current, name: '' })); setMessage('') }} />{profileErrors.name ? <small className="arena-field-error">{errorText(profileErrors.name)}</small> : null}</label>
            <label className="arena-field"><span>{t("users.custom.persona")} <em>{t("users.optional.up.to.16.000.characters")}</em></span><textarea className="arena-textarea" value={draft.role ?? ''} maxLength={16000} placeholder={t("users.optional.persona.cards.with.user.and.char.placeholders.are")} onChange={event => { setDraft(current => ({ ...current, role: event.target.value })); setMessage('') }} /></label>
             <label className="arena-field"><span>{t("users.quick.conversation.starters.one.per.line.up.to.8")}</span><textarea className="arena-textarea arena-preset-textarea" value={(draft.presetPrompts ?? []).join('\n')} placeholder={t("users.help.me.analyze.this.idea.roast.it.in.your")} onChange={event => setDraft(current => ({ ...current, presetPrompts: event.target.value.split('\n').slice(0, 8) }))} /></label>
            <label className="arena-toggle arena-toggle--ai-reply"><input type="checkbox" checked={draft.autoReplyDisabled === true} onChange={event => setDraft(current => ({ ...current, autoReplyDisabled: event.target.checked }))} /><span><strong>{t("users.disable.this.ai.s.independent.follow.up.check")}</strong><small>{t("users.this.ai.can.still.reply.automatically.but.the.administrator")}<br />{t("users.disabling.this.check.can.save.tokens")}</small></span></label>
            <div className="arena-model-picker">
              <label className={`arena-field ${profileErrors.provider ? 'has-error' : ''}`}>
                <span>{t("users.provider")} <b>{t("users.required")}</b></span>
                <select className="arena-select" value={draft.provider ?? ''} onChange={event => {
                  const provider = event.target.value
                  const firstModel = modelCatalog.find(item => item.id === provider)?.models[0]?.id || ''
                  setDraft(current => ({ ...current, provider, model: firstModel }))
                  setProfileErrors(current => ({ ...current, provider: '', model: '' }))
                  setMessage('')
                }}>
                  {!modelCatalog.length ? <option value="">{t("users.no.providers.available")}</option> : null}
                  {modelCatalog.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                </select>
                {profileErrors.provider ? <small className="arena-field-error">{errorText(profileErrors.provider)}</small> : null}
              </label>
              <label className={`arena-field ${profileErrors.model ? 'has-error' : ''}`}>
                <span>{t("users.model")} <b>{t("users.required")}</b></span>
                <select className="arena-select" value={draft.model ?? ''} onChange={event => { setDraft(current => ({ ...current, model: event.target.value })); setProfileErrors(current => ({ ...current, model: '' })); setMessage('') }}>
                  {!providerEntry?.models.length ? <option value="">{t("users.no.models.available")}</option> : null}
                  {(providerEntry?.models ?? []).map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
                {profileErrors.model ? <small className="arena-field-error">{errorText(profileErrors.model)}</small> : null}
              </label>
              <label className="arena-color-field"><span>{t("users.accent.color")}</span><input type="color" value={draft.color ?? '#6f5ee8'} onChange={event => setDraft(current => ({ ...current, color: event.target.value }))} /></label>
            </div>
            {!modelCatalog.length ? <div className="arena-error">{t("users.dsh.has.not.reported.any.enabled.model.providers.configure")}</div> : null}
          </div>
        </div>
      </section>
      </div>
      <div className="arena-action-dock">
        <span className="arena-action-dock__message" data-error={Object.values(profileErrors).some(Boolean)}>{errorText(Object.values(profileErrors).some(Boolean) ? (profileErrors.form || message || t("users.complete.the.required.fields.highlighted.in.red")) : (message || (draft.id ? t("users.editing.value", { p0: draft.name || t("users.this.ai.user") }) : t("users.enter.a.name.provider.and.model.to.create.the"))))}</span>
        <button className="arena-launch" type="button" disabled={savingAi} onClick={() => void saveAi()}>{savingAi ? t("users.saving") : draft.id ? t("users.save.ai.user.changes") : t("users.create.ai.user.2")}</button>
      </div>
    </div>
  )
}

function CollaborationSettingsView(props: { settings?: ArenaSettings; onSaved: (settings: ArenaSettings) => void }): ReactNode {
  const [settings, setSettings] = useState<ArenaSettings>(props.settings ?? { ...DEFAULT_ARENA_SETTINGS })
  const [statusDraft, setStatusDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<UiNotice>('')
  useEffect(() => {
    if (props.settings) setSettings(props.settings)
  }, [props.settings?.rateLimitCooldownEnabled, props.settings?.channelQueueEnabled, props.settings?.channelRequestsPerMinute, props.settings?.cooldownErrorStatuses?.join(','), props.settings?.autoReplyEnabled])
  const addStatus = (): void => {
    const status = Number(statusDraft)
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      setMessage(notice("settings.enter.an.http.status.code.between.100.and.599"))
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
      setSettings(result.settings); props.onSaved(result.settings); setMessage(notice("settings.collaboration.settings.saved"))
    } catch (cause) { setMessage(captureError(cause)) }
    finally { setSaving(false) }
  }
  return <div className="arena-profiles"><div className="arena-page-scroll"><div className="arena-kicker">{t("settings.collaboration.settings")}</div><h2>{t("settings.collaboration.settings")}</h2><p className="arena-lead">{t("settings.configure.shared.channel.protection.for.all.model.requests.in")}</p>{message ? <div className="arena-page-alert is-success" role="status">{errorText(message)}</div> : null}
    <section className="arena-profile-section"><div className="arena-profile-section__title"><strong>{t("settings.channel.protection")}</strong><span>{t("settings.shared.by.provider.configuration")}</span></div>
      <label className="arena-toggle"><input type="checkbox" checked={settings.rateLimitCooldownEnabled} onChange={event => setSettings(current => ({ ...current, rateLimitCooldownEnabled: event.target.checked }))} /><span><strong>{t("settings.rate.limit.cooldown")}</strong><small>{t("settings.when.a.provider.configuration.hits.a.rate.limit.all")}</small></span></label>
      <div className="arena-setting-control">
        <div><strong>{t("settings.status.codes.that.trigger.cooldown")}</strong><small>{t("settings.defaults.429.and.500.removing.a.code.means.that")}</small></div>
        <div className="arena-status-editor">
          <div className="arena-status-chips">{settings.cooldownErrorStatuses.length ? settings.cooldownErrorStatuses.map(status => <span key={status}>{status}<button type="button" aria-label={t("settings.remove.status.code.value", { p0: status })} onClick={() => setSettings(current => ({ ...current, cooldownErrorStatuses: current.cooldownErrorStatuses.filter(item => item !== status) }))}>×</button></span>) : <em>{t("settings.no.status.codes.configured")}</em>}</div>
          <div className="arena-status-add"><input className="arena-input" type="number" min={100} max={599} placeholder={t("settings.for.example.503")} value={statusDraft} onChange={event => setStatusDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addStatus() } }} /><button className="arena-control" type="button" onClick={addStatus}>{t("settings.add")}</button></div>
        </div>
      </div>
      <label className="arena-toggle"><input type="checkbox" checked={settings.channelQueueEnabled} onChange={event => setSettings(current => ({ ...current, channelQueueEnabled: event.target.checked }))} /><span><strong>{t("settings.shared.channel.request.queue")}</strong><small>{t("settings.replies.tool.continuations.subagents.and.follow.up.checks.using")}</small></span></label>
      <label className="arena-setting-control arena-setting-control--inline"><span><strong>{t("settings.requests.allowed.per.minute")}</strong><small>{t("settings.applies.to.each.shared.provider.queue.enter.1.10")}</small></span><input className="arena-input" type="number" min={1} max={10000} value={settings.channelRequestsPerMinute} onChange={event => setSettings(current => ({ ...current, channelRequestsPerMinute: Number(event.target.value) }))} /></label>
      <details className="arena-setting-help"><summary>{t("settings.why.group.by.provider.configuration")}</summary><p>{t("settings.arena.does.not.read.or.store.api.keys.from")}</p></details>
    </section>
    <section className="arena-profile-section"><div className="arena-profile-section__title"><strong>{t("settings.note")}</strong><span>{t("settings.automatic.reply.settings.are.in.users.group.administrator")}</span></div>



    </section><button className="arena-launch" type="button" disabled={saving} onClick={() => void save()}>{saving ? t("users.saving") : t("settings.save.collaboration.settings")}</button>
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
  const [error, setError] = useState<UiNotice>('')

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
      setError(type === 'direct' ? notice("chat.please.select.1.ai.user") : notice("chat.select.2.12.ai.users.for.a.group.chat"))
      return
    }
    setBusy(true)
    try {
      const result = await jsonRequest<{ room: ChatRoom }>('/rooms', {
        method: 'POST', body: JSON.stringify({ type, name, profileIds: selected }),
      })
      onCreated(result.room)
    } catch (cause) {
      setError(captureError(cause))
    } finally { setBusy(false) }
  }

  return (
    <div className="arena-chat-create">
      <div className="arena-page-scroll">
      <div className="arena-kicker">{t("chat.socialChat")}</div>
      <h2>{type === 'direct' ? t("chat.start.a.direct.chat") : t("chat.create.group.chat")}</h2>
      <p className="arena-lead">{t("chat.choose.people.from.the.ai.user.library.group.chats")}</p>
      {error ? <div className="arena-page-alert" role="alert">{errorText(error)}</div> : null}
      <div className="arena-chat-type-tabs">
        <button className={type === 'direct' ? 'is-active' : ''} type="button" onClick={() => { setType('direct'); setSelected([]); setError('') }}>{t("chat.direct.chat")}</button>
        <button className={type === 'group' ? 'is-active' : ''} type="button" onClick={() => { setType('group'); setSelected([]); setError('') }}>{t("chat.multi.ai.group.chat")}</button>
      </div>
      {type === 'group' ? (
        <label className="arena-field"><span>{t("chat.group.name.optional")}</span><input className="arena-input" value={name} maxLength={60} placeholder={t("chat.for.example.friday.brainstorming")} onChange={event => setName(event.target.value)} /></label>
      ) : null}
      <span className={`arena-section-title ${error ? 'has-error' : ''}`}>{t("counts.selectedUsers", { count: `${selected.length}/${type === 'direct' ? 1 : 12}` })}</span>
      {profiles?.aiUsers.length ? (
        <div className="arena-chat-user-grid">
          {profiles.aiUsers.map(profile => (
            <button type="button" key={profile.id} className={`arena-chat-user ${selected.includes(profile.id) ? 'is-active' : ''}`} onClick={() => toggle(profile.id)}>
              <Avatar value={profile.avatar} name={profile.name} className="arena-avatar--medium" />
              <span><strong>{profile.name}</strong><small>{profile.role || t("chat.general.assistant.no.custom.persona")}</small><em>{profile.provider}/{profile.model}</em></span>
              <i>{selected.includes(profile.id) ? '✓' : '+'}</i>
            </button>
          ))}
        </div>
      ) : (
        <button className="arena-empty-users" type="button" onClick={onManageProfiles}>{t("chat.create.an.ai.user.first")}</button>
      )}
      </div>
      <div className="arena-action-dock">
        <span className="arena-action-dock__message" data-error={Boolean(error)}>{error || (type === 'direct' ? t("chat.select.1.ai.user.to.start.a.direct.chat") : t("chat.select.2.12.ai.users.to.create.a.group"))}</span>
        <button className="arena-launch" type="button" disabled={busy} onClick={() => void create()}>{busy ? t("chat.creating") : type === 'direct' ? t("chat.start.direct.chat") : t("chat.create.group.chat")}</button>
      </div>
    </div>
  )
}

function ROLE_ACTIVITY_TEXT(): Record<string, string> { return {
  idle: t("role_activity.idle"), acknowledging: t("role_activity.acknowledging"), thinking: t("activity.thinking"), working: t("role_activity.working"), tool: t("role_activity.using.tools"),
  editing: t("role_activity.editing.files"), testing: t("role_activity.testing"), researching: t("role_activity.researching"), delegating: t("role_activity.delegating.to.subagents"), waiting: t("role_activity.waiting.for.collaboration"),
  error: t("role_activity.error"), muted: t("role_activity.muted"),
} }

const ACTIVE_ROLE_ACTIVITY = new Set(['acknowledging', 'thinking', 'working', 'tool', 'editing', 'testing', 'researching', 'delegating', 'waiting'])

function compactFilePath(value: string): string {
  const parts = value.replaceAll('\\', '/').split('/').filter(Boolean)
  return parts.length > 3 ? `…/${parts.slice(-3).join('/')}` : value
}

function activityTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function RoleMonitor(props: { monitor?: ActivityMonitor; permissions?: Record<string, string>; onPermission?: (profileId: string, mode: string) => Promise<void> }): ReactNode {
  const { permissions, onPermission } = props
  const roles = props.monitor?.roles ?? []
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [historyRole, setHistoryRole] = useState<RoleActivity | null>(null)
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string>>({})
  const [permissionBusy, setPermissionBusy] = useState<Record<string, boolean>>({})
  const [permissionErrors, setPermissionErrors] = useState<Record<string, UiNotice>>({})

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

  useEffect(() => {
    setPermissionDrafts(current => {
      const next = { ...current }
      let changed = false
      for (const [profileId, mode] of Object.entries(current)) {
        if (permissions?.[profileId] !== mode) continue
        delete next[profileId]
        changed = true
      }
      return changed ? next : current
    })
  }, [permissions])

  const changePermission = async (profileId: string, mode: string): Promise<void> => {
    if (!onPermission) return
    setPermissionDrafts(current => ({ ...current, [profileId]: mode }))
    setPermissionBusy(current => ({ ...current, [profileId]: true }))
    setPermissionErrors(current => ({ ...current, [profileId]: '' }))
    try {
      await onPermission(profileId, mode)
    } catch (cause) {
      setPermissionDrafts(current => { const next = { ...current }; delete next[profileId]; return next })
      setPermissionErrors(current => ({ ...current, [profileId]: captureError(cause) }))
    } finally {
      setPermissionBusy(current => ({ ...current, [profileId]: false }))
    }
  }

  const activeCount = roles.filter(role => ACTIVE_ROLE_ACTIVITY.has(role.status)).length
  const errorCount = roles.filter(role => role.status === 'error').length

  return (
    <section className="arena-role-monitor">
      <div className="arena-role-monitor__head">
        <div><h3>{t("activity.role.activity")}</h3><p>{t("activity.live.collaboration.board.visible.to.other.roles")}</p></div>
        <span data-active={activeCount > 0} data-error={errorCount > 0}>{errorCount ? t("activity.value.errors", { p0: errorCount }) : activeCount ? t("activity.value.working", { p0: activeCount }) : t("activity.all.idle")}</span>
      </div>
      <div className="arena-role-monitor__list">
        {roles.map(role => {
          const isOpen = expanded[role.profileId] ?? false
          return (
            <article className="arena-role-activity" data-status={role.status} key={role.profileId}>
              <div className="arena-role-activity__row">
                <button className="arena-role-activity__toggle" type="button" aria-expanded={isOpen} onClick={() => setExpanded(current => ({ ...current, [role.profileId]: !isOpen }))}>
                  <Avatar value={role.avatar} name={role.name} />
                  <span><strong>{role.name}</strong><small>{systemText(role.stage, role.stageI18n) || ROLE_ACTIVITY_TEXT()[role.status] || role.status}</small></span>
                  <i className="arena-role-activity__status"><b />{ROLE_ACTIVITY_TEXT()[role.status] || role.status}</i>
                  <em>{isOpen ? '−' : '+'}</em>
                </button>
                {onPermission ? <div className="arena-role-activity__permission-wrap"><select className="arena-role-activity__permission" aria-label={t("activity.value.s.agent.permissions", { p0: role.name })} disabled={permissionBusy[role.profileId] === true} value={permissionDrafts[role.profileId] ?? permissions?.[role.profileId] ?? 'danger-full-access'} onChange={event => void changePermission(role.profileId, event.target.value)}><option value="read-only">{t("permissions.readOnly")}</option><option value="workspace-write">{t("permissions.workspaceWrite")}</option><option value="danger-full-access">{t("permissions.fullAccess")}</option></select>{permissionBusy[role.profileId] ? <small>{t("users.saving")}</small> : permissionErrors[role.profileId] ? <small className="is-error" title={errorText(permissionErrors[role.profileId])}>{t("activity.save.failed")}</small> : null}</div> : null}
              </div>
              {isOpen ? (
                <div className="arena-role-activity__body">
                  {role.detail ? <p>{role.detailI18n ? systemText(role.detail, role.detailI18n) : role.detail}</p> : <p className="is-muted">{t("activity.no.further.details")}</p>}
                  {role.currentTool ? <div className="arena-role-tool"><span>{t("activity.current.tool")}</span><code>{systemText(role.currentTool, role.currentToolI18n)}</code></div> : null}
                  {role.claimedFiles.length ? <div className="arena-role-files"><span>{t("activity.locked.files")}</span>{role.claimedFiles.map(file => <code key={file} title={file}>🔒 {compactFilePath(file)}</code>)}</div> : null}
                  {role.recent.length ? <div className="arena-role-events"><span>{t("activity.recent.actions")}</span>{[...role.recent].reverse().slice(0, 6).map(event => <div data-kind={event.kind} key={event.id}><i /><p>{systemText(event.text, event.i18n)}</p><time>{activityTime(event.createdAt)}</time></div>)}</div> : null}
                  <button className="arena-role-history-button" type="button" onClick={() => setHistoryRole(role)}>{t("activity.view.action.history")}{role.history?.length ? `（${role.history.length}）` : ''}</button>
                  <div className="arena-role-updated">{t("activity.last.updated")} {activityTime(role.updatedAt)}</div>
                </div>
              ) : null}
            </article>
          )
        })}
        {!roles.length ? <div className="arena-role-monitor__empty">{t("activity.no.role.activity.yet")}</div> : null}
      </div>
      <div className="arena-role-monitor__note">{t("activity.file.edits.use.per.role.locks.conflicting.edits.are")}</div>
      {historyRole ? <div className="arena-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setHistoryRole(null) }}>
        <section className="arena-dialog arena-role-history-dialog" role="dialog" aria-modal="true" aria-label={t("activity.value.s.action.history", { p0: historyRole.name })}>
          <header><div><strong>{historyRole.name} {t("activity.action.history")}</strong><span>{t("activity.earlier.actions.are.retained.instead.of.being.replaced.by")}</span></div><button type="button" onClick={() => setHistoryRole(null)}>×</button></header>
          <div className="arena-role-history-list">{[...(historyRole.history ?? historyRole.recent)].reverse().map(event => <div data-kind={event.kind} key={event.id}><i /><p>{systemText(event.text, event.i18n)}</p><time>{activityTime(event.createdAt)}</time></div>)}{!(historyRole.history ?? historyRole.recent).length ? <p className="is-muted">{t("activity.no.recorded.actions")}</p> : null}</div>
        </section>
      </div> : null}
    </section>
  )
}

function ApprovalCard(props: { approval?: ApprovalRequest; onResolve: (outcome: 'allowed-once' | 'rejected', note?: string) => Promise<void> }): ReactNode {
  const { approval, onResolve } = props
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  if (!approval) return null
  const pending = approval.status === 'pending'
  const resolve = async (outcome: 'allowed-once' | 'rejected', withNote = false): Promise<void> => {
    setBusy(true)
    try { await onResolve(outcome, withNote ? note.trim() : undefined) } finally { setBusy(false) }
  }
  return <div className="arena-approval-card" data-status={approval.status}>
    <div className="arena-approval-card__title">{t("approval.permission.review")} {pending ? t("approval.awaiting.your.decision") : `· ${approval.status === 'approved' ? t("approval.allowed.once") : approval.status === 'rejected' ? t("approval.rejected") : t("approval.canceled")}`}</div>
    {pending ? <>
      <div className="arena-approval-card__actions"><button type="button" disabled={busy} onClick={() => void resolve('allowed-once')}>{t("approval.allow.once")}</button><button type="button" disabled={busy} onClick={() => void resolve('rejected')}>{t("approval.reject")}</button></div>
      <div className="arena-approval-card__manual"><input className="arena-input" value={note} maxLength={2000} placeholder={t("approval.optionally.enter.a.note.or.execution.requirements")} onChange={event => setNote(event.target.value)} /><button type="button" disabled={busy || !note.trim()} onClick={() => void resolve('allowed-once', true)}>{t("approval.allow.with.a.note")}</button></div>
    </> : approval.note ? <p>{approval.note}</p> : null}
  </div>
}

function WorkdirSettings({ value = '', onSave }: { value?: string; onSave: (workdir: string) => Promise<string> }): ReactNode {
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<UiNotice>('')
  const [savedValue, setSavedValue] = useState<string | null>(null)
  const inFlight = useRef(false)

  useEffect(() => { setDraft(value); setError('') }, [value])

  const save = async (): Promise<void> => {
    if (inFlight.current || draft.trim() === value) return
    inFlight.current = true
    setSaving(true)
    setError('')
    setSavedValue(null)
    try {
      const persistedValue = await onSave(draft.trim())
      setSavedValue(persistedValue)
    } catch (cause) {
      setError(captureError(cause))
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return <div className="arena-workdir-settings">
    <label className="arena-field"><span>{t("workspace.working.directory")}</span>
      <input className="arena-input" aria-label={t("workspace.working.directory")} value={draft} disabled={saving} placeholder={t("workspace.leave.blank.to.use.the.startup.directory")}
        onChange={event => { setDraft(event.target.value); setSavedValue(null); setError('') }}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void save() } }} />
    </label>
    <div className="arena-workdir-actions">
      <button className="arena-control arena-control--primary" type="button" disabled={saving || draft.trim() === value} onClick={() => void save()}>{saving ? t("users.saving") : t("workspace.save.working.directory")}</button>
      {savedValue !== null && savedValue === value ? <span role="status">{t("workspace.saved")}</span> : null}
    </div>
    <small className="arena-field-hint">{t("workspace.use.an.existing.absolute.directory.changes.apply.to.the")}</small>
    {error ? <div className="arena-error" role="alert">{errorText(error)}</div> : null}
  </div>
}

function ChatView(props: {
  room: ChatRoom
  profiles?: ArenaState['profiles']
  onSend: (text: string) => Promise<void>
  onRetry: () => Promise<void>
  onRename: (name: string) => Promise<void>
  onSetWorkdir: (workdir: string) => Promise<string>
  onInvite: (profileIds: string[]) => Promise<void>
  onDelete: () => Promise<void>
  onApproval: (approvalId: string, outcome: 'allowed-once' | 'rejected', note?: string) => Promise<void>
  onPermission: (profileId: string, mode: string) => Promise<void>
}): ReactNode {
  const { room, profiles, onSend, onRetry, onRename, onSetWorkdir, onInvite, onDelete, onApproval, onPermission } = props
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<UiNotice>('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [roomName, setRoomName] = useState(room.name)
  const [inviteIds, setInviteIds] = useState<string[]>([])
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [settingsError, setSettingsError] = useState<UiNotice>('')
  const [monitorWidth, setMonitorWidth] = useState(310)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatLayoutRef = useRef<HTMLDivElement>(null)
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
      setError(captureError(cause))
    } finally { setBusy(false) }
  }

  const retry = async (): Promise<void> => {
    if (busy || room.status === 'responding') return
    setBusy(true)
    setError('')
    try {
      await onRetry()
    } catch (cause) {
      setError(captureError(cause))
    } finally { setBusy(false) }
  }

  const saveRoomName = async (): Promise<void> => {
    if (!roomName.trim()) { setSettingsError(notice("chat.the.chat.name.cannot.be.empty")); return }
    setSettingsBusy(true)
    setSettingsError('')
    try { await onRename(roomName.trim()) } catch (cause) {
      setSettingsError(captureError(cause))
    } finally { setSettingsBusy(false) }
  }

  const inviteMembers = async (): Promise<void> => {
    if (!inviteIds.length) { setSettingsError(notice("chat.select.at.least.one.ai.user.to.invite")); return }
    setSettingsBusy(true)
    setSettingsError('')
    try {
      await onInvite(inviteIds)
      setInviteIds([])
    } catch (cause) {
      setSettingsError(captureError(cause))
    } finally { setSettingsBusy(false) }
  }

  const resizeMonitor = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const layout = chatLayoutRef.current
    if (!layout) return
    event.preventDefault()
    const bounds = layout.getBoundingClientRect()
    const move = (pointer: PointerEvent): void => setMonitorWidth(Math.round(Math.min(560, Math.max(240, bounds.right - pointer.clientX))))
    const stop = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); document.body.classList.remove('arena-is-resizing') }
    document.body.classList.add('arena-is-resizing')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }

  return (
    <div className="arena-chat-layout" ref={chatLayoutRef} style={{ '--arena-chat-monitor-width': `${monitorWidth}px` } as CSSProperties}>
    <div className="arena-chat">
      <header className="arena-chat-head">
        <div className="arena-chat-stack">
          {room.administratorProfile ? <span style={{ zIndex: 6 }}><Avatar value={room.administratorProfile.avatar} name={room.administratorProfile.name} /></span> : null}
          {room.participants.slice(0, 4).map((profile, index) => <span style={{ zIndex: 4 - index }} key={profile.id}><Avatar value={profile.avatar} name={profile.name} /></span>)}
        </div>
        <div><strong>{room.name}</strong><span>{room.type === 'direct' ? t("chat.direct.chat.2") : t("chat.value.ai.users.administrator", { p0: room.participants.length })}</span></div>
        <div className="arena-chat-head__actions"><button className="arena-control" type="button" onClick={() => { setSettingsOpen(current => !current); setSettingsError('') }}>{settingsOpen ? t("chat.close.settings") : room.type === 'group' ? t("chat.group.settings") : t("chat.chat.settings")}</button><button className="arena-control arena-control--danger" type="button" onClick={() => { if (window.confirm(room.type === 'group' ? t("chat.dissolve.group.value.all.messages.in.this.group.will", { p0: room.name }) : t("chat.delete.chat.value", { p0: room.name }))) void onDelete() }}>{room.type === 'group' ? t("chat.dissolve.group") : t("chat.delete.chat")}</button></div>
      </header>
      {settingsOpen ? (
        <aside className="arena-chat-settings" aria-label={room.type === 'group' ? t("chat.group.settings") : t("chat.chat.settings")}>
          <div className="arena-chat-settings__head"><div><strong>{room.type === 'group' ? t("chat.group.settings") : t("chat.chat.settings")}</strong><span>{t(room.type === 'group' ? "chat.renameAndInvite" : "chat.rename")}</span></div><button type="button" aria-label={t("chat.close.settings")} onClick={() => setSettingsOpen(false)}>×</button></div>
          <label className="arena-field"><span>{room.type === 'group' ? t("chat.group.name") : t("chat.chat.name")}</span><div className="arena-settings-name"><input className="arena-input" value={roomName} maxLength={80} onChange={event => setRoomName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void saveRoomName() }} /><button className="arena-control arena-control--primary" type="button" disabled={settingsBusy || roomName.trim() === room.name} onClick={() => void saveRoomName()}>{t("chat.save.name")}</button></div></label>
          <WorkdirSettings key={room.id} value={room.workdir} onSave={onSetWorkdir} />
          {room.type === 'group' ? <section><div className="arena-chat-settings__section"><strong>{t("chat.invite.ai.users")}</strong><span>{t("counts.inviteCapacity", { count: room.participants.length })}</span></div>{availableInvitees.length ? <div className="arena-invite-list">{availableInvitees.map(profile => <button type="button" key={profile.id} className={inviteIds.includes(profile.id) ? 'is-active' : ''} onClick={() => setInviteIds(current => current.includes(profile.id) ? current.filter(id => id !== profile.id) : room.participants.length + current.length < 12 ? [...current, profile.id] : current)}><Avatar value={profile.avatar} name={profile.name} /><span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span><i>{inviteIds.includes(profile.id) ? '✓' : '+'}</i></button>)}</div> : <div className="arena-invite-empty">{t("chat.there.are.no.more.ai.users.available.to.invite")}</div>}<button className="arena-launch arena-invite-submit" type="button" disabled={settingsBusy || !inviteIds.length} onClick={() => void inviteMembers()}>{settingsBusy ? t("chat.processing") : t("chat.invite.value.selected.members", { p0: inviteIds.length || '' })}</button></section> : null}
          <section className="arena-permission-section"><div className="arena-chat-settings__section"><strong>{t("chat.agent.permissions.for.this.chat")}</strong><span>{t("chat.per.conversation.defaults.to.full.access")}</span></div>{room.participants.map(profile => <label className="arena-permission-row" key={profile.id}><Avatar value={profile.avatar} name={profile.name} /><span>{profile.name}</span><select value={room.permissions?.[profile.id] || 'danger-full-access'} onChange={event => void onPermission(profile.id, event.target.value)}><option value="read-only">{t("permissions.readOnly")}</option><option value="workspace-write">{t("permissions.workspaceWrite")}</option><option value="danger-full-access">{t("permissions.fullAccess")}</option></select></label>)}</section>
          {settingsError ? <div className="arena-error">{errorText(settingsError)}</div> : null}
        </aside>
      ) : null}
      <div className="arena-chat-scroll" ref={scrollRef}>
        {room.messages.length === 0 ? (
          <div className="arena-chat-welcome">
            <div className="arena-chat-stack arena-chat-stack--large">{room.participants.map(profile => <span key={profile.id}><Avatar value={profile.avatar} name={profile.name} className="arena-avatar--large" /></span>)}</div>
            <strong>{room.type === 'direct' ? t("chat.your.direct.chat.with.value", { p0: room.participants[0]?.name }) : room.name}</strong>
            <span>{t("chat.send.a.message.to.start.each.ai.will.reply")}</span>
          </div>
        ) : null}
        {room.messages.map(message => message.kind === 'system' ? (
          <div className="arena-chat-system" key={message.id}>{systemText(message.text, message.i18n)}{message.approval ? <ApprovalCard approval={message.approval} onResolve={(outcome, note) => onApproval(message.approval!.id, outcome, note)} /> : null}</div>
        ) : (
          <div className="arena-message-row" data-kind={message.kind === 'human' ? 'user' : message.kind === 'admin' ? 'admin' : 'participant'} key={message.id}>
            <Avatar value={message.avatar} name={message.senderName} className="arena-avatar--message" />
            <div className="arena-message" data-kind={message.kind === 'human' ? 'user' : message.kind === 'admin' ? 'admin' : 'participant'}>
              <div className="arena-message__head"><strong>{message.senderName}</strong><span>{message.model ?? (message.kind === 'human' ? t("users.you") : '')}{message.phase === 'ack' ? t("chat.getting.started") : ''}</span></div>
              <div className="arena-message__text">{message.text}</div>
            </div>
          </div>
        ))}
        {room.status === 'responding' ? (
          <div className="arena-chat-typing"><div className="arena-typing-stack">{responding.slice(0, 4).map(profile => <Avatar key={profile.id} value={profile.avatar} name={profile.name} />)}</div><span>{respondingNames || 'AI'} {t("chat.are.processing.in.parallel")}</span><WorkingDots /></div>
        ) : null}
        {error ? <div className="arena-error">{errorText(error)}</div> : null}
      </div>
      <footer className="arena-chat-compose">
        {room.status === 'idle' && room.messages.some(message => message.kind === 'human') ? <div className="arena-chat-retry"><span>{t("chat.no.reply.to.your.last.message.or.want.to")}</span><button className="arena-control" type="button" disabled={busy} onClick={() => void retry()}>{t("chat.retry.last.message")}</button></div> : null}
        {presets.length ? <div className="arena-preset-chips">{presets.map(preset => <button type="button" key={preset} onClick={() => setText(preset)}>{preset}</button>)}</div> : null}
        <div className="arena-mention-bar"><span>{t("chat.mention")}</span>{mentionable.map(profile => { const muted = mutedIds.has(profile.id); return <button type="button" key={profile.id} className={muted ? 'is-muted' : profile.id === 'administrator' ? 'is-admin' : ''} title={muted ? t("chat.value.is.muted.click.to.draft.an.unmute.command", { p0: profile.name }) : `@${profile.name}`} onClick={() => setText(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${profile.name} ${muted ? t("chat.you.can.speak.again") : ''}`)}><Avatar value={profile.avatar} name={profile.name} />@{profile.name}{muted ? t("chat.muted") : ''}</button> })}</div>
        <div><textarea className="arena-textarea" value={text} maxLength={4000} placeholder={room.status === 'responding' ? t("chat.value.are.working.in.parallel.you.can.still.speak", { p0: respondingNames || 'AI' }) : t("chat.send.a.message.without.mentions.all.unmuted.ai.users")} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} /><button className="arena-send" type="button" disabled={busy || !text.trim()} onClick={() => void send()}>{t("chat.send")}</button></div>
      </footer>
    </div>
    <div className="arena-chat-resizer" role="separator" aria-label={t("chat.resize.the.right.activity.panel")} aria-orientation="vertical" aria-valuemin={240} aria-valuemax={560} aria-valuenow={monitorWidth} tabIndex={0} onPointerDown={resizeMonitor} onKeyDown={event => { if (event.key === 'ArrowLeft') setMonitorWidth(width => Math.min(560, width + 20)); else if (event.key === 'ArrowRight') setMonitorWidth(width => Math.max(240, width - 20)) }} />
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
  const [error, setError] = useState<UiNotice>('')
  const filteredRooms = rooms.filter(room => room.type === filter)

  const saveName = async (): Promise<void> => {
    if (!editing || !editing.name.trim()) {
      setError(notice("history.the.name.cannot.be.empty"))
      return
    }
    setBusyId(editing.id)
    setError('')
    try {
      if (editing.kind === 'meeting') await onRenameMeeting(editing.id, editing.name.trim())
      else await onRenameRoom(editing.id, editing.name.trim())
      setEditing(null)
    } catch (cause) {
      setError(captureError(cause))
    } finally { setBusyId('') }
  }

  const removeMeeting = async (meeting: Meeting): Promise<void> => {
    if (BUSY_MEETINGS.has(meeting.status)) {
      setError(notice("history.ai.users.are.working.stop.the.current.work.before"))
      return
    }
    if (!window.confirm(t("history.permanently.delete.meeting.value.this.cannot.be.undone", { p0: meetingTitle(meeting) }))) return
    setBusyId(meeting.id)
    setError('')
    try { await onDeleteMeeting(meeting.id) } catch (cause) {
      setError(captureError(cause))
    } finally { setBusyId('') }
  }

  const removeRoom = async (room: ChatRoom): Promise<void> => {
    if (!window.confirm(t("history.permanently.delete.value.value.and.all.its.messages.this", { p0: room.type === 'direct' ? t("chat.direct.chat.2") : t("history.group.chat"), p1: room.name }))) return
    setBusyId(room.id)
    setError('')
    try { await onDeleteRoom(room.id) } catch (cause) {
      setError(captureError(cause))
    } finally { setBusyId('') }
  }

  const dateText = (value: string): string => {
    try { return new Date(value).toLocaleString(localeTag(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  return (
    <div className="arena-history">
      <div className="arena-page-scroll">
        <div className="arena-kicker">{t("history.history")}</div>
        <h2>{t("history.history")}</h2>
        <p className="arena-lead">{t("history.meeting.names.are.stored.separately.from.discussion.topics.renaming")}</p>
        <div className="arena-history-tabs">
          <button type="button" className={filter === 'meeting' ? 'is-active' : ''} onClick={() => { onFilter('meeting'); setEditing(null); setError('') }}>{t("history.meetings")} <i>{meetings.length}</i></button>
          <button type="button" className={filter === 'direct' ? 'is-active' : ''} onClick={() => { onFilter('direct'); setEditing(null); setError('') }}>{t("history.ai.direct.chats")} <i>{rooms.filter(room => room.type === 'direct').length}</i></button>
          <button type="button" className={filter === 'group' ? 'is-active' : ''} onClick={() => { onFilter('group'); setEditing(null); setError('') }}>{t("history.ai.group.chats")} <i>{rooms.filter(room => room.type === 'group').length}</i></button>
        </div>
        {error ? <div className="arena-page-alert" role="alert">{errorText(error)}</div> : null}
        <div className="arena-history-list">
          {filter === 'meeting' ? meetings.map(meeting => (
            <article className="arena-history-card" key={meeting.id}>
              <div className="arena-history-avatars">{meeting.participants.slice(0, 3).map((participant, index) => <span key={participant.id} style={{ zIndex: 4 - index }}><Avatar value={participant.avatar} name={participant.name} /></span>)}</div>
              <button className="arena-history-open" type="button" onClick={() => onOpenMeeting(meeting.id)}>
                <strong>{meetingTitle(meeting)}</strong>
                <span>{meeting.displayName ? t("history.original.topic.value", { p0: meeting.topic }) : meeting.topic}</span>
                <small>{STATUS_TEXT()[meeting.status] ?? meeting.status} · {dateText(meeting.createdAt)} · {t("counts.messages", { count: meeting.transcript.filter(item => item.kind !== 'system').length })}</small>
              </button>
              <div className="arena-history-actions"><button type="button" onClick={() => { setEditing({ kind: 'meeting', id: meeting.id, name: meetingTitle(meeting) }); setError('') }}>{t("history.rename")}</button><button className="is-danger" type="button" disabled={BUSY_MEETINGS.has(meeting.status) || busyId === meeting.id} title={BUSY_MEETINGS.has(meeting.status) ? t("history.stop.the.current.ai.work.first") : t("history.delete.meeting")} onClick={() => void removeMeeting(meeting)}>{t("history.delete")}</button></div>
              {editing?.kind === 'meeting' && editing.id === meeting.id ? <div className="arena-history-editor"><input className="arena-input" value={editing.name} maxLength={80} autoFocus onChange={event => setEditing({ ...editing, name: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') void saveName(); if (event.key === 'Escape') setEditing(null) }} /><button className="arena-send" type="button" disabled={busyId === meeting.id} onClick={() => void saveName()}>{t("history.save")}</button><button className="arena-control" type="button" onClick={() => setEditing(null)}>{t("avatar.cancel")}</button></div> : null}
            </article>
          )) : filteredRooms.map(room => (
            <article className="arena-history-card" key={room.id}>
              <div className="arena-history-avatars">{room.participants.slice(0, 3).map((participant, index) => <span key={participant.id} style={{ zIndex: 4 - index }}><Avatar value={participant.avatar} name={participant.name} /></span>)}</div>
              <button className="arena-history-open" type="button" onClick={() => onOpenRoom(room.id)}><strong>{room.name}</strong><span>{room.type === 'direct' ? t("history.direct.chat.with.value", { p0: room.participants[0]?.name || 'AI' }) : t("history.value.ai.users.administrator", { p0: room.participants.length })}</span><small>{room.status === 'responding' ? t("history.responding") : t("role_activity.idle")} · {dateText(room.updatedAt)} · {t("counts.messages", { count: room.messages.length })}</small></button>
              <div className="arena-history-actions"><button type="button" onClick={() => { setEditing({ kind: 'room', id: room.id, name: room.name }); setError('') }}>{t("history.rename")}</button><button className="is-danger" type="button" disabled={busyId === room.id} onClick={() => void removeRoom(room)}>{t("history.delete")}</button></div>
              {editing?.kind === 'room' && editing.id === room.id ? <div className="arena-history-editor"><input className="arena-input" value={editing.name} maxLength={80} autoFocus onChange={event => setEditing({ ...editing, name: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') void saveName(); if (event.key === 'Escape') setEditing(null) }} /><button className="arena-send" type="button" disabled={busyId === room.id} onClick={() => void saveName()}>{t("history.save")}</button><button className="arena-control" type="button" onClick={() => setEditing(null)}>{t("avatar.cancel")}</button></div> : null}
            </article>
          ))}
          {filter === 'meeting' && !meetings.length ? <div className="arena-history-empty">{t("history.no.meetings.yet")}</div> : null}
          {filter !== 'meeting' && !filteredRooms.length ? <div className="arena-history-empty">{t(filter === 'direct' ? "history.emptyDirect" : "history.emptyGroup")}</div> : null}
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
  onPermission: (profileId: string, mode: string) => Promise<void>
}): ReactNode {
  const { meeting, busy, active, onAction, onCompose, onPermission } = props
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
  const [sectionHeights, setSectionHeights] = useState<Record<Exclude<WorkspaceTab, 'activity'>, number>>({ tasks: 420, decisions: 520, artifacts: 420 })
  const tasks = meeting.tasks ?? []
  const decisions = meeting.decisions ?? []
  const artifacts = meeting.artifacts ?? []
  const stage = meeting.collaborationStage ?? (meeting.status === 'completed' ? 'completed' : 'discussion')
  const administrator = meeting.administratorProfile ?? { id: 'administrator', name: t("users.administrator"), avatar: '🛡️' }
  const owners = [{ id: 'administrator', name: administrator.name }, ...meeting.participants.map(item => ({ id: item.id || '', name: item.name }))]
  const ownerName = (id: string | null): string => owners.find(item => item.id === id)?.name || t("board.unassigned")
  const blockers = tasks.filter(item => item.status === 'blocked')

  const resizeSection = (event: ReactPointerEvent<HTMLDivElement>, key: Exclude<WorkspaceTab, 'activity'>): void => {
    event.preventDefault()
    const startY = event.clientY
    const startHeight = sectionHeights[key]
    const move = (pointer: PointerEvent): void => setSectionHeights(current => ({ ...current, [key]: Math.round(Math.min(1000, Math.max(220, startHeight + pointer.clientY - startY))) }))
    const stop = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); document.body.classList.remove('arena-is-row-resizing') }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    document.body.classList.add('arena-is-row-resizing')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }

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
        <span><small>{t("board.meeting.stage")}</small><strong>{MEETING_STAGE_TEXT()[stage]}</strong></span>
        <select value={stage} disabled={busy || stage === 'completed'} onChange={event => void onAction({ action: 'set-stage', stage: event.target.value })}>
          {(Object.keys(MEETING_STAGE_TEXT()) as MeetingStage[]).filter(item => item !== 'completed').map(item => <option value={item} key={item}>{MEETING_STAGE_TEXT()[item]}</option>)}
          {stage === 'completed' ? <option value="completed">{t("meeting_stage.completed")}</option> : null}
        </select>
      </div>
      <div className="arena-workspace-tabs" role="tablist" aria-label={t("board.collaboration.panel")}>
        <button type="button" className={tab === 'activity' ? 'is-active' : ''} onClick={() => setTab('activity')}><span>{t("board.activity")}</span><i>{meeting.activityMonitor?.roles.filter(item => !['idle', 'muted'].includes(item.status)).length || 0}</i></button>
        <button type="button" className={tab === 'tasks' ? 'is-active' : ''} onClick={() => setTab('tasks')}><span>{t("board.tasks")}</span><i>{tasks.length}</i></button>
        <button type="button" className={tab === 'decisions' ? 'is-active' : ''} onClick={() => setTab('decisions')}><span>{t("board.decisions")}</span><i>{decisions.filter(item => item.status === 'open').length}</i></button>
        <button type="button" className={tab === 'artifacts' ? 'is-active' : ''} onClick={() => setTab('artifacts')}><span>{t("board.deliverables")}</span><i>{artifacts.length}</i></button>
      </div>

      <div className="arena-workspace-scroll">
        {tab === 'activity' ? <RoleMonitor monitor={meeting.activityMonitor} permissions={meeting.permissions} onPermission={onPermission} /> : null}

        {tab === 'tasks' ? <><section className="arena-workspace-section" style={{ height: `${sectionHeights.tasks}px` }}>
          <div className="arena-workspace-section__head"><span><h3>{t("board.task.board")}</h3><p>{blockers.length ? t("board.value.blocked.tasks.need.attention", { p0: blockers.length }) : t("board.assign.owners.and.track.delivery")}</p></span><button type="button" onClick={() => setTaskFormOpen(value => !value)}>{t("board.new")}</button></div>
          {taskFormOpen ? <div className="arena-workspace-form">
            <input className="arena-input" value={taskTitle} maxLength={160} placeholder={t("board.task.title")} onChange={event => setTaskTitle(event.target.value)} />
            <textarea className="arena-textarea" value={taskDescription} maxLength={1600} placeholder={t("board.acceptance.criteria.dependencies.or.notes.optional")} onChange={event => setTaskDescription(event.target.value)} />
            <select value={taskAssignee} onChange={event => setTaskAssignee(event.target.value)}><option value="">{t("board.unassigned")}</option>{owners.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
            <div><button className="is-primary" type="button" disabled={busy || !taskTitle.trim()} onClick={() => void createTask()}>{t("board.create.task")}</button><button type="button" onClick={() => setTaskFormOpen(false)}>{t("avatar.cancel")}</button></div>
          </div> : null}
          <div className="arena-task-list">{tasks.map(task => <article className="arena-task-card" data-status={task.status} key={task.id}>
            <div className="arena-task-card__head"><strong>{task.title}</strong><em>{TASK_STATUS_TEXT()[task.status]}</em></div>
            {task.description ? <p>{task.description}</p> : null}
            <div className="arena-task-card__fields">
              <select aria-label={t("board.task.owner")} value={task.assigneeId || ''} disabled={busy} onChange={event => void onAction({ action: 'task-update', taskId: task.id, assigneeId: event.target.value })}><option value="">{t("board.unassigned")}</option>{owners.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
              <select aria-label={t("board.task.status")} value={task.status} disabled={busy} onChange={event => void onAction({ action: 'task-update', taskId: task.id, status: event.target.value })}>{(Object.keys(TASK_STATUS_TEXT()) as TaskStatus[]).map(status => <option value={status} key={status}>{TASK_STATUS_TEXT()[status]}</option>)}</select>
            </div>
            <div className="arena-card-actions">
              {task.status === 'todo' ? <button className="is-primary" type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'in-progress' })}>{t("board.start.task")}</button> : null}
              {task.status === 'paused' ? <button className="is-primary" type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'in-progress' })}>{t("board.continue.task")}</button> : null}
              {task.status === 'in-progress' ? <button type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'paused' })}>{t("board.pause.task")}</button> : null}
              {task.status === 'blocked' ? <><button className="is-primary" type="button" disabled={busy} onClick={() => void onAction({ action: 'task-update', taskId: task.id, status: 'in-progress' })}>{t("board.rework")}</button><button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: t("board.blocked.task.value", { p0: task.title }) })}>{t("board.request.review")}</button></> : null}
              <button className="is-danger" type="button" disabled={busy} onClick={() => { if (window.confirm(t("board.delete.task.value", { p0: task.title }))) void onAction({ action: 'task-delete', taskId: task.id }) }}>{t("history.delete")}</button>
            </div>
          </article>)}</div>
          {!tasks.length ? <div className="arena-workspace-empty">{t("board.no.tasks.yet.you.and.the.ai.users.can")}</div> : null}
        </section><div className="arena-workspace-section-resizer" role="separator" aria-label={t("board.resize.the.task.board")} aria-orientation="horizontal" aria-valuemin={220} aria-valuemax={1000} aria-valuenow={sectionHeights.tasks} tabIndex={0} onPointerDown={event => resizeSection(event, 'tasks')} onKeyDown={event => { if (event.key === 'ArrowUp') setSectionHeights(current => ({ ...current, tasks: Math.max(220, current.tasks - 20) })); else if (event.key === 'ArrowDown') setSectionHeights(current => ({ ...current, tasks: Math.min(1000, current.tasks + 20) })) }} /> </> : null}

        {tab === 'decisions' ? <><section className="arena-workspace-section" style={{ height: `${sectionHeights.decisions}px` }}>
          <div className="arena-workspace-section__head"><span><h3>{t("board.decision.board")}</h3><p>{t("board.compare.options.and.risks.you.make.the.final.decision")}</p></span><button type="button" onClick={() => setDecisionFormOpen(value => !value)}>{t("board.new")}</button></div>
          {decisionFormOpen ? <div className="arena-workspace-form">
            <input className="arena-input" value={decisionTitle} maxLength={160} placeholder={t("board.what.needs.to.be.decided")} onChange={event => setDecisionTitle(event.target.value)} />
            <textarea className="arena-textarea" value={decisionDescription} maxLength={1600} placeholder={t("board.background.and.constraints.optional")} onChange={event => setDecisionDescription(event.target.value)} />
            <textarea className="arena-textarea" value={decisionOptions} placeholder={t("board.one.option.per.line.at.least.two.option.a")} onChange={event => setDecisionOptions(event.target.value)} />
            <div><button className="is-primary" type="button" disabled={busy || !decisionTitle.trim() || decisionOptions.split('\n').filter(item => item.trim()).length < 2} onClick={() => void createDecision()}>{t("board.create.decision")}</button><button type="button" onClick={() => setDecisionFormOpen(false)}>{t("avatar.cancel")}</button></div>
          </div> : null}
          <div className="arena-decision-list">{decisions.map(decision => <article className="arena-decision-card" data-status={decision.status} key={decision.id}>
            <div className="arena-decision-card__head"><span><strong>{decision.title}</strong><small>{decision.status === 'decided' ? t("board.decided") : t("board.awaiting.your.choice")}</small></span>{decision.status === 'decided' ? <button type="button" disabled={busy} onClick={() => void onAction({ action: 'decision-reopen', decisionId: decision.id })}>{t("board.reopen.discussion")}</button> : null}</div>
            {decision.description ? <p>{decision.description}</p> : null}
            <div className="arena-option-list">{decision.options.map(option => {
              const selected = decision.selectedOptionId === option.id
              return <div className={selected ? 'arena-option is-selected' : 'arena-option'} key={option.id}>
                <div className="arena-option__head"><span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span><button type="button" disabled={busy || selected} onClick={() => void onAction({ action: 'decision-choose', decisionId: decision.id, optionId: option.id })}>{selected ? t("board.selected") : decision.status === 'decided' ? t("board.change.choice") : t("board.choose.option")}</button></div>
                {(option.opinions ?? []).map(opinion => <div className="arena-opinion" data-stance={opinion.stance} key={opinion.profileId}><Avatar value={opinion.avatar} name={opinion.name} /><span><strong>{opinion.name} · {opinion.stance === 'support' ? t("board.support") : opinion.stance === 'oppose' ? t("board.oppose") : t("board.neutral")} {t("board.confidence")} {opinion.confidence}%</strong><p>{opinion.reason || t("board.no.reason.provided")}</p>{opinion.risk ? <small>{t("board.risks")}{opinion.risk}</small> : null}</span></div>)}
              </div>
            })}</div>
            <div className="arena-card-actions"><button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: t("board.decision.value", { p0: decision.title }) })}>{t("board.request.evidence")}</button><button className="is-danger" type="button" disabled={busy} onClick={() => { if (window.confirm(t("board.delete.decision.value", { p0: decision.title }))) void onAction({ action: 'decision-delete', decisionId: decision.id }) }}>{t("history.delete")}</button></div>
          </article>)}</div>
          {!decisions.length ? <div className="arena-workspace-empty">{t("board.when.several.options.are.viable.compare.their.reasoning.risks")}</div> : null}
        </section><div className="arena-workspace-section-resizer" role="separator" aria-label={t("board.resize.the.decision.board")} aria-orientation="horizontal" aria-valuemin={220} aria-valuemax={1000} aria-valuenow={sectionHeights.decisions} tabIndex={0} onPointerDown={event => resizeSection(event, 'decisions')} onKeyDown={event => { if (event.key === 'ArrowUp') setSectionHeights(current => ({ ...current, decisions: Math.max(220, current.decisions - 20) })); else if (event.key === 'ArrowDown') setSectionHeights(current => ({ ...current, decisions: Math.min(1000, current.decisions + 20) })) }} /> </> : null}

        {tab === 'artifacts' ? <><section className="arena-workspace-section" style={{ height: `${sectionHeights.artifacts}px` }}>
          <div className="arena-workspace-section__head"><span><h3>{t("board.deliverable.library")}</h3><p>{t("board.files.links.conclusions.and.progress.summaries")}</p></span><button type="button" onClick={() => setArtifactFormOpen(value => !value)}>{t("board.add")}</button></div>
          {artifactFormOpen ? <div className="arena-workspace-form">
            <input className="arena-input" value={artifactTitle} maxLength={160} placeholder={t("board.deliverable.title")} onChange={event => setArtifactTitle(event.target.value)} />
            <textarea className="arena-textarea" value={artifactDescription} maxLength={2400} placeholder={t("board.content.or.review.notes")} onChange={event => setArtifactDescription(event.target.value)} />
            <div className="arena-form-row"><select value={artifactType} onChange={event => setArtifactType(event.target.value as MeetingArtifact['artifactType'])}><option value="note">{t("board.conclusion")}</option><option value="file">{t("board.file")}</option><option value="link">{t("board.link")}</option><option value="summary">{t("board.summary")}</option></select><input className="arena-input" value={artifactLocation} maxLength={1600} placeholder={t("board.file.path.or.url.optional")} onChange={event => setArtifactLocation(event.target.value)} /></div>
            <div><button className="is-primary" type="button" disabled={busy || !artifactTitle.trim()} onClick={() => void createArtifact()}>{t("board.register.deliverable")}</button><button type="button" onClick={() => setArtifactFormOpen(false)}>{t("avatar.cancel")}</button></div>
          </div> : null}
          <div className="arena-artifact-list">{artifacts.map(artifact => <article className="arena-artifact-card" data-status={artifact.status} key={artifact.id}>
            <div className="arena-artifact-card__head"><span>{artifact.artifactType === 'file' ? '📄' : artifact.artifactType === 'link' ? '🔗' : artifact.artifactType === 'summary' ? '📋' : '💡'}</span><div><strong>{artifact.title}</strong><small>{artifact.status === 'accepted' ? t("board.accepted") : artifact.status === 'rejected' ? t("board.rejected") : t("board.awaiting.review")} · {ownerName(artifact.ownerId)}</small></div></div>
            {artifact.description ? <p>{artifact.description}</p> : null}
            {artifact.location ? (/^https?:\/\//i.test(artifact.location) ? <a href={artifact.location} target="_blank" rel="noreferrer">{artifact.location}</a> : <code>{artifact.location}</code>) : null}
            <div className="arena-card-actions"><button type="button" disabled={busy || artifact.status === 'accepted'} onClick={() => void onAction({ action: 'artifact-update', artifactId: artifact.id, status: 'accepted' })}>{t("board.accept")}</button><button type="button" disabled={busy || artifact.status === 'rejected'} onClick={() => void onAction({ action: 'artifact-update', artifactId: artifact.id, status: 'rejected' })}>{t("board.reject.result")}</button><button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: t("board.deliverable.value", { p0: artifact.title }) })}>{t("board.request.evidence")}</button><button className="is-danger" type="button" disabled={busy} onClick={() => { if (window.confirm(t("board.delete.deliverable.value", { p0: artifact.title }))) void onAction({ action: 'artifact-delete', artifactId: artifact.id }) }}>{t("history.delete")}</button></div>
          </article>)}</div>
          {!artifacts.length ? <div className="arena-workspace-empty">{t("board.completed.files.research.links.and.conclusions.appear.here.for")}</div> : null}
        </section><div className="arena-workspace-section-resizer" role="separator" aria-label={t("board.resize.the.deliverable.library")} aria-orientation="horizontal" aria-valuemin={220} aria-valuemax={1000} aria-valuenow={sectionHeights.artifacts} tabIndex={0} onPointerDown={event => resizeSection(event, 'artifacts')} onKeyDown={event => { if (event.key === 'ArrowUp') setSectionHeights(current => ({ ...current, artifacts: Math.max(220, current.artifacts - 20) })); else if (event.key === 'ArrowDown') setSectionHeights(current => ({ ...current, artifacts: Math.min(1000, current.artifacts + 20) })) }} /> </> : null}
      </div>

      <div className="arena-workspace-quick">
        <button type="button" disabled={!active || busy} onClick={() => void onAction({ action: 'request-evidence', subject: t("board.current.proposals.and.deliverables") })}>{t("board.ask.everyone.for.evidence")}</button>
        <button type="button" onClick={() => onCompose(t("board.value.change.the.topic.to", { p0: administrator.name }))}>{t("board.change.topic")}</button>
      </div>
    </aside>
  )
}

function WatchView(props: { meeting: Meeting; profiles: ArenaState['profiles']; onAction: (body: object) => Promise<void>; onApproval: (approvalId: string, outcome: 'allowed-once' | 'rejected', note?: string) => Promise<void>; onSetWorkdir: (workdir: string) => Promise<string> }): ReactNode {
  const { meeting, profiles, onAction, onApproval, onSetWorkdir } = props
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<UiNotice>('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [inviteIds, setInviteIds] = useState<string[]>([])
  const [workspaceWidth, setWorkspaceWidth] = useState(370)
  const [headerHeight, setHeaderHeight] = useState(82)
  const stageRef = useRef<HTMLDivElement>(null)
  const collabRef = useRef<HTMLDivElement>(null)
  const watchRef = useRef<HTMLDivElement>(null)
  const active = true
  const busyMeeting = BUSY_MEETINGS.has(meeting.status)
  const administrator = meeting.administratorProfile ?? { id: 'administrator', name: t("users.administrator"), avatar: '🛡️' }
  const human = meeting.humanProfile ?? { id: 'human', name: t("users.you"), avatar: '🧑' }
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
      setError(captureError(cause))
      return false
    } finally { setBusy(false) }
  }

  const send = async (): Promise<void> => {
    const text = message.trim()
    if (!text) return
    if (await act({ action: 'intervene', text })) setMessage('')
  }

  const mention = (name: string, suffix = ''): void => setMessage(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${name} ${suffix}`)

  const resizeWorkspace = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const layout = collabRef.current
    if (!layout) return
    event.preventDefault()
    const bounds = layout.getBoundingClientRect()
    const minWidth = 280
    const maxWidth = Math.max(minWidth, Math.min(620, bounds.width - 320))
    const move = (pointer: PointerEvent): void => {
      setWorkspaceWidth(Math.round(Math.min(maxWidth, Math.max(minWidth, bounds.right - pointer.clientX))))
    }
    const stop = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      document.body.classList.remove('arena-is-resizing')
    }
    document.body.classList.add('arena-is-resizing')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }

  const resizeHeader = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const layout = watchRef.current
    if (!layout) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const bounds = layout.getBoundingClientRect()
    const move = (pointer: PointerEvent): void => setHeaderHeight(Math.round(Math.min(240, Math.max(64, pointer.clientY - bounds.top))))
    const stop = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); document.body.classList.remove('arena-is-row-resizing') }
    document.body.classList.add('arena-is-row-resizing')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }

  const inviteMembers = async (): Promise<void> => {
    if (!inviteIds.length) { setError(notice("chat.select.at.least.one.ai.user.to.invite")); return }
    if (await act({ action: 'invite-members', profileIds: inviteIds })) {
      setInviteIds([])
      setInviteOpen(false)
    }
  }

  const setMeetingPermission = async (profileId: string, mode: string): Promise<void> => {
    await onAction({ action: 'set-permission', profileId, mode })
  }

  const headerTitleSize = Math.round(Math.min(29, Math.max(13, 13 + (headerHeight - 64) * 0.09)))
  const headerMetaSize = Math.round(Math.min(13, Math.max(9, 9 + (headerHeight - 64) * 0.025)))

  return (
    <div className="arena-watch" ref={watchRef} style={{ '--arena-watch-head-height': `${headerHeight}px`, '--arena-watch-title-size': `${headerTitleSize}px`, '--arena-watch-meta-size': `${headerMetaSize}px` } as CSSProperties}>
      <div className="arena-watch-head">
        <div className="arena-watch-head__title">
          <h2 title={meeting.topic}>{meetingTitle(meeting)}</h2>
          <div className="arena-meta">
            <span>{t("counts.members", { count: meeting.participants.length + 2 })}</span>
            <span>{t("meeting.ongoing.collaboration.continue.anytime")}</span>
          </div>
        </div>
        <div className="arena-watch-head__actions">
          <button className="arena-control" type="button" onClick={() => { setSettingsOpen(value => !value); setInviteOpen(false) }}>{t("meeting.meeting.settings")}</button>
          <button className="arena-control" type="button" onClick={() => { setInviteOpen(value => !value); setSettingsOpen(false); setError('') }}>{inviteOpen ? t("meeting.close.invitations") : t("meeting.invite.members")}</button>
          <span className="arena-status" data-status={meeting.status}>{STATUS_TEXT()[meeting.status] ?? meeting.status}</span>
        </div>
        <div className="arena-watch-head-resizer" role="separator" aria-label={t("meeting.resize.the.meeting.header")} aria-orientation="horizontal" aria-valuemin={64} aria-valuemax={240} aria-valuenow={headerHeight} tabIndex={0} onPointerDown={resizeHeader} onKeyDown={event => { if (event.key === 'ArrowUp') { event.preventDefault(); setHeaderHeight(height => Math.max(64, height - 10)) } else if (event.key === 'ArrowDown') { event.preventDefault(); setHeaderHeight(height => Math.min(240, height + 10)) } }} />
      </div>

      {settingsOpen ? <aside className="arena-chat-settings" aria-label={t("meeting.meeting.settings")}>
        <div className="arena-chat-settings__head"><div><strong>{t("meeting.meeting.settings")}</strong></div><button type="button" aria-label={t("meeting.close.meeting.settings")} onClick={() => setSettingsOpen(false)}>×</button></div>
        <WorkdirSettings key={meeting.id} value={meeting.workdir} onSave={onSetWorkdir} />
      </aside> : null}

      {inviteOpen ? (
        <aside className="arena-chat-settings arena-meeting-invite" aria-label={t("meeting.invite.meeting.members")}>
          <div className="arena-chat-settings__head"><div><strong>{t("chat.invite.ai.users")}</strong><span>{t("counts.inviteMeetingCapacity", { count: meeting.participants.length })}</span></div><button type="button" aria-label={t("meeting.close.invitations")} onClick={() => setInviteOpen(false)}>×</button></div>
          {availableInvitees.length ? <div className="arena-invite-list">{availableInvitees.map(profile => <button type="button" key={profile.id} className={inviteIds.includes(profile.id) ? 'is-active' : ''} onClick={() => setInviteIds(current => current.includes(profile.id) ? current.filter(id => id !== profile.id) : meeting.participants.length + current.length < 12 ? [...current, profile.id] : current)}><Avatar value={profile.avatar} name={profile.name} /><span><strong>{profile.name}</strong><small>{profile.provider}/{profile.model}</small></span><i>{inviteIds.includes(profile.id) ? '✓' : '+'}</i></button>)}</div> : <div className="arena-invite-empty">{t("chat.there.are.no.more.ai.users.available.to.invite")}</div>}
          <button className="arena-launch arena-invite-submit" type="button" disabled={busy || !inviteIds.length} onClick={() => void inviteMembers()}>{busy ? t("chat.processing") : t("chat.invite.value.selected.members", { p0: inviteIds.length || '' })}</button>
        </aside>
      ) : null}

      <div className="arena-collab-layout" ref={collabRef} style={{ '--arena-workspace-width': `${workspaceWidth}px` } as CSSProperties}>
        <div className="arena-stage" ref={stageRef}>
          {meeting.transcript.length === 0 ? <div className="arena-empty"><div><strong>{meeting.status === 'queued' ? t("meeting.waiting.to.join") : t("meeting.ai.members.are.preparing.to.speak")}</strong><WorkingDots /></div></div> : (
            <div className="arena-transcript">
              {meeting.transcript.map(item => {
                if (item.kind === 'system') return /^第\s*\d+\s*轮/.test(item.text)
                  ? null
                  : <div className="arena-round-label" key={item.id}>{systemText(item.text, item.i18n)}{item.approval ? <ApprovalCard approval={item.approval} onResolve={(outcome, note) => onApproval(item.approval!.id, outcome, note)} /> : null}</div>
                const participant = meeting.participants.find(entry => entry.id === item.speakerId)
                const avatar = item.avatar || participant?.avatar || (item.kind === 'user' ? human.avatar : item.kind === 'admin' ? administrator.avatar : '🤖')
                return (
                  <div className="arena-message-row" data-kind={item.kind} key={item.id}>
                    <Avatar value={avatar} name={item.speaker} className="arena-avatar--message" />
                    <div className="arena-message" data-kind={item.kind}>
                      <div className="arena-message__head"><strong>{item.speaker}</strong><span>{item.model ?? (item.kind === 'user' ? t("meeting.me") : item.kind === 'admin' ? t("users.group.administrator") : '')}{item.phase === 'ack' ? t("chat.getting.started") : ''}</span></div>
                      <div className="arena-message__text">{item.text}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {working.length ? <div className="arena-chat-typing"><div className="arena-typing-stack">{working.slice(0, 4).map(participant => <Avatar key={participant.id} value={participant.avatar} name={participant.name} />)}</div><span>{working.map(item => item.name).join('、')} {t("meeting.are.working.in.parallel")}</span><WorkingDots /></div> : null}
          {meeting.status === 'paused' && active ? <div className="arena-chat-system">{t("meeting.nobody.is.speaking.right.now.but.the.meeting.is")}</div> : null}
          {meeting.error ? <div className="arena-error">{errorText(meeting.error)}</div> : null}
          {error ? <div className="arena-error">{errorText(error)}</div> : null}
        </div>

        <div
          className="arena-workspace-resizer"
          role="separator"
          aria-label={t("meeting.resize.the.right.collaboration.panel")}
          aria-orientation="vertical"
          aria-valuemin={280}
          aria-valuemax={620}
          aria-valuenow={workspaceWidth}
          tabIndex={0}
          onPointerDown={resizeWorkspace}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') setWorkspaceWidth(width => Math.min(620, width + 20))
            else if (event.key === 'ArrowRight') setWorkspaceWidth(width => Math.max(280, width - 20))
          }}
        />
        <CollaborationConsole meeting={meeting} busy={busy} active={active} onAction={act} onCompose={setMessage} onPermission={setMeetingPermission} />
      </div>

      <div className="arena-controls">
        <div className="arena-intervene arena-intervene--chat">
          <div className="arena-mention-bar"><span>{t("chat.mention")}</span>{meeting.participants.map(participant => { const muted = mutedIds.has(participant.id); return <button type="button" key={participant.id} className={muted ? 'is-muted' : ''} title={muted ? t("chat.value.is.muted.click.to.draft.an.unmute.command", { p0: participant.name }) : `@${participant.name}`} onClick={() => mention(participant.name, muted ? t("chat.you.can.speak.again") : '')}><Avatar value={participant.avatar} name={participant.name} />@{participant.name}{muted ? t("chat.muted") : ''}</button> })}<button type="button" className="is-admin" onClick={() => mention(administrator.name)}><Avatar value={administrator.avatar} name={administrator.name} />@{administrator.name}</button></div>
          <div><textarea className="arena-textarea" value={message} placeholder={t("meeting.speak.freely.without.mentions.unmuted.ai.users.work.together")} maxLength={4000} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} /><button className="arena-send" type="button" disabled={busy || !message.trim()} onClick={() => void send()}>{t("chat.send")}</button></div>
        </div>
        {meeting.status === 'paused' ? (
          <button className="arena-control" type="button" disabled={busy} onClick={() => void act({ action: 'resume' })}>{t("meeting.continue.with.everyone")}</button>
        ) : meeting.status === 'running' ? <button className="arena-control" type="button" disabled={busy} onClick={() => void act({ action: 'pause' })}>{t("meeting.pause.after.this.turn")}</button> : null}
        <button className="arena-control" type="button" disabled={busy} onClick={() => void act({ action: 'summarize' })}>{t("meeting.summarize.progress")}</button>
        <button className="arena-control arena-control--danger" type="button" disabled={busy || !busyMeeting} onClick={() => void act({ action: 'stop' })}>{t("meeting.stop.current.work")}</button>
      </div>
    </div>
  )
}

export function ArenaOverlay({ embedded = false }: { embedded?: boolean } = {}): ReactNode {
  const language = useArenaLocale()
  const [open, setOpen] = useState(embedded)
  const [state, setState] = useState<ArenaState>({
    meetings: [],
    rooms: [],
    templates: FALLBACK_TEMPLATES,
    profiles: {
      human: { id: 'human', name: t("users.you"), avatar: '🧑' },
      administrator: { id: 'administrator', name: t("users.administrator"), avatar: '🛡️' },
      aiUsers: [],
    },
    modelCatalog: [],
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('meeting')
  const [view, setView] = useState<ArenaView>('setup')
  const [loadError, setLoadError] = useState<UiNotice>('')

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
        if (alive) setLoadError(captureError(cause))
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

  const resolveApproval = async (approvalId: string, outcome: 'allowed-once' | 'rejected', note?: string): Promise<void> => {
    if (selected) {
      const result = await jsonRequest<{ meeting: Meeting }>(`/meetings/${encodeURIComponent(selected.id)}/actions`, { method: 'POST', body: JSON.stringify({ action: 'approval', approvalId, outcome, note }) })
      setState(current => ({ ...current, meetings: current.meetings.map(item => item.id === result.meeting.id ? result.meeting : item) }))
      return
    }
    if (selectedRoom) {
      const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}/actions`, { method: 'POST', body: JSON.stringify({ action: 'approval', approvalId, outcome, note }) })
      setState(current => ({ ...current, rooms: (current.rooms ?? []).map(item => item.id === result.room.id ? result.room : item) }))
    }
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
      administrator: current.profiles?.administrator ?? { id: 'administrator', name: t("users.administrator"), avatar: '🛡️' },
      aiUsers: current.profiles?.aiUsers ?? [],
    },
  }))

  const administratorSaved = (profile: UserProfile): void => setState(current => ({
    ...current,
    profiles: {
      human: current.profiles?.human ?? { id: 'human', name: t("users.you"), avatar: '🧑' },
      administrator: profile,
      aiUsers: current.profiles?.aiUsers ?? [],
    },
  }))

  const aiSaved = (profile: UserProfile): void => setState(current => {
    const human = current.profiles?.human ?? { id: 'human', name: t("users.you"), avatar: '🧑' }
    const aiUsers = [...(current.profiles?.aiUsers ?? [])]
    const index = aiUsers.findIndex(item => item.id === profile.id)
    if (index >= 0) aiUsers.splice(index, 1, profile)
    else aiUsers.push(profile)
    const administrator = current.profiles?.administrator ?? { id: 'administrator', name: t("users.administrator"), avatar: '🛡️' }
    return { ...current, profiles: { human, administrator, aiUsers } }
  })

  const aiDeleted = (id: string): void => setState(current => ({
    ...current,
    profiles: {
      human: current.profiles?.human ?? { id: 'human', name: t("users.you"), avatar: '🧑' },
      administrator: current.profiles?.administrator ?? { id: 'administrator', name: t("users.administrator"), avatar: '🛡️' },
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

  const setSelectedRoomWorkdir = async (workdir: string): Promise<string> => {
    if (!selectedRoom) throw new Error(t("arena.select.a.chat.first"))
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}`, { method: 'PATCH', body: JSON.stringify({ workdir }) })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(room => room.id === result.room.id ? result.room : room) }))
    return result.room.workdir ?? ''
  }

  const setSelectedMeetingWorkdir = async (workdir: string): Promise<string> => {
    if (!selected) throw new Error(t("arena.select.a.meeting.first"))
    const result = await jsonRequest<{ meeting: Meeting }>(`/meetings/${encodeURIComponent(selected.id)}`, { method: 'PATCH', body: JSON.stringify({ workdir }) })
    setState(current => ({ ...current, meetings: current.meetings.map(meeting => meeting.id === result.meeting.id ? result.meeting : meeting) }))
    return result.meeting.workdir ?? ''
  }

  const inviteRoomMembers = async (profileIds: string[]): Promise<void> => {
    if (!selectedRoom) return
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}/members`, { method: 'POST', body: JSON.stringify({ profileIds }) })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(room => room.id === result.room.id ? result.room : room) }))
  }

  const setRoomPermission = async (profileId: string, mode: string): Promise<void> => {
    if (!selectedRoom) return
    const result = await jsonRequest<{ room: ChatRoom }>(`/rooms/${encodeURIComponent(selectedRoom.id)}/actions`, { method: 'POST', body: JSON.stringify({ action: 'set-permission', profileId, mode }) })
    setState(current => ({ ...current, rooms: (current.rooms ?? []).map(item => item.id === result.room.id ? result.room : item) }))
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
        <div className="arena-backdrop" lang={language === 'zh' ? 'zh-CN' : 'en'} data-embedded={embedded} role="presentation" onMouseDown={event => { if (!embedded && event.target === event.currentTarget) setOpen(false) }}>
          <section className="arena-modal" role="dialog" aria-modal={!embedded} aria-label="Agent Arena">
            <header className="arena-header">
              <div className="arena-topbar">
                <div className="arena-brand">
                  <span className="arena-brand__mark">⚔</span>
                  <span className="arena-brand__text"><strong>Agent Arena</strong><span>{t("arena.ai.social.and.multi.model.collaboration")}</span></span>
                </div>
                <div className="arena-topbar__spacer" />
                {activeCount > 0 ? <span className="arena-running-badge">● {t("counts.activeMeetings", { count: activeCount })}</span> : null}
                {!embedded ? <button className="arena-exit" type="button" onClick={() => setOpen(false)}>{t("arena.exit.arena")}</button> : null}
              </div>
              <nav className="arena-mode-nav" aria-label={t("arena.arena.modes")}>
                <button type="button" className={view !== 'history' && activeMode === 'meeting' ? 'is-active' : ''} onClick={() => switchMode('meeting')}>
                  <span>⚔️</span><strong>{t("history.meetings")}</strong><small>{t("arena.multi.ai.discussion.and.work")}</small>
                </button>
                <button type="button" className={view !== 'history' && activeMode === 'direct' ? 'is-active' : ''} onClick={() => switchMode('direct')}>
                  <span>💬</span><strong>{t("history.ai.direct.chats")}</strong><small>{t("arena.talk.to.one.character")}</small>
                </button>
                <button type="button" className={view !== 'history' && activeMode === 'group' ? 'is-active' : ''} onClick={() => switchMode('group')}>
                  <span>👥</span><strong>{t("history.ai.group.chats")}</strong><small>{t("arena.2.12.ai.users.together")}</small>
                </button>
                <button type="button" className={view !== 'history' && activeMode === 'profiles' ? 'is-active' : ''} onClick={() => switchMode('profiles')}>
                  <span>🪪</span><strong>{t("arena.users")}</strong><small>{t("arena.avatars.personas.and.models")}</small>
                </button>
                <button type="button" className={view === 'settings' ? 'is-active' : ''} onClick={() => setView('settings')}>
                  <span>⚙️</span><strong>{t("arena.settings")}</strong><small>{t("arena.rate.limits.and.automatic.replies")}</small>
                </button>
                <button type="button" className={view === 'history' ? 'is-active' : ''} onClick={openHistory}>
                  <span>🗂️</span><strong>{t("arena.history")}</strong><small>{t("arena.rename.and.delete")}</small>
                </button>
              </nav>
              {view !== 'history' && activeMode !== 'profiles' && ((activeMode === 'meeting' && state.meetings.length > 0) || (activeMode !== 'meeting' && modeRooms.length > 0)) ? (
                <div className="arena-recent-strip">
                  <span>{t("arena.recent")}</span>
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
                {loadError ? <div className="arena-global-alert" role="alert">{t("arena.unable.to.connect.to.arena")}{errorText(loadError)}</div> : null}
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
                  <ChatView room={selectedRoom} profiles={state.profiles} onSend={sendRoomMessage} onRetry={retrySelectedRoom} onRename={renameSelectedRoom} onSetWorkdir={setSelectedRoomWorkdir} onInvite={inviteRoomMembers} onDelete={deleteRoom} onApproval={resolveApproval} onPermission={setRoomPermission} />
                ) : view === 'setup' || !selected ? (
                  <SetupView
                    templates={state.templates.length ? state.templates : FALLBACK_TEMPLATES}
                    profiles={state.profiles}
                    onManageProfiles={() => setView('profiles')}
                    onCreated={created}
                  />
                ) : (
                  <WatchView meeting={selected} profiles={state.profiles} onAction={runAction} onApproval={resolveApproval} onSetWorkdir={setSelectedMeetingWorkdir} />
                )}
              </main>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export const inject = ['slots', 'locale']

export function apply(ctx: any): void {
  ctx.effect(() => installArenaLocale(ctx.locale), 'agent-arena: dictionaries')
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
    label: () => t("arena.ai.collaboration"),
  }, () => <ArenaOverlay embedded />))
}
