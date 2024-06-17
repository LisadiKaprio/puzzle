<template>
  <v-card
    class="running-game-teaser"
    :class="{ 'game-is-private': game.isPrivate }"
    elevation="10"
  >
    <a :href="`/g/${game.id}`">
      <div
        class="game-teaser-image-holder"
        :style="styleContainer"
        :href="`/g/${game.id}`"
      >
        <div
          class="game-teaser-image state-normal"
          :style="styleIdle"
        />
        <div
          v-if="styleHovered"
          class="game-teaser-image state-hovered"
          :style="styleHovered"
        />
      </div>
    </a>

    <div class="game-teaser-inner">
      <div
        v-if="game.isPrivate"
        class="game-teaser-info game-is-private-info"
      >
        <v-icon icon="mdi-incognito" /> Private Game
      </div>
      <div class="game-teaser-info">
        <icon icon="puzzle-piece" />
        {{ game.piecesFinished }} / {{ game.piecesTotal }} pieces ({{ Math.round((game.piecesFinished / game.piecesTotal) * 100) }}%)
      </div>
      <div
        v-if="scoreMode"
        class="game-teaser-info secondary"
      >
        <icon icon="special-piece" /> {{ scoreMode }}
      </div>
      <div
        v-if="shapeMode"
        class="game-teaser-info secondary"
      >
        <icon icon="special-piece" /> {{ shapeMode }}
      </div>
      <div
        v-if="snapMode"
        class="game-teaser-info secondary"
      >
        <icon icon="special-piece" /> {{ snapMode }}
      </div>
      <div
        v-if="players.length > 0"
        class="game-teaser-info"
      >
        Played by: 
        <span
          v-for="(player, idx) in players"
          :key="idx"
          class="mr-1"
          :style="usernameStyle(player.color)"
        >
          <icon
            :style="iconStyle(player)"
            :title="iconTitle(player)"
          />
          {{ player.name }} ({{ player.points }} points)
        </span>
      </div>
      <v-divider class="my-2" />
      <div class="game-teaser-info bottom">
        Started {{ time }} ago
        <div 
          class="opener"
          @click.stop="emit('showImageInfo', game.image)"
        >
          <icon icon="info" />
          Image info
        </div>
      </div>
    </div>
  </v-card>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import Time from '../../../common/src/Time'
import { resizeUrl } from '../../../common/src/ImageService'
import { BasicPlayerInfo, GameInfo, ImageInfo, ScoreMode, ShapeMode, SnapMode } from '../../../common/src/Types'
import { scoreModeToString, shapeModeToString, snapModeDescriptionToString } from '../../../common/src/Util'
import { getAnonBadge, getColoredBadge, usernameColorStyle } from '../util'
import { Assets } from '../Assets'
import { Graphics } from '../Graphics'
import { formatDistance, formatDistanceToNow } from 'date-fns'

const props = defineProps<{
  game: GameInfo,
  graphics: Graphics,
  assets: Assets
}>()

const emit = defineEmits<{
  (e: 'goToGame', val: GameInfo): void
  (e: 'showImageInfo', val: ImageInfo): void
}>()

const MIN_HEIGHT = 300

const players = computed(() => {
  return props.game.playersWithScore
})

const usernameStyle = ((color: string | null) => {
  return usernameColorStyle(color)
})

const styleContainer = computed(() => {
  return {
    paddingTop: (Math.max(MIN_HEIGHT, props.game.image.height) / props.game.image.width * 100) + '%',
    }
})

const styleIdle = computed(() => {
  const url = props.game.imageSnapshots.current
    ? props.game.imageSnapshots.current.url
    : props.game.image.url
  return { 
    paddingTop: (Math.max(MIN_HEIGHT, props.game.image.height) / props.game.image.width * 100) + '%',
    backgroundImage: `url("${resizeUrl(url, 620, 496, 'contain')}")`,
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
  }
})
const styleHovered = computed(() => {
  // when there is a snapshot, we show the full image on hover! this is
  // not a mistake here
  const url = props.game.imageSnapshots.current ? props.game.image.url : null
  return url ? { 
    paddingTop: (Math.max(MIN_HEIGHT, props.game.image.height) / props.game.image.width * 100) + '%',
    
    backgroundImage: `url("${resizeUrl(url, 620, 496, 'contain')}")`,
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
  } : null
})

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
    return formatDistance(start, end)
  }
})(props.game.started, props.game.finished)


let badgeMap: Record<string, string> = {}

const iconStyle = ((player: BasicPlayerInfo) => {
  if (!player) {
    throw new Error('Invalid player object')
  }
  console.log(props.game.activePlayers)
  const active = props.game.activePlayers.includes(player)
  console.log(player)
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
  const active = (props.game.activePlayers.includes(player) ? 'Active' : 'Idle')
  if (!player.id) {
    return active + ', anonymous user'
  }
  return active + ', registered user ♥'
})

</script>
