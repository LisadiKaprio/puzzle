<template>
  <tr :style="style">
    <td>
      <icon
        :style="iconStyle"
        :title="iconTitle"
      />
    </td>
    <td class="pl-1">
      {{ name }}
    </td>
    <td class="pl-1">
      {{ points }}
    </td>
  </tr>
</template>
<script setup lang="ts">
import { StyleValue, computed } from 'vue'
import { BasicPlayerInfo, RegisteredMap } from '../../../common/src/Types'
import { GamePlay } from '../GamePlay'
import { GameReplay } from '../GameReplay'
import { getColoredBadge, getAnonBadge, usernameColorStyle } from '../util'

const props = defineProps<{
  player: BasicPlayerInfo,
  active: boolean,
  registeredMap: RegisteredMap,
  game: GamePlay | GameReplay,
}>()

const name = computed(() => {
  return props.player.name || '<No name>'
})
const points = computed(() => {
  return props.player.points
})

let badgeMap: Record<string, string> = {}

const style = computed(() => {
  return usernameColorStyle(props.player.color)
})

const iconStyle = computed(() => {
  const url = !props.registeredMap[props.player.id]
    ? getAnonBadge(props.game.getGraphics(), props.game.getAssets(), badgeMap, props.active )
    : getColoredBadge(props.game.getGraphics(), props.game.getAssets(), badgeMap, props.active, props.player.color)
  return {
    backgroundImage: `url(${url})`,
  }
})

const iconTitle = computed(() => {
  const active = (props.active ? 'Active' : 'Idle')
  if (!props.registeredMap[props.player.id]) {
    return active + ', anonymous user'
  }
  return active + ', registered user ♥'
})
</script>
