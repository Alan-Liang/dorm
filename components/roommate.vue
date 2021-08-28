<template>
  <div>
    <v-select outlined :items="items" v-model="value_" hide-details="auto" :multiple="multiple" :label="label" />
  </div>
</template>

<script>
import { getRoommates, sessionMixin } from '~/assets/session'

export default {
  props: {
    includeSelf: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    value: { type: [ String, Array ], default: '' },
    label: { type: String, default: '' },
  },
  data () { return { items: [ '加载中……' ], value_: this.multiple ? [] : '' } },
  mixins: [ sessionMixin ],
  async mounted () {
    const roommates = await getRoommates()
    this.items = this.includeSelf ? [ this.session.name, ...roommates ] : roommates
    if (this.multiple) this.value_ = [ ...this.items ]
  },
  watch: {
    value () { this.value_ = this.value },
    value_ () { this.$emit('input', this.value_) },
  },
}
</script>

<style>

</style>
