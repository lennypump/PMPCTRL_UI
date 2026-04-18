<template>
  <div class="bg-grey-darken-4 pa-2">
    <div class="ml-2 mr-2 mb-1">SEQUENCE_STATUS</div>
    <div v-if="store.sequenceStatus" class="ml-2 mr-2">
      <div class="text-h5 font-weight-black mb-1">
        Schritt {{ (store.sequenceStatus.step_index ?? 0) + 1 }} / {{ store.sequenceStatus.total_steps }}:
        {{ store.sequenceStatus.step_label || '—' }}
      </div>
      <div class="mb-2">
        Aktion: <strong class="text-uppercase">{{ store.sequenceStatus.step_action || '—' }}</strong>
      </div>
      <v-progress-linear
        :model-value="progressPercent"
        color="grey-lighten-1"
        bg-color="grey-darken-2"
        height="12"
        rounded
      ></v-progress-linear>
      <div class="text-right text-caption mt-1">
        {{ Math.round(progressPercent) }}%
      </div>
    </div>
    <div v-else class="ml-2 mr-2 text-grey">
      Keine aktive Sequence
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { usePmpctrlStore } from '@/store'

const store = usePmpctrlStore()

const progressPercent = computed(() => {
  const s = store.sequenceStatus
  if (!s || !s.total_steps) return 0
  return ((s.step_index ?? 0) + 1) / s.total_steps * 100
})

let pollInterval = null

onMounted(async () => {
  await store.fetchSequenceStatus()
  if (store.sequenceStatus?.active && store.sequenceStatus?.name) {
    if (!store.activeSequence || store.activeSequence.name !== store.sequenceStatus.name) {
      await store.loadSequence(store.sequenceStatus.name)
    }
  }
  pollInterval = setInterval(async () => {
    await store.fetchSequenceStatus()
    if (store.sequenceStatus?.active && store.sequenceStatus?.name) {
      if (!store.activeSequence || store.activeSequence.name !== store.sequenceStatus.name) {
        await store.loadSequence(store.sequenceStatus.name)
      }
    }
  }, 500)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
</script>
