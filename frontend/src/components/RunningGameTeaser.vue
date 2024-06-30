<template>
  <v-card
    class="game-teaser"
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
      <div class="flex-1-1">
        <div
          v-if="game.isPrivate"
          class="game-teaser-info special-info private"
        >
          <v-icon icon="mdi-incognito" /> Private Game
          <v-tooltip
          width="250px"
          class="custom-tooltip"
          text="This game is not listed publically. Share the game URL with others to let them join." 
          activator="parent"
          location="bottom" 
          />
        </div>
        <div
          v-if="scoreMode"
          class="game-teaser-info special-info mode"
        >
          <icon icon="special-piece" /> {{ scoreMode }}
          <v-tooltip
          width="250px"
          class="custom-tooltip"
          :text="scoreModeDescription" 
          activator="parent"
          location="bottom" 
          />
        </div>
        <div
          v-if="shapeMode"
          class="game-teaser-info special-info mode"
        >
          <icon icon="special-piece" /> {{ shapeMode }}
          <v-tooltip
          width="250px"
          class="custom-tooltip"
          :text="shapeModeDescription" 
          activator="parent"
          location="bottom" 
          />
        </div>
        <div
          v-if="snapMode"
          class="game-teaser-info special-info mode"
        >
          <icon icon="special-piece" /> {{ snapMode }}
          <v-tooltip
          width="250px"
          class="custom-tooltip"
          :text="snapModeDescription" 
          activator="parent"
          location="bottom" 
          />
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
import { scoreModeDescriptionToString, scoreModeToString, shapeModeDescriptionToString, shapeModeToString, snapModeDescriptionToString, snapModeToString } from '../../../common/src/Util'
import { getAnonBadge, getColoredBadge, isPlayerActive, usernameColorStyle } from '../util'
import { Assets } from '../Assets'
import { Graphics } from '../Graphics'
import { formatDistance, formatDistanceToNow } from 'date-fns'

const props = defineProps<{
  game: GameInfo,
  graphics: Graphics,
  assets: Assets,
  masonry: boolean
}>()

const emit = defineEmits<{
  (e: 'goToGame', val: GameInfo): void
  (e: 'showImageInfo', val: ImageInfo): void
}>()

const MIN_HEIGHT = 300

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

const styleContainer = computed(() => {
  if (props.masonry.valueOf() === true) {
    return {
      paddingTop: (Math.max(MIN_HEIGHT, props.game.image.height) / props.game.image.width * 100) + '%',
      }
  } else {
    return {
      height: '320px',
    }
  }
})

const styleIdle = computed(() => {
  const url = props.game.imageSnapshots.current
    ? props.game.imageSnapshots.current.url
    : props.game.image.url
  const paddingTopValue = props.masonry.valueOf() === true
    ? (Math.max(MIN_HEIGHT, props.game.image.height) / props.game.image.width * 100) + '%'
    : `0px`
  return { 
    paddingTop: paddingTopValue,
    backgroundImage: `url("${resizeUrl(url, 620, 496, 'contain')}")`,
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
  }
})

const styleHovered = computed(() => {
  // when there is a snapshot, we show the full image on hover! this is
  // not a mistake here
  const url = props.game.imageSnapshots.current ? props.game.image.url : null
  const paddingTopValue = props.masonry.valueOf() === true
    ? (Math.max(MIN_HEIGHT, props.game.image.height) / props.game.image.width * 100) + '%'
    : `0px`
  return url ? { 
    paddingTop: paddingTopValue,
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
    return `Snap Mode: ${snapModeToString(props.game.snapMode)}`
  }
})

const snapModeDescription = computed(() => {
  if (props.game.snapMode === SnapMode.NORMAL) {
    return null
  } else {
    return `${snapModeDescriptionToString(props.game.snapMode)}`
  }
})

const scoreMode = computed(() => {
    if (props.game.scoreMode === ScoreMode.ANY) {
      return null
    } else {
      return `Score Mode: ${scoreModeToString(props.game.scoreMode)}`
    }
})

const scoreModeDescription = computed(() => {
  if (props.game.scoreMode === ScoreMode.ANY) {
    return null
  } else {
    return `${scoreModeDescriptionToString(props.game.scoreMode)}`
  }
})

const shapeMode = computed(() => {
  if (props.game.shapeMode === ShapeMode.NORMAL) {
    return null
  } else {
    return `Shape Mode: ${shapeModeToString(props.game.shapeMode)}`
  }
})

const shapeModeDescription = computed(() => {
  if (props.game.shapeMode === ShapeMode.NORMAL) {
    return null
  } else {
    return `${shapeModeDescriptionToString(props.game.shapeMode)}`
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
