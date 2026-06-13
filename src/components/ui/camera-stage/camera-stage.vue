<script setup>

// IMPORTS
import { onBeforeUnmount, ref } from 'vue'
import AppButton from '../app-button/app-button.vue'
import AppText from '../app-text/app-text.vue'

// DEFINE PROPS
defineProps({
  aspectRatio: {
    type: String,
    default: '4 / 3',
  },
  showPlaceholder: {
    type: Boolean,
    default: false,
  },
  placeholderText: {
    type: String,
    default: '',
  },
  showAction: {
    type: Boolean,
    default: false,
  },
  actionLabel: {
    type: String,
    default: 'Kamera aktiviere',
  },
  showBadge: {
    type: Boolean,
    default: false,
  },
  badgeLabel: {
    type: String,
    default: '',
  },
  badgeConfidence: {
    type: String,
    default: '',
  },
});

// DEFINE EMITS
const emit = defineEmits(['action', 'metadata'])

// DEFINE VIDEO REF
const videoRef = ref(null)

// FUNCTION: GET DIMENSIONS
const getDimensions = () => {

  // RETURN
  return {
    width: videoRef.value?.videoWidth || 4,
    height: videoRef.value?.videoHeight || 3,
  }
}

// FUNCTION: EMIT META-DATA
const emitMetadata = () => {

  // EMIT META-DATA
  emit('metadata', getDimensions())
};

// FUNCTION: ATTACH STREAM
const attachStream = async (stream) => {

  // RAISE ERROR IF NO VIDEO REF
  if (!videoRef.value) {
    throw new Error('S Video-Element isch nid verfuegbar.')
  }

  // UPDATE VIDEO REF
  videoRef.value.srcObject = stream

  // PLAY VIDEO
  await videoRef.value.play()

  // EMIT META DATA
  emitMetadata()
};

// FUNCTION: CLEAR STREAM
const clearStream = () => {

  // RAISE ERROR IF VIDEO REF IS MISSING
  if (!videoRef.value) {
    return
  }

  // UPDATE VIDEO
  videoRef.value.pause()
  videoRef.value.srcObject = null
};

// FUNCTION GET VIDEO ELEMENT
const getVideoElement = () => {

  // RETURN
  return videoRef.value
};

// FUNCTIONL: IS VIDEO READY
const isVideoReady = () => {

  // RETURN
  return Boolean(videoRef.value && videoRef.value.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
};

// FUNCTION: HANDLE LOADED META-DATA
const handleLoadedMetadata = () => {

  // EMIT META-DATA
  emitMetadata();
};

// HOOK: ON BEFORE UNMOUNT
onBeforeUnmount(() => {

  // CLEAR STREAM
  clearStream()
});

// DEFINE EXPOSE
defineExpose({
  attachStream,
  clearStream,
  getDimensions,
  getVideoElement,
  isVideoReady,
});
</script>

<template>
  <div class="camera-stage" :style="{ aspectRatio }">
    <video
      ref="videoRef"
      class="camera-video"
      autoplay
      playsinline
      muted
      @loadedmetadata="handleLoadedMetadata"
    ></video>

    <div v-if="showBadge" class="camera-badge">
      <AppText as="span" class="camera-badge__label">{{ badgeLabel }}</AppText>
      <strong v-if="badgeConfidence" class="camera-badge__confidence">{{ badgeConfidence }}</strong>
    </div>

    <div v-if="showPlaceholder" class="camera-placeholder">
      <div class="camera-placeholder__content">
        <AppText as="span" tone="muted">{{ placeholderText }}</AppText>
        <AppButton v-if="showAction" @click="emit('action')">{{ actionLabel }}</AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped src="./camera-stage.scss" lang="scss"></style>
