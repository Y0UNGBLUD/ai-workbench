<template>
  <q-list dense>
    <q-item v-for="i in 10" :key="i">
      <q-skeleton square width="100%"></q-skeleton>
    </q-item>
  </q-list>
</template>
<script setup lang="ts">
import { QList, QItem, QSkeleton } from 'quasar'
</script>
