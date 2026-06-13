# [UI] Nell Finder

![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E)
![Vue](https://img.shields.io/badge/Vue-3-42b883)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF)
![ONNX Runtime Web](https://img.shields.io/badge/ONNX_Runtime-Web-black)
![SCSS](https://img.shields.io/badge/SCSS-Styling-CC6699)

Nell Finder is the browser-based UI for live card recognition. It uses Vue and Vite for the frontend, loads an ONNX model directly in the browser, accesses the device camera, and shows live recognition results for Swiss playing cards.

## Requirements

- Node.js and npm
- A modern browser with camera access support
- An ONNX model file at `models/best.onnx`

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the local Vite URL shown in the terminal and allow camera access in the browser.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Model

The ONNX model used by Nell Finder is currently stored at:

```text
models/best.onnx
```

This model is created in the separate training repository `nell-finder-tr`.

If you train or export a better model there, you can replace `models/best.onnx` with the updated file. The replacement model must stay compatible with the frontend inference code in `src/lib/card-detector.js`, especially the expected input size and output structure.

## Notes

- The model runs fully in the browser via `onnxruntime-web`.
- Camera access is required for live detection.
- UI styles are organized with SCSS and split per component.
