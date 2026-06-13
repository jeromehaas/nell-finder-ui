<script setup>

// DEFINE PROPS
defineProps({
  as: {
    type: String,
    default: 'div',
  },
  variant: {
    type: String,
    default: 'default',
  },
});
</script>

<template>
  <component :is="as" class="app-card" :class="`app-card--${variant}`">
    <slot />
  </component>
</template>

<style scoped src="./app-card.scss" lang="scss"></style>
