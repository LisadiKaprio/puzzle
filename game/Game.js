import GameCommon from './../common/GameCommon.js'

export default {
  newGame: GameCommon.newGame,
  getRelevantPlayers: GameCommon.getRelevantPlayers,
  getActivePlayers: GameCommon.getActivePlayers,
  addPlayer: GameCommon.addPlayer,
  handleInput: GameCommon.handleInput,
  getPlayerIdByIndex: GameCommon.getPlayerIdByIndex,
  getPlayerBgColor: GameCommon.getPlayerBgColor,
  getPlayerColor: GameCommon.getPlayerColor,
  getPlayerName: GameCommon.getPlayerName,
  changePlayer: GameCommon.changePlayer,
  setPlayer: GameCommon.setPlayer,
  setTile: GameCommon.setTile,
  getImageUrl: GameCommon.getImageUrl,
  setPuzzleData: GameCommon.setPuzzleData,
  getTableWidth: GameCommon.getTableWidth,
  getTableHeight: GameCommon.getTableHeight,
  getPuzzle: GameCommon.getPuzzle,
  getRng: GameCommon.getRng,
  getPuzzleWidth: GameCommon.getPuzzleWidth,
  getPuzzleHeight: GameCommon.getPuzzleHeight,
  getTilesSortedByZIndex: GameCommon.getTilesSortedByZIndex,
  getFirstOwnedTile: GameCommon.getFirstOwnedTile,
  getTileDrawOffset: GameCommon.getTileDrawOffset,
  getTileDrawSize: GameCommon.getTileDrawSize,
  getStartTs: GameCommon.getStartTs,
  getFinishTs: GameCommon.getFinishTs,
  getFinishedTileCount: GameCommon.getFinishedTileCount,
  getTileCount: GameCommon.getTileCount,
}
