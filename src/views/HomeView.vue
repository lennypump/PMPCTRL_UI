<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios'
import PressureSensor from '../components/PressureSensor.vue';
import PressureTarget from '../components/PressureTarget.vue';
import ControlPump from '../components/ControlPump.vue';
import ControlSession from '../components/ControlSession.vue';
import ControlValve from '../components/ControlValve.vue';
import ControlLights from '../components/ControlLights.vue';
import ConfigSession from '../components/ConfigSession.vue';
import InfoPanel from '../components/InfoPanel.vue';
import SequenceStatus from '../components/SequenceStatus.vue';

import { usePmpctrlStore } from '../store';

const UPDATE_INTERVAL_MS = 250

const API_HEADER = { headers: { 'Content-Type' : 'application/json' } }
let apiUrl

if (import.meta.env.MODE == 'development') {
  apiUrl = import.meta.env.VITE_PMPCTRL_API_URL
}
else {
  let protocol = document.location.protocol
  let hostname = document.location.hostname
  let port = import.meta.env.VITE_PMPCTRL_API_PORT
  apiUrl = protocol.concat("//", hostname, ":", port, "/")
}

let backendConnection = true

const store = usePmpctrlStore()

let errorDialog = ref(false)
let errorDialogTitle = ''
let errorDialogText = ''

async function makeApiGetCall(endpoint) {
  let response = await axios.get(apiUrl.concat(endpoint))
    .catch((error) => {
      errorDialog.value = true
      errorDialogTitle = 'Connection Error'
      errorDialogText = error.message
      backendConnection = false
    })
  return response.data
}

function makeApiPutCall(endpoint, content=null) {
  if(!backendConnection) {
    errorDialog.value = true
    errorDialogTitle = 'No connection'
    errorDialogText = 'Reload and try again'
    return
  }
  axios.put(apiUrl.concat(endpoint), content, API_HEADER)
    .catch((error) => {
      if(error.status == 409) {
        errorDialog.value = true
        errorDialogTitle = error.response.statusText
        errorDialogText = error.response.data.detail
      }
      else {
        errorDialog.value = true
        console.log(errorDialog)
        errorDialogTitle = 'Error'
        errorDialogText = error.message
        backendConnection = false
      }
    })
}

async function getApiRoot() {
  let data = await makeApiGetCall('')
  store.session = data.session
  data.session == 'on' ? store.sessionBool = true : store.sessionBool = false
  store.pump = data.pump
  store.valve = data.valve
  store.lightshow = data.lightshow
  store.timeUtcNow = data.time_utc_now
  store.timeUtcSessionStart = data.time_utc_session_start
  store.lastSessionDuration = data.last_session_duration
  store.pressure.actual = data.pressure.actual
  store.pressure.sensor_available = data.pressure.sensor_available
  store.pressure.setpoint = data.pressure.setpoint
  store.pressure.auto_setpoint = data.pressure.auto_setpoint
  store.pressure.target.target = data.pressure.target.target
  store.pressure.min = data.pressure.min
  store.pressure.max = data.pressure.max
  store.pushPressureHistoryValues(data.pressure.actual, data.pressure.target.target)
  store.pressure.target.tolerance_minus = data.pressure.target.tolerance_minus
  store.pressure.target.tolerance_plus = data.pressure.target.tolerance_plus
  store.mode.active = data.mode.active
  store.mode.available = data.mode.available
  store.mode.interval.peak_pressure = data.mode.interval.peak_pressure
  store.mode.interval.interval_time = data.mode.interval.interval_time
  store.mode.pulsating.pump_time = data.mode.pulsating.pump_time
  store.mode.pulsating.release_time = data.mode.pulsating.release_time
}

function updatePressureTarget(value) {
  makeApiPutCall('pressure/target', {'target':value})
}

function startSession() {
  makeApiPutCall('session/start')
}

