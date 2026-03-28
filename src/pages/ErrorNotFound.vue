<template>
  <q-page class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <q-card flat class="bg-transparent">
      <q-card-section>
        <q-item-label class="text-weight-bold" style="font-size: 30vh">404</q-item-label>
        <q-item-label class="text-h2" style="opacity: 0.4">Oops. Nothing here...</q-item-label>
      </q-card-section>

      <q-card-section>
        <q-btn
          class="q-mt-xl"
          color="white"
          text-color="blue"
          unelevated
          to="/"
          label="Go Home"
          no-caps
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
//
</script>
