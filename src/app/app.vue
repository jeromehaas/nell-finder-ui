<script setup>

// IMPORTS
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppCard from '../components/ui/app-card/app-card.vue'
import CameraStage from '../components/ui/camera-stage/camera-stage.vue'
import AppHeading from '../components/ui/app-heading/app-heading.vue'
import AppSlider from '../components/ui/app-slider/app-slider.vue'
import AppSwitch from '../components/ui/app-switch/app-switch.vue'
import AppText from '../components/ui/app-text/app-text.vue'
import AppToast from '../components/ui/app-toast/app-toast.vue'
import { createCardDetector } from '../lib/card-detector.js'

// SETUP REFS
const cameraStageRef = ref(null)
const detector = ref(null)
const detections = ref([])
const modelReady = ref(false)
const cameraStarting = ref(false)
const cameraRunning = ref(false)
const confidenceThreshold = ref(0.25)
const toastMessage = ref('')
const toastTone = ref('danger')
const toastVisible = ref(false)
const videoWidth = ref(4)
const videoHeight = ref(3)

// SETUT STREAM, DETECTION TIMER, ACTIVE LOOP AND TOAST TIMER ID
let stream = null;
let detectionTimerId = 0;
let loopActive = false;
let toastTimerId = 0;

// SETUP PRIMARY DETECTION
const primaryDetection = computed(() => {
  return detections.value[0] ?? null;
});

// SETUP ASPECT RATIO
const aspectRatio = computed(() => {
  return `${videoWidth.value} / ${videoHeight.value}`;
});

// SETUP SHOW PLACEHOLDER FLAG
const showPlaceholder = computed(() => {
  return !cameraRunning.value;
});

// SETUP CAMERA PLACEHOLDER TEXT
const cameraPlaceholderText = computed(() => {

  // SHOW LOADING TEXT
  if (!modelReady.value) {
    return 'Nell Finder wird glade...'
  }

  // SHOW MESSAGE TO ASK FOR CAMERA PERMISSION
  if (cameraStarting.value) {
    return 'Erlaub de Kamera-Zuegriff, damit d Erkenning startet.'
  }

  // ADD MESSAGE TO SHOW INSTRUCTIONS
  return 'Aktivier d Kamera und heb e einzelni Charte is Bild.'
});

// SETUP SHOW CAMERA ACTION FLAG
const showCameraAction = computed(() => {
  return modelReady.value && !cameraRunning.value && !cameraStarting.value;
});

// SETUP SHOW CAMERA BADGE ACTION
const showCameraBadge = computed(() => {
  return cameraRunning.value
});

// SETUP CAMERA BADGE LABEL
const cameraBadgeLabel = computed(() => {

  // SHOW WHAT IMAGE IS DETECTED
  if (primaryDetection.value) {
    return `Das isch ${primaryDetection.value.displayLabel}`
  }

  // PRINT INSTRUCTIONS
  return 'Heb e einzelni Charte is Bild'
});

// SETUP CAMERA BADGE CONFIDENCE
const cameraBadgeConfidence = computed(() => {

  // PRINT NOTHING IF NO CURRENT DETEACTION
  if (!primaryDetection.value) {
    return ''
  }

  // PRINT PROCENTUAL VALUE FOR DETECTION CONFIDENCE
  return `${(primaryDetection.value.confidence * 100).toFixed(0)}%`
});

// SETUP SWITCH CHECKED FLAG
const cameraSwitchChecked = computed(() => {
  return cameraRunning.value
});

// SETUP CAMERA SWITCH DISABLED FLAG
const cameraSwitchDisabled = computed(() => {
  return cameraStarting.value || (!cameraRunning.value && !modelReady.value)
});

// FUNCTION HIDE TOAST
const hideToast = () => {

  // SET TIMEOUT
  window.clearTimeout(toastTimerId);

  // RESET TOAST
  toastTimerId = 0
  toastVisible.value = false
};

