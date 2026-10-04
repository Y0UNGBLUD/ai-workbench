<template>
  <q-header bordered height-hint="98" class="global-header">
    <q-toolbar>
      <div class="global-header__left">
        <q-btn
          aria-label="Toggle drawer"
          flat
          @click="uiStore.toggleLNB"
          round
          dense
          icon="menu" />
      </div>

      <div class="global-header__contents"></div>
      <div class="global-header__right">
        <div id="globalHeaderActions"></div>
      </div>
    </q-toolbar>
  </q-header>
</template>
<script setup lang="ts">
import { QHeader, QToolbar, QToolbarTitle, QBtn } from 'quasar'
import { useUiStore } from '@/stores/ui'
const uiStore = useUiStore()
</script>
<style lang="scss" scoped>
.global-header {
  background: var(--color-surface);
  color: var(--text-primary);
  border-color: var(--ink);
  border-width: 2px;
  &__left {
    margin-right: auto;
  }
  &__contents {
    flex-grow: 1;
  }
  &__left {
    margin-left: auto;
  }
}
</style>
