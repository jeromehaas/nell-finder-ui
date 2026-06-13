<script setup>

// DEFINE PROPS
defineProps({
  checked: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  offLabel: {
    type: String,
    default: '',
  },
  onLabel: {
    type: String,
    default: '',
  },
});

// DEFINE EMITS
const emit = defineEmits(['toggle'])

</script>

<template>
  <button
    type="button"
    class="app-switch"
    :class="{ 'app-switch--checked': checked }"
    role="switch"
    :aria-checked="checked"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <span class="app-switch__track">
      <span class="app-switch__thumb"></span>
      <span class="app-switch__label app-switch__label--off">{{ offLabel }}</span>
      <span class="app-switch__label app-switch__label--on">{{ onLabel }}</span>
    </span>
  </button>
</template>

<style scoped src="./app-switch.scss" lang="scss"></style>
