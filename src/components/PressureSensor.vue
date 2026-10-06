<template>
  <div class="bg-grey-darken-4 pa-2">
    <div class="ml-2 mr-2">
      PRESSURE_SENSOR
    </div>
    <div class="ml-2 mr-2 d-flex flex-row justify-space-between">
      <div>
        <span class="text-h4 font-weight-black">
          {{ store.getPressureActual }}
        </span><strong>MBAR</strong>
      </div>
      <div>
        <span class="text-h4">
          {{ store.getPressureDiff }}
        </span>MBAR
      </div>
    </div>
    <div class="ml-2 mr-2 pb-2 font-weight-black" style="line-height: 0.2;">
      {{ store.getPressureSetpoint }} &#8793; 0
    </div>
    <div class="ml-2 mr-2 d-flex flex-row justify-space-between">
      <div>
        <span class="text-h4 font-weight-black">
          {{ store.getPressureActualInhg }}
        </span><strong>INHG</strong>
      </div>
      <div>
        <span class="text-h4">
          {{ store.getPressureDiffInhg }}
        </span><span>INHG</span>
      </div>
    </div>
    <div class="ml-2 mr-2 pb-2 font-weight-black" style="line-height: 0.2;">
      {{ store.getPressureSetpointInhg }} &#8793; 0
    </div>

    <!-- Grafik korrekt innerhalb der Kachel -->
    <div class="ma-2 bg-grey-darken-3" style="position: relative; height: 150px;">
      <v-sparkline
        :model-value="store.pressure.actual_history"
        line-width=2
        color="white"
        padding="2"
        stroke-linecap="round"
        smooth
        :max="chartMax"
        :min="chartMin"
        style="width: 100%; height: 100%"
      ></v-sparkline>
      <v-sparkline
        :model-value="store.pressure.target.target_history"
        line-width=1
        color="blue"
        padding="2"
        stroke-linecap="round"
        smooth
        :max="chartMax"
        :min="chartMin"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
      ></v-sparkline>
    </div>

    <!-- Statusmeldung -->
    <div class="ml-2 mr-2 mt-1 text-caption">
      <span v-if="store.pressure.sensor_available === true" class="text-green">
        ✓ Sensor aktiv
      </span>
      <span v-else-if="store.pressure.sensor_available === false" class="text-red">
        ✗ Sensor nicht verfügbar
      </span>
    </div>

    <div class="ml-2 mr-2 d-flex flex-row justify-end">
      <v-switch
        v-model="autoSetpoint"
        :model-value="store.pressure.auto_setpoint"
        hide-details="true"
        color="blue"
        label="AUTO-SETPOINT"
        @update:modelValue="changeAutoSetpoint"
      ></v-switch>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePmpctrlStore } from '@/store'

const emit = defineEmits(['changeAutoSetpoint'])

const store = usePmpctrlStore()

const autoSetpoint = ref(store.pressure.auto_setpoint)

const chartMax = computed(() => {
  let maxPressure = Math.max.apply(Math, store.pressure.actual_history)
  let maxTarget = Math.max.apply(Math, store.pressure.target.target_history)
  if (maxPressure > maxTarget) { return maxPressure }
  else { return maxTarget }
})

const chartMin = computed(() => {
  let minPressure = Math.min.apply(Math, store.pressure.actual_history)
  let minTarget = Math.min.apply(Math, store.pressure.target.target_history)
  if (minPressure < minTarget) { return minPressure }
  else { return minTarget }
})

function changeAutoSetpoint() {
  emit('changeAutoSetpoint', autoSetpoint.value)
}
</script>