function stopSession() {
  makeApiPutCall('session/stop')
}

function openValve() {
  makeApiPutCall('valve/open')
}

function closeValve() {
  makeApiPutCall('valve/close')
}

function pumpOn() {
  makeApiPutCall('pump/on')
}

function pumpOff() {
  makeApiPutCall('pump/off')
}

function lightsOn() {
  makeApiPutCall('lights/on')
}

function lightsOff() {
  makeApiPutCall('lights/off')
}

function updateMode(value) {
  makeApiPutCall('mode', { 'mode' : value })
}

function updateModeInterval(value) {
  makeApiPutCall('mode/interval', value)
}

function updateModePulsating(value) {
  makeApiPutCall('mode/pulsating', value)
}

function updateTolerances(value) {
  makeApiPutCall('pressure/target', value)
}

function onChangeAutoSetpoint(value) {
  makeApiPutCall('pressure/setpoint', { 'auto_setpoint' : value })
}

onMounted(() => {
  function timer() {
    if (!backendConnection) return
    getApiRoot()
    setTimeout(timer, UPDATE_INTERVAL_MS)
  }
  timer()
})
</script>

<template>
  <v-dialog
    v-model="errorDialog"
    width="auto">
    <v-card
      max-width="400"
      prepend-icon="mdi-alert-box"
      :title="errorDialogTitle"
      :text="errorDialogText">
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="errorDialog=false"></v-btn>
      </template>
    </v-card>
  </v-dialog>

  <div class="main-grid pa-2">
    <div class="grid-infopanel">
      <InfoPanel></InfoPanel>
    </div>
    <div class="grid-session">
      <ControlSession
        @start="startSession"
        @stop="stopSession">
      </ControlSession>
    </div>
    <div class="grid-sensor">
      <PressureSensor
        @change-auto-setpoint="onChangeAutoSetpoint">
      </PressureSensor>
    </div>
    <div class="grid-pumptarget">
      <PressureTarget
        :target="store.pressure.target.target"
        @update-pressure-target="updatePressureTarget">
      </PressureTarget>
    </div>
    <div class="grid-pump">
      <ControlPump
        @pumpOn="pumpOn"
        @pumpOff="pumpOff">
      </ControlPump>
    </div>
    <div class="grid-valve">
      <ControlValve
        @open="openValve"
        @close="closeValve">
      </ControlValve>
    </div>
    <div class="grid-lights">
      <ControlLights
        @lightsOn="lightsOn"
        @lightsOff="lightsOff">
      </ControlLights>
    </div>
    <div class="grid-mode">
      <ConfigSession
        @updateMode="updateMode"
        @updateModeInterval="updateModeInterval"
        @updateModePulsating="updateModePulsating"
        @updateTolerances="updateTolerances">
      </ConfigSession>
    </div>
    <div
      v-if="store.mode.active === 'sequence' && store.sessionBool"
      class="grid-seqstatus">
      <SequenceStatus></SequenceStatus>
    </div>
  </div>
</template>

<style scoped>
.main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  grid-template-areas:
    "infopanel"
    "session"
    "sensor"
    "pumptarget"
    "pump"
    "valve"
    "lights"
    "mode"
    "seqstatus";
}

.grid-infopanel  { grid-area: infopanel; }
.grid-session    { grid-area: session; }
.grid-sensor     { grid-area: sensor; }
.grid-pumptarget { grid-area: pumptarget; }
.grid-pump       { grid-area: pump; }
.grid-valve      { grid-area: valve; }
.grid-lights     { grid-area: lights; }
.grid-mode       { grid-area: mode; }
.grid-seqstatus  { grid-area: seqstatus; }

@media (min-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "infopanel  infopanel"
      "session    sensor"
      "session    sensor"
      "pumptarget sensor"
      "pump       valve"
      "lights     lights"
      "mode       mode"
      "seqstatus  seqstatus";
  }
}
</style>
