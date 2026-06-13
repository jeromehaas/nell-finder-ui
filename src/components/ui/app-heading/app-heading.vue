<script setup>

// DEFINE PROPS
defineProps({
  as: {
    type: String,
    default: 'h2',
  },
  size: {
    type: String,
    default: 'section',
  },
})
</script>

<template>
  <component :is="as" class="app-heading" :class="`app-heading--${size}`">
    <slot />
  </component>
</template>

<style scoped src="./app-heading.scss" lang="scss"></style>
