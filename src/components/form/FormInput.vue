<template>
  <div class="base-form base-form--input">
    <FormLabel
      v-if="label"
      :label="label"
      :required="!!required"
      :label-classes="labelClasses"
      :info="info"
      :tooltip-class="tooltipClass" />
    <q-input
      v-model="modelValue"
      :type="type ? type : 'text'"
      :placeholder="placeholder ? placeholder : ''"
      :autocomplete="autocomplete ? autocomplete : null"
      :autofocus="!!autofocus"
      :outlined="borderless ? false : true"
      :label="undefined"
      :borderless="!!borderless"
      :readonly="!!readonly"
      :disable="!!disable"
      :maxlength="max"
      :hide-hint="hideHint"
      :error="hasError"
      no-error-icon
      @keydown.enter="$emit('enter', $event)"
      @update:model-value="$emit('update', $event)"
      dense
      class="base-form__input"
      :class="{
        'no-bottom': (!hasError && !hint) || hideBottom,
      }"
      v-bind="$attrs">
      <template #prepend>
        <slot name="prepend"></slot>
      </template>
      <template #append>
        <slot name="append"></slot>
      </template>
      <template #hint>
        {{ hint }}
      </template>
      <template #error>
        {{ errorMsg }}
      </template>
    </q-input>
  </div>
</template>
<script setup lang="ts">
import { QInput } from 'quasar'
import { computed } from 'vue'
import FormLabel from '@/components/form/FormLabel.vue'
const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    required?: boolean | string
    type?:
      | 'text'
      | 'number'
      | 'email'
      | 'password'
      | 'tel'
      | 'search'
      | 'url'
      | 'date'
      | 'time'
      | 'datetime-local'
      | 'file'
      | 'textarea'
    autocomplete?: boolean | string
    autofocus?: boolean | string
    borderless?: boolean | string
    errorMsg?: string | undefined
    readonly?: boolean | string
    disable?: boolean | string
    variant?: 'normal' | 'slim'
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
    type: 'text',
    autocomplete: '',
    autofocus: false,
    borderless: false,
    errorMsg: '',
    readonly: false,
    disable: false,
    variant: 'normal',
  },
)
const modelValue = defineModel<string | number | null>({
  required: true,
})
const emit = defineEmits<{
  (e: 'enter', data: KeyboardEvent): void
  (e: 'update', data: any): void
}>()
const hasError = computed(() => props.errorMsg !== '')
</script>
