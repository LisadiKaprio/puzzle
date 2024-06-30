import { StyleValue } from 'vue'
import { Assets } from './Assets'
import { Graphics } from './Graphics'
import { IDLE_TIMEOUT_SEC } from '../../common/src/GameCommon'
import Time from '../../common/src/Time'

export function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F {
  let timeoutID: number
  if (!Number.isInteger(wait)) {
    console.warn('Called debounce without a valid number')
    wait = 300
  }
  // conversion through any necessary as it wont satisfy criteria otherwise
  return <any>function (this: any, ...args: any[]) {
    clearTimeout(timeoutID)
    // eslint-disable-next-line
    const context = this
    timeoutID = window.setTimeout(function () {
      func.apply(context, args)
    }, wait)
  }
}

export const testEmailValid = (email: string) => {
  return /^\w+([.-]\w+)*@\w+([.-]\w+)*(\.\w+)+$/.test(email)
}

export const getColoredBadge = (graphics: Graphics, assets: Assets, badgeMap: Record<string, string>, active: boolean, playerColor: string | null): string => {
  let url = ''
  const key = 'color_' + playerColor || '#ffffff' + '_' + (active ? 'active' : 'idle')
  if (key in badgeMap) {
    url = badgeMap[key]
  } else {
    if (active) {
      badgeMap[key] = graphics.colorizedCanvas(assets.Gfx.badgeOver, assets.Gfx.badgeMask, playerColor || '#ffffff').toDataURL()
    } else {
      badgeMap[key] = graphics.colorizedCanvas(assets.Gfx.badgeOverIdle, assets.Gfx.badgeMask, playerColor || '#ffffff').toDataURL()
    }
    url = badgeMap[key]
  }
  return url
}

export const getAnonBadge = (graphics: Graphics, assets: Assets, badgeMap: Record<string, string>, active: boolean): string => {
  let url = ''
  const key = 'anon_' + (active ? 'active' : 'idle')
  if (key in badgeMap) {
    url = badgeMap[key]
  } else {
    if (active) {
      badgeMap[key] = graphics.bitmapToImageString(assets.Gfx.badgeAnon)
    } else {
      badgeMap[key] = graphics.bitmapToImageString(assets.Gfx.badgeAnonIdle)
    }
    url = badgeMap[key]
  }
  return url
}

export const usernameColorStyle = ((color: string | null) => {
  if (color === 'ukraine') {
    return {
      'backgroundImage': 'linear-gradient(180deg, rgba(0,87,183,1) 0%, rgba(0,87,183,1) 50%, rgba(255,221,0,1) 50%)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
    } as StyleValue
  }
  return { color } as StyleValue
})

export function isPlayerActive(ts: number): boolean {
  const minTs = Time.timestamp() - IDLE_TIMEOUT_SEC * Time.SEC
  return ts >= minTs
}

export const zeroPad = (num: number, places: number): string => {
  // if no num, return as many 0 in a string as there are places given
  if (!num) {
    return '0'.repeat(places);
  }
  return String(num).padStart(places, '0')
}