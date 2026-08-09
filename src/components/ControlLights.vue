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
  </div>
</template>

<script setup>
  import { usePmpctrlStore } from '@/store';

  const store = usePmpctrlStore()

  const emit = defineEmits(['lightsOn', 'lightsOff'])

  function onOff() {
    store.getLightshow == 'ON' ? emit('lightsOff') : emit('lightsOn')
  }
</script>
