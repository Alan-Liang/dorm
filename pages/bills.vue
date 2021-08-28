<template>
  <div>
    <v-btn icon color="black" class="back" @click="$router.back()"><v-icon>mdi-arrow-left</v-icon></v-btn>
    <h1>我的账单</h1>
    <div v-if="bills === null">加载中……</div>
    <v-expansion-panels v-else accordion>
      <v-expansion-panel v-for="bill in bills" :key="bill.id">
        <v-expansion-panel-header>{{ bill.type === 'incoming' || (bill.type === 'public' && bill.owner) ? '应收款' : '应支付' }} {{ bill.type === 'public' ? Number(bill.amount) / bill.users.length * (bill.owner ? bill.users.includes(session.name) ? bill.users.length - 1 : bill.users.length : 1) : Number(bill.amount) }} 元</v-expansion-panel-header>
        <v-expansion-panel-content class="bill-content">
          {{
            bill.type === 'incoming'
              ? `给 ${bill.otherParty} 买${bill.content ? ` ${bill.content} ` : '东西'}花了 ${Number(bill.amount)} 元`
              : bill.type === 'outgoing'
                ? `${bill.otherParty} 给我买${bill.content ? ` ${bill.content} ` : '东西'}花了 ${Number(bill.amount)} 元`
                : `${bill.payer} 给 ${bill.users.join('、')} 买了 ${bill.content}（公共物品） 花了 ${Number(bill.amount)} 元`
          }}
          <template v-if="bill.owner">，<v-btn text outlined class="inline-button" @click="revoke(bill)" :disabled="revokeInProgress">撤销</v-btn></template>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { authHeaders, sessionMixin } from '~/assets/session'
export default {
  mixins: [ sessionMixin ],
  data: () => ({ bills: null, revokeInProgress: false }),
  mounted () { this.load() },
  methods: {
    async revoke (bill) {
      if (!confirm('确认撤销？')) return
      this.revokeInProgress = true
      try {
        const res = await fetch('/api/revoke', { method: 'post', ...authHeaders(), body: new URLSearchParams({ id: bill.id }) })
        if (res.status > 399) throw new Error('Network Error')
      } catch (e) {
        alert('网络错误')
      } finally {
        this.revokeInProgress = false
        this.load()
      }
    },
    async load () {
      this.bills = null
      try {
        this.bills = await (await fetch('/api/bills', authHeaders())).json()
      } catch(e) {
        alert('网络错误，请刷新重试')
      }
    }
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
.inline-button { margin-top: -6px; }
</style>
