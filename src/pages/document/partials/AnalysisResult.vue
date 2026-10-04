<template>
  <article class="analysis-result">
    <section class="analysis-result__header">
      <!-- title -->
      <h2 v-if="title" class="analysis-result__title">{{ title }}</h2>
      <q-skeleton
        v-else
        square
        animation="fade"
        animation-speed="2500"
        class="analysis-result__title-skeleton" />
      <!-- hashtag -->
      <ul v-if="hashtags?.length" class="analysis-result__hashtags">
        <li
          v-for="(tag, index) in hashtags"
          :key="index"
          class="analysis-result__hashtag">
          {{ tag }}
        </li>
      </ul>
      <q-skeleton
        v-else
        square
        animation="fade"
        animation-speed="2500"
        class="analysis-result__hashtag-skeleton" />
    </section>
    <!-- content -->
    <section class="analysis-result__content" ref="contentContainerRef">
      <div v-if="!content" class="analysis-result__content-loading">
        <q-spinner size="lg" class="q-mb-md" />
        <span>내용을 분석중입니다.</span>
      </div>
      <template v-else>
        <div v-if="tocList.length" class="analysis-result__toc">
          <p class="analysis-result__toc-title">목차</p>
          <ul class="analysis-result__toc-list">
            <li
              v-for="item in tocList"
              :key="item.id"
              :style="{ paddingLeft: `${getPaddingByLevel(item.level)}px` }"
              class="analysis-result__toc-item">
              <span @click="scrollTo(item.id)">
                {{ item.number ? `${item.number}. ` : null }}{{ item.text }}
              </span>
            </li>
          </ul>
        </div>
        <div v-html="contentMarkdown" class="analysis-result__markdown"></div>
      </template>
    </section>
    <section class="analysis-result__footer">
      <div v-if="questions?.length" class="analysis-result__question">
        <span class="analysis-result__question-title">추천 질문</span>
        <ul class="analysis-result__question-list">
          <li
            v-for="(item, index) in questions"
            :key="index"
            class="analysis-result__question-item"
            @click="onClickQuestion(item)">
            <span>
              {{ item }}
            </span>
          </li>
        </ul>
      </div>
    </section>
  </article>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { watch, ref, nextTick } from 'vue'
import { QSkeleton, QSpinner } from 'quasar'
import { parseMarkdown } from '@/libs/markdown'
import { generateRandomId } from '@/utils/string'
import { usePdfViewerStore } from '@/stores/pdfViewer'
const pdfViewerStore = usePdfViewerStore()
// ===================================================
// 📐 Types / Interfaces
// ===================================================
export type Toc = {
  level: number
  text: string
  id: string
  number?: string | null
}

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = withDefaults(
  defineProps<{
    title: string | null
    hashtags: string[] | null
    content: string | null
    layout: string[] | null
    questions: string[] | null
    isLoading?: boolean
    isSseLoading?: boolean
    isError?: boolean
  }>(),
  {},
)
const emit = defineEmits<{
  (e: 'ask', question: string): void
}>()

// ===================================================
// 📦 State
// ===================================================
const contentContainerRef = ref<HTMLDivElement | null>(null)
const contentMarkdown = ref<string>('')
const tocList = ref<Toc[]>([])

// ===================================================
// ⚙️ Methods
// ===================================================

