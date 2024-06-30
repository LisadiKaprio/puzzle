<template>
  <div class="puzzle-status">
    <div>
      <icon icon="puzzle-piece" /> 
      {{ status.piecesDone }} / {{ status.piecesTotal }} pieces ({{ Math.round((status.piecesDone / status.piecesTotal) * 100) }}%)
    </div>
    <div class="d-flex flew-row">
      <icon
        v-if="!status.finished"
        icon="clock"
      />
      <icon
        v-else
        icon="flag"
      />
      <div class="d-flex flex-column ml-1">
        <span v-if="duration.valueOf().years">{{ duration.valueOf().years }} year{{ duration.valueOf().years > 1 ? 's' : '' }} </span>
        <span v-if="duration.valueOf().months">{{ duration.valueOf().months }} month{{ duration.valueOf().months > 1 ? 's' : '' }} </span>
        <span v-if="duration.valueOf().weeks">{{ duration.valueOf().weeks }} week{{ duration.valueOf().weeks > 1 ? 's' : '' }} </span>
        <span v-if="duration.valueOf().days">{{ duration.valueOf().days }} day{{ duration.valueOf().days > 1 ? 's' : '' }}</span>
        <span v-if="duration.valueOf().hours">{{ duration.valueOf().hours }} hour{{ duration.valueOf().hours > 1 ? 's' : '' }}</span>
        <span>{{ minutesPadded.valueOf() }} minute{{ minutesPadded.valueOf() > 1 ? 's' : '' }} </span>
        <span>{{ secondsPadded.valueOf() }} seconds</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import Time from './../../../common/src/Time'
import { zeroPad } from './../util'
import { GameStatus } from '../../../common/src/Types'
import { Duration, formatDuration, intervalToDuration } from 'date-fns';

const props = defineProps<{
  status: GameStatus,
}>()

const minutesPadded = computed((): string => {
  if (!duration.value.minutes) return '00'
  return zeroPad(duration.value.minutes, 2)
})

const secondsPadded = computed((): string => {
  if (!duration.value.seconds) return '00'
  return zeroPad(duration.value.seconds, 2)
})

const duration = computed((): Duration => {
  return intervalToDuration({ start: 0, end: props.status.duration })
})
</script>
