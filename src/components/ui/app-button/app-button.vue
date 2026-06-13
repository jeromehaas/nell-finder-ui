<script setup>

// DEFINE PROPS
defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  type: {
    type: String,
    default: 'button',
  },
});
</script>

<template>
  <button :type="type" class="app-button" :class="`app-button--${variant}`">
    <slot />
  </button>
</template>

<style scoped src="./app-button.scss" lang="scss"></style>
