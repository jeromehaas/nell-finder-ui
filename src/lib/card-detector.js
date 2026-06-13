
// IMPORTS
import * as ort from 'onnxruntime-web';
import modelUrl from '../../models/best.onnx?url';

// DETECTOR CONSTANTS
const INPUT_SIZE = 640;
const DEFAULT_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;
const MAX_DETECTIONS = 8;
const MASK_VALUES = 32;
const TOP_CANDIDATE_COUNT = 5;

// MODEL LABELS
const LABELS = [
  'card_back',
  'eichel_10',
  'eichel_6',
  'eichel_7',
  'eichel_8',
  'eichel_9',
  'eichel_ass',
  'eichel_koenig',
  'eichel_ober',
  'eichel_under',
  'rosen_10',
  'rosen_6',
  'rosen_7',
  'rosen_8',
  'rosen_9',
  'rosen_ass',
  'rosen_koenig',
  'rosen_ober',
  'rosen_under',
  'schellen_10',
  'schellen_6',
  'schellen_7',
  'schellen_8',
  'schellen_9',
  'schellen_ass',
  'schellen_koenig',
  'schellen_ober',
  'schellen_under',
  'schilten_10',
  'schilten_6',
  'schilten_7',
  'schilten_8',
  'schilten_9',
  'schilten_ass',
  'schilten_koenig',
  'schilten_ober',
  'schilten_under',
];

// HUMAN-READABLE RANK NAMES
const RANK_NAMES = {
  ass: 'Ass',
  koenig: 'Koenig',
  ober: 'Ober',
  under: 'Under',
};

// FUNCTION: CLAMP A VALUE TO A GIVEN RANGE
const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// FUNCTION: FORMAT A MODEL LABEL FOR THE UI
const formatLabel = (label) => {

  // RETURN THE SPECIAL LABEL FOR THE BACK OF A CARD
  if (label === 'card_back') {
    return 'Ruecksite';
  }

  // SPLIT THE RAW LABEL INTO SUIT AND RANK
  const [suit, rank] = label.split('_');

  // RETURN A HUMAN-READABLE LABEL
  return `${suit.charAt(0).toUpperCase() + suit.slice(1)} ${RANK_NAMES[rank] ?? rank}`;
};


// FUNCTION: KEEP THE STRONGEST NON-OVERLAPPING DETECTIONS
const selectDetections = (detections) => {

  // SORT DETECTIONS BY CONFIDENCE SO THE BEST ONES WIN FIRST
  const sortedDetections = [...detections].sort((left, right) => right.confidence - left.confidence);

  // STORE THE FINAL SELECTION
  const selected = [];

  // LOOP OVER SORTED DETECTIONS
  for (const detection of sortedDetections) {

    // STOP WHEN THE MAXIMUM NUMBER OF DETECTIONS IS REACHED
    if (selected.length === MAX_DETECTIONS) {
      break;
    }

    // SKIP DETECTIONS THAT OVERLAP TOO MUCH WITH A STRONGER ONE
    const overlapsExisting = selected.some((selectedDetection) => {

      // CALCULATE THE OVERLAPPING RECTANGLE
      const left = Math.max(selectedDetection.box.x, detection.box.x);
      const top = Math.max(selectedDetection.box.y, detection.box.y);
      const right = Math.min(selectedDetection.box.x + selectedDetection.box.width, detection.box.x + detection.box.width);
      const bottom = Math.min(selectedDetection.box.y + selectedDetection.box.height, detection.box.y + detection.box.height);

      // CALCULATE OVERLAP WIDTH, HEIGHT, AND AREA
      const overlapWidth = Math.max(0, right - left);
      const overlapHeight = Math.max(0, bottom - top);
      const overlapArea = overlapWidth * overlapHeight;

      // RETURN EARLY WHEN THERE IS NO OVERLAP
      if (overlapArea === 0) {
        return false;
      }

      // CALCULATE THE AREA OF BOTH BOXES
      const selectedArea = selectedDetection.box.width * selectedDetection.box.height;
      const detectionArea = detection.box.width * detection.box.height;

      // RETURN TRUE WHEN THE IOU IS ABOVE THE LIMIT
      return overlapArea / (selectedArea + detectionArea - overlapArea) > IOU_THRESHOLD;
    });

    // KEEP ONLY DETECTIONS THAT PASS THE OVERLAP CHECK
    if (!overlapsExisting) {
      selected.push(detection);
    }
  }

  // RETURN THE FILTERED DETECTIONS
  return selected;
};

// FUNCTION: CREATE THE MODEL INPUT TENSOR FROM THE CANVAS
const createInputTensor = (context) => {

  // READ PIXEL DATA AND PREPARE THE THREE COLOR PLANES
  const imageData = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const pixels = imageData.data;
  const planeSize = INPUT_SIZE * INPUT_SIZE;
  const values = new Float32Array(planeSize * 3);

  // CONVERT RGBA PIXELS INTO A CHW FLOAT TENSOR
  for (let offset = 0, pixelIndex = 0; offset < pixels.length; offset += 4, pixelIndex += 1) {
    values[pixelIndex] = pixels[offset] / 255;
    values[planeSize + pixelIndex] = pixels[offset + 1] / 255;
    values[planeSize * 2 + pixelIndex] = pixels[offset + 2] / 255;
  }

  // RETURN THE TENSOR USED BY THE MODEL
  return new ort.Tensor('float32', values, [1, 3, INPUT_SIZE, INPUT_SIZE]);
};

