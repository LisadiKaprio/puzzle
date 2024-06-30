<template>
  <v-card
    class="game-teaser"
    :class="{ 'game-is-private': game.isPrivate }"
    elevation="10"
  >
    <div
      class="game-teaser-image-holder"
      :href="`/g/${game.id}`"
    >
      <div
        class="game-teaser-image finished"
        :style="style"
        @click="emit('goToGame', game)"
      />
    </div>

    <div class="game-teaser-inner">
      <div class="flex-1-1">
        <div
          v-if="game.isPrivate"
          class="game-teaser-info game-is-private-info"
        >
          <v-icon icon="mdi-incognito" /> Private Game
        </div>
        <div
          v-if="scoreMode"
          class="game-teaser-info game-special-info"
        >
          <icon icon="special-piece" /> {{ scoreMode }}
        </div>
        <div
          v-if="shapeMode"
          class="game-teaser-info game-special-info"
        >
          <icon icon="special-piece" /> {{ shapeMode }}
        </div>
        <div
          v-if="snapMode"
          class="game-teaser-info game-special-info"
        >
          <icon icon="special-piece" /> {{ snapMode }}
        </div>
        <div class="game-teaser-info">
          <icon icon="puzzle-piece" />
          {{ game.piecesFinished }} / {{ game.piecesTotal }} pieces ({{ Math.round((game.piecesFinished / game.piecesTotal) * 100) }}%)
        </div>
        <div
          v-if="players.length > 0"
          class="game-teaser-info"
        >
          Played by: 
          <span
            v-for="(player, idx) in players"
            :key="idx"
            class="mr-1 font-weight-black"
            :style="usernameStyle(player.color)"
          >
            <icon
              :style="iconStyle(player)"
              :title="iconTitle(player)"
            />
            {{ player.name }} ({{ player.points }} points)
          </span>
        </div>
      </div>
      <v-divider class="my-2" />
      <div class="game-teaser-info bottom">
        <span>
        <icon icon="flag"  /> {{ time }}</span>
        <div class="d-flex flex-column">
          <div 
            class="opener"
            @click.stop="emit('showImageInfo', game.image)"
          >
            <icon icon="info" />
            Image info
          </div>
          <div 
            class="opener" 
            @click.stop="emit('goToReplay', game)"
          >
            <icon icon="replay" />
            Watch replay
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { resizeUrl } from '../../../common/src/ImageService'
import Time from '../../../common/src/Time'
import { BasicPlayerInfo, GameInfo, ImageInfo, ScoreMode, ShapeMode, SnapMode } from '../../../common/src/Types'
import { scoreModeToString, shapeModeToString, snapModeDescriptionToString, snapModeToString } from '../../../common/src/Util'
import { getAnonBadge, getColoredBadge, usernameColorStyle } from '../util'
import { Graphics } from '../Graphics'
import { Assets } from '../Assets'
import { formatDistance, formatDistanceStrict, formatDistanceToNow, formatDuration } from 'date-fns'

const props = defineProps<{
  game: GameInfo,
  graphics: Graphics,
  assets: Assets,
}>()

const emit = defineEmits<{
  (e: 'goToGame', val: GameInfo): void
  (e: 'goToReplay', val: GameInfo): void
  (e: 'showImageInfo', val: ImageInfo): void
}>()

const players = computed(() => {
  const activePlayers = props.game.activePlayers
  const idlePlayers = props.game.playersWithScore.filter(p => !activePlayers.map(p => p.id).includes(p.id))
  // sort by score
  activePlayers.sort((a, b) => b.points - a.points)
  idlePlayers.sort((a, b) => b.points - a.points)
  return [...activePlayers, ...idlePlayers]
})

const usernameStyle = ((color: string | null) => {
  return usernameColorStyle(color)
})


const url = computed(() => resizeUrl(props.game.image.url, 375, 210, 'contain'))
const style = computed(() => ({ 'background-image': `url("${url.value}")` }))

const joinPuzzleText = computed(() => props.game.finished ? 'View puzzle' : 'Join puzzle')

const snapMode = computed(() => {
  if (props.game.snapMode === SnapMode.NORMAL) {
    return null
  } else {
    return `Special Snap Mode: ${snapModeDescriptionToString(props.game.snapMode)}`
  }
})

const scoreMode = computed(() => {
    if (props.game.scoreMode === ScoreMode.ANY) {
      return null
    } else {
      return `Special Score Mode: ${scoreModeToString(props.game.scoreMode)}`
    }
  })

const shapeMode = computed(() => {
  if (props.game.shapeMode === ShapeMode.NORMAL) {
    return null
  } else {
    return `Special Shape Mode: ${shapeModeToString(props.game.shapeMode)}`
  }
})

const time = ((start: number, end: number) => {
  if (!end) {
    return formatDistanceToNow(start)
  } else {
    return formatDistanceStrict(start, end)
  }
})(props.game.started, props.game.finished)


let badgeMap: Record<string, string> = {}

const iconStyle = ((player: BasicPlayerInfo) => {
  if (!player) {
    throw new Error('Invalid player object')
  }
  const active = props.game.activePlayers.map(p => p.id).includes(player.id)
  const url = !player.id
    ? getAnonBadge(props.graphics, props.assets, badgeMap, active)
    : getColoredBadge(props.graphics, props.assets, badgeMap, active, player.color)
  return {
    backgroundImage: `url(${url})`,
  }
})

const iconTitle = ((player: BasicPlayerInfo) => {
  if (!player) {
    throw new Error('Invalid player object')
  }
  const active = (props.game.activePlayers.map(p => p.id).includes(player.id) ? 'Active' : 'Idle')
  if (!player.id) {
    return active + ', anonymous user'
  }
  return active + ', registered user ♥'
})
</script>
