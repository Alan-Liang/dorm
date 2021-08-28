<template>
  <div>
    <h1>室友记账</h1>
    <v-card class="confirm" v-if="confirmations.length" outlined>
      <v-list-item two-line>
        <v-list-item-content>
          <v-list-item-title class="text-h6">交易提醒</v-list-item-title>
          <v-list-item-subtitle>
            {{
              confirmations[0].type === 'incoming'
                ? `给 ${confirmations[0].otherParty} 买${confirmations[0].content ? ` ${confirmations[0].content} ` : '东西'}花了 ${Number(confirmations[0].amount)} 元`
                : confirmations[0].type === 'outgoing'
                  ? `${confirmations[0].otherParty} 给我买${confirmations[0].content ? ` ${confirmations[0].content} ` : '东西'}花了 ${Number(confirmations[0].amount)} 元`
                  : `${confirmations[0].payer} 给 ${confirmations[0].users.join('、')} 买了 ${confirmations[0].content}（公共物品） 花了 ${Number(confirmations[0].amount)} 元`
            }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-card-actions>
        <v-btn text @click="confirm" :disabled="confirmInProgress">确认</v-btn>
      </v-card-actions>
    </v-card>
    <v-list class="main-list">
      <v-list-item nuxt to="/incoming">
        <v-list-item-icon>
          <v-icon>mdi-location-enter</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>我给室友买了东西</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item nuxt to="/outgoing">
        <v-list-item-icon>
          <v-icon>mdi-location-exit</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>室友给我买了东西</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item nuxt to="/public">
        <v-list-item-icon>
          <v-icon>mdi-earth</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>我买了公共物品</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider />

      <v-list-item nuxt to="/bills">
        <v-list-item-icon>
          <v-icon>mdi-file-multiple-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>我的账单</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item nuxt to="/passwd">
        <v-list-item-icon>
          <v-icon>mdi-key</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>更改密码</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <div id="identity">
      {{ session.name }} ·
      <v-btn text @click="logout">退出</v-btn>
    </div>
  </div>
</template>

<style scoped>
*.v-application--is-ltr .v-list-item__icon:first-child { margin-right: 16px; }
#identity {
  position: fixed;
  display: flex;
  bottom: 16px;
  align-items: center;
}
.confirm {
  margin-bottom: 32px;
}
.main-list {
  margin-left: -16px;
  margin-right: -16px;
}
.v-list-item__subtitle, .v-list-item__title {
  overflow: visible;
  white-space: normal;
}
.text-h6 {
  margin: 8px 0;
}
</style>

<script>
import { authHeaders, sessionMixin, clearSession } from '~/assets/session'
export default {
  head: () => ({ title: '室友记账' }),
  data: () => ({ confirmations: [], confirmInProgress: false }),
  mixins: [ sessionMixin ],
  async mounted () {
    this.confirmations = await (await fetch('/api/confirmations', authHeaders())).json()
  },
  methods: {
    async logout () {
      const res = await fetch('/api/logout', { method: 'post', ...authHeaders() })
      if (res.status > 399) return alert('网络错误')
      clearSession()
      this.$router.push('/login')
    },
    async confirm () {
      this.confirmInProgress = true
      try {
        const res = await fetch('/api/confirm', { method: 'post', ...authHeaders(), body: new URLSearchParams({ id: this.confirmations[0].id }) })
        if (res.status > 399) throw new Error('Network Error')
        this.confirmations.shift()
      } catch (e) {
        alert('网络错误')
      } finally {
        this.confirmInProgress = false
      }
    },
  },
}
</script>
