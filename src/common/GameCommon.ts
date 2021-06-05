import Geometry, { Point, Rect } from './Geometry'
import Protocol from './Protocol'
import { Rng } from './Rng'
import Time from './Time'
import {
  Change,
  EncodedPiece,
  EvtInfo,
  Game,
  Input,
  Piece,
  PieceChange,
  Player,
  PlayerChange,
  Puzzle,
  PuzzleData,
  PuzzleDataChange,
  ScoreMode,
  SnapMode,
  Timestamp
} from './Types'
import Util from './Util'

const IDLE_TIMEOUT_SEC = 30

// Map<gameId, Game>
const GAMES: Record<string, Game> = {}

function exists(gameId: string): boolean {
  return (!!GAMES[gameId]) || false
}

function __createPlayerObject(id: string, ts: Timestamp): Player {
  return {
    id: id,
    x: 0,
    y: 0,
    d: 0, // mouse down
    name: null, // 'anon'
    color: null, // '#ffffff'
    bgcolor: null, // '#222222'
    points: 0,
    ts: ts,
  }
}

function setGame(gameId: string, game: Game): void {
  GAMES[gameId] = game
}

function getPlayerIndexById(gameId: string, playerId: string): number {
  let i = 0;
  for (const player of GAMES[gameId].players) {
    if (Util.decodePlayer(player).id === playerId) {
      return i
    }
    i++
  }
  return -1
}

function getPlayerIdByIndex(gameId: string, playerIndex: number): string|null {
  if (GAMES[gameId].players.length > playerIndex) {
    return Util.decodePlayer(GAMES[gameId].players[playerIndex]).id
  }
  return null
}

function getPlayer(gameId: string, playerId: string): Player|null {
  const idx = getPlayerIndexById(gameId, playerId)
  if (idx === -1) {
    return null
  }
  return Util.decodePlayer(GAMES[gameId].players[idx])
}

function setPlayer(
  gameId: string,
  playerId: string,
  player: Player
): void {
  const idx = getPlayerIndexById(gameId, playerId)
  if (idx === -1) {
    GAMES[gameId].players.push(Util.encodePlayer(player))
  } else {
    GAMES[gameId].players[idx] = Util.encodePlayer(player)
  }
}

function setPiece(gameId: string, pieceIdx: number, piece: Piece): void {
  GAMES[gameId].puzzle.tiles[pieceIdx] = Util.encodePiece(piece)
}

function setPuzzleData(gameId: string, data: PuzzleData): void {
  GAMES[gameId].puzzle.data = data
}

function playerExists(gameId: string, playerId: string): boolean {
  const idx = getPlayerIndexById(gameId, playerId)
  return idx !== -1
}

function getActivePlayers(gameId: string, ts: number): Array<Player> {
  const minTs = ts - IDLE_TIMEOUT_SEC * Time.SEC
  return getAllPlayers(gameId).filter((p: Player) => p.ts >= minTs)
}

function getIdlePlayers(gameId: string, ts: number): Array<Player> {
  const minTs = ts - IDLE_TIMEOUT_SEC * Time.SEC
  return getAllPlayers(gameId).filter((p: Player) => p.ts < minTs && p.points > 0)
}

function addPlayer(gameId: string, playerId: string, ts: Timestamp): void {
  if (!playerExists(gameId, playerId)) {
    setPlayer(gameId, playerId, __createPlayerObject(playerId, ts))
  } else {
    changePlayer(gameId, playerId, { ts })
  }
}

function getEvtInfo(gameId: string, playerId: string): EvtInfo {
  if (playerId in GAMES[gameId].evtInfos) {
    return GAMES[gameId].evtInfos[playerId]
  }
  return {
    _last_mouse: null,
    _last_mouse_down: null,
  }
}

function setEvtInfo(
  gameId: string,
  playerId: string,
  evtInfo: EvtInfo
): void {
  GAMES[gameId].evtInfos[playerId] = evtInfo
}

function getAllGames(): Array<Game> {
  return Object.values(GAMES).sort((a: Game, b: Game) => {
    // when both have same finished state, sort by started
    if (isFinished(a.id) === isFinished(b.id)) {
      return b.puzzle.data.started - a.puzzle.data.started
    }
    // otherwise, sort: unfinished, finished
    return isFinished(a.id) ? 1 : -1
  })
}

