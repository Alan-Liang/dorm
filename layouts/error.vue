<template>
  <v-app>
    <h1 v-if="error.statusCode === 404">404 Not Found</h1>
    <h1 v-else>Error {{ error.statusCode }}</h1>
    <nuxt-link to="/">Home page</nuxt-link>
  </v-app>
</template>

<script>
export default {
  layout: 'empty',
  props: {
    error: {
      type: Object,
      default: null,
    }
  },
  head () {
    return { title: this.error.statusCode }
  }
}
</script>
