require('dotenv').config()

const Koa = require('koa')
const Router = require('@koa/router')
const bodyparser = require('koa-body')
const uuid = require('uuid').v4
const Datastore = require('nedb-promise')
const serve = require('koa-static')
const argon2 = require('argon2')

const app = new Koa()
const router = new Router()
app.use(bodyparser())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(Number(process.env.PORT), process.env.HOST || '0.0.0.0')

// these type annotations are for VS Code's IntelliSense
/** @type {import('nedb')} */
const db = new Datastore({
  filename: process.env.DATABASE_FILENAME,
  autoload: true,
})

// db.insert({ is: 'user', name: '1', password: '$argon2i$v=19$m=4096,t=3,p=1$0CDHBvhYcgoIc6+10ibsGg$tNkOtAqCaUipGM6OpEXPdq2BzjUew/m5NJldEipxM8o' }) // passwd = '1'
// db.insert({ is: 'user', name: '2', password: '$argon2i$v=19$m=4096,t=3,p=1$6fOSnKAKckDlfb5JOPDVCA$3DY67vySmjBKo4veONYvVNcfTeLk+9+IX6bwmC5bozA' }) // passwd = '2'
// db.insert({ is: 'user', name: '3', password: '$argon2i$v=19$m=4096,t=3,p=1$mB2fcETvFz+EvZMxblsRGw$JrP10GHv5zCzfyZvX0GGj9Nuc/9UhXz0lULT2Sl7r2k' }) // passwd = '3'
// db.insert({ is: 'user', name: '4', password: '$argon2i$v=19$m=4096,t=3,p=1$bGdXoX0WYNyLmSmkfYarKg$oXMBAay+ROPC8eihQc+bD2FcdL+O+SugdVDtstyGZL8' }) // passwd = '4'

/** @type {import('koa').Middleware} */
const getSession = async (ctx, next) => {
  const auth = ctx.get('authorization')
  if (!auth) ctx.throw(401)
  const ticketMatch = auth.match(/^bearer (.+)$/i)
  if (!ticketMatch || !ticketMatch[1]) ctx.throw(401)
  const ticket = ticketMatch[1]
  const session = await db.findOne({ is: 'ticket', ticket })
  if (!session) ctx.throw(401)
  ctx.state.name = session.name
  ctx.state.ticket = ticket
  return next()
}

const getOwnBills = async name => {
  const bills = await db.find({ is: 'transaction', owner: name })
  return bills
}
const getSharedBills = async name => {
  const privateBills = db.find({ is: 'transaction', otherParty: name })
  const publicBills = db.find({ is: 'transaction', type: 'public', users: { $elemMatch: name }, owner: { $ne: name } })
  return [ ...await privateBills, ...await publicBills ]
}
const getBills = async name => (await Promise.all([ getOwnBills(name), getSharedBills(name) ])).flat()

const userFromPassword = async password => {
  const users = await db.find({ is: 'user' })
  return users[
    (await Promise.all(
      users.map(user => argon2.verify(user.password, password))
    )).indexOf(true)
  ] || null
}

router.post('/api/login', async ctx => {
  if (!ctx.request.body || !ctx.request.body.password || typeof ctx.request.body.password !== 'string') ctx.throw(400)
  const user = await userFromPassword(ctx.request.body.password)
  if (!user) return ctx.body = {}
  const { name } = user
  const ticket = uuid()
  await db.insert({ is: 'ticket', name, ticket, time: Date.now() })
  return ctx.body = { name, ticket }
})
router.post('/api/logout', getSession, async ctx => {
  await db.remove({ is: 'ticket', ticket: ctx.state.ticket })
  return ctx.status = 204
})
router.post('/api/passwd', getSession, async ctx => {
  if (!ctx.request.body) ctx.throw(400)
  const { current, future } = ctx.request.body
  if (!current || !future || typeof current !== 'string' || typeof future !== 'string') ctx.throw(400)
  if (current === future) ctx.throw(400)
  const { password } = await db.findOne({ is: 'user', name: ctx.state.name })
  if (!await argon2.verify(password, current)) return ctx.body = { status: 401, message: '密码错误' }
  if (await userFromPassword(future)) return ctx.body = { status: 400, message: '密码重复' }
  await db.update({ is: 'user', name: ctx.state.name }, { $set: { password: await argon2.hash(future) } })
  return ctx.body = { status: 0 }
})

router.get('/api/roommates', getSession, async ctx => {
  const users = await db.find({ is: 'user' })
  return ctx.body = users.map(user => user.name).filter(name => name !== ctx.state.name)
})

router.get('/api/bills', getSession, async ctx => {
  const bills = await getBills(ctx.state.name)
  bills.forEach(bill => {
    bill.owner = bill.owner === ctx.state.name
    if (bill.type !== 'public' && !bill.owner) bill.type = { 'incoming': 'outgoing', 'outgoing': 'incoming' }[bill.type]
    delete bill.confirmationNeeded
  })
  bills.sort((a, b) => a.time - b.time)
  return ctx.body = bills
})
router.post('/api/revoke', getSession, async ctx => {
  if (!ctx.request.body) ctx.throw(400)
  const { id } = ctx.request.body
  if (!id) ctx.throw(400)
  const tx = await db.findOne({ is: 'transaction', id })
  if (tx.owner !== ctx.state.name) ctx.throw(401)
  await db.remove({ is: 'transaction', id })
  return ctx.status = 204
})

router.get('/api/confirmations', getSession, async ctx => {
  const bills = await db.find({ is: 'transaction', confirmationNeeded: { $elemMatch: ctx.state.name } })
  bills.sort((a, b) => a.time - b.time)
  bills.forEach(bill => delete bill.confirmationNeeded)
  return ctx.body = bills
})
router.post('/api/confirm', getSession, async ctx => {
  if (!ctx.request.body) ctx.throw(400)
  const { id } = ctx.request.body
  if (!id || typeof id !== 'string') ctx.throw(400)
  await db.update({ is: 'transaction', id }, { $pull: { confirmationNeeded: ctx.state.name } })
  return ctx.status = 201
})

router.post('/api/transaction/public', getSession, async ctx => {
  const { name } = ctx.state
  if (!ctx.request.body) ctx.throw(400)
  const { users: rawUsers, content, amount } = ctx.request.body
  if (!rawUsers || !content || !amount || isNaN(amount) || Number(amount) <= 0) ctx.throw(400)
  const users = rawUsers.split(',')
  await db.insert({ is: 'transaction', type: 'public', content, amount, users, owner: name, payer: name, id: uuid(), time: Date(), confirmationNeeded: users.filter(user => name !== user) })
  return ctx.status = 201
})
router.post('/api/transaction', getSession, async ctx => {
  const { name } = ctx.state
  if (!ctx.request.body) ctx.throw(400)
  const { otherParty, content, amount, direction } = ctx.request.body
  if (!otherParty || !amount || isNaN(amount) || Number(amount) <= 0 || ![ 'incoming', 'outgoing' ].includes(direction)) ctx.throw(400)
  // don't check other constraints here
  // already checked at FE, and users are trusted
  await db.insert({ is: 'transaction', otherParty, content, amount, type: direction, owner: name, id: uuid(), time: Date.now(), confirmationNeeded: [ otherParty ] })
  return ctx.status = 201
})

router.get('/(.*)', serve('../dist'))
router.get('/(.*)', (ctx, next) => {
  ctx.path = '/'
  return next()
}, serve('../dist'))
