"use strict"

import { logger } from '../common/Util.js'

const log = logger('Debug.js')

let _pt = 0
let _mindiff = 0

const checkpoint_start = (mindiff) => {
  _pt = performance.now()
  _mindiff = mindiff
}

const checkpoint = (label) => {
  const now = performance.now()
  const diff = now - _pt
  if (diff > _mindiff) {
    log.log(label + ': ' + (diff))
  }
  _pt = now
}

export default {
  checkpoint_start,
  checkpoint,
}
