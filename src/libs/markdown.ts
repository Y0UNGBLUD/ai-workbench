import type { Tokens } from 'marked'
import type * as MarkedModule from 'marked'
import type * as DOMPurifyModule from 'dompurify'
import type * as KatexModule from 'katex'

export interface ParseMarkdownOptions {
  sanitize?: boolean
  transformLayoutBlocks?: boolean
  renderMath?: boolean
}

let markedLib: typeof MarkedModule | null = null
let DOMPurifyLib: typeof DOMPurifyModule | null = null
let katexLib: typeof KatexModule | null = null

let isMarkedInitialized = false
let isPurifyInitialized = false

async function getMarked() {
  if (!markedLib) {
    markedLib = await import('marked')
  }

  return markedLib.marked
}

async function getPurify() {
  if (!DOMPurifyLib) {
    DOMPurifyLib = await import('dompurify')
  }

  return DOMPurifyLib.default
}

async function getKatex() {
  if (!katexLib) {
    await import('katex/dist/katex.min.css')
    katexLib = await import('katex')
  }

  return katexLib.default
}

async function initMarked() {
  if (isMarkedInitialized) return

  const marked = await getMarked()

  marked.use({
    tokenizer: {
      del() {
        return undefined
      },
    },
    renderer: {
      link(token: Tokens.Link) {
        const title = token.title ? ` title="${token.title}"` : ''

        return `<a href="${token.href}"${title} target="_blank" rel="noopener noreferrer">${token.text}</a>`
      },
    },
  })

  isMarkedInitialized = true
}

async function initPurify() {
  if (isPurifyInitialized) return

  const DOMPurify = await getPurify()

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })

  isPurifyInitialized = true
}

function transformLayoutBlocks(md: string): string {
  const regex =
    /<!--\s*start id:\s*(.*?)\s*-->\s*([\s\S]*?)\s*<!--\s*end id:\s*\1\s*-->/g

  return md.replace(regex, (_, id, content) => {
    return `<div data-layout-id="${id}">\n${content}\n</div>`
  })
}

async function renderMath(html: string): Promise<string> {
  const katex = await getKatex()

  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      })
    } catch {
      return _
    }
  })

  html = html.replace(/\$([\s\S]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      })
    } catch {
      return _
    }
  })

  return html
}

export async function parseMarkdown(
  md: string,
  options: ParseMarkdownOptions = {},
): Promise<string> {
  const {
    sanitize = true,
    transformLayoutBlocks: useLayoutBlocks = false,
    renderMath: useMath = false,
  } = options

  if (!md) return ''

  await initMarked()

  if (sanitize) {
    await initPurify()
  }

  const marked = await getMarked()

  const input = useLayoutBlocks ? transformLayoutBlocks(md) : md

  let html = await marked.parse(input)

  if (useMath) {
    html = await renderMath(html)
  }

  if (sanitize) {
    const DOMPurify = await getPurify()

    html = DOMPurify.sanitize(html, {
      ADD_ATTR: ['data-layout-id'],
    })
  }

  return html
}
