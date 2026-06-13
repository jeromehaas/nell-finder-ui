<script setup>

// DEFINE PROPS
defineProps({
  as: {
    type: String,
    default: 'p',
  },
  tone: {
    type: String,
    default: 'default',
  },
});

</script>

<template>
  <component :is="as" class="app-text" :class="`app-text--${tone}`">
    <slot />
  </component>
</template>

<style scoped src="./app-text.scss" lang="scss"></style>
