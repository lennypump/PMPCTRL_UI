<template>
  <div class="bg-grey-darken-4 pa-2">
    <div class="ml-2 mr-2">
      LIGHTS
    </div>
    <div class="ml-2 mr-2">
      <span class="text-h4 font-weight-black">
        {{ store.getLightshow }}
      </span>
    </div>
    <div class="ma-2 d-flex justify-center">
      <v-btn
        class="text-h5 w-100"
        height="70"
        color="grey-darken-3"
        @click="onOff">
        <template v-slot:prepend>
          <v-icon
            :class="{
                      'text-purple': store.getLightshow == 'ON',
                      'text-grey': store.getLightshow == 'OFF'
          }">
            mdi-party-popper
          </v-icon>
        </template>
          <b>LIGHTSHOW {{ store.getLightshow == 'ON' ? 'OFF' : 'ON' }}</b>
      </v-btn>
    </div>

    <div v-if="colorsLoaded" class="ma-2 pt-2">
      <div class="text-caption mb-1">COLORS</div>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-for="profile in PROFILES"
          :key="profile.key"
          class="flex-grow-1"
          color="grey-darken-3"
          height="48"
          @click="openPicker(profile.key)">
          <template v-slot:prepend>
            <span class="swatch" :style="{ backgroundColor: store.ledColors[profile.key] }"></span>
          </template>
          {{ profile.label }}
        </v-btn>
      </div>
      <div class="d-flex justify-end mt-1">
        <v-btn
          variant="text"
          size="small"
          :disabled="!hasChanges"
          @click="resetAll">
          RESET ALL
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="pickerOpen" max-width="340">
      <v-card class="bg-grey-darken-4">
        <v-card-title>{{ editingLabel }}</v-card-title>
        <v-card-text class="d-flex justify-center">
          <v-color-picker
            v-model="pickerValue"
            :modes="['rgb', 'hex']"
            mode="hex"
            show-swatches
            :swatches="swatches"
            swatches-max-height="120"
            elevation="0"
            bg-color="grey-darken-4">
          </v-color-picker>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="pickerValue = store.ledColorDefaults[editingKey]">
            DEFAULT
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="pickerOpen = false">CANCEL</v-btn>
          <v-btn variant="tonal" :loading="saving" @click="save">SAVE</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { usePmpctrlStore } from '@/store';
  import { computed, onMounted, ref } from 'vue'

  const store = usePmpctrlStore()

  const emit = defineEmits(['lightsOn', 'lightsOff'])

  const PROFILES = [
    { key: 'hold', label: 'HOLD' },
    { key: 'interval', label: 'INTERVAL' },
    { key: 'pulsating', label: 'PULSATING' },
    { key: 'sequence', label: 'SEQUENCE' },
    { key: 'idle', label: 'IDLE' },
  ]

  const colorsLoaded = ref(false)
  const pickerOpen = ref(false)
  const pickerValue = ref('#000000')
  const editingKey = ref(null)
  const saving = ref(false)

  const editingLabel = computed(() => {
    const profile = PROFILES.find(p => p.key == editingKey.value)
    return profile ? `COLOR ${profile.label}` : ''
  })

  // Presets (the Pi's named colors), four per swatch column
  const swatches = computed(() => {
    const colors = Object.values(store.ledColorPresets)
    const columns = []
    for (let i = 0; i < colors.length; i += 4) {
      columns.push(colors.slice(i, i + 4))
    }
    return columns
  })

  const hasChanges = computed(() => {
    return PROFILES.some(p => store.ledColors[p.key] != store.ledColorDefaults[p.key])
  })

  function onOff() {
    store.getLightshow == 'ON' ? emit('lightsOff') : emit('lightsOn')
  }

  function openPicker(key) {
    editingKey.value = key
    pickerValue.value = store.ledColors[key]
    pickerOpen.value = true
  }

  async function save() {
    saving.value = true
    try {
      // v-color-picker may return #rrggbbaa - the Pi wants #rrggbb
      await store.saveLedColor(editingKey.value, pickerValue.value.slice(0, 7))
      pickerOpen.value = false
    } catch (error) {
      alert(`Saving color failed: ${error.response?.data?.detail ?? error.message}`)
    } finally {
      saving.value = false
    }
  }

  async function resetAll() {
    try {
      await store.resetLedColors()
    } catch (error) {
      alert(`Reset failed: ${error.response?.data?.detail ?? error.message}`)
    }
  }

  onMounted(async () => {
    try {
      await store.fetchLedColors()
      colorsLoaded.value = true
    } catch {
      // older backend without /lights/colors - just hide the color section
      colorsLoaded.value = false
    }
  })
</script>

<style scoped>
  .swatch {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
</style>
