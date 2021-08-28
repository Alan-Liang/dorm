export const sessionInfo = () => ({
  valid: localStorage.dormTicket && localStorage.dormName && true,
  ticket: localStorage.dormTicket,
  name: localStorage.dormName,
})

export const clearSession = () => { localStorage.dormTicket = localStorage.dormName = '' }

export const sessionMixin = {
  data: () => ({ session: sessionInfo() }),
  created () {
    if (!this.session.valid) this.$router.push('/login')
    getRoommates().catch(() => {
      clearSession()
      this.$router.push('/login')
    })
  },
}

export const authHeaders = () => ({ headers: { authorization: `bearer ${localStorage.dormTicket}` } })

let cachedRoommates = null
export const getRoommates = async () => cachedRoommates ? [ ...cachedRoommates ] : (cachedRoommates = await (await fetch('/api/roommates', authHeaders())).json())
