# Adi Pro: The Next-Gen Proactive Engineering Partner

**Built for Google Gemini 3 Hackathon**

## 🚀 Overview
Adi Pro is not just an AI assistant; it is a highly intelligent, proactive engineering partner designed by Ewelina Lesiak. Leveraging the full power of **Gemini 3**, Adi Pro breaks the boundaries between reactive chatbots and autonomous collaborators.

## 🛠 Tech Stack & Architecture
Adi Pro features a unique "Flat Core" architecture for maximum efficiency and seamless AI integration:
- **Core Logic:** `indeks.tsx` - Orchestrates Gemini 3 API, handling complex multimodal inputs (Video, Audio, Text).
- **Cross-Platform:** 
  - **Desktop:** Integrated via Electron (`main.js`, `package.json`).
  - **Mobile/Web:** Full PWA support (`manifest.json`, `sw.js`) for "install-anywhere" capability.
- **UI/UX:** `index.css` - Modern Glassmorphism aesthetic, ensuring a premium user experience.
- **Permissions:** `metadane.json` - Custom hardware access management for real-time vision and voice reasoning.

## 🌟 Key Innovations (The "Wow" Factor)
1. **Proactive Reasoning:** Adi Pro analyzes developer workflows in real-time and suggests optimizations before being asked.
2. **Native Multimodality:** Direct integration of camera and microphone streams into the Gemini 3 reasoning loop.
3. **Omnipresence:** A single codebase that delivers a consistent, high-performance experience across Windows, macOS, Linux, Android, and iOS.

## 📁 Project Structure
The project uses a flat directory structure to optimize AI-native development and rapid deployment.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1mteZyipK8Obtw8ZA4ji5rP6WWbF6yG-F

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
