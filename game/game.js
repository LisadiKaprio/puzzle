"use strict"
import {run} from './gameloop.js'
import Camera from './Camera.js'
import Graphics from './Graphics.js'
import Debug from './Debug.js'
import Communication from './Communication.js'
import Util from './../common/Util.js'
import PuzzleGraphics from './PuzzleGraphics.js'
import Game from './Game.js'

if (typeof GAME_ID === 'undefined') throw '[ GAME_ID not set ]'
if (typeof WS_ADDRESS === 'undefined') throw '[ WS_ADDRESS not set ]'

if (typeof DEBUG === 'undefined') window.DEBUG = false

let RERENDER = true

function addCanvasToDom(canvas) {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    RERENDER = true
  })
  return canvas
}

function addMenuToDom(previewImageUrl) {
  function row (...elements) {
    const row = document.createElement('tr')
    for (let el of elements) {
      const td = document.createElement('td')
      td.appendChild(el)
      row.appendChild(td)
    }
    return row
  }

  function colorinput() {
    const input = document.createElement('input')
    input.type = 'color'
    return input
  }

  function textinput(maxLength) {
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = maxLength
    return input
  }

  function label(text) {
    const label = document.createElement('label')
    label.innerText = text
    return label
  }

  const bgColorPickerEl = colorinput()
  const bgColorPickerRow = row(
    label('Background: '),
    bgColorPickerEl
  )

  const playerColorPickerEl = colorinput()
  const playerColorPickerRow = row(
    label('Color: '),
    playerColorPickerEl
  )

  const nameChangeEl = textinput(16)
  const nameChangeRow = row(
    label('Name: '),
    nameChangeEl
  )

  const settingsEl = document.createElement('table')
  settingsEl.classList.add('layer', 'settings', 'closed')
  settingsEl.appendChild(bgColorPickerRow)
  settingsEl.appendChild(playerColorPickerRow)
  settingsEl.appendChild(nameChangeRow)

  const previewEl = document.createElement('div')
  previewEl.classList.add('preview')

  const imgEl = document.createElement('div')
  imgEl.classList.add('img')
  imgEl.style.backgroundImage = `url(${previewImageUrl})`
  previewEl.appendChild(imgEl)

  const previewOverlay = document.createElement('div')
  previewOverlay.classList.add('overlay', 'closed')
  previewOverlay.appendChild(previewEl)
  previewOverlay.addEventListener('click', () => {
    previewOverlay.classList.toggle('closed')
  })

  const settingsOpenerEl = document.createElement('div')
  settingsOpenerEl.classList.add('opener')
  settingsOpenerEl.appendChild(document.createTextNode('🛠️ Settings'))
  settingsOpenerEl.addEventListener('click', () => {
    settingsEl.classList.toggle('closed')
  })

  const homeEl = document.createElement('a')
  homeEl.classList.add('opener')
  homeEl.appendChild(document.createTextNode('🧩 Puzzles'))
  homeEl.href = "/"

  const previewOpenerEl = document.createElement('div')
  previewOpenerEl.classList.add('opener')
  previewOpenerEl.appendChild(document.createTextNode('🖼️ Preview'))
  previewOpenerEl.addEventListener('click', () => {
    previewOverlay.classList.toggle('closed')
  })

  const tabsEl = document.createElement('div')
  tabsEl.classList.add('tabs')
  tabsEl.appendChild(homeEl)
  tabsEl.appendChild(previewOpenerEl)
  tabsEl.appendChild(settingsOpenerEl)

  const menuEl = document.createElement('div')
  menuEl.classList.add('menu')
  menuEl.appendChild(tabsEl)

  const scoresTitleEl = document.createElement('div')
  scoresTitleEl.appendChild(document.createTextNode('Scores'))

  const scoresListEl = document.createElement('table')
  const updateScores = (gameId) => {
    const activePlayers = Game.getActivePlayers(gameId)
    const scores = activePlayers.map(p => ({
      name: p.name,
      points: p.points,
      color: p.color,
    }))
    scores.sort((a, b) => b.points - a.points)
    scoresListEl.innerHTML = ''
    for (let score of scores) {
      const r = row(
        document.createTextNode(score.name),
        document.createTextNode(score.points)
      )
      r.style.color = score.color
      scoresListEl.appendChild(r)
    }
  }

  const scoresEl = document.createElement('div')
  scoresEl.classList.add('scores')
  scoresEl.appendChild(scoresTitleEl)
  scoresEl.appendChild(scoresListEl)

  document.body.appendChild(settingsEl)
  document.body.appendChild(previewOverlay)
  document.body.appendChild(menuEl)
  document.body.appendChild(scoresEl)

  return {
    bgColorPickerEl,
    playerColorPickerEl,
    nameChangeEl,
    updateScores,
  }
}

