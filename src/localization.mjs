import zh from './locales/zh.mjs'
import en from './locales/en.mjs'

export const LOCALE_NAMESPACE = 'agent-arena'
export const dictionaries = { zh, en }

export function normalizeLocale(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function formatMessage(key, params = {}, locale = 'zh') {
  const template = dictionaries[normalizeLocale(locale)][key] ?? en[key] ?? zh[key] ?? key
  return template.replace(/\{(\w+)\}/g, (token, name) => Object.hasOwn(params, name) ? String(params[name] ?? '') : token)
}

/** A descriptor is stored alongside the original text, never in place of user data. */
export function uiMessage(key, params = {}) {
  return { key, params, text: formatMessage(key, params, 'zh') }
}

export function messageText(value) {
  return value && typeof value === 'object' && typeof value.key === 'string' ? value.text + (value.suffix || '') : String(value ?? '')
}

export function messageDescriptor(value) {
  return value && typeof value === 'object' && Object.hasOwn(zh, value.key)
    ? { key: value.key, params: value.params ?? {}, ...(value.suffix ? { suffix: value.suffix } : {}) }
    : undefined
}

export function uiError(message, status, ErrorType = Error) {
  const error = new ErrorType(messageText(message))
  const descriptor = messageDescriptor(message)
  if (descriptor) error.i18n = descriptor
  if (status != null) error.status = status
  return error
}

export function withMessageDetail(value, detail) {
  const descriptor = messageDescriptor(value)
  return descriptor
    ? { ...uiMessage(descriptor.key, descriptor.params), suffix: detail ? `：${detail}` : '' }
    : `${messageText(value)}${detail ? `：${detail}` : ''}`
}

// Compatibility for existing plugin-generated records only. Never run this over
// human/AI messages, names, personas, task contents, file paths, or provider errors.
const exactSystemKeys = new Map(Object.entries(zh).map(([key, text]) => [text, key]))
export function legacySystemDescriptor(text) {
  const key = exactSystemKeys.get(text)
  return key ? { key, params: {} } : undefined
}
