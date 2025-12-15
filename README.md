# CHROMA-SYS | Analog Color Engine

![Status](https://img.shields.io/badge/System-Online-4aff4a?style=flat-square&logo=react&logoColor=black)
![Version](https://img.shields.io/badge/Version-3.0_FLUX-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

**A high-fidelity visual synthesizer interface for exploring color theory, generative flux, and texture.**

CHROMA-SYS is a React-based web application that treats visual design like an analog modular synthesizer. Featuring realistic physics-based knobs, dynamic lighting, and a tactile industrial design, it allows users to generate complex gradients, noise textures, and psychedelic "Flux" patterns.

---

## 🎛 System Architecture

The application is divided into two distinct synthesis engines:

### 1. Chroma Mode (DOM/CSS Engine)
A high-performance engine for generating rich, textured gradients and backgrounds for web design.
*   **Oscillators (A/B):** Dual-channel color manipulation (Hue, Saturation, Luminance).
*   **Texture Lab:** Layer fractal noise, fine film grain, and heavy vignettes.
*   **Blending:** Real-time composite blending modes (Overlay, Soft-light, Difference, etc.).
*   **Smudge Physics:** Optical blur and smear effects.
*   **Image Injection:** Upload custom background images to texture over.

### 2. Flux Engine V3 (Canvas/WebGL)
A generative art engine simulating fluid dynamics, optics, and digital artifacts.
*   **10 Unique Patterns:** Wave, Interference, Ripple, Prism, Turbulence, Glitch, Kaleido, Pixelate, Scanline, Vortex.
*   **Optics:** Control spectra (chromatic aberration) and distortion.
*   **Emulsion:** Manage exposure, ISO (scale), and film grain.

### 3. Audio Intelligence
*   **Microphone Sync:** Reacts to audio input in real-time using the Web Audio API.
*   **Reactive Properties:** Bass thumps affect distortion/scale, highs affect chromatic shift, and volume drives color cycling.
*   **"Sticky" Logic:** Color state persists even after audio stops, preventing jarring resets.

### 4. Output & State
*   **Render Pipeline:** Export generated visuals as PNGs in 4K, 1080p, Mobile, or Square formats.
*   **Signal Sharing:** Full application state is encoded into the URL for easy sharing.
*   **Code View:** Extract the raw JSON configuration of your current patch.

---

## 🛠 Installation & Setup

This project is built with **React 18** and **TypeScript** using **Vite** as the bundler.

### Prerequisites
*   Node.js (v16+)
*   npm or yarn

### Step 1: Initialize Project
Open your terminal and create a new Vite project.

```bash
npm create vite@latest chroma-sys -- --template react-ts
cd chroma-sys
npm install

Step 2: Install Dependencies
Install the required animation and smooth scrolling libraries.
code
Bash
npm install gsap @studio-freight/lenis
Step 3: Project Structure
Replicate the file structure below. Delete the default files in src/ (like App.css, index.css, assets/) and replace/create files according to the code provided in the chat.

chroma-sys/
├── index.html              <-- Replace with provided HTML
├── src/
│   ├── main.tsx            <-- (Renamed from index.tsx in some templates)
│   ├── App.tsx             <-- Main logic
│   ├── metadata.json       <-- Config info
│   ├── components/
│   │   ├── Device.tsx      <-- Chroma Engine UI
│   │   ├── FluxDevice.tsx  <-- Flux Engine UI
│   │   └── ui/
│   │       ├── Knob.tsx
│   │       ├── Switch.tsx
│   │       ├── Slider.tsx
│   │       └── Cursor.tsx
│   └── utils/
│       ├── audio.ts        <-- Audio context & sfx
│       ├── canvas.ts       <-- Image generation logic
│       └── colors.ts       <-- Color math

Note: The index.html provided uses a Tailwind CSS CDN link for zero-config styling. In a production environment, you would typically install Tailwind via PostCSS, but the CDN allows immediate usage with the provided code.
Step 4: Run the Simulation
Start the development server.
code
Bash
npm run dev
Open your browser to http://localhost:5173.