function initme() {
  // return uniqId()
  let ID = localStorage.getItem('ID')
  if (!ID) {
    ID = Util.uniqId()
    localStorage.setItem('ID', ID)
  }
  return ID
}

export default class EventAdapter {
  constructor(canvas, viewport) {
    this.events = []
    this._viewport = viewport
    canvas.addEventListener('mousedown', this._mouseDown.bind(this))
    canvas.addEventListener('mouseup', this._mouseUp.bind(this))
    canvas.addEventListener('mousemove', this._mouseMove.bind(this))
    canvas.addEventListener('wheel', this._wheel.bind(this))
  }

  addEvent(event) {
    this.events.push(event)
  }

  consumeAll() {
    if (this.events.length === 0) {
      return []
    }
    const all = this.events.slice()
    this.events = []
    return all
  }

  _mouseDown(e) {
    if (e.button === 0) {
      const pos = this._viewport.viewportToWorld({
        x: e.offsetX,
        y: e.offsetY,
      })
      this.addEvent(['down', pos.x, pos.y])
    }
  }

  _mouseUp(e) {
    if (e.button === 0) {
      const pos = this._viewport.viewportToWorld({
        x: e.offsetX,
        y: e.offsetY,
      })
      this.addEvent(['up', pos.x, pos.y])
    }
  }

  _mouseMove(e) {
    const pos = this._viewport.viewportToWorld({
      x: e.offsetX,
      y: e.offsetY,
    })
    this.addEvent(['move', pos.x, pos.y])
  }

  _wheel(e) {
    const pos = this._viewport.viewportToWorld({
      x: e.offsetX,
      y: e.offsetY,
    })
    const evt = e.deltaY < 0 ? 'zoomin' : 'zoomout'
    this.addEvent([evt, pos.x, pos.y])
  }
}

