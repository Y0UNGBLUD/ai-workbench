<template>
  <div
    class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">403</div>

      <div class="text-h2" style="opacity: 0.4">접근 권한이 없습니다.</div>
      <q-btn
        color="white"
        text-color="primary"
        @click="$router.push('/')"
        class="q-mt-md"
        >홈으로 이동</q-btn
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { QBtn } from 'quasar'
</script>
