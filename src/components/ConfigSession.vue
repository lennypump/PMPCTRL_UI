<template>
<div class="bg-grey-darken-4 pa-2">
    <div class="ml-2 mr-2">
      MODE_SETTINGS
    </div>
    <div class="ml-2 mr-2">
      <span class="text-h4 font-weight-black">
        ACTIVE: {{ store.getModeActive }}
      </span>
    </div>
    <div class="ml-2 mr-2 d-flex justify-center">
      <table class="w-100">
        <tbody>
          <tr>
            <td>MODE</td>
            <td>
              <v-select
                class="text-uppercase"
                density="comfortable"
                v-model="selectedMode"
                hide-details="true"
                :items="modeItems"
              >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  v-html="item.title"
                  class="text-uppercase"
                />
              </template>
              </v-select>
            </td>
          </tr>
          <tr :class="{'d-none': showPulsatingSettings || showSequenceSettings}">
            <td>TARGET TOL PLUS (+)</td>
            <td>
              <v-number-input
                density="comfortable"
                v-model="tolerancePlus"
                label="MBAR"
                controlVariant="split"
                hide-details="true"
                :min="0"
                :precision="1"
                :step="0.1"
              ></v-number-input>
            </td>
          </tr>
          <tr :class="{'d-none': showPulsatingSettings || showSequenceSettings}">
            <td>TARGET TOL MINUS (-)</td>
            <td>
              <v-number-input
                density="comfortable"
                v-model="toleranceMinus"
                label="MBAR"
                controlVariant="split"
                hide-details="true"
                :min="0"
                :precision="1"
                :step="0.1"
              ></v-number-input>
            </td>
          </tr>
          <tr :class="{'d-none': !showIntervalSettings}">
            <td>PEAK PRESSURE</td>
            <td>
              <v-number-input
                density="comfortable"
                v-model="peakPressure"
                label="MBAR"
                controlVariant="split"
                hide-details="true"
                :min="0"
                :precision="1"
                :step="1"
              ></v-number-input>
            </td>
          </tr>
          <tr :class="{'d-none': !showIntervalSettings}">
            <td>INTERVAL TIME</td>
            <td>
              <v-number-input
                density="comfortable"
                v-model="intervalTime"
                label="SECONDS"
                controlVariant="split"
                hide-details="true"
                :min="0"
                :precision="1"
                :step="0.1"
              ></v-number-input>
            </td>
          </tr>
          <tr :class="{'d-none': !showPulsatingSettings}">
            <td>PUMP TIME</td>
            <td>
              <v-number-input
                density="comfortable"
                v-model="pumpTime"
                label="SECONDS"
                controlVariant="split"
                hide-details="true"
                :min="0"
                :precision="1"
                :step="0.1"
              ></v-number-input>
            </td>
          </tr>
          <tr :class="{'d-none': !showPulsatingSettings}">
            <td>RELEASE TIME</td>
            <td>
              <v-number-input
                density="comfortable"
                v-model="releaseTime"
                label="SECONDS"
                controlVariant="split"
                hide-details="true"
                :min="0"
                :precision="1"
                :step="0.1"
              ></v-number-input>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showSequenceSettings" class="ml-2 mr-2 mt-2">
      <div class="bg-grey-darken-3 pa-2 rounded">
        <div class="text-caption mb-1">SEQUENCE_CONTROL</div>
        <div class="mb-2">
          Aktiv: <strong>{{ store.sequenceStatus?.name || '—' }}</strong>
        </div>
        <v-btn
          class="w-100 mb-3"
          height="40"
          color="grey-darken-2"
          append-icon="mdi-arrow-right"
          @click="router.push('/sequences')"
        >
          Sequences verwalten
        </v-btn>
        <div class="text-caption mb-1">LEVEL</div>
        <v-slider
          v-model="levelFactor"
          min="0.5"
          max="1.5"
          step="0.01"
          hide-details
          thumb-label
        >
          <template v-slot:thumb-label>{{ Math.round(levelFactor * 100) }}%</template>
        </v-slider>
        <div class="text-center mb-2">{{ Math.round(levelFactor * 100) }}%</div>
        <v-btn
          class="w-100"
          height="40"
          color="grey-darken-2"
          prepend-icon="mdi-check"
          :loading="applyingLevel"
          @click="applyLevel"
        >
          APPLY
        </v-btn>
      </div>
    </div>

    <div class="ml-2 mr-2 mt-4 mb-2 d-flex justify-center">
      <v-btn
        class="text-h5 w-100"
        height="70"
        color="grey-darken-3"
        prepend-icon="mdi-reload"
        @click="update"
      >
        <b>UPDATE</b>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
  import { usePmpctrlStore } from '@/store'
  import { computed, onBeforeUpdate, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { VNumberInput } from 'vuetify/labs/VNumberInput'

  const emit = defineEmits(['updateTolerances',
                            'updateMode',
                            'updateModeInterval',
                            'updateModePulsating'])

  const store = usePmpctrlStore()
  const router = useRouter()

  let selectedMode = ref()
  let tolerancePlus = ref()
  let toleranceMinus = ref()
  let peakPressure = ref()
  let intervalTime = ref()
  let pumpTime = ref()
  let releaseTime = ref()
  let levelFactor = ref(1.0)
  let applyingLevel = ref(false)

  let oldMode
  let oldTolerancePlus
  let oldToleranceMinus
  let oldPreakPressure
  let oldIntervalTime
  let oldPumpTime
  let oldReleaseTime

  const modeItems = computed(() => {
    const available = store.mode.available
    if (Array.isArray(available) && !available.includes('sequence')) {
      return [...available, 'sequence']
    }
    return available || []
  })

  const showPulsatingSettings = computed(() => {
    return selectedMode.value == 'pulsating' ? true : false
  })

  const showIntervalSettings = computed(() => {
    return selectedMode.value == 'interval' ? true : false
  })

  const showSequenceSettings = computed(() => {
    return selectedMode.value === 'sequence'
  })

  async function applyLevel() {
    if (!store.activeSequence) return
    applyingLevel.value = true
    try {
      const updated = { ...store.activeSequence, level_factor: levelFactor.value }
      await store.saveSequence(store.activeSequence.name, updated)
      await store.activateSequence(store.activeSequence.name)
      store.activeSequence.level_factor = levelFactor.value
    } finally {
      applyingLevel.value = false
    }
  }

  function update() {
    emit('updateMode', selectedMode.value)
    if (selectedMode.value == 'hold' || selectedMode.value == 'interval') {
      let value = {
        'tolerance_plus' : tolerancePlus.value,
        'tolerance_minus' : toleranceMinus.value
      }
      emit('updateTolerances', value)
    }
    if (selectedMode.value == 'interval') {
      let value = {
        'peak_pressure': peakPressure.value,
        'interval_time': intervalTime.value
      }
      emit('updateModeInterval', value)

    }
    else if (selectedMode.value == 'pulsating') {
      let value = {
        'pump_time' : pumpTime.value,
        'release_time' : releaseTime.value
      }
      emit('updateModePulsating', value)
    }
  }

  onBeforeUpdate(() => {
    if (oldMode != store.mode.active) {
      selectedMode.value = store.mode.active
      oldMode = store.mode.active
    }
    if (oldTolerancePlus != store.pressure.target.tolerance_plus) {
      tolerancePlus.value = store.pressure.target.tolerance_plus
      oldTolerancePlus = store.pressure.target.tolerance_plus
    }
    if (oldToleranceMinus != store.pressure.target.tolerance_minus) {
      toleranceMinus.value = store.pressure.target.tolerance_minus
      oldToleranceMinus = store.pressure.target.tolerance_minus
    }
    if (oldPreakPressure != store.mode.interval.peak_pressure) {
      peakPressure.value = store.mode.interval.peak_pressure
      oldPreakPressure = store.mode.interval.peak_pressure
    }
    if (oldIntervalTime != store.mode.interval.interval_time) {
      intervalTime.value = store.mode.interval.interval_time
      oldIntervalTime = store.mode.interval.interval_time
    }
    if (oldPumpTime != store.mode.pulsating.pump_time) {
      pumpTime.value = store.mode.pulsating.pump_time
      oldPumpTime = store.mode.pulsating.pump_time
    }
    if (oldReleaseTime != store.mode.pulsating.release_time) {
      releaseTime.value = store.mode.pulsating.release_time
      oldReleaseTime = store.mode.pulsating.release_time
    }
    if (store.activeSequence?.level_factor !== undefined) {
      levelFactor.value = store.activeSequence.level_factor
    }
  })
</script>
