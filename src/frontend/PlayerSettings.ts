import { MODE_REPLAY } from "./game";
import storage from "./storage";
import Game from './../common/GameCommon'
import { Emitter, EventType } from "mitt";

const SETTINGS = {
  SOUND_VOLUME: 'sound_volume',
  SOUND_ENABLED: 'sound_enabled',
  OTHER_PLAYER_CLICK_SOUND_ENABLED: 'other_player_click_sound_enabled',
  COLOR_BACKGROUND: 'bg_color',
  SHOW_TABLE: 'show_table',
  TABLE_TEXTURE: 'table_texture',
  PLAYER_COLOR: 'player_color',
  PLAYER_NAME: 'player_name',
  SHOW_PLAYER_NAMES: 'show_player_names',
}

const DEFAULTS = {
  SOUND_VOLUME: 100,
  SOUND_ENABLED: true,
  OTHER_PLAYER_CLICK_SOUND_ENABLED: true,
  COLOR_BACKGROUND: '#222222',
  SHOW_TABLE: true,
  TABLE_TEXTURE: 'dark',
  PLAYER_COLOR: '#ffffff',
  PLAYER_NAME: 'anon',
  SHOW_PLAYER_NAMES: true,
}

interface PlayerSettingsData {
  background: string
  showTable: boolean
  tableTexture: string
  color: string
  name: string
  soundsEnabled: boolean
  otherPlayerClickSoundEnabled: boolean
  soundsVolume: number
  showPlayerNames: boolean
}

export class PlayerSettings {

  private settings!: PlayerSettingsData

  constructor(
    private MODE: string,
    private gameId: string,
    private clientId: string,
    private eventBus: Emitter<Record<EventType, unknown>>
  ) {
    // pass
  }

  init() {
    this.settings = {} as PlayerSettingsData
    this.settings.soundsVolume = storage.getInt(SETTINGS.SOUND_VOLUME, DEFAULTS.SOUND_VOLUME)
    this.settings.otherPlayerClickSoundEnabled = storage.getBool(SETTINGS.OTHER_PLAYER_CLICK_SOUND_ENABLED, DEFAULTS.OTHER_PLAYER_CLICK_SOUND_ENABLED)
    this.settings.soundsEnabled = storage.getBool(SETTINGS.SOUND_ENABLED, DEFAULTS.SOUND_ENABLED)
    this.settings.showPlayerNames = storage.getBool(SETTINGS.SHOW_PLAYER_NAMES, DEFAULTS.SHOW_PLAYER_NAMES)
    this.settings.showTable = storage.getBool(SETTINGS.SHOW_TABLE, DEFAULTS.SHOW_TABLE)
    this.settings.tableTexture = storage.getStr(SETTINGS.TABLE_TEXTURE, DEFAULTS.TABLE_TEXTURE)
    if (this.MODE === MODE_REPLAY) {
      this.settings.background = storage.getStr(SETTINGS.COLOR_BACKGROUND, DEFAULTS.COLOR_BACKGROUND)
      this.settings.color = storage.getStr(SETTINGS.PLAYER_COLOR, DEFAULTS.PLAYER_COLOR)
      this.settings.name = storage.getStr(SETTINGS.PLAYER_NAME, DEFAULTS.PLAYER_NAME)
    } else {
      this.settings.background = Game.getPlayerBgColor(this.gameId, this.clientId)
        || storage.getStr(SETTINGS.COLOR_BACKGROUND, DEFAULTS.COLOR_BACKGROUND)
      this.settings.color = Game.getPlayerColor(this.gameId, this.clientId)
        || storage.getStr(SETTINGS.PLAYER_COLOR, DEFAULTS.PLAYER_COLOR)
      this.settings.name = Game.getPlayerName(this.gameId, this.clientId)
        || storage.getStr(SETTINGS.PLAYER_NAME, DEFAULTS.PLAYER_NAME)
    }
  }

  showStatusMessage(what: string, value: any = undefined) {
    this.eventBus.emit('statusMessage', { what, value })
  }

  setBackground(value: string) {
    if (this.settings.background !== value) {
      this.settings.background = value
      storage.setStr(SETTINGS.COLOR_BACKGROUND, value)
      this.showStatusMessage('Background', value)
      this.eventBus.emit('onBgChange', value)
      return true
    }
    return false
  }

