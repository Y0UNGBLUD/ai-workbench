<template>
  <div v-if="label || !!info" class="base-form__label">
    <span v-if="label" :class="[{ 'is-required': required }, labelClasses]">{{
      label
    }}</span>
    <span v-if="!!info">
      <span>i</span>
      <q-tooltip
        :class="[tooltipClass]"
        anchor="top middle"
        self="bottom middle"
        :offset="[0, 4]"
        >{{ info }}</q-tooltip
      >
    </span>
    <slot name="label-append"></slot>
  </div>
</template>
<script setup lang="ts">
import { QTooltip } from 'quasar'
defineProps<{
  label?: string | undefined
  required?: boolean | string
  labelClasses?: string | undefined
  info?: string | undefined
  tooltipClass?: string | undefined
}>()
</script>
