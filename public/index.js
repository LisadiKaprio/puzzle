import GameCommon from '../common/GameCommon.js';
import Time from '../common/Time.js'

const Upload = {
  name: 'upload',
  props: {
    accept: String,
    label: String,
  },
  template: `
<label>
    <input type="file" style="display: none" @change="upload" :accept="accept" />
    <span class="btn">{{label || 'Upload File'}}</span>
</label>
`,
  methods: {
    async upload(evt) {
      const file = evt.target.files[0]
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file, file.name);
      const res = await fetch('/upload', {
        method: 'post',
        body: formData,
      })
      const j = await res.json()
      this.$emit('uploaded', j)
    },
  }
}

const GameTeaser = {
  name: 'game-teaser',
  props: {
    game: Object,
  },
  template: `
  <div class="game-teaser" :style="style">
    <a class="game-info" :href="'/g/' + game.id">
      <span class="game-info-text">
        🧩 {{game.tilesFinished}}/{{game.tilesTotal}}<br />
        👥 {{game.players}}<br />
        {{time(game.started, game.finished)}}<br />
      </span>
    </a>
    <a v-if="false && game.hasReplay" class="game-replay" :href="'/replay/' + game.id">
      ↪️ Watch replay
    </a>
  </div>`,
  computed: {
    style() {
      const url = this.game.imageUrl.replace('uploads/', 'uploads/r/') + '-375x210.webp'
      return {
        'background-image': `url("${url}")`,
      }
    },
  },
  methods: {
    time(start, end) {
      const icon = end ? '🏁' : '⏳'
      const from = start;
      const to = end || Time.timestamp()
      const timeDiffStr = Time.timeDiffStr(from, to)
      return `${icon} ${timeDiffStr}`
    },
  },
}

const ImageTeaser = {
  name: 'image-teaser',
  props: {
    image: Object
  },
  template: `<div class="imageteaser" :style="style" @click="onClick"></div>`,
  computed: {
    style() {
      const url = this.image.url.replace('uploads/', 'uploads/r/') + '-150x100.webp'
      return {
        'background-image': `url("${url}")`,
      }
    },
  },
  methods: {
    onClick() {
      this.$emit('click')
    },
  },
}

export default {
  components: {
    Upload,
    GameTeaser,
    ImageTeaser,
  },
  props: {
    gamesRunning: Array,
    gamesFinished: Array,
    images: Array,
  },
  template: `
<div id="app">
  <h1>Running games</h1>
  <div class="game-teaser-wrap" v-for="g in gamesRunning">
    <game-teaser :game="g" />
  </div>

  <h1>New game</h1>
  <table>
    <tr>
      <td><label>Pieces: </label></td>
      <td><input type="text" v-model="tiles" /></td>
    </tr>
    <tr>
      <td><label>Scoring: </label></td>
      <td>
        <label><input type="radio" v-model="scoreMode" value="1" /> Any (Score when pieces are connected to each other or on final location)</label>
        <br />
        <label><input type="radio" v-model="scoreMode" value="0" /> Final (Score when pieces are put to their final location)</label>
      </td>
    </tr>
    <tr>
      <td><label>Image: </label></td>
      <td>
        <span v-if="image">
          <img :src="image.url" style="width: 150px;" />
          or
          <upload @uploaded="mediaImgUploaded($event)" accept="image/*" label="Upload an image" />
        </span>
        <span v-else>
          <upload @uploaded="mediaImgUploaded($event)" accept="image/*" label="Upload an image" />
          (or select from below)
        </span>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <span class="btn" :class="" @click="onNewGameClick">Start new game</span>
      </td>
    </tr>
  </table>

  <h1>Image lib</h1>
  <div>
    <image-teaser v-for="i in images" :image="i" @click="image = i" />
  </div>

  <h1>Finished games</h1>
  <div class="game-teaser-wrap" v-for="g in gamesFinished">
    <game-teaser :game="g" />
  </div>
</div>`,
  data() {
    return {
      tiles: 1000,
      image: '',
      scoreMode: GameCommon.SCORE_MODE_ANY,
    }
  },
  methods: {
    time(start, end) {
      const icon = end ? '🏁' : '⏳'
      const from = start;
      const to = end || Time.timestamp()
      const timeDiffStr = Time.timeDiffStr(from, to)
      return `${icon} ${timeDiffStr}`
    },
    mediaImgUploaded(j) {
      this.image = j.image
    },
    async onNewGameClick() {
      const res = await fetch('/newgame', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tiles: this.tiles,
          image: this.image,
          scoreMode: parseInt(this.scoreMode, 10),
        }),
      })
      if (res.status === 200) {
        const game = await res.json()
        location.assign(game.url)
      }
    }
  }
}
