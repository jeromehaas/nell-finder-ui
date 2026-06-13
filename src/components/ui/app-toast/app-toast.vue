<script setup>

// IMPORTS
import AppText from '../app-text/app-text.vue'

// DEFINE PROPS
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'danger',
  },
});
</script>

<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div v-if="visible && message" class="app-toast" :class="`app-toast--${tone}`" role="alert" aria-live="assertive">
        <AppText class="app-toast__message">{{ message }}</AppText>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped src="./app-toast.scss" lang="scss"></style>
