<template>
  <v-app>
    <v-main>
      <Nuxt />
    </v-main>
  </v-app>
</template>

<style>
.v-list a:hover, .v-list a:active, .v-list a:focus { text-decoration: none; }
body .v-application--wrap { min-height: 0; }
html body { text-align: left; }
body .v-main { max-width: 1080px; }

@media (max-width: 768px) {
  body .v-application h1 {
    font-size: 2rem !important;
    line-height: 2rem;
    font-weight: 400;
  }
}
</style>
