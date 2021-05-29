import GameCommon, { Game, ScoreMode, Timestamp } from './../common/GameCommon'
import Util from './../common/Util'
import { Rng } from './../common/Rng'
import GameLog from './GameLog'
import { createPuzzle, PuzzleCreationImageInfo } from './Puzzle'
import Protocol from './../common/Protocol'
import GameStorage from './GameStorage'

async function createGameObject(
  gameId: string,
  targetTiles: number,
  image: PuzzleCreationImageInfo,
  ts: number,
  scoreMode: ScoreMode
): Promise<Game> {
  const seed = Util.hash(gameId + ' ' + ts)
  const rng = new Rng(seed)
  return {
    id: gameId,
    rng: { type: 'Rng', obj: rng },
    puzzle: await createPuzzle(rng, targetTiles, image, ts),
    players: [],
    evtInfos: {},
    scoreMode,
  }
}

async function createGame(
  gameId: string,
  targetTiles: number,
  image: PuzzleCreationImageInfo,
  ts: number,
  scoreMode: ScoreMode
): Promise<void> {
  const gameObject = await createGameObject(
    gameId,
    targetTiles,
    image,
    ts,
    scoreMode
  )

  GameLog.create(gameId)
  GameLog.log(gameId, Protocol.LOG_HEADER, 1, targetTiles, image, ts, scoreMode)

  GameCommon.setGame(gameObject.id, gameObject)
  GameStorage.setDirty(gameId)
}

function addPlayer(gameId: string, playerId: string, ts: Timestamp): void {
  const idx = GameCommon.getPlayerIndexById(gameId, playerId)
  const diff = ts - GameCommon.getStartTs(gameId)
  if (idx === -1) {
    GameLog.log(gameId, Protocol.LOG_ADD_PLAYER, playerId, diff)
  } else {
    GameLog.log(gameId, Protocol.LOG_UPDATE_PLAYER, idx, diff)
  }

  GameCommon.addPlayer(gameId, playerId, ts)
  GameStorage.setDirty(gameId)
}

function handleInput(
  gameId: string,
  playerId: string,
  input: any,
  ts: number
): Array<Array<any>> {
  const idx = GameCommon.getPlayerIndexById(gameId, playerId)
  const diff = ts - GameCommon.getStartTs(gameId)
  GameLog.log(gameId, Protocol.LOG_HANDLE_INPUT, idx, input, diff)

  const ret = GameCommon.handleInput(gameId, playerId, input, ts)
  GameStorage.setDirty(gameId)
  return ret
}

export default {
  createGameObject,
  createGame,
  addPlayer,
  handleInput,
}
