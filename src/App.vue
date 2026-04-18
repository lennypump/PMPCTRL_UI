<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
</script>

<template>
  <div style="position: relative; min-height: 100vh;">
    <div style="position: absolute; top: 8px; right: 8px; z-index: 100;">
      <v-btn
        v-if="route.path === '/'"
        icon="mdi-format-list-bulleted"
        size="small"
        variant="tonal"
        color="grey-darken-2"
        @click="router.push('/sequences')"
      />
      <v-btn
        v-else
        icon="mdi-home"
        size="small"
        variant="tonal"
        color="grey-darken-2"
        @click="router.push('/')"
      />
    </div>
    <RouterView />
  </div>
</template>
