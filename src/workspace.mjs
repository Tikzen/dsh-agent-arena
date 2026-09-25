import { uiMessage, uiError } from './localization.mjs'
import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'

function invalid(message) {
  return uiError(message, 400)
}

export async function normalizeRoomWorkdir(value) {
  if (value != null && typeof value !== 'string') throw invalid(uiMessage("workspace.the.working.directory.must.be.text"))
  const text = (value ?? '').trim()
  if (!text) return ''
  if (!isAbsolute(text) || (process.platform === 'win32' && /^[\\/](?![\\/])/.test(text))) {
    throw invalid(uiMessage("workspace.use.a.fully.qualified.absolute.directory.such.as.d"))
  }
  const absolute = resolve(text)
  let info
  try {
    info = await stat(absolute)
  } catch {
    throw invalid(uiMessage("workspace.the.working.directory.does.not.exist.or.cannot.be", { p0: absolute }))
  }
  if (!info.isDirectory()) throw invalid(uiMessage("workspace.the.working.directory.is.not.a.directory.value", { p0: absolute }))
  return absolute
}

export async function conversationSettingsPatch(raw, nameKey = 'name') {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw invalid(uiMessage("savesettings.settings.must.be.a.json.object"))
  const patch = {}
  if (Object.hasOwn(raw, 'name')) {
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : ''
    if (!name) throw invalid(nameKey === 'displayName' ? uiMessage("workspace.the.meeting.name.cannot.be.empty") : uiMessage("workspace.the.chat.name.cannot.be.empty"))
    patch[nameKey] = name
  }
  if (Object.hasOwn(raw, 'workdir')) patch.workdir = await normalizeRoomWorkdir(raw.workdir)
  if (!Object.keys(patch).length) throw invalid(uiMessage("workspace.provide.a.name.or.working.directory"))
  return patch
}

export function runtimeWorkdir(container) {
  return typeof container?.workdir === 'string' && container.workdir.trim()
    ? container.workdir.trim()
    : process.cwd()
}

export function normalizeCoordinationFile(value, cwd) {
  const text = String(value ?? '').trim()
  if (!text || text.length > 1000) return null
  const absolute = resolve(cwd, text)
  return { key: process.platform === 'win32' ? absolute.toLowerCase() : absolute, path: absolute }
}
