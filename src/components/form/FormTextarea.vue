<template>
  <div class="base-form base-form--textarea">
    <label>
      <FormLabel
        :label="label ?? ''"
        :required="!!required"
        :label-classes="labelClasses"
        :info="info"
        :tooltip-class="tooltipClass" />
      <q-input
        ref="qInputRef"
        v-model="modelValue"
        type="textarea"
        :placeholder="placeholder ? placeholder : ''"
        :autocomplete="autocomplete ? autocomplete : null"
        :autofocus="!!autofocus"
        :autogrow="autogrow"
        :outlined="borderless ? false : true"
        :borderless="!!borderless"
        :readonly="!!readonly"
        :disable="!!disable"
        :maxlength="max"
        :hint="hint"
        :hide-hint="hideHint"
        :error="hasError"
        no-error-icon
        spellcheck="false"
        dense
        :rows="rows"
        v-bind="$attrs"
        @keydown="handleKeydown"
        class="base-form__input"
        :class="{ 'no-bottom': (!hasError && !hint) || hideBottom }">
        <template #hint>
          {{ hint }}
        </template>
        <template #error>
          {{ errorMsg }}
        </template>
      </q-input>
    </label>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { QInput } from 'quasar'
import FormLabel from './FormLabel.vue'

// ===================================================
// 📥 Props / Emits
// ===================================================
const modelValue = defineModel<string>({
  required: true,
})

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string | undefined
    required?: boolean | string
    autocomplete?: boolean | string
    autofocus?: boolean | string
    borderless?: boolean | string
    errorMsg?: string | undefined
    readonly?: boolean | string
    disable?: boolean | string
    hasError?: boolean
    rows?: string | number
    autogrow?: boolean
    enterToSend?: boolean
    max?: string | number
    hint?: string
    hideHint?: boolean
    hideBottom?: boolean
    labelClasses?: string
    info?: string
    tooltipClass?: string
  }>(),
  {
    label: '',
    placeholder: '',
    required: false,
    autocomplete: '',
    autofocus: false,
    borderless: false,
    errorMsg: '내용을 입력하세요.',
    readonly: false,
    disable: false,
    rows: 1,
    autogrow: true,
    enterToSend: false,
  },
)

const emit = defineEmits<{
  (e: 'enter'): void
}>()

// ===================================================
// ✏️ expose method
// ===================================================
const qInputRef = ref()
defineExpose({
  focus: () => qInputRef.value?.focus(),
  blur: () => qInputRef.value?.blur(),
  qInputRef,
})

// ===================================================
// ⚙️ Methods
// ===================================================
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.enterToSend) return
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // shift+enter : 줄바꿈 허용
      return
    } else {
      // enter 단독 : send 이벤트 발생 + 기본 동작 막기
      e.preventDefault()
      emit('enter')
    }
  }
}
</script>
