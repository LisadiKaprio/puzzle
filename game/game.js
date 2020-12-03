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

function getActivePlayers(players) {
  const ts = Util.timestamp()
  const activePlayers = []
  for (let id of Object.keys(players)) {
    const player = players[id]
    if (player.ts >= ts - 30000) {
      activePlayers.push(player)
    }
  }
  return activePlayers
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
  const updateScores = (players) => {
    const activePlayers = getActivePlayers(players)
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

const getFirstOwnedTile = (puzzle, userId) => {
  for (let t of puzzle.tiles) {
    if (t.owner === userId) {
      return t
    }
  }
  return null
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
  Game.createGame(GAME_ID, game);

  const bitmaps = await PuzzleGraphics.loadPuzzleBitmaps(game.puzzle)
  const puzzle = game.puzzle
  const players = game.players

  const changePlayer = (change) => {
    for (let k of Object.keys(change)) {
      players[CLIENT_ID][k] = change[k]
    }
  }

  const {bgColorPickerEl, playerColorPickerEl, nameChangeEl, updateScores} = addMenuToDom(game.puzzle.info.imageUrl)
  updateScores(players)

  // Create a dom and attach adapters to it so we can work with it
  const canvas = addCanvasToDom(Graphics.createCanvas())
  const ctx = canvas.getContext('2d')

  // initialize some view data
  // this global data will change according to input events
  const viewport = new Camera(canvas)
  // center viewport
  viewport.move(
    -(puzzle.info.table.width - viewport.width) /2,
    -(puzzle.info.table.height - viewport.height) /2
  )

  const evts = new EventAdapter(canvas, viewport)

  bgColorPickerEl.value = players[CLIENT_ID].bgcolor
  bgColorPickerEl.addEventListener('change', () => {
    evts.addEvent(['bg_color', bgColorPickerEl.value])
  })
  playerColorPickerEl.value = players[CLIENT_ID].color
  playerColorPickerEl.addEventListener('change', () => {
    evts.addEvent(['player_color', playerColorPickerEl.value])
  })
  nameChangeEl.value = players[CLIENT_ID].name
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
          if (changeData.id !== CLIENT_ID) {
            players[changeData.id] = changeData
            RERENDER = true
          }
        } break;
        case 'tile': {
          puzzle.tiles[changeData.idx] = changeData
          RERENDER = true
        } break;
        case 'data': {
          puzzle.data = changeData
          RERENDER = true
        } break;
      }
    }
  })

  const tilesSortedByZIndex = () => {
    const sorted = puzzle.tiles.slice()
    return sorted.sort((t1, t2) => t1.z - t2.z)
  }

  let _last_mouse_down = null
  const onUpdate = () => {
    for (let evt of evts.consumeAll()) {

      // LOCAL ONLY CHANGES
      // -------------------------------------------------------------
      const type = evt[0]
      if (type === 'move') {
        const pos = { x: evt[1], y: evt[2] }
        RERENDER = true
        changePlayer(pos)

        if (_last_mouse_down && !getFirstOwnedTile(puzzle, CLIENT_ID)) {
          // move the cam
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
          changePlayer(pos)
        }
      } else if (type === 'zoomout') {
        if (viewport.zoomOut()) {
          const pos = { x: evt[1], y: evt[2] }
          RERENDER = true
          changePlayer(pos)
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
    ctx.fillStyle = players[CLIENT_ID].bgcolor || '#222222'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (DEBUG) Debug.checkpoint('clear done')
    // ---------------------------------------------------------------


    // DRAW BOARD
    // ---------------------------------------------------------------
    pos = viewport.worldToViewport({
      x: (puzzle.info.table.width - puzzle.info.width) / 2,
      y: (puzzle.info.table.height - puzzle.info.height) / 2
    })
    dim = viewport.worldDimToViewport({
      w: puzzle.info.width,
      h: puzzle.info.height,
    })
    ctx.fillStyle = 'rgba(255, 255, 255, .5)'
    ctx.fillRect(pos.x, pos.y, dim.w, dim.h)
    if (DEBUG) Debug.checkpoint('board done')
    // ---------------------------------------------------------------


    // DRAW TILES
    // ---------------------------------------------------------------
    for (let tile of tilesSortedByZIndex()) {
      const bmp = bitmaps[tile.idx]
      pos = viewport.worldToViewport({
        x: puzzle.info.tileDrawOffset + tile.pos.x,
        y: puzzle.info.tileDrawOffset + tile.pos.y,
      })
      dim = viewport.worldDimToViewport({
        w: puzzle.info.tileDrawSize,
        h: puzzle.info.tileDrawSize,
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
    for (let p of getActivePlayers(players)) {
      const cursor = await getPlayerCursor(p)
      const pos = viewport.worldToViewport(p)
      ctx.drawImage(cursor,
        Math.round(pos.x - cursor.width/2),
        Math.round(pos.y - cursor.height/2)
      )
      if (p.id !== CLIENT_ID) {
        ctx.fillStyle = 'white'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.name + ' (' + p.points + ')',
          Math.round(pos.x),
          Math.round(pos.y) + cursor.height
        )
      }
    }
    if (DEBUG) Debug.checkpoint('players done')

    // DRAW PLAYERS
    // ---------------------------------------------------------------
    updateScores(players)
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
