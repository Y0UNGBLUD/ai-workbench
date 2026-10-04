<template>
  <q-btn
    :color="color"
    unelevated
    :rounded="!!rounded"
    :type="type"
    :to="to"
    :size="size"
    :outline="!!outline"
    :loading="loading"
    :dense="!!dense"
    :disable="!!disable"
    :text-color="textColor"
    class="base-btn"
    :class="[classes]"
    v-bind="$attrs">
    <span v-if="label" :class="{ a11y: a11y }">{{ label }}</span>
    <q-tooltip
      v-if="useTooltip"
      class=""
      anchor="bottom middle"
      self="top middle"
      :offset="[10, 4]"
      >{{ label }}</q-tooltip
    >
    <slot></slot>
  </q-btn>
</template>
<script setup lang="ts">
import { QBtn, QTooltip } from 'quasar'
withDefaults(
  defineProps<{
    label?: string
    color?: string
    size?: string
    rounded?: boolean | string
    type?: string
    to?: string
    disable?: boolean
    outline?: boolean | string
    loading?: boolean | null
    dense?: boolean | string
    a11y?: boolean | string
    useTooltip?: boolean
    classes?: string
    textColor?: string
  }>(),
  {
    label: '',
    color: 'primary',
    textColor: 'dark',
    size: 'md',
    rounded: false,
    type: 'button',
    disable: false,
    a11y: false,
    useTooltip: false,
    classes: '',
  },
)
</script>
<style lang="scss" scoped>
.base-btn {
}
</style>
