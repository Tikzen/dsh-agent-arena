import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const iconRoot = resolve(root, 'node_modules', '@lobehub', 'icons-static-svg', 'icons')
const outputFile = resolve(root, 'src', 'client', 'brand-logos.generated.ts')

const sources = {
  deepseek: 'deepseek-color.svg',
  openai: 'openai.svg',
  claude: 'claude-color.svg',
  gemini: 'gemini-color.svg',
  qwen: 'qwen-color.svg',
  kimi: 'kimi-color.svg',
  grok: 'grok.svg',
  doubao: 'doubao-color.svg',
  metaai: 'metaai-color.svg',
  mistral: 'mistral-color.svg',
}

const logos = {}
for (const [id, file] of Object.entries(sources)) {
  const source = await readFile(resolve(iconRoot, file), 'utf8')
  logos[id] = source
    .replace(/\r?\n/g, '')
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" fill="currentColor" ')
}

const generated = `// Generated from @lobehub/icons-static-svg (MIT). Do not edit by hand.\nexport const BRAND_LOGOS = ${JSON.stringify(logos, null, 2)} as const\n\nexport type BrandLogoId = keyof typeof BRAND_LOGOS\n`
await writeFile(outputFile, generated, 'utf8')
