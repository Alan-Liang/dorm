<template>
  <div>
    <v-btn icon color="black" class="back" @click="$router.back()"><v-icon>mdi-arrow-left</v-icon></v-btn>
    <h1>{{ direction === 'outgoing' ? '室友给我买了东西' : '我给室友买了东西' }}</h1>
    <form @submit.prevent="submit">
      <template v-if="direction === 'outgoing'">
        室友
        <roommate v-model="otherParty" />
        给我（{{ session.name }}）买了
      </template>
      <template v-else>
        我（{{ session.name }}）给室友
        <roommate v-model="otherParty" />
        买了
      </template>
      <v-text-field outlined v-model="content" hide-details="auto" :placeholder="`备注${contentRequired ? '' : '（可选）'}`" ref="content" />
      共支付
      <v-text-field outlined v-model="amount" type="number" min="0.01" step="0.01" hide-details="auto" placeholder="金额" />
      元
      <br><br>
      <v-btn id="submit" type="submit" color="primary" :disabled="submitInProgress">提交</v-btn>
    </form>
  </div>
</template>

<script>
import { authHeaders, sessionMixin } from '~/assets/session'
import { checkAmount } from '~/assets/amount'
const largeAmount = 50

export default {
  props: {
    direction: { type: 'String', default: '' },
  },
  data: () => ({ otherParty: '', content: '', amount: '', submitInProgress: false }),
  mixins: [ sessionMixin ],
  computed: {
    contentRequired () { return !isNaN(this.amount) && Number(this.amount) > largeAmount },
  },
  methods: {
    async submit () {
      const { otherParty, content, contentRequired, amount, direction } = this
      const amountRes = checkAmount(amount)
      if (amountRes) return alert(amountRes)
      if (!otherParty) return alert('请选择室友')
      if (contentRequired && !content) {
        alert('大额交易，请填写备注')
        this.$refs.content.focus()
        return
      }
      const message = this.direction === 'incoming'
        ? `给 ${otherParty} 买${content ? ` ${content} ` : '东西'}花了 ${Number(amount)} 元？`
        : `${otherParty} 给我买${content ? ` ${content} ` : '东西'}花了 ${Number(amount)} 元？`
      if (!confirm(message)) return
      this.submitInProgress = true
      try {
        const res = await fetch('/api/transaction', { method: 'post', ...authHeaders(), body: new URLSearchParams({ otherParty, content, amount, direction }) })
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
