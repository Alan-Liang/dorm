<template>
  <div>
    <v-btn icon color="black" class="back" @click="$router.back()"><v-icon>mdi-arrow-left</v-icon></v-btn>
    <h1>修改密码</h1>
    <form @submit.prevent="submit">
      <v-text-field outlined type="password" v-model="current" hide-details="auto" label="旧密码" />
      <br>
      <v-text-field outlined type="password" v-model="future" hide-details="auto" label="新密码" />
      <br>
      <v-text-field outlined type="password" v-model="repeat" hide-details="auto" label="重复新密码" />
      <br><br>
      <v-btn id="submit" type="submit" color="primary" :disabled="submitInProgress">提交</v-btn>
    </form>
  </div>
</template>

<script>
import { sessionMixin, authHeaders } from '~/assets/session'
export default {
  mixins: [ sessionMixin ],
  data: () => ({ current: '', future: '', repeat: '', submitInProgress: false }),
  methods: {
    async submit () {
      const { current, future, repeat } = this
      if (!current || !future || !repeat) return alert('请填写所有项')
      if (future !== repeat) return alert('新密码与重复密码不一致')
      if (current === future) return alert('你根本就没改密码啊')

      this.submitInProgress = true
      try {
        const res = await (await fetch('/api/passwd', { method: 'post', ...authHeaders(), body: new URLSearchParams({ current, future }) })).json()
        if (res.status !== 0) return alert(res.message || '未知错误')
        alert('修改密码成功')
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
