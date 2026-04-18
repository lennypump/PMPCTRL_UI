<template>
  <div class="pa-2">

    <!-- Card 1: SEQUENCE_LIBRARY -->
    <div class="bg-grey-darken-4 pa-2 mb-2">
      <div class="ml-2 mr-2 mb-2">SEQUENCE_LIBRARY</div>
      <div class="ml-2 mr-2 d-flex align-center gap-2 mb-2">
        <v-select
          v-model="selectedName"
          :items="store.sequences"
          density="comfortable"
          hide-details
          placeholder="Sequence wählen..."
          class="flex-grow-1"
        ></v-select>
        <v-btn
          color="grey-darken-2"
          height="40"
          @click="loadSelected"
          :disabled="!selectedName"
        >LADEN</v-btn>
      </div>
      <div class="ml-2 mr-2 d-flex gap-2">
        <v-btn color="grey-darken-2" height="40" @click="newSequence">NEU</v-btn>
        <v-btn
          color="grey-darken-2"
          height="40"
          :disabled="!selectedName"
          @click="deleteSelected"
          :loading="deleting"
        >LÖSCHEN</v-btn>
        <v-btn
          color="grey-darken-2"
          height="40"
          :disabled="!selectedName"
          @click="activateSelected"
          :loading="activating"
        >AKTIVIEREN</v-btn>
      </div>
    </div>

    <!-- Card 2: SEQUENCE_EDITOR -->
    <div class="bg-grey-darken-4 pa-2 mb-2">
      <div class="ml-2 mr-2 mb-2">SEQUENCE_EDITOR</div>
      <div class="ml-2 mr-2">
        <table class="w-100 mb-2">
          <tbody>
            <tr>
              <td style="width: 120px;">NAME</td>
              <td>
                <v-text-field
                  v-model="editName"
                  density="comfortable"
                  hide-details
                ></v-text-field>
              </td>
            </tr>
            <tr>
              <td>BASIS (mbar)</td>
              <td>
                <v-number-input
                  v-model="editBasePressure"
                  density="comfortable"
                  hide-details
                  controlVariant="split"
                  :min="0"
                  :precision="1"
                  :step="10"
                ></v-number-input>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mb-2 text-caption">SCHRITTE</div>
        <div
          v-for="(step, i) in editSteps"
          :key="i"
          class="bg-grey-darken-3 pa-2 mb-2 rounded"
        >
          <div class="d-flex align-center gap-2 mb-2">
            <div class="d-flex flex-column gap-1">
              <v-btn
                icon="mdi-chevron-up"
                size="x-small"
                variant="text"
                :disabled="i === 0"
                @click="moveStep(i, -1)"
              />
              <v-btn
                icon="mdi-chevron-down"
                size="x-small"
                variant="text"
                :disabled="i === editSteps.length - 1"
                @click="moveStep(i, 1)"
              />
            </div>
            <v-select
              v-model="step.action"
              :items="actionTypes"
              density="comfortable"
              hide-details
              class="flex-grow-1 text-uppercase"
            ></v-select>
            <v-text-field
              v-model="step.label"
              density="comfortable"
              hide-details
              placeholder="Label"
              class="flex-grow-1"
            ></v-text-field>
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              color="grey"
              @click="removeStep(i)"
            />
          </div>
          <div class="d-flex gap-2">
            <v-number-input
              v-if="step.action !== 'release' && step.action !== 'release_to_base'"
              v-model="step.duration"
              density="comfortable"
              hide-details
              controlVariant="split"
              label="Dauer (s)"
              :min="0"
              :precision="1"
              :step="1"
              class="flex-grow-1"
            ></v-number-input>
            <v-number-input
              v-if="step.action === 'hold' || step.action === 'interval'"
              v-model="step.pressure"
              density="comfortable"
              hide-details
              controlVariant="split"
              label="Zieldruck (mbar)"
              :min="0"
              :precision="1"
              :step="10"
              class="flex-grow-1"
            ></v-number-input>
            <div
              v-if="step.action === 'release' || step.action === 'release_to_base'"
              class="text-caption text-grey align-self-center"
            >
              {{ step.action === 'release' ? 'Lässt ab bis Maximum' : 'Lässt ab bis Basis' }}
            </div>
          </div>
        </div>

        <v-btn
          class="w-100 mt-1 mb-2"
          color="grey-darken-2"
          height="44"
          prepend-icon="mdi-plus"
          @click="addStep"
        >
          SCHRITT HINZUFÜGEN
        </v-btn>
      </div>
    </div>

    <!-- Card 3: LEVEL_ADJUST -->
    <div class="bg-grey-darken-4 pa-2 mb-2">
      <div class="ml-2 mr-2 mb-1">LEVEL_ADJUST</div>
      <div class="ml-2 mr-2 text-caption mb-1">
        Alle Intervall-Zieldrücke skalieren, Basis bleibt fix
      </div>
      <div class="ml-2 mr-2">
        <v-slider
          v-model="editLevelFactor"
          min="0.5"
          max="1.5"
          step="0.01"
          hide-details
          thumb-label
        >
          <template v-slot:thumb-label>{{ Math.round(editLevelFactor * 100) }}%</template>
        </v-slider>
        <div class="text-center">{{ Math.round(editLevelFactor * 100) }}%</div>
      </div>
    </div>

    <!-- Footer buttons -->
    <div class="d-flex gap-2 mb-2">
      <v-btn
        class="flex-grow-1"
        height="60"
        color="grey-darken-3"
        prepend-icon="mdi-content-save"
        :loading="saving"
        @click="save"
      >
        <b>SPEICHERN</b>
      </v-btn>
      <v-btn
        class="flex-grow-1"
        height="60"
        color="grey-darken-2"
        prepend-icon="mdi-play"
        :loading="savingAndActivating"
        @click="saveAndActivate"
      >
        <b>SPEICHERN &amp; AKTIVIEREN</b>
      </v-btn>
    </div>

    <v-snackbar v-model="snackbar" :timeout="2500" location="bottom">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePmpctrlStore } from '../store'
