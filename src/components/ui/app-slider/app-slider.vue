<script setup>

// DEFINE MODEL
const model = defineModel({
  type: Number,
  default: 0,
});

// DEFINE PROPS
defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  displayValue: {
    type: String,
    default: '',
  },
  min: {
    type: [Number, String],
    default: 0,
  },
  max: {
    type: [Number, String],
    default: 1,
  },
  step: {
    type: [Number, String],
    default: 0.1,
  },
});
</script>

<template>
  <label class="app-slider" :for="id">
    <span class="app-slider__header">
      <span class="app-slider__label">{{ label }}</span>
      <strong v-if="displayValue" class="app-slider__value">{{ displayValue }}</strong>
    </span>
    <input
      :id="id"
      v-model.number="model"
      class="app-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
    />
  </label>
</template>

<style scoped src="./app-slider.scss" lang="scss"></style>
