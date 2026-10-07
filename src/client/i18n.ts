import { useSyncExternalStore } from 'react'
import { dictionaries, formatMessage, legacySystemDescriptor } from '../localization.mjs'
import { activeLocale, installArenaLocale, subscribeLocale, translate } from './locale-store.mjs'
export { installArenaLocale }

export interface MessageDescriptor { key: string; params?: Record<string, unknown>; suffix?: string }
export type UiNotice = string | ArenaRequestError
export function useArenaLocale(): string {
  return useSyncExternalStore(subscribeLocale, activeLocale, () => 'zh')
}

export function t(key: string, params: Record<string, unknown> = {}): string {
  return translate(key, params)
}

export function localeTag(): string { return activeLocale() === 'zh' ? 'zh-CN' : 'en-US' }

export function systemText(text: string | undefined, descriptor?: MessageDescriptor): string {
  if (descriptor) return t(descriptor.key, descriptor.params) + (descriptor.suffix ?? '')
  if (descriptor === null) return text ?? ''
  const legacy = legacySystemDescriptor(text)
  return legacy ? t(legacy.key) : text ?? ''
}

/** Errors retain a descriptor so an already visible error can switch language. */
export class ArenaRequestError extends Error {
  constructor(message: string, public readonly i18n?: MessageDescriptor) { super(message) }
}

export function captureError(value: unknown): UiNotice {
  return value instanceof ArenaRequestError ? value : value instanceof Error ? value.message : String(value)
}

export function notice(key: string, params: Record<string, unknown> = {}): ArenaRequestError {
  return new ArenaRequestError(formatMessage(key, params, 'zh'), { key, params })
}

export function errorText(value: unknown): string {
  if (value instanceof ArenaRequestError && value.i18n) return t(value.i18n.key, value.i18n.params)
  // Locally generated UI validation messages can be stored in either language.
  const text = value instanceof Error ? value.message : String(value ?? '')
  const key = Object.keys(dictionaries.zh).find(key => dictionaries.zh[key] === text || dictionaries.en[key] === text)
  return key ? t(key) : text
}

const templateKeys: Record<string, { name: string; description: string }> = {
  roundtable: { name: 'fallback_templates.roundtable', description: 'system.discuss.architecture.risks.and.user.experience.from.three.perspectives' },
  courtroom: { name: 'fallback_templates.ai.courtroom', description: 'system.debate.both.sides.while.an.evidence.reviewer.checks.the' },
  'code-review': { name: 'fallback_templates.code.review', description: 'system.review.a.technical.proposal.from.implementation.review.and.security' },
  roast: { name: 'fallback_templates.roast.session', description: 'system.mix.serious.analysis.with.entertainment.for.product.ideas.and' },
}
export function templateText(template: { id: string; name: string; description: string }, field: 'name' | 'description'): string {
  const key = templateKeys[template.id]?.[field]
  return key && dictionaries.zh[key] ? t(key) : systemText(template[field])
}
