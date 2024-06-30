<template>
  <v-dialog 
    class="custom-dialog"
    width="560" 
    v-model="fullLeaderboardDialog"
  >
  <v-card>
    <h1 class="pixel-font negative-margin">
      Leaderboard
    </h1>
    <v-select
      v-model="currentLeaderboardType"
      class="custom-select"
      :items="leaderboards"
    />
      <Leaderboard
        v-if="currentLeaderboard"
        :lb="currentLeaderboard"
      />
    <div
      v-if="!me || me.type !== 'user'"
      class="mt-5 text-disabled"
    >
      <v-btn
        density="comfortable"
        @click="login"
      >
        Login
      </v-btn> to show up on the leaderboard!
      </div> 
    </v-card>
  </v-dialog>

  <v-container
    v-if="data"
    :fluid="true"
    class="index-view"
  >
    <div class="leaderboard-container">
      <div class="d-flex flex-column">
        <h2 class="pixel-font negative-margin">
          Leaderboard
        </h2>
        <v-select
          v-model="currentLeaderboardType"
          class="custom-select"
          :items="leaderboards" 
          density="compact"
        />
        <div class="opener" @click="fullLeaderboardDialog = true">Show full Top 10</div>
      </div>
      <span
        v-if="currentLeaderboard"
        class="leaderboard-row"
      >
        <span
          v-for="(entry, idx) in currentLeaderboard.entries"
          :key="idx"
          class="player-entry"
          :style="usernameStyle(entry.color)"
        >
          <span class="player-icon-container">
            <icon
              class="crown"
              :style="crownStyle(entry)"
            />
            <icon
              :style="iconStyle(entry)"
              :title="iconTitle(entry)"
            />
          </span>
          {{ entry.registered_name }} ({{ entry.pieces_count }} pieces)
        </span>

      </span>
    </div>


    <div class="homepage-action-buttons "> 
      <div class="text-center">
        <v-menu v-if="me && loggedIn">
          <template v-slot:activator="{ props }">
            <a v-bind="props"
              class="action-button secondary-action"
            >
              <span
                v-if="currentLeaderboard.valueOf() && currentLeaderboard.valueOf().userEntry" 
                class="player-icon-container"
                >
                <icon
                  class="crown"
                  :style="crownStyle(currentLeaderboard.valueOf().userEntry)"
                />
                  <icon 
                    :style="iconStyle(currentLeaderboard.valueOf().userEntry)"
                    :title="iconTitle(currentLeaderboard.valueOf().userEntry)"
                  />
              </span>
              <div class="info-container">
                <span class="main-info">
                  Hello, {{ me.name }}!
                </span>
                <span 
                  v-if="currentLeaderboard.valueOf() && currentLeaderboard.valueOf().userEntry"
                  class="secondary-info"
                >
                  You rank place {{ currentLeaderboard.valueOf().userEntry.rank }} on {{ currentLeaderboardToAdjective }} leaderboard!
                </span>
                <span 
                  v-else
                  class="secondary-info"
                >
                  Finish a public game to show up in leaderboards!
                </span>
              </div>
            </a>
          </template>
          <v-list>
            <v-list-item
              @click="logout()"
            >
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <a
          v-else
          class="action-button secondary-action"
          @click="login"
        >
          <span class="main-info">
            Log in to show up on leaderboard!
          </span>
        </a>
      </div>
      <div class="text-center">
        <RouterLink
          class="action-button main-action"
          :to="{ name: 'new-game' }"
        >
          <icon icon="puzzle-game" />
          Start a new Puzzle
        </RouterLink>
      </div>
    </div>

    <div
      v-if="data.gamesRunning.items.length"
      class="running-games-container"
    >
      <v-select
        v-model="currentGamesView"
        class="custom-select"
        :items="gamesViewSettings" 
        density="compact"
      />
      <MasonryWall
        v-if="currentGamesView === GamesViewSetting.MASONRY"
        class="my-4"
        :items="data.gamesRunning.items"
        :column-width="360"
        :gap="10"
      >
        <template #default="{ item, index }">
          <RunningGameTeaser
            :key="index"
            :assets="assets"
            :graphics="graphics"
            :game="item"
            :masonry="true"
            @go-to-game="goToGame"
            @show-image-info="showImageInfo"
          />
        </template>
      </MasonryWall>
      <v-container
        v-else
        :fluid="true"
        class="pl-0 pr-0 game-teasers-holder running-games"
      >
        <RunningGameTeaser
          v-for="(g, idx) in data.gamesRunning.items"
          :key="idx"
          :assets="assets"
          :graphics="graphics"
          :game="g"
          :masonry="false"
          @go-to-game="goToGame"
          @show-image-info="showImageInfo"
        />
      </v-container>
    </div>
    <h1
      v-if="data.livestreams.length > 0"
      class="mt-5"
    >
      Live on Twitch
    </h1>
    <v-container
      v-if="data.livestreams.length > 0"
      :fluid="true"
      class="pl-0 pr-0 live-on-twitch"
    >
      <div class="d-flex ga-3">
        <template
          v-for="livestream of data.livestreams"
          :key="livestream.id"
        >
          <v-tooltip>
            <p>
              <strong>{{ livestream.user_display_name }}</strong>
            </p>
            <p>
              {{ livestream.title }}
            </p>
            <p>
              {{ livestream.viewers }} viewers
            </p>
            <template #activator="{ props }">
              <a
                :href="livestream.url"
                target="_blank"
                v-bind="props"
              >
                <img :src="livestream.user_thumbnail">
              </a>
            </template>
          </v-tooltip>
        </template>
      </div>
    </v-container>

    <h1 class="mt-5">
      Finished games
    </h1>
    <Pagination
      :pagination="data.gamesFinished.pagination"
      @click="onPagination"
    />
    <v-container
      :fluid="true"
      class="pl-0 pr-0 game-teasers-holder games-list"
    >
      <FinishedGameTeaser
        v-for="(g, idx) in data.gamesFinished.items"
        :key="idx"
        :assets="assets"
        :graphics="graphics"
        :game="g"
        @go-to-game="goToGame"
        @go-to-replay="goToReplay"
        @show-image-info="showImageInfo"
      />
      <v-container
        :fluid="true"
        class="pl-0 pr-0 game-teasers-holder finished-games"
      >
        <FinishedGameTeaser
          v-for="(g, idx) in data.gamesFinished.items"
          :key="idx"
          :game="g"
          @go-to-game="goToGame"
          @go-to-replay="goToReplay"
          @show-image-info="showImageInfo"
        />
      </v-container>
      <Pagination
        :pagination="data.gamesFinished.pagination"
        @click="onPagination"
      />
    </template>
  </v-container>

  <v-dialog v-model="dialog">
    <ImageInfoDialog
      v-if="imageInfo"
      :image="imageInfo"
      @tag-click="onTagClick"
      @close="dialog = false"
    />
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiDataFinishedGames, ApiDataIndexData, GameInfo, ImageInfo, ImageSearchSort, LeaderboardEntry, LeaderboardType, Tag } from '../../../common/src/Types'
import { IDLE_TIMEOUT_SEC } from '../../../common/src/GameCommon'
import Time from '../../../common/src/Time'
import RunningGameTeaser from '../components/RunningGameTeaser.vue'
import FinishedGameTeaser from '../components/FinishedGameTeaser.vue'
import Pagination from '../components/Pagination.vue'
import api from '../_api'
import Leaderboard from '../components/Leaderboard.vue'
import user, { User } from '../user'
import ImageInfoDialog from '../components/ImageInfoDialog.vue'
import MasonryWall from '../components/MasonryWall.vue'
import { Assets } from '../Assets'
import { Graphics } from '../Graphics'
import { getAnonBadge, getColoredBadge, isPlayerActive, usernameColorStyle } from '../util'