// FUNCTION: SHOW TOAST
const showToast = (message, tone = 'danger') => {

  // UPDATE MESSAGE TONE AND VISIBILITY
  toastMessage.value = message
  toastTone.value = tone
  toastVisible.value = true

  // CLEAR TIMEOUT
  window.clearTimeout(toastTimerId)

  // CREATE TIMER ID
  toastTimerId = window.setTimeout(() => {
    toastVisible.value = false
    toastTimerId = 0
  }, 3600);
};


// FUNCTION: LOAD MODEL
const loadModel = async () => {

  // TRY-CATCH BLOCK
  try {

    // UPDATE STATE AND GET DETECTOR
    detector.value = await createCardDetector()
    modelReady.value = true
  }

  // HANDLE ERRORS
  catch (error) {

    // CREATE MESSAGE AND SHOW TOAST
    const message = error instanceof Error ? error.message : 'es unbekannts Problem'
    showToast(`S Modell het sich nid lade lah: ${message}`)
  }
};

// FUNCTION: SYNC VIDEO METRICS
const syncVideoMetrics = () => {

  // GET DIMENSIONS
  const dimensions = cameraStageRef.value?.getDimensions()

  // STOP IF DIMENSIONS ARE NOT AVAILABLE
  if (!dimensions) {
    return
  }

  // GET WITH AND HEIGHT FOR VIDEO
  videoWidth.value = dimensions.width || 4
  videoHeight.value = dimensions.height || 3
};

// FUNCTION: STOP CAMERA
const stopCamera = () => {

  // SET FLAG FOR LOOP
  loopActive = false

  // CLEAR TIMEOUT
  window.clearTimeout(detectionTimerId)

  // GET DETECTION TIMER ID
  detectionTimerId = 0

  // SETUP STATE
  cameraRunning.value = false
  detections.value = []

  // CHECK FOR STREAM
  if (stream) {

    // LOOP OVER TRACKS AND STOP THEM
    for (const track of stream.getTracks()) {
      track.stop()
    }

    // UPDATE STREAM
    stream = null
  }

  // CLEAR STREAM
  cameraStageRef.value?.clearStream()
};

const runDetectionLoop = async () => {

  // GET VIDEO
  const video = cameraStageRef.value?.getVideoElement()

  // RETURN IF VIDEO NOT AVAILABLE
  if (!video || !detector.value || !loopActive) {
    return
  }

  // SYNC VIDEO METRICS
  syncVideoMetrics()

  // CHECK FOR VIDEO
  if (cameraStageRef.value?.isVideoReady()) {

    // TRY-CATCH BLOCK
    try {

      // GET RESULT FROM DETECTOR
      const result = await detector.value.detect(video, confidenceThreshold.value)

      // GET DETECTIONS AND UPDATE STATE
      detections.value = result.detections
    }

    // HANDLE ERRORS
    catch (error) {

      // GET MESSAGE
      const message = error instanceof Error ? error.message : 'es unbekannts Problem'

      // SHOW TOAST
      showToast(`D Erkenning het nid funktioniert: ${message}`)

      // STOP CAMERA
      stopCamera()

      // BREAK
      return
    }
  }

  // UPDATE DETECTION TIMER ID
  detectionTimerId = window.setTimeout(() => {
    void runDetectionLoop()
  }, 250);
};