function getAllPlayers(gameId: string): Array<Player> {
  return GAMES[gameId]
    ? GAMES[gameId].players.map(Util.decodePlayer)
    : []
}

function get(gameId: string): Game|null {
  return GAMES[gameId] || null
}

function getPieceCount(gameId: string): number {
  return GAMES[gameId].puzzle.tiles.length
}

function getImageUrl(gameId: string): string {
  return GAMES[gameId].puzzle.info.imageUrl
}

function setImageUrl(gameId: string, imageUrl: string): void {
  GAMES[gameId].puzzle.info.imageUrl = imageUrl
}

function getScoreMode(gameId: string): ScoreMode {
  return GAMES[gameId].scoreMode || ScoreMode.FINAL
}

function getSnapMode(gameId: string): SnapMode {
  return GAMES[gameId].snapMode || SnapMode.NORMAL
}

function isFinished(gameId: string): boolean {
  return getFinishedPiecesCount(gameId) === getPieceCount(gameId)
}

function getFinishedPiecesCount(gameId: string): number {
  let count = 0
  for (const t of GAMES[gameId].puzzle.tiles) {
    if (Util.decodePiece(t).owner === -1) {
      count++
    }
  }
  return count
}

function getPiecesSortedByZIndex(gameId: string): Piece[] {
  const pieces = GAMES[gameId].puzzle.tiles.map(Util.decodePiece)
  return pieces.sort((t1, t2) => t1.z - t2.z)
}

function changePlayer(
  gameId: string,
  playerId: string,
  change: PlayerChange
): void {
  const player = getPlayer(gameId, playerId)
  if (player === null) {
    return
  }

  for (const k of Object.keys(change)) {
    // @ts-ignore
    player[k] = change[k]
  }
  setPlayer(gameId, playerId, player)
}

function changeData(gameId: string, change: PuzzleDataChange): void {
  for (const k of Object.keys(change)) {
    // @ts-ignore
    GAMES[gameId].puzzle.data[k] = change[k]
  }
}

function changePiece(
  gameId: string,
  pieceIdx: number,
  change: PieceChange
): void {
  for (const k of Object.keys(change)) {
    const piece = Util.decodePiece(GAMES[gameId].puzzle.tiles[pieceIdx])
    // @ts-ignore
    piece[k] = change[k]
    GAMES[gameId].puzzle.tiles[pieceIdx] = Util.encodePiece(piece)
  }
}

const getPiece = (gameId: string, pieceIdx: number): Piece => {
  return Util.decodePiece(GAMES[gameId].puzzle.tiles[pieceIdx])
}

const getPieceGroup = (gameId: string, tileIdx: number): number => {
  const tile = getPiece(gameId, tileIdx)
  return tile.group
}

const isCornerPiece = (gameId: string, tileIdx: number): boolean => {
  const info = GAMES[gameId].puzzle.info
  return (
    tileIdx === 0 // top left corner
    || tileIdx === (info.tilesX - 1) // top right corner
    || tileIdx === (info.tiles - info.tilesX) // bottom left corner
    || tileIdx === (info.tiles - 1) // bottom right corner
  )
}

const getFinalPiecePos = (gameId: string, tileIdx: number): Point => {
  const info = GAMES[gameId].puzzle.info
  const boardPos = {
    x: (info.table.width - info.width) / 2,
    y: (info.table.height - info.height) / 2
  }
  const srcPos = srcPosByTileIdx(gameId, tileIdx)
  return Geometry.pointAdd(boardPos, srcPos)
}

const getPiecePos = (gameId: string, tileIdx: number): Point => {
  const tile = getPiece(gameId, tileIdx)
  return tile.pos
}

// todo: instead, just make the table bigger and use that :)
const getBounds = (gameId: string): Rect => {
  const tw = getTableWidth(gameId)
  const th = getTableHeight(gameId)

  const overX = Math.round(tw / 4)
  const overY = Math.round(th / 4)
  return {
    x: 0 - overX,
    y: 0 - overY,
    w: tw + 2 * overX,
    h: th + 2 * overY,
  }
}