function parseHeadings(markdown: string) {
  const toc: Toc[] = []

  markdown.replace(
    /^(#{1,6})\s+(.+)$/gm,
    (_, hashes: string, title: string) => {
      const text = title.replace(/:$/, '')
      const id = generateRandomId(4)

      toc.push({
        level: hashes.length,
        text,
        id,
      })

      return _
    },
  )

  return {
    markdown,
    toc,
  }
}
function parseFootnotes(markdown: string) {
  let number = 0

  return markdown.replace(/\^\[(#\/text\/\d+)\]/g, (_, id: string) => {
    number += 1

    return `<sup
        class="footnote"
        data-footnote-id="${id}"
        data-footnote-number="${number}"
      >[${number}]</sup>`
  })
}
function applyHeadingIds(html: string, toc: Toc[]) {
  let index = 0

  return html.replace(
    /<h([1-6])>(.*?)<\/h\1>/g,
    (match, level: string, content: string) => {
      const item = toc[index++]

      if (!item) return match

      return `<h${level} id="${item.id}">${content}</h${level}>`
    },
  )
}
/**
 * 목차 레벨에 따른 padding 계산
 */
function getPaddingByLevel(level: number): number {
  if (level <= 1) return 0
  return (level - 1) * 12
}
/**
 * 스크롤 이동
 */
function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
/**
 * 각주 이벤트리스너
 */
function attachFootnoteListeners() {
  const container = contentContainerRef.value
  if (!container) return

  container.querySelectorAll<HTMLElement>('sup.footnote').forEach((el) => {
    el.onclick = () => {
      const id = el.dataset.footnoteId!
      const number = Number(el.dataset.footnoteNumber)

      // 기존 선택 상태 제거
      container
        .querySelectorAll('.is-selected')
        .forEach((n) => n.classList.remove('is-selected'))

      // 현재 각주 선택
      el.classList.add('is-selected')
      const parentBlock = findBlockParent(el, container)
      if (parentBlock) {
        container
          .querySelectorAll('.is-focus')
          .forEach((n) => n.classList.remove('is-focus'))
        parentBlock.classList.add('is-focus')
      }
      pdfViewerStore.selectFootnote(
        {
          id: id,
          number: number,
        },
        'content',
      )
    }
  })
}
/**
 *  부모 태그 찾기
 */
function findBlockParent(el: HTMLElement, container: HTMLElement) {
  let node: HTMLElement | null = el.parentElement
  while (node && node !== container) {
    const display = window.getComputedStyle(node).display
    if (
      display === 'block' ||
      display === 'list-item' ||
      display === 'table-cell'
    ) {
      return node
    }
    node = node.parentElement
  }
  return null
}

// ===================================================
// 🛠️ Actions
// ===================================================
/**
 * 컨텐츠 파싱
 */
async function parseContent(content: string) {
  // 1. Heading 분석 + TOC 생성
  const { markdown, toc } = parseHeadings(content)

  // 2. Footnote 변환
  const footnoteMarkdown = parseFootnotes(markdown)

  // 3. Markdown → HTML
  const html = await parseMarkdown(footnoteMarkdown)

  // 4. Heading에 TOC id 적용
  const processedHtml = applyHeadingIds(html, toc)

  return {
    html: processedHtml,
    toc,
  }
}

/**
 * 질문 전송
 */
const onClickQuestion = (question: string) => {
  emit('ask', question)
}
// ===================================================
// 👀 Watchers
// ===================================================
watch(
  () => props.content,
  async (val) => {
    if (!val) return
    const { html, toc } = await parseContent(val)
    contentMarkdown.value = html
    tocList.value = toc
    await nextTick()
    attachFootnoteListeners()
  },
)
</script>
<style lang="scss" scoped>
.analysis-result {
  padding: 24px;
  max-width: 640px;
  margin: auto;
  &__header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  &__title {
    font-weight: 700;
    font-size: mixin.rem(32px);
    line-height: mixin.rem(40px);
  }
  &__title-skeleton {
  }
  &__hashtags {
    @include mixin.list-reset();
    display: flex;
    margin-top: 12px;
  }
  &__hashtag {
    font-size: mixin.rem(15px);
    font-weight: 500;
    background: var(--butter);
    padding: 2px 8px;
    border-radius: 4px;
    &::before {
      content: '#';
      margin-right: 4px;
    }
    &:not(:last-child) {
      margin-right: 4px;
    }
  }
  &__hashtag-skeleton {
  }
  // content
  &__content {
  }
  &__content-loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 100px 0;
    font-size: mixin.rem(16px);
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  &__toc {
    background: var(--color-background);
    padding: 12px 16px;
    margin-bottom: 32px;
  }
  &__toc-title {
    font-size: mixin.rem(14px);
    font-weight: 700;
  }
  &__toc-list {
    @include mixin.list-reset();
  }
  &__toc-item {
    > span {
      cursor: pointer;
      font-size: mixin.rem(15px);
      font-weight: 500;
      &:hover {
        background-image: linear-gradient(
          to top,
          var(--color-primary) 40%,
          transparent 10%,
          transparent 50%
        );
        display: inline;
      }
    }
  }
  // footer
  &__footer {
  }
  &__question {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  &__question-title {
    font-size: mixin.rem(14px);
    font-weight: 700;
    margin-bottom: 4px;
    display: block;
  }
  &__question-list {
    // @include mixin.list-reset();
    margin: 0;
    padding-left: 16px;
  }
  &__question-item {
    font-size: mixin.rem(15px);
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    span {
      transition: all 300ms;
      &:hover {
        color: var(--color-text-primary);
        background-image: linear-gradient(
          to top,
          var(--color-primary) 40%,
          transparent 10%,
          transparent 50%
        );
        display: inline;
      }
    }
  }
}
.analysis-result__markdown:deep() {
  font-size: mixin.rem(16px);
  line-height: mixin.rem(21px);
  color: var(--color-text-secondary);
  word-break: keep-all;
  white-space: normal;
  .is-focus {
    background: color-mix(
      in srgb,
      rgb(var(--viewer-highlight-color)) 10%,
      transparent
    );
    color: var(--color-text-primary);
  }
  sup {
    font-weight: 600;
    cursor: pointer;
    top: initial;
    vertical-align: top;
    font-size: mixin.rem(14px);
    line-height: mixin.rem(20px);
    &.is-selected {
      color: color-mix(in srgb, rgb(var(--viewer-highlight-color)) 80%, #000);
    }
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-text-primary);
    font-weight: 700;
    margin: 16px 0 8px;
  }
  h1 {
    font-size: mixin.rem(26px);
    line-height: mixin.rem(32px);
  }
  h2 {
    font-size: mixin.rem(22px);
    line-height: mixin.rem(28px);
  }
  h3 {
    font-size: mixin.rem(22px);
    line-height: mixin.rem(26px);
  }
  h4 {
    font-size: mixin.rem(20px);
    line-height: mixin.rem(24px);
  }
  h5 {
    font-size: mixin.rem(18px);
    line-height: mixin.rem(22px);
  }
  h6 {
    font-size: mixin.rem(16px);
    line-height: mixin.rem(20px);
  }

  ul {
    list-style: disc;
  }
  ol {
    list-style: decimal;
  }
  ul,
  ol {
    margin-block-start: 0.5em;
    margin-block-end: 0.5em;
    padding-inline-start: 16px;
    white-space: normal;
    list-style-position: inside;
    > li > p:first-of-type {
      display: inline;
    }
  }
  li + li {
    margin-top: 8px;
  }
  p {
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    line-height: inherit;
    white-space: pre-line;
  }
  > p ~ p {
    margin-top: 8px;
  }
  hr {
    border-style: solid;
    border-color: var(--color-border);
    margin: 16px 0;
  }
  strong {
    color: var(--color-text-primary);
    font-weight: 700;
  }
  pre {
    background: var(--gray-800);
    color: var(--gray-50);
    padding: 12px;
    border-radius: 4px;
    overflow: auto;
    > code {
      padding: 0;
      margin: 0;
      background: inherit;
      color: inherit;
    }
  }
  code {
    background: var(--gray-800);
    color: var(--gray-50);
    padding: 4px;
    border-radius: 4px;
    font-size: mixin.rem(14px);
    line-height: mixin.rem(18px);
    margin: 0 2px;
  }
  table {
    width: 100%;
    border: 1px solid var(--color-border);
    border-collapse: collapse;
    table-layout: auto;
    thead {
      th {
        background: var(--color-border);
        height: 40px;
        padding: 4px;
        &:not(:last-child) {
          border-right: 1px solid var(--color-border);
        }
      }
    }
    tbody {
      td {
        height: 48px;
        padding: 4px;
        word-break: keep-all;
        &:not(:last-child) {
          border-right: 1px solid var(--color-border);
        }
      }
      tr:not(:last-child) {
        td {
          border-bottom: 1px solid var(--color-border);
        }
      }
    }
  }
  blockquote {
    margin: 12px;
    border-left: 8px solid var(--color-border);
    padding: 12px 16px;
    background: var(--color-background);
    color: var(--color-text-secondary);
    font-size: mixin.rem(14px);
    line-height: mixin.rem(18px);
    * {
      color: inherit;
    }
  }
}
</style>