  setTableTexture(value: string) {
    if (this.settings.tableTexture !== value) {
      this.settings.tableTexture = value
      storage.setStr(SETTINGS.TABLE_TEXTURE, value)
      this.showStatusMessage('Table texture', value)
      this.eventBus.emit('onTableTextureChange', value)
      return true
    }
    return false
  }

  setShowTable(value: boolean) {
    if (this.settings.showTable !== value) {
      this.settings.showTable = value
      storage.setBool(SETTINGS.SHOW_TABLE, value)
      this.showStatusMessage('Table', value)
      this.eventBus.emit('onShowTableChange', value)
      return true
    }
    return false
  }

  setColor(value: string) {
    if (this.settings.color !== value) {
      this.settings.color = value
      storage.setStr(SETTINGS.PLAYER_COLOR, value)
      this.showStatusMessage('Color', value)
      this.eventBus.emit('onColorChange', value)
      return true
    }
    return false
  }

  setName(value: string) {
    if (this.settings.name !== value) {
      this.settings.name = value
      storage.setStr(SETTINGS.PLAYER_NAME, value)
      this.showStatusMessage('Name', value)
      this.eventBus.emit('onNameChange', value)
      return true
    }
    return false
  }

  setOtherPlayerClickSoundEnabled(value: boolean) {
    if (this.settings.otherPlayerClickSoundEnabled !== value) {
      this.settings.otherPlayerClickSoundEnabled = value
      storage.setBool(SETTINGS.OTHER_PLAYER_CLICK_SOUND_ENABLED, value)
      this.showStatusMessage('Other player sounds', value)
      this.eventBus.emit('onOtherPlayerClickSoundEnabledChange', value)
      return true
    }
    return false
  }

  setSoundsEnabled(value: boolean) {
    if (this.settings.soundsEnabled !== value) {
      this.settings.soundsEnabled = value
      storage.setBool(SETTINGS.SOUND_ENABLED, value)
      this.showStatusMessage('Sounds', value)
      this.eventBus.emit('onSoundsEnabledChange', value)
      return true
    }
    return false
  }

  setSoundsVolume(value: number) {
    if (this.settings.soundsVolume !== value) {
      this.settings.soundsVolume = value
      storage.setInt(SETTINGS.SOUND_VOLUME, value)
      this.showStatusMessage('Volume', value)
      this.eventBus.emit('onSoundsVolumeChange', value)
      return true
    }
    return false
  }

  setShowPlayerNames(value: boolean) {
    if (this.settings.showPlayerNames !== value) {
      this.settings.showPlayerNames = value
      storage.setBool(SETTINGS.SHOW_PLAYER_NAMES, value)
      this.showStatusMessage('Player names', value)
      this.eventBus.emit('onShowPlayerNamesChange', value)
      return true
    }
    return false
  }

  toggleSoundsEnabled() {
    this.settings.soundsEnabled = !this.settings.soundsEnabled
    const value = this.settings.soundsEnabled
    this.eventBus.emit('toggleSoundsEnabled', value)
    storage.setBool(SETTINGS.SOUND_ENABLED, value)
    this.showStatusMessage('Sounds', value)
  }

  togglePlayerNames() {
    this.settings.showPlayerNames = !this.settings.showPlayerNames
    const value = this.settings.showPlayerNames
    this.eventBus.emit('togglePlayerNames', value)
    storage.setBool(SETTINGS.SHOW_PLAYER_NAMES, value)
    this.showStatusMessage('Player names', value)
  }

  toggleShowTable() {
    this.settings.showTable = !this.settings.showTable
    const value = this.settings.showTable
    this.eventBus.emit('toggleShowTable', value)
    storage.setBool(SETTINGS.SHOW_TABLE, value)
    this.showStatusMessage('Table', value)
  }

  showTable() {
    return this.settings.showTable
  }

  tableTexture() {
    return this.settings.tableTexture
  }

  soundsVolume() {
    return this.settings.soundsVolume
  }

  background() {
    return this.settings.background
  }

  color() {
    return this.settings.color
  }

  name() {
    return this.settings.name
  }

  otherPlayerClickSoundEnabled() {
    return this.settings.otherPlayerClickSoundEnabled
  }

  soundsEnabled() {
    return this.settings.soundsEnabled
  }

  showPlayerNames() {
    return this.settings.showPlayerNames
  }
}