const getPieceBounds = (gameId: string, tileIdx: number): Rect => {
  const s = getPieceSize(gameId)
  const tile = getPiece(gameId, tileIdx)
  return {
    x: tile.pos.x,
    y: tile.pos.y,
    w: s,
    h: s,
  }
}

const getPieceZIndex = (gameId: string, pieceIdx: number): number => {
  return getPiece(gameId, pieceIdx).z
}

const getFirstOwnedPieceIdx = (gameId: string, playerId: string): number => {
  for (const t of GAMES[gameId].puzzle.tiles) {
    const tile = Util.decodePiece(t)
    if (tile.owner === playerId) {
      return tile.idx
    }
  }
  return -1
}

const getFirstOwnedPiece = (
  gameId: string,
  playerId: string
): EncodedPiece|null => {
  const idx = getFirstOwnedPieceIdx(gameId, playerId)
  return idx < 0 ? null : GAMES[gameId].puzzle.tiles[idx]
}

const getPieceDrawOffset = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.tileDrawOffset
}

const getPieceDrawSize = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.tileDrawSize
}

const getPieceSize = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.tileSize
}

const getStartTs = (gameId: string): Timestamp => {
  return GAMES[gameId].puzzle.data.started
}

const getFinishTs = (gameId: string): Timestamp => {
  return GAMES[gameId].puzzle.data.finished
}

const getMaxGroup = (gameId: string): number => {
  return GAMES[gameId].puzzle.data.maxGroup
}

const getMaxZIndex = (gameId: string): number => {
  return GAMES[gameId].puzzle.data.maxZ
}

const getMaxZIndexByPieceIdxs = (gameId: string, pieceIdxs: Array<number>): number => {
  let maxZ = 0
  for (const pieceIdx of pieceIdxs) {
    const curZ = getPieceZIndex(gameId, pieceIdx)
    if (curZ > maxZ) {
      maxZ = curZ
    }
  }
  return maxZ
}

function srcPosByTileIdx(gameId: string, tileIdx: number): Point {
  const info = GAMES[gameId].puzzle.info

  const c = Util.coordByPieceIdx(info, tileIdx)
  const cx = c.x * info.tileSize
  const cy = c.y * info.tileSize

  return { x: cx, y: cy }
}

function getSurroundingTilesByIdx(gameId: string, tileIdx: number) {
  const info = GAMES[gameId].puzzle.info

  const c = Util.coordByPieceIdx(info, tileIdx)

  return [
    // top
    (c.y > 0) ?               (tileIdx - info.tilesX) : -1,
    // right
    (c.x < info.tilesX - 1) ? (tileIdx + 1)           : -1,
    // bottom
    (c.y < info.tilesY - 1) ? (tileIdx + info.tilesX) : -1,
    // left
    (c.x > 0) ?               (tileIdx - 1)           : -1,
  ]
}

const setPiecesZIndex = (gameId: string, tileIdxs: Array<number>, zIndex: number): void => {
  for (const tilesIdx of tileIdxs) {
    changePiece(gameId, tilesIdx, { z: zIndex })
  }
}

const moveTileDiff = (gameId: string, tileIdx: number, diff: Point): void => {
  const oldPos = getPiecePos(gameId, tileIdx)
  const pos = Geometry.pointAdd(oldPos, diff)
  changePiece(gameId, tileIdx, { pos })
}

const movePiecesDiff = (
  gameId: string,
  pieceIdxs: Array<number>,
  diff: Point
): void => {
  const drawSize = getPieceDrawSize(gameId)
  const bounds = getBounds(gameId)
  const cappedDiff = diff

  for (const pieceIdx of pieceIdxs) {
    const t = getPiece(gameId, pieceIdx)
    if (t.pos.x + diff.x < bounds.x) {
      cappedDiff.x = Math.max(bounds.x - t.pos.x, cappedDiff.x)
    } else if (t.pos.x + drawSize + diff.x > bounds.x + bounds.w) {
      cappedDiff.x = Math.min(bounds.x + bounds.w - t.pos.x + drawSize, cappedDiff.x)
    }
    if (t.pos.y + diff.y < bounds.y) {
      cappedDiff.y = Math.max(bounds.y - t.pos.y, cappedDiff.y)
    } else if (t.pos.y + drawSize + diff.y > bounds.y + bounds.h) {
      cappedDiff.y = Math.min(bounds.y + bounds.h - t.pos.y + drawSize, cappedDiff.y)
    }
  }

  for (const pieceIdx of pieceIdxs) {
    moveTileDiff(gameId, pieceIdx, cappedDiff)
  }
}