const router = useRouter()
const data = ref<ApiDataIndexData | null>(null)
const me = ref<User | null>(null)

const loggedIn = computed(() => {
  return !!(me.value && me.value.type === 'user')
})

const assets = new Assets()
const graphics = new Graphics()

const onInit = async () => {
  me.value = user.getMe()
  const res = await api.pub.indexData()
  const json = await res.json() as ApiDataIndexData
  data.value = json
}

const login = () => {
  user.eventBus.emit('triggerLoginDialog')
}
async function logout() {
  await user.logout()
}

const goToGame = ((game: GameInfo) => {
  router.push({ name: 'game', params: { id: game.id } })
})
const goToReplay = ((game: GameInfo) => {
  router.push({ name: 'replay', params: { id: game.id } })
})

const dialog = ref<boolean>(false)
const imageInfo = ref<ImageInfo|null>(null)
const showImageInfo = ((image: ImageInfo) => {
  dialog.value = true
  imageInfo.value = image
})

enum GamesViewSetting {
  MASONRY = 'Masonry View',
  STANDARD = 'Standard View'
}

const gamesViewSettings = Object.values(GamesViewSetting)
const currentGamesView = ref<string>(GamesViewSetting.STANDARD)

const leaderboards = Object.values(LeaderboardType)
const currentLeaderboardType = ref<LeaderboardType>(LeaderboardType.WEEK)