// FUNCTION: READ MODEL OUTPUTS AND BUILD DETECTIONS
const readDetections = (output, width, height, scale, offsetX, offsetY, threshold) => {

  // DEFINE HOW MANY VALUES EACH PREDICTION CONTAINS
  const valuesPerPrediction = 4 + LABELS.length + MASK_VALUES;

  // CALCULATE HOW MANY PREDICTIONS THE MODEL RETURNED
  const predictionCount = output.length / valuesPerPrediction;

  // TRACK FINAL DETECTIONS AND DEBUG CANDIDATES
  const detections = [];
  const candidates = [];

  // LOOP OVER ALL PREDICTIONS
  for (let index = 0; index < predictionCount; index += 1) {

    // TRACK THE BEST CLASS AND SCORE FOR THIS PREDICTION
    let bestClass = -1;
    let bestScore = 0;

    // FIND THE BEST SCORING CLASS
    for (let classIndex = 0; classIndex < LABELS.length; classIndex += 1) {

      // GET SCORE
      const score = output[(4 + classIndex) * predictionCount + index];

      // UPDATE THE BEST MATCH WHEN A HIGHER SCORE IS FOUND
      if (score > bestScore) {
        bestScore = score;
        bestClass = classIndex;
      }
    }

    // SKIP PREDICTIONS WITHOUT A VALID CLASS
    if (bestClass === -1) {
      continue;
    }

    // READ THE BOX CENTER AND SIZE FROM THE MODEL OUTPUT
    const x = output[index];
    const y = output[predictionCount + index];
    const boxWidth = output[predictionCount * 2 + index];
    const boxHeight = output[predictionCount * 3 + index];

    // MAP THE BOX BACK TO THE ORIGINAL SOURCE IMAGE
    const left = clamp((x - boxWidth / 2 - offsetX) / scale, 0, width);
    const top = clamp((y - boxHeight / 2 - offsetY) / scale, 0, height);
    const right = clamp((x + boxWidth / 2 - offsetX) / scale, 0, width);
    const bottom = clamp((y + boxHeight / 2 - offsetY) / scale, 0, height);

    // SKIP VERY SMALL BOXES
    if (right - left < 8 || bottom - top < 8) {
      continue;
    }

    // BUILD A DETECTION OBJECT FOR THE UI AND FILTERING
    const label = LABELS[bestClass];
    const detection = {
      label,
      displayLabel: formatLabel(label),
      confidence: bestScore,
      box: {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      },
    };

    // KEEP EVERY CANDIDATE FOR DIAGNOSTIC OUTPUT
    candidates.push(detection);

    // ONLY KEEP DETECTIONS ABOVE THE ACTIVE THRESHOLD
    if (bestScore < threshold) {
      continue;
    }

    // ADD THE DETECTION TO THE FINAL LIST
    detections.push(detection);
  }

  // KEEP ONLY THE STRONGEST CANDIDATES FOR DEBUGGING STATS
  const topCandidates = [...candidates]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, TOP_CANDIDATE_COUNT)
    .map(({ box, ...candidate }) => candidate);

  // RETURN DETECTIONS AND RELATED STATS
  return {
    detections: selectDetections(detections),
    stats: {
      maxConfidence: topCandidates[0]?.confidence ?? 0,
      topCandidates,
      predictionCount,
      scoreThreshold: threshold,
    },
  };
};

// FUNCTION: CREATE A CARD DETECTOR INSTANCE
const createCardDetector = async () => {

  // CREATE THE OFFSCREEN CANVAS USED FOR PREPROCESSING
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;

  // GET THE 2D CONTEXT USED TO DRAW VIDEO FRAMES
  const context = canvas.getContext('2d', { willReadFrequently: true });

  // STOP EARLY WHEN THE BROWSER DOES NOT SUPPORT A 2D CANVAS
  if (!context) {
    throw new Error('Canvas 2D context is not available in this browser.');
  }

  // CREATE THE ONNX RUNTIME SESSION
  const session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  // BUILD THE PUBLIC DETECTOR API
  const detector = {
    labels: LABELS,
    async detect(source, threshold = DEFAULT_THRESHOLD) {

      // READ THE CURRENT SOURCE DIMENSIONS
      const width = source.videoWidth;
      const height = source.videoHeight;

      // RETURN AN EMPTY RESULT UNTIL A FRAME IS AVAILABLE
      if (!width || !height) {
        const emptyResult = {
          detections: [],
          stats: { maxConfidence: 0, topCandidates: [], predictionCount: 0, scoreThreshold: threshold },
        };

        // RETURN
        return emptyResult;
      }

      // SCALE THE SOURCE FRAME INTO THE MODEL INPUT SIZE
      const scale = Math.min(INPUT_SIZE / width, INPUT_SIZE / height);
      const drawWidth = Math.round(width * scale);
      const drawHeight = Math.round(height * scale);
      const offsetX = (INPUT_SIZE - drawWidth) / 2;
      const offsetY = (INPUT_SIZE - drawHeight) / 2;

      // DRAW THE CURRENT FRAME INTO THE OFFSCREEN CANVAS
      context.fillStyle = '#000';
      context.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
      context.drawImage(source, 0, 0, width, height, offsetX, offsetY, drawWidth, drawHeight);

      // RUN THE MODEL ON THE PREPARED INPUT TENSOR
      const input = createInputTensor(context);
      const { output0 } = await session.run({ images: input });

      // RETURN DETECTIONS FOR THE CURRENT FRAME
      return readDetections(output0.data, width, height, scale, offsetX, offsetY, threshold);
    },
  };

  // RETURN THE DETECTOR API
  return detector;
};

// EXPORTS
export { createCardDetector };