const isFinishedPiece = (gameId: string, pieceIdx: number): boolean => {
  return getPieceOwner(gameId, pieceIdx) === -1
}

const getPieceOwner = (gameId: string, pieceIdx: number): string|number => {
  return getPiece(gameId, pieceIdx).owner
}

const finishPieces = (gameId: string, pieceIdxs: Array<number>): void => {
  for (const pieceIdx of pieceIdxs) {
    changePiece(gameId, pieceIdx, { owner: -1, z: 1 })
  }
}

const setTilesOwner = (
  gameId: string,
  pieceIdxs: Array<number>,
  owner: string|number
): void => {
  for (const pieceIdx of pieceIdxs) {
    changePiece(gameId, pieceIdx, { owner })
  }
}

// get all grouped tiles for a tile
function getGroupedPieceIdxs(gameId: string, pieceIdx: number): number[] {
  const pieces = GAMES[gameId].puzzle.tiles
  const piece = Util.decodePiece(pieces[pieceIdx])

  const grouped = []
  if (piece.group) {
    for (const other of pieces) {
      const otherPiece = Util.decodePiece(other)
      if (otherPiece.group === piece.group) {
        grouped.push(otherPiece.idx)
      }
    }
  } else {
    grouped.push(piece.idx)
  }
  return grouped
}

// Returns the index of the puzzle tile with the highest z index
// that is not finished yet and that matches the position
const freePieceIdxByPos = (gameId: string, pos: Point): number => {
  const info = GAMES[gameId].puzzle.info
  const pieces = GAMES[gameId].puzzle.tiles

  let maxZ = -1
  let pieceIdx = -1
  for (let idx = 0; idx < pieces.length; idx++) {
    const piece = Util.decodePiece(pieces[idx])
    if (piece.owner !== 0) {
      continue
    }

    const collisionRect: Rect = {
      x: piece.pos.x,
      y: piece.pos.y,
      w: info.tileSize,
      h: info.tileSize,
    }
    if (Geometry.pointInBounds(pos, collisionRect)) {
      if (maxZ === -1 || piece.z > maxZ) {
        maxZ = piece.z
        pieceIdx = idx
      }
    }
  }
  return pieceIdx
}

const getPlayerBgColor = (gameId: string, playerId: string): string|null => {
  const p = getPlayer(gameId, playerId)
  return p ? p.bgcolor : null
}

const getPlayerColor = (gameId: string, playerId: string): string|null => {
  const p = getPlayer(gameId, playerId)
  return p ? p.color : null
}

const getPlayerName = (gameId: string, playerId: string): string|null => {
  const p = getPlayer(gameId, playerId)
  return p ? p.name : null
}

const getPlayerPoints = (gameId: string, playerId: string): number => {
  const p = getPlayer(gameId, playerId)
  return p ? p.points : 0
}

// determine if two tiles are grouped together
const areGrouped = (
  gameId: string,
  tileIdx1: number,
  tileIdx2: number
): boolean => {
  const g1 = getPieceGroup(gameId, tileIdx1)
  const g2 = getPieceGroup(gameId, tileIdx2)
  return !!(g1 && g1 === g2)
}

const getTableWidth = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.table.width
}

const getTableHeight = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.table.height
}

const getPuzzle = (gameId: string): Puzzle => {
  return GAMES[gameId].puzzle
}

const getRng = (gameId: string): Rng => {
  return GAMES[gameId].rng.obj
}

const getPuzzleWidth = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.width
}

const getPuzzleHeight = (gameId: string): number => {
  return GAMES[gameId].puzzle.info.height
}