import { VNumberInput } from 'vuetify/labs/VNumberInput'

const store = usePmpctrlStore()

const selectedName = ref(null)
const editName = ref('')
const editBasePressure = ref(900)
const editLevelFactor = ref(1.0)
const editSteps = ref([])

const saving = ref(false)
const savingAndActivating = ref(false)
const deleting = ref(false)
const activating = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')

const actionTypes = ['hold', 'interval', 'fading', 'release', 'release_to_base']

onMounted(async () => {
  await store.fetchSequences()
})

function showMessage(text) {
  snackbarText.value = text
  snackbar.value = true
}

function newSequence() {
  selectedName.value = null
  editName.value = ''
  editBasePressure.value = 900
  editLevelFactor.value = 1.0
  editSteps.value = []
}

async function loadSelected() {
  if (!selectedName.value) return
  await store.loadSequence(selectedName.value)
  const seq = store.activeSequence
  editName.value = seq.name
  editBasePressure.value = seq.base_pressure
  editLevelFactor.value = seq.level_factor ?? 1.0
  editSteps.value = seq.steps.map(s => ({ ...s }))
}

async function deleteSelected() {
  if (!selectedName.value) return
  deleting.value = true
  try {
    await store.deleteSequence(selectedName.value)
    await store.fetchSequences()
    selectedName.value = null
    newSequence()
    showMessage('Sequence gelöscht')
  } catch {
    showMessage('Fehler beim Löschen')
  } finally {
    deleting.value = false
  }
}

async function activateSelected() {
  if (!selectedName.value) return
  activating.value = true
  try {
    await store.activateSequence(selectedName.value)
    showMessage(`"${selectedName.value}" aktiviert`)
  } catch {
    showMessage('Fehler beim Aktivieren')
  } finally {
    activating.value = false
  }
}

function addStep() {
  editSteps.value.push({
    action: 'hold',
    label: '',
    duration: 10,
    pressure: editBasePressure.value,
  })
}

function removeStep(i) {
  editSteps.value.splice(i, 1)
}

function moveStep(i, dir) {
  const j = i + dir
  if (j < 0 || j >= editSteps.value.length) return
  const tmp = editSteps.value[i]
  editSteps.value[i] = editSteps.value[j]
  editSteps.value[j] = tmp
}

function buildSequenceData() {
  return {
    name: editName.value,
    base_pressure: editBasePressure.value,
    level_factor: editLevelFactor.value,
    steps: editSteps.value.map(s => {
      const noParams = s.action === 'release' || s.action === 'release_to_base'
      const step = { action: s.action, label: s.label || null }
      if (!noParams) step.duration = s.duration
      if (s.action === 'hold' || s.action === 'interval') step.pressure = s.pressure
      return step
    }),
  }
}

async function save() {
  if (!editName.value) { showMessage('Bitte einen Namen eingeben'); return }
  saving.value = true
  try {
    const data = buildSequenceData()
    await store.saveSequence(editName.value, data)
    await store.fetchSequences()
    selectedName.value = editName.value
    showMessage('Sequence gespeichert')
  } catch {
    showMessage('Fehler beim Speichern')
  } finally {
    saving.value = false
  }
}

async function saveAndActivate() {
  if (!editName.value) { showMessage('Bitte einen Namen eingeben'); return }
  savingAndActivating.value = true
  try {
    const data = buildSequenceData()
    await store.saveSequence(editName.value, data)
    await store.fetchSequences()
    selectedName.value = editName.value
    await store.activateSequence(editName.value)
    showMessage(`"${editName.value}" gespeichert und aktiviert`)
  } catch {
    showMessage('Fehler')
  } finally {
    savingAndActivating.value = false
  }
}
</script>
