<template>
  <div>
    <h1>登录</h1>
    <form @submit.prevent="login">
      <div><v-text-field type="password" v-model="password" label="密码" outlined /></div>
      <v-btn type="submit" color="primary" :disabled="loginInProgress">登录</v-btn>
    </form>
  </div>
</template>

<script>
import { sessionInfo } from '~/assets/session'
export default {
  head: () => ({ title: '登录 - 室友记账' }),
  data: () => ({ password: '', loginInProgress: false }),
  mounted () {
    if (sessionInfo().valid) this.$router.push('/')
  },
  methods: {
    async login () {
      const { password } = this
      if (!password) return alert('请输入密码')
      this.loginInProgress = true
      try {
        const { ticket, name } = await (await fetch('/api/login', { method: 'post', body: new URLSearchParams({ password }) })).json()
        if (!ticket || !name) {
          alert('密码错误')
          return
        }
        localStorage.dormTicket = ticket
        localStorage.dormName = name
        this.$router.push('/')
      } catch (e) {
        alert('网络错误')
      } finally {
        this.loginInProgress = false
      }
    },
  },
}
</script>