async function main() {
  let gameId = GAME_ID
  let CLIENT_ID = initme()

  const cursorGrab = await Graphics.loadImageToBitmap('/grab.png')
  const cursorHand = await Graphics.loadImageToBitmap('/hand.png')
  const cursorGrabMask = await Graphics.loadImageToBitmap('/grab_mask.png')
  const cursorHandMask = await Graphics.loadImageToBitmap('/hand_mask.png')

  const cursors = {}
  const getPlayerCursor = async (p) => {
    let key = p.color + ' ' + p.d
    if (!cursors[key]) {
      const cursor = p.d ? cursorGrab : cursorHand
      const mask = p.d ? cursorGrabMask : cursorHandMask
      cursors[key] = await Graphics.colorize(cursor, mask, p.color)
    }
    return cursors[key]
  }

  const game = await Communication.connect(gameId, CLIENT_ID)
  Game.newGame(game)

  const bitmaps = await PuzzleGraphics.loadPuzzleBitmaps(game.puzzle)

  const {bgColorPickerEl, playerColorPickerEl, nameChangeEl, updateScores} = addMenuToDom(Game.getImageUrl(gameId))
  updateScores(gameId)

  // Create a dom and attach adapters to it so we can work with it
  const canvas = addCanvasToDom(Graphics.createCanvas())
  const ctx = canvas.getContext('2d')

  // initialize some view data
  // this global data will change according to input events
  const viewport = new Camera(canvas)
  // center viewport
  viewport.move(
    -(Game.getTableWidth(gameId) - viewport.width) /2,
    -(Game.getTableHeight(gameId) - viewport.height) /2
  )

  const evts = new EventAdapter(canvas, viewport)

  bgColorPickerEl.value = Game.getPlayerBgColor(gameId, CLIENT_ID)
  bgColorPickerEl.addEventListener('change', () => {
    evts.addEvent(['bg_color', bgColorPickerEl.value])
  })
  playerColorPickerEl.value = Game.getPlayerBgColor(gameId, CLIENT_ID)
  playerColorPickerEl.addEventListener('change', () => {
    evts.addEvent(['player_color', playerColorPickerEl.value])
  })
  nameChangeEl.value = Game.getPlayerName(gameId, CLIENT_ID)
  nameChangeEl.addEventListener('change', () => {
    evts.addEvent(['player_name', nameChangeEl.value])
  })

  Communication.onServerChange((msg) => {
    const msgType = msg[0]
    const evClientId = msg[1]
    const evClientSeq = msg[2]
    const evChanges = msg[3]
    for(let [changeType, changeData] of evChanges) {
      switch (changeType) {
        case 'player': {
          const p = Util.decodePlayer(changeData)
          if (p.id !== CLIENT_ID) {
            Game.setPlayer(gameId, p.id, p)
            RERENDER = true
          }
        } break;
        case 'tile': {
          const t = Util.decodeTile(changeData)
          Game.setTile(gameId, t.idx, t)
          RERENDER = true
        } break;
        case 'data': {
          Game.setPuzzleData(gameId, changeData)
          RERENDER = true
        } break;
      }
    }
  })

  let _last_mouse_down = null
  const onUpdate = () => {
    for (let evt of evts.consumeAll()) {

      // LOCAL ONLY CHANGES
      // -------------------------------------------------------------
      const type = evt[0]
      if (type === 'move') {
        if (_last_mouse_down && !Game.getFirstOwnedTile(gameId, CLIENT_ID)) {
          // move the cam
          const pos = { x: evt[1], y: evt[2] }
          const mouse = viewport.worldToViewport(pos)
          const diffX = Math.round(mouse.x - _last_mouse_down.x)
          const diffY = Math.round(mouse.y - _last_mouse_down.y)
          viewport.move(diffX, diffY)

          _last_mouse_down = mouse
        }
      } else if (type === 'down') {
        const pos = { x: evt[1], y: evt[2] }
        _last_mouse_down = viewport.worldToViewport(pos)
      } else if (type === 'up') {
        _last_mouse_down = null
      } else if (type === 'zoomin') {
        if (viewport.zoomIn()) {
          const pos = { x: evt[1], y: evt[2] }
          RERENDER = true
          Game.changePlayer(gameId, CLIENT_ID, pos)
        }
      } else if (type === 'zoomout') {
        if (viewport.zoomOut()) {
          const pos = { x: evt[1], y: evt[2] }
          RERENDER = true
          Game.changePlayer(gameId, CLIENT_ID, pos)
        }
      }

      // LOCAL + SERVER CHANGES
      // -------------------------------------------------------------
      const changes = Game.handleInput(GAME_ID, CLIENT_ID, evt)
      if (changes.length > 0) {
        RERENDER = true
      }
      Communication.sendClientEvent(evt)
    }
  }

  const onRender = async () => {
    if (!RERENDER) {
      return
    }

    let pos
    let dim

    if (DEBUG) Debug.checkpoint_start(0)

    // CLEAR CTX
    // ---------------------------------------------------------------
    ctx.fillStyle = Game.getPlayerBgColor(gameId, CLIENT_ID) || '#222222'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (DEBUG) Debug.checkpoint('clear done')
    // ---------------------------------------------------------------


    // DRAW BOARD
    // ---------------------------------------------------------------
    pos = viewport.worldToViewport({
      x: (Game.getTableWidth(gameId) - Game.getPuzzleWidth(gameId)) / 2,
      y: (Game.getTableHeight(gameId) - Game.getPuzzleHeight(gameId)) / 2
    })
    dim = viewport.worldDimToViewport({
      w: Game.getPuzzleWidth(gameId),
      h: Game.getPuzzleHeight(gameId),
    })
    ctx.fillStyle = 'rgba(255, 255, 255, .5)'
    ctx.fillRect(pos.x, pos.y, dim.w, dim.h)
    if (DEBUG) Debug.checkpoint('board done')
    // ---------------------------------------------------------------


    // DRAW TILES
    // ---------------------------------------------------------------
    for (let tile of Game.getTilesSortedByZIndex(gameId)) {
      const bmp = bitmaps[tile.idx]
      pos = viewport.worldToViewport({
        x: Game.getTileDrawOffset(gameId) + tile.pos.x,
        y: Game.getTileDrawOffset(gameId) + tile.pos.y,
      })
      dim = viewport.worldDimToViewport({
        w: Game.getTileDrawSize(gameId),
        h: Game.getTileDrawSize(gameId),
      })
      ctx.drawImage(bmp,
        0, 0, bmp.width, bmp.height,
        pos.x, pos.y, dim.w, dim.h
      )
    }
    if (DEBUG) Debug.checkpoint('tiles done')
    // ---------------------------------------------------------------


    // DRAW PLAYERS
    // ---------------------------------------------------------------
    for (let player of Game.getActivePlayers(gameId)) {
      const cursor = await getPlayerCursor(player)
      const pos = viewport.worldToViewport(player)
      ctx.drawImage(cursor,
        Math.round(pos.x - cursor.width/2),
        Math.round(pos.y - cursor.height/2)
      )
      if (player.id !== CLIENT_ID) {
        ctx.fillStyle = 'white'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(player.name + ' (' + player.points + ')',
          Math.round(pos.x),
          Math.round(pos.y) + cursor.height
        )
      }
    }
    if (DEBUG) Debug.checkpoint('players done')

    // DRAW PLAYERS
    // ---------------------------------------------------------------
    updateScores(gameId)
    if (DEBUG) Debug.checkpoint('scores done')
    // ---------------------------------------------------------------


    RERENDER = false
  }

  run({
    update: onUpdate,
    render: onRender,
  })
}

main()
