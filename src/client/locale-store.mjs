import { dictionaries, formatMessage, LOCALE_NAMESPACE, normalizeLocale } from '../localization.mjs'

let nativeLocale
let nativeTranslate
const listeners = new Set()
const notify = () => { for (const listener of listeners) listener() }

export function subscribeLocale(listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function activeLocale() {
  return normalizeLocale(nativeLocale?.getLocale().active ?? 'zh')
}

/** Subscribe to DSH without writing its preferences or storing a second one. */
export function installArenaLocale(service) {
  const disposeZh = service.register(LOCALE_NAMESPACE, 'zh', dictionaries.zh)
  let disposeEn
  try { disposeEn = service.register(LOCALE_NAMESPACE, 'en', dictionaries.en) }
  catch (error) { disposeZh(); throw error }
  nativeLocale = service
  nativeTranslate = service.bind(LOCALE_NAMESPACE)
  const unsubscribe = service.subscribe(notify)
  notify()
  return () => {
    unsubscribe()
    if (nativeLocale === service) { nativeLocale = undefined; nativeTranslate = undefined }
    disposeEn()
    disposeZh()
    notify()
  }
}

export function translate(key, params = {}) {
  return nativeTranslate ? nativeTranslate(key, params) : formatMessage(key, params, activeLocale())
}
