# 🎤 Voice Coach App

A collaborative AI-designed voice training application built with React + Vite for guided vocal exercises and strength building.

## ✨ About This Project

This is a **vibe-coded** application developed through collaborative planning with **Claude, Gemini, ChatGPT, and Ra13s**. The workout routines and exercises were designed by this collaboration, implementing evidence-based voice training techniques adapted for everyday use.

## 🚀 Features

- **🌅 AI-Designed Exercise Routines**: Morning (14min), Evening (9-14min), Weekend (11min), and Optional Modules
- **🎯 Guided Wizard Interface**: Step-by-step exercise guidance with timers and progress tracking
- **🎤 dB Meter**: SPL measurement using Tone.js for vocal level monitoring
- **🫁 Advanced Breathing Timer**: SVG-animated breathing exercises with customizable patterns
- **🌍 Multilingual Support**: English/Estonian with dynamic language switching
- **📱 Mobile-First Design**: Responsive layout optimized for voice training on-the-go
- **💾 Offline-First**: All data stored locally, no accounts or cloud sync required
- **📖 Integrated Workout Guide**: Comprehensive HTML guide with cross-language linking

## 🛠️ Technology Stack

- **React 18** + **Vite** - Modern frontend development
- **Tone.js** - Audio analysis and dB measurement  
- **Web Audio API** - Real-time audio processing
- **CSS-in-JS** - Component-scoped styling
- **LocalStorage** - Client-side data persistence
- **GitHub Pages** - Automated deployment

## 🏗️ Development Approach

This app was built using a **collaborative AI development pipeline** with:

- **Claude**: Technical implementation and code architecture
- **Gemini**: Alternative technical perspectives and optimization  
- **ChatGPT**: Feature planning and user experience design
- **Ra13s**: Project coordination and collaborative development

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Ra13s/voice-coach.git
cd voice-coach

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── Welcome.jsx     # Main navigation
│   ├── Wizard.jsx      # Exercise routine interface
│   ├── DbMeter.jsx     # SPL measurement
│   └── TimerBreathing.jsx # Advanced breathing exercises
├── hooks/              # Custom React hooks
├── locales/            # Internationalization files
└── contexts/           # React context providers

docs/                   # Multilingual workout guides
logs/                   # 4-agent development decisions
```

## 🎯 Target Users

**Voice-Intensive Users**: Teachers, speakers, salespeople, and performers who experience vocal fatigue and need structured training to build vocal strength and stamina.

## 📋 Exercise Routines

Based on evidence-based vocal therapy techniques:

- **Targeted Laryngeal & Shoulder Reset** - Biomechanical voice improvements
- **SOVT (Semi-Occluded Vocal Tract)** - Straw-in-water and lip trill exercises  
- **Formant Tuning** - Ring Finder resonance training
- **Breathing Patterns** - 4-4-6, 4-7-8, and 6-2-8 cycles
- **Vocal Ladder & Call-Drop** - Dynamic range exercises

## 🌐 Live Demo

Visit the live application: [Voice Coach App](https://ra13s.github.io/voice-coach)

## 📄 License

MIT License - Feel free to fork and adapt for your own voice training needs.