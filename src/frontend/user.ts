import mitt from 'mitt'
import api from './_api'
import storage from './storage'
import xhr from './_api/xhr'

export interface User {
  id: number
  name: string
  created: string
  clientId: string
  type: 'guest' | 'user'
  cannyToken: string | null
  groups: string[]
}

let me: null | User = null
export const eventBus = mitt()

async function init(): Promise<void> {
  xhr.setClientId(storage.uniq('ID'))
  const res = await api.pub.me()
  me = res.status === 200 ? (await res.json()) : null
  if (me) {
    console.log('loggedin')
    xhr.setClientId(me.clientId)
    eventBus.emit('login')
  } else {
    console.log('loggedout')
    xhr.setClientId(storage.uniq('ID'))
    eventBus.emit('logout')
  }
}

async function logout(): Promise<{ error: string | false }> {
  const res = await api.pub.logout()
  const data = await res.json()
  if (data.success) {
    await init()
    return { error: false }
  }

  return { error: '[2021-09-25 18:36]' }
}

async function login(
  email: string,
  password: string,
): Promise<{ error: string | false }> {
  const res = await api.pub.auth(email, password)
  if (res.status === 200) {
    await init()
    return { error: false }
  }

  if (res.status === 401) {
    return { error: (await res.json()).reason }
  }

  return { error: 'Unknown error' }
}

async function register(
  username: string,
  email: string,
  password: string,
): Promise<{ error: string | false }> {
  const res = await api.pub.register(username, email, password)
  if (res.status === 200) {
    return { error: false }
  }

  // conflict (eg. username already taken, email already taken)
  if (res.status === 409) {
    return { error: (await res.json()).reason }
  }

  return { error: 'Unknown error' }
}

async function sendPasswordResetEmail(
  email: string,
): Promise<{ error: string | false }> {
  const res = await api.pub.sendPasswordResetEmail(email)
  if (res.status === 200) {
    return { error: false }
  }

  // conflict (eg. username already taken, email already taken)
  if (res.status === 409) {
    return { error: (await res.json()).reason }
  }

  return { error: 'Unknown error' }
}

async function changePassword(
  password: string,
  token: string,
): Promise<{ error: string | false }> {
  const res = await api.pub.changePassword(password, token)
  if (res.status === 200) {
    return { error: false }
  }

  if (res.status === 400) {
    return { error: (await res.json()).reason }
  }

  return { error: 'Unknown error' }
}

export default {
  getMe: () => me,
  eventBus,
  logout,
  login,
  register,
  sendPasswordResetEmail,
  changePassword,
  init,
}
