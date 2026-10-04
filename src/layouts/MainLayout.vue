<template>
  <q-layout view="lHh lpR lFf">
    <GlobalHeader />
    <Sidebar />
    <q-page-container>
      <router-view></router-view>
    </q-page-container>
  </q-layout>
</template>
<script lang="ts" setup>
import { QLayout, QPageContainer } from 'quasar'
import GlobalHeader from '@/components/layouts/GlobalHeader.vue'
import Sidebar from '@/components/layouts/Sidebar.vue'
</script>