function handleInput(
  gameId: string,
  playerId: string,
  input: Input,
  ts: Timestamp,
  onSnap?: (playerId: string) => void
): Array<Change> {
  const puzzle = GAMES[gameId].puzzle
  const evtInfo = getEvtInfo(gameId, playerId)

  const changes: Array<Change> = []

  const _dataChange = (): void => {
    changes.push([Protocol.CHANGE_DATA, puzzle.data])
  }

  const _pieceChange = (pieceIdx: number): void => {
    changes.push([
      Protocol.CHANGE_TILE,
      Util.encodePiece(getPiece(gameId, pieceIdx)),
    ])
  }

  const _pieceChanges = (pieceIdxs: Array<number>): void => {
    for (const pieceIdx of pieceIdxs) {
      _pieceChange(pieceIdx)
    }
  }

  const _playerChange = (): void => {
    const player = getPlayer(gameId, playerId)
    if (!player) {
      return
    }
    changes.push([
      Protocol.CHANGE_PLAYER,
      Util.encodePlayer(player),
    ])
  }

  // put both tiles (and their grouped tiles) in the same group
  const groupTiles = (
    gameId: string,
    pieceIdx1: number,
    pieceIdx2: number
  ): void => {
    const pieces = GAMES[gameId].puzzle.tiles
    const group1 = getPieceGroup(gameId, pieceIdx1)
    const group2 = getPieceGroup(gameId, pieceIdx2)

    let group
    const searchGroups = []
    if (group1) {
      searchGroups.push(group1)
    }
    if (group2) {
      searchGroups.push(group2)
    }
    if (group1) {
      group = group1
    } else if (group2) {
      group = group2
    } else {
      const maxGroup = getMaxGroup(gameId) + 1
      changeData(gameId, { maxGroup })
      _dataChange()
      group = getMaxGroup(gameId)
    }

    changePiece(gameId, pieceIdx1, { group })
    _pieceChange(pieceIdx1)
    changePiece(gameId, pieceIdx2, { group })
    _pieceChange(pieceIdx2)

    // TODO: strange
    if (searchGroups.length > 0) {
      for (const p of pieces) {
        const piece = Util.decodePiece(p)
        if (searchGroups.includes(piece.group)) {
          changePiece(gameId, piece.idx, { group })
          _pieceChange(piece.idx)
        }
      }
    }
  }

  const type = input[0]
  if (type === Protocol.INPUT_EV_BG_COLOR) {
    const bgcolor = input[1]
    changePlayer(gameId, playerId, { bgcolor, ts })
    _playerChange()
  } else if (type === Protocol.INPUT_EV_PLAYER_COLOR) {
    const color = input[1]
    changePlayer(gameId, playerId, { color, ts })
    _playerChange()
  } else if (type === Protocol.INPUT_EV_PLAYER_NAME) {
    const name = `${input[1]}`.substr(0, 16)
    changePlayer(gameId, playerId, { name, ts })
    _playerChange()
  } else if (type === Protocol.INPUT_EV_MOVE) {
    const w = input[1]
    const h = input[2]
    const player = getPlayer(gameId, playerId)
    if (player) {
      const x = player.x - w
      const y = player.y - h
      changePlayer(gameId, playerId, { ts, x, y })
      _playerChange()
    }
  } else if (type === Protocol.INPUT_EV_MOUSE_DOWN) {
    const x = input[1]
    const y = input[2]
    const pos = {x, y}

    changePlayer(gameId, playerId, { d: 1, ts })
    _playerChange()
    evtInfo._last_mouse_down = pos

    const tileIdxAtPos = freePieceIdxByPos(gameId, pos)
    if (tileIdxAtPos >= 0) {
      const maxZ = getMaxZIndex(gameId) + 1
      changeData(gameId, { maxZ })
      _dataChange()
      const tileIdxs = getGroupedPieceIdxs(gameId, tileIdxAtPos)
      setPiecesZIndex(gameId, tileIdxs, getMaxZIndex(gameId))
      setTilesOwner(gameId, tileIdxs, playerId)
      _pieceChanges(tileIdxs)
    }
    evtInfo._last_mouse = pos

  } else if (type === Protocol.INPUT_EV_MOUSE_MOVE) {
    const x = input[1]
    const y = input[2]
    const pos = {x, y}

    if (evtInfo._last_mouse_down === null) {
      // player is just moving the hand
      changePlayer(gameId, playerId, {x, y, ts})
      _playerChange()
    } else {
      const pieceIdx = getFirstOwnedPieceIdx(gameId, playerId)
      if (pieceIdx >= 0) {
        // player is moving a tile (and hand)
        changePlayer(gameId, playerId, {x, y, ts})
        _playerChange()

        // check if pos is on the tile, otherwise dont move
        // (mouse could be out of table, but tile stays on it)
        const pieceIdxs = getGroupedPieceIdxs(gameId, pieceIdx)
        let anyOk = Geometry.pointInBounds(pos, getBounds(gameId))
          && Geometry.pointInBounds(evtInfo._last_mouse_down, getBounds(gameId))
        for (const idx of pieceIdxs) {
          const bounds = getPieceBounds(gameId, idx)
          if (Geometry.pointInBounds(pos, bounds)) {
            anyOk = true
            break
          }
        }
        if (anyOk) {
          const diffX = x - evtInfo._last_mouse_down.x
          const diffY = y - evtInfo._last_mouse_down.y

          const diff = { x: diffX, y: diffY }
          movePiecesDiff(gameId, pieceIdxs, diff)

          _pieceChanges(pieceIdxs)
        }
      } else {
        // player is just moving map, so no change in position!
        changePlayer(gameId, playerId, {ts})
        _playerChange()
      }

      evtInfo._last_mouse_down = pos
    }
    evtInfo._last_mouse = pos

  } else if (type === Protocol.INPUT_EV_MOUSE_UP) {
    const x = input[1]
    const y = input[2]
    const pos = {x, y}
    const d = 0

    evtInfo._last_mouse_down = null

    const pieceIdx = getFirstOwnedPieceIdx(gameId, playerId)
    if (pieceIdx >= 0) {
      // drop the tile(s)
      const pieceIdxs = getGroupedPieceIdxs(gameId, pieceIdx)
      setTilesOwner(gameId, pieceIdxs, 0)
      _pieceChanges(pieceIdxs)

      // Check if the tile was dropped near the final location
      const tilePos = getPiecePos(gameId, pieceIdx)
      const finalPos = getFinalPiecePos(gameId, pieceIdx)

      let canSnapToFinal = false
      if (getSnapMode(gameId) === SnapMode.REAL) {
        // only can snap to final if any of the grouped pieces are
        // corner pieces
        for (const pieceIdxTmp of pieceIdxs) {
          if (isCornerPiece(gameId, pieceIdxTmp)) {
            canSnapToFinal = true
            break
          }
        }
      } else {
        canSnapToFinal = true
      }

      if (
        canSnapToFinal
        && Geometry.pointDistance(finalPos, tilePos) < puzzle.info.snapDistance
      ) {
        const diff = Geometry.pointSub(finalPos, tilePos)
        // Snap the tile to the final destination
        movePiecesDiff(gameId, pieceIdxs, diff)
        finishPieces(gameId, pieceIdxs)
        _pieceChanges(pieceIdxs)

        let points = getPlayerPoints(gameId, playerId)
        if (getScoreMode(gameId) === ScoreMode.FINAL) {
          points += pieceIdxs.length
        } else if (getScoreMode(gameId) === ScoreMode.ANY) {
          points += 1
        } else {
          // no score mode... should never occur, because there is a
          // fallback to ScoreMode.FINAL in getScoreMode function
        }
        changePlayer(gameId, playerId, { d, ts, points })
        _playerChange()

        // check if the puzzle is finished
        if (getFinishedPiecesCount(gameId) === getPieceCount(gameId)) {
          changeData(gameId, { finished: ts })
          _dataChange()
        }
        if (onSnap) {
          onSnap(playerId)
        }
      } else {
        // Snap to other tiles
        const check = (
          gameId: string,
          tileIdx: number,
          otherTileIdx: number,
          off: Array<number>
        ): boolean => {
          const info = GAMES[gameId].puzzle.info
          if (otherTileIdx < 0) {
            return false
          }
          if (areGrouped(gameId, tileIdx, otherTileIdx)) {
            return false
          }
          const tilePos = getPiecePos(gameId, tileIdx)
          const dstPos = Geometry.pointAdd(
            getPiecePos(gameId, otherTileIdx),
            {x: off[0] * info.tileSize, y: off[1] * info.tileSize}
          )
          if (Geometry.pointDistance(tilePos, dstPos) < info.snapDistance) {
            const diff = Geometry.pointSub(dstPos, tilePos)
            let pieceIdxs = getGroupedPieceIdxs(gameId, tileIdx)
            movePiecesDiff(gameId, pieceIdxs, diff)
            groupTiles(gameId, tileIdx, otherTileIdx)
            pieceIdxs = getGroupedPieceIdxs(gameId, tileIdx)
            if (isFinishedPiece(gameId, otherTileIdx)) {
              finishPieces(gameId, pieceIdxs)
            } else {
              const zIndex = getMaxZIndexByPieceIdxs(gameId, pieceIdxs)
              setPiecesZIndex(gameId, pieceIdxs, zIndex)
            }
            _pieceChanges(pieceIdxs)
            return true
          }
          return false
        }

        let snapped = false
        for (const pieceIdxTmp of getGroupedPieceIdxs(gameId, pieceIdx)) {
          const othersIdxs = getSurroundingTilesByIdx(gameId, pieceIdxTmp)
          if (
            check(gameId, pieceIdxTmp, othersIdxs[0], [0, 1]) // top
            || check(gameId, pieceIdxTmp, othersIdxs[1], [-1, 0]) // right
            || check(gameId, pieceIdxTmp, othersIdxs[2], [0, -1]) // bottom
            || check(gameId, pieceIdxTmp, othersIdxs[3], [1, 0]) // left
          ) {
            snapped = true
            break
          }
        }
        if (snapped && getScoreMode(gameId) === ScoreMode.ANY) {
          const points = getPlayerPoints(gameId, playerId) + 1
          changePlayer(gameId, playerId, { d, ts, points })
          _playerChange()
        } else {
          changePlayer(gameId, playerId, { d, ts })
          _playerChange()
        }

        if (snapped && getSnapMode(gameId) === SnapMode.REAL) {
          if (getFinishedPiecesCount(gameId) === getPieceCount(gameId)) {
            changeData(gameId, { finished: ts })
            _dataChange()
          }
        }
        if (snapped && onSnap) {
          onSnap(playerId)
        }
      }
    } else {
      changePlayer(gameId, playerId, { d, ts })
      _playerChange()
    }
    evtInfo._last_mouse = pos
  } else if (type === Protocol.INPUT_EV_ZOOM_IN) {
    const x = input[1]
    const y = input[2]
    changePlayer(gameId, playerId, { x, y, ts })
    _playerChange()
    evtInfo._last_mouse = { x, y }
  } else if (type === Protocol.INPUT_EV_ZOOM_OUT) {
    const x = input[1]
    const y = input[2]
    changePlayer(gameId, playerId, { x, y, ts })
    _playerChange()
    evtInfo._last_mouse = { x, y }
  } else {
    changePlayer(gameId, playerId, { ts })
    _playerChange()
  }

  setEvtInfo(gameId, playerId, evtInfo)
  return changes
}

export default {
  setGame,
  exists,
  playerExists,
  getActivePlayers,
  getIdlePlayers,
  addPlayer,
  getFinishedPiecesCount,
  getPieceCount,
  getImageUrl,
  setImageUrl,
  get,
  getAllGames,
  getPlayerBgColor,
  getPlayerColor,
  getPlayerName,
  getPlayerIndexById,
  getPlayerIdByIndex,
  changePlayer,
  setPlayer,
  setPiece,
  setPuzzleData,
  getTableWidth,
  getTableHeight,
  getPuzzle,
  getRng,
  getPuzzleWidth,
  getPuzzleHeight,
  getPiecesSortedByZIndex,
  getFirstOwnedPiece,
  getPieceDrawOffset,
  getPieceDrawSize,
  getFinalPiecePos,
  getStartTs,
  getFinishTs,
  handleInput,
}