// FUNCTION: START CAMERA
const startCamera = async () => {

  // CHECK FOR MODEL AND CAMERA
  if (!modelReady.value || cameraStarting.value || cameraRunning.value) {
    return
  }

  // RAISE ERROR IF CAMERA NOT SUPPORTED
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('De Browser unterstuetzt kei Kamera-Zuegriff.')
    return
  }

  // HIDE TOAST
  hideToast();

  // STOP CAMERA
  cameraStarting.value = true
  stopCamera();

  // TRY-CATCH BLOCK
  try {

    // GET STREAM
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    // RAISE ERROR IF CAMERA REF IS MISSING
    if (!cameraStageRef.value) {
      throw new Error('D Kamera-Aasicht isch nid verfuegbar.')
    }

    // GET VIDEO STREAM
    await cameraStageRef.value.attachStream(stream)

    // UPDATE VIDEO METRICS
    syncVideoMetrics()

    // UPDATE STATE
    cameraRunning.value = true
    loopActive = true

    // RUN DETECTION LOOP
    void runDetectionLoop()
  }

  // HANDLE ERRORS
  catch (error) {

    // GET MESSAGE AND SHOW TOASTR
    showToast(`D Kamera het sich nid starte lah!`)

    // STOP CAMERA
    stopCamera()
  }

  // FINALLY
  finally {

    // UPDATE CAMERA STATE
    cameraStarting.value = false
  }
};

// FUNCTION: HANDLE CAMERA META-DATA
const handleCameraMetadata = (dimensions) => {

  // GET VIDEO DIMENSIONS
  videoWidth.value = dimensions.width || 4
  videoHeight.value = dimensions.height || 3
}

// FUNCTION: HANDLE CAMERA TOGGLE
const handleCameraToggle = () => {

  // CHECK FOR CAMERA RUNNING FLAG AND STOP IT
  if (cameraRunning.value) {
    stopCamera()
    return
  }

  // START CAMERA
  void startCamera()
};

// HOOK: ON MOUNT
onMounted(() => {

  // LAOD MODEL
  void loadModel()
});

// HOOK: ON BEFORE UNMOUNT
onBeforeUnmount(() => {

  // HIDE TOAST AND STOP CAMERA
  hideToast();
  stopCamera();
});
</script>

<template>
  <main class="page-shell">
    <section class="app-layout">
      <div class="camera-column">
        <CameraStage
          ref="cameraStageRef"
          :aspect-ratio="aspectRatio"
          :show-placeholder="showPlaceholder"
          :placeholder-text="cameraPlaceholderText"
          :show-action="showCameraAction"
          action-label="Kamera aktiviere"
          :show-badge="showCameraBadge"
          :badge-label="cameraBadgeLabel"
          :badge-confidence="cameraBadgeConfidence"
          @action="startCamera"
          @metadata="handleCameraMetadata"
        />
      </div>
      <aside class="sidebar">
        <AppCard class="side-card" as="section">
          <AppText as="p" tone="accent" class="card-eyebrow">NELL FINDER</AppText>
          <AppHeading as="h1" size="section" class="info-title">Heb e einzelni Charte vor d Kamera und halt si rueig, bis Nell Finder si erkennt.</AppHeading>
          <AppText class="info-copy" tone="muted">Sorg fuer guets Liecht, halt d Charte im Bild, und pass d Schwelle nume aa, wenn d Erkenning strenger oder lockerer soell sii.
          </AppText>
        </AppCard>
        <AppCard class="side-card controls-card" as="section">
          <div class="control-section">
            <AppHeading as="h2">Kamera</AppHeading>
            <AppSwitch
              :checked="cameraSwitchChecked"
              :disabled="cameraSwitchDisabled"
              off-label="Kamera aktiviere"
              on-label="Kamera deaktiviere"
              @toggle="handleCameraToggle"
            />
          </div>
          <div class="control-section">
            <AppHeading as="h2">Erkennigsschwelle</AppHeading>
            <AppSlider
              id="confidence-threshold"
              v-model="confidenceThreshold"
              label="Schwelle"
              :display-value="confidenceThreshold.toFixed(2)"
              min="0.1"
              max="0.6"
              step="0.05"
            />
          </div>
        </AppCard>
      </aside>
    </section>
    <AppToast :visible="toastVisible" :message="toastMessage" :tone="toastTone" />
  </main>
</template>

<style scoped src="./app.scss" lang="scss"></style>
