<template>
  <div>
    <v-btn icon color="black" class="back" @click="$router.back()"><v-icon>mdi-arrow-left</v-icon></v-btn>
    <h1>公共物品</h1>
    <form @submit.prevent="submit">
      <v-text-field outlined v-model="content" hide-details="auto" label="品名" placeholder="铅笔" />
      <br>
      <v-text-field label="金额（元）" outlined v-model="amount" type="number" min="0.01" step="0.01" hide-details="auto" placeholder="0.01" />
      <br>
      <roommate v-model="users" label="使用者" multiple include-self />
      <br><br>
      <v-btn id="submit" type="submit" color="primary" :disabled="submitInProgress">提交</v-btn>
    </form>
  </div>
</template>

<script>
import { checkAmount } from '~/assets/amount'
import { sessionMixin, authHeaders } from '~/assets/session'
export default {
  mixins: [ sessionMixin ],
  data: () => ({ content: '', amount: '', users: [], submitInProgress: false }),
  methods: {
    async submit () {
      const { content, amount, users } = this
      if (!content) return alert('请填写品名')
      const amountRes = checkAmount(amount)
      if (amountRes) return alert(amountRes)
      if (users.length === 0) return alert('没人用为什么要买')
      if (users.length === 1) return alert(users[0] === this.session.name ? '给自己买的不算公共用品' : '只有一个人用的不是公共物品')

      const message = `给 ${users.join('、')} 买了 ${content} 花了 ${Number(amount)} 元？`
      if (!confirm(message)) return

      this.submitInProgress = true
      try {
        const res = await fetch('/api/transaction/public', { method: 'post', ...authHeaders(), body: new URLSearchParams({ users: users.join(','), content, amount }) })
        if (res.status > 399) throw new Error('Network Error')
        alert('提交成功')
        this.$router.push('/')
      } catch (e) {
        alert('网络错误')
      } finally {
        this.submitInProgress = false
      }
    },
  },
}
</script>

<style scoped>
.back {
  position: fixed;
  top: 12px;
  left: 12px;
}
h1 { margin-top: 32px; }
#submit { float: right; }
</style>