const currentLeaderboardToAdjective = computed(() => {
  if (currentLeaderboardType.value === LeaderboardType.WEEK) {
    return `this week's`
  } else if (currentLeaderboardType.value === LeaderboardType.MONTH) {
    return `this month's`
  } else {
    return 'the all time'
  }
})

const currentLeaderboard = computed(() => {
  return data.value?.leaderboards.find(lb => lb.name === currentLeaderboardType.value)
})

const fullLeaderboardDialog = ref<boolean>(false)

const onPagination = async (q: { limit: number, offset: number }) => {
  if (!data.value) {
    return
  }
  const res = await api.pub.finishedGames(q)
  const json = await res.json() as ApiDataFinishedGames
  data.value.gamesFinished = json
}

const onTagClick = (tag: Tag): void => {
  router.push({ name: 'new-game', query: { sort: ImageSearchSort.DATE_DESC, search: tag.title } })
}

let badgeMap: Record<string, string> = {}

enum CrownType {
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze'
}

const crownStyle = ((entry: LeaderboardEntry) => {
  console.log(entry)
  if (!entry) {
    return ``
  }
  let crownType = ''
  if (entry.rank === 1) {
    crownType = CrownType.GOLD
  } else if (entry.rank === 2) {
    crownType = CrownType.SILVER
  } else if (entry.rank === 3) {
    crownType = CrownType.BRONZE
  } else {
    return {}
  }
  return {
    backgroundImage: `url("assets/icons/crown_${crownType}.png")`,
  }
})

const iconStyle = ((entry: LeaderboardEntry) => {
  if (!entry) {
    return ``
  }
  const active = isPlayerActive(entry.ts)
  const url = !entry.user_id
    ? getAnonBadge(graphics, assets, badgeMap, active)
    : getColoredBadge(graphics, assets, badgeMap, active, entry.color)
  return {
    backgroundImage: `url(${url})`,
  }
})

const iconTitle = ((entry: LeaderboardEntry) => {
  if (!entry) {
    return ``
  }
  const active = isPlayerActive(entry.ts)
  if (!entry.user_id) {
    return active + ', anonymous user'
  }
  return active + ', registered user ♥'
})

const usernameStyle = ((color: string | null) => {
  return usernameColorStyle(color)
})

onMounted(async () => {
  await assets.init(graphics)
  onInit()
  user.eventBus.on('login', onInit)
  user.eventBus.on('logout', onInit)
})
onBeforeUnmount(() => {
  user.eventBus.off('login', onInit)
  user.eventBus.off('logout', onInit)
})
</script>
