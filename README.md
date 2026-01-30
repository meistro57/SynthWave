# 🎹 SynthWave

> **A professional-grade, browser-based modular DAW inspired by Caustic 3**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/meistro57/SynthWave)

SynthWave is a zero-install, cross-platform music production environment that combines the intuitive rack-mount workflow of legendary mobile DAWs with cutting-edge web technologies and AI-powered sound generation.

![SynthWave Banner](docs/images/banner.png)
*Coming Soon: Screenshot of the main interface*

---

## ✨ Features

### 🎛️ Core Production Tools
- **14-Machine Rack System** - Virtual analog synths, samplers, drum machines, and more
- **Professional Mixer** - 14-channel mixing desk with EQ, send effects, and automation
- **Step Sequencer** - Powerful pattern-based sequencer with velocity and gate controls
- **Piano Roll** - Traditional MIDI note editing with advanced tools
- **Song Arranger** - Pattern-to-song timeline with markers and automation lanes

### 🎚️ Machines (Instruments)
- **SubSynth** - Virtual analog subtractive synthesizer
- **PCMSynth** - Multi-sample wave synthesizer with SoundFont support
- **BassLine** - TB-303 style monosynth with slide and accent
- **BeatBox** - 8-channel sampling drum machine
- **PadSynth** - Harmonic table pad synthesizer
- **FMSynth** - DX-style 3-operator FM synthesis
- **SawSynth** - Supersaw-type polyphonic synthesizer
- *...and more to come*

### 🎸 Effects Rack
- **2 Effect Slots Per Machine** - Chain up to 20+ effect types
- **Master Effects** - Global delay, reverb, and mastering chain
- **Effect Types:** Distortion, Filter, Delay, Reverb, Chorus, Phaser, Compressor, EQ, and more

### 🤖 AI-Powered Features
- **AI Sound Generation** - Create custom sounds from text descriptions
- **AI Pattern Assistant** - Generate melodies, basslines, and drum patterns
- **AI Mixing Helper** - Intelligent mixing suggestions and auto-balancing
- **Style Transfer** - Transform sounds between different styles

### 🌐 Cloud & Collaboration
- **Cloud Project Storage** - Save and sync projects across devices
- **Real-time Collaboration** - Jam with friends in real-time
- **Preset Sharing** - Community library of sounds and patterns
- **Sample Management** - Cloud-based sample library with search

### 📱 Cross-Platform
- **Works Everywhere** - Desktop, tablet, and mobile browsers
- **No Installation** - Zero downloads, instant access
- **Touch Optimized** - Full touch gesture support for tablets
- **Offline Capable** - Progressive Web App with offline mode

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and pnpm
- **Modern Browser** (Chrome 120+, Firefox 120+, Safari 17+)
- **Web Audio API Support** (automatically detected)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/meistro57/SynthWave.git
cd SynthWave

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000 in your browser
```

### Backend Setup (Optional for Development)

The backend is optional for local development - cloud features will be disabled.

```bash
# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
composer install

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Start Laravel development server
php artisan serve
```

---

## 📖 Documentation

- **[Project Plan](docs/PROJECT_PLAN.md)** - Full development roadmap
- **[Todo](docs/TODO.md)** - Active task list and completed milestones

### Quick Links
- [Video Tutorials](https://youtube.com/@synthwave) *(Coming Soon)*
- [FAQ](docs/FAQ.md) *(Coming Soon)*

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Audio Engine:** [Tone.js](https://tonejs.github.io/) + Web Audio API
- **Plugin System:** [Web Audio Modules 2.0](https://www.webaudiomodules.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (Dexie.js)

### Backend
- **Framework:** [Laravel 12](https://laravel.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Cache/Queue:** [Redis](https://redis.io/)
- **WebSockets:** [Laravel Reverb](https://reverb.laravel.com/)
- **Authentication:** [Laravel Sanctum](https://laravel.com/docs/sanctum)
- **Storage:** S3-compatible (DigitalOcean Spaces)

### AI Integration
- **Sound Generation:** [ElevenLabs](https://elevenlabs.io/) Sound Effects API
- **Voice Synthesis:** ElevenLabs TTS (optional)
- **Pattern Generation:** Custom AI models

---

## 🎯 Project Status

**Current Phase:** Foundation & Proof of Concept (Phase 1)  
**Version:** 0.1.0-alpha  
**Target Launch:** Q3 2026

### Roadmap Progress

- [x] Project planning and architecture
- [x] Repository setup
- [ ] Core audio engine (In Progress)
- [ ] First synthesizer (SubSynth)
- [ ] Basic step sequencer
- [ ] Machine rack system
- [ ] Effects processing
- [ ] Mixer interface
- [ ] Song arrangement
- [ ] AI integration
- [ ] Backend API
- [ ] Cloud sync
- [ ] Collaboration features

See the [full project plan](docs/PROJECT_PLAN.md) for detailed timeline.

---

## 🎨 Screenshots

### Main Interface
*Coming Soon*

### Step Sequencer
*Coming Soon*

### Mixer Desk
*Coming Soon*

### Effects Rack
*Coming Soon*

---

## 🤝 Contributing

We welcome contributions! SynthWave is being built in the open.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the TypeScript style guide
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

[Report a Bug →](https://github.com/meistro57/SynthWave/issues/new?template=bug_report.md)

---

## 💡 Feature Requests

Have an idea? We'd love to hear it!

[Request a Feature →](https://github.com/meistro57/SynthWave/issues/new?template=feature_request.md)

---

## 📋 Project Structure

```
SynthWave/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── machines/        # Synthesizer/instrument components
│   │   ├── effects/         # Effect components
│   │   ├── sequencer/       # Sequencer components
│   │   ├── mixer/           # Mixer components
│   │   └── ui/              # Shared UI components
│   ├── audio/               # Audio engine and utilities
│   │   ├── engine.ts        # Core audio engine
│   │   ├── transport.ts     # Timing and playback
│   │   ├── routing.ts       # Audio graph management
│   │   └── machines/        # Machine implementations
│   ├── lib/                 # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand state stores
│   └── types/               # TypeScript type definitions
├── backend/                 # Laravel backend
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── tests/
├── public/                  # Static assets
│   ├── samples/             # Default sample library
│   └── presets/             # Factory presets
├── docs/                    # Documentation
└── tests/                   # Frontend tests
```

---

## 🎓 Learning Resources

### Web Audio API
- [MDN Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Book](https://webaudioapi.com/book/)
- [Tone.js Documentation](https://tonejs.github.io/docs/)

### Music Production
- [Learning Music](https://learningmusic.ableton.com/) - Free Ableton course
- [Syntorial](https://www.syntorial.com/) - Synthesizer programming

### Web Audio Modules
- [WAM 2.0 Documentation](https://www.webaudiomodules.com/docs/intro/)
- [WAM Community](https://www.webaudiomodules.com/community/)

---

## 💰 Pricing (Coming Soon)

### Free Tier
- 3 machine slots
- 2 cloud projects
- Basic preset library
- Community samples
- MP3/WAV export

### Pro Tier ($9.99/month)
- 14 machine slots
- Unlimited projects
- Full preset library
- AI features (100/month)
- Stem export
- Cloud sync

### Studio Tier ($29.99/month)
- Everything in Pro
- Unlimited AI generations
- Real-time collaboration
- Advanced export options
- Priority support
- API access

---

## 🌟 Inspiration

SynthWave is inspired by:
- **Caustic 3** - The mobile DAW that started it all
- **FL Studio** - Pattern-based workflow
- **Ableton Live** - Session view and warping
- **Renoise** - Tracker-style sequencing
- **VCV Rack** - Modular synthesis approach

Special thanks to Rej (SingleCellSoftware) for creating Caustic and inspiring countless mobile producers.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Tone.js** - For the incredible Web Audio framework
- **Web Audio Modules** - For the plugin standard
- **shadcn/ui** - For beautiful UI components
- **The Web Audio Community** - For pushing the boundaries

---

## 📧 Contact

**Mark** - Creator & Lead Developer
- GitHub: [@meistro57](https://github.com/meistro57)
- Website: [quantummindsunited.com](https://quantummindsunited.com)
- Reddit: [r/OperationNewEarth](https://reddit.com/r/OperationNewEarth)

**Project Links:**
- [Documentation](https://synthwave.dev/docs) *(Coming Soon)*
- [Discord Community](https://discord.gg/synthwave) *(Coming Soon)*
- [Twitter/X](https://twitter.com/synthwaveapp) *(Coming Soon)*

---

## 🚨 Status Notices

⚠️ **Alpha Software** - SynthWave is in active development. Expect bugs and breaking changes.

🔧 **Breaking Changes** - Project structure may change significantly during Phase 1-3

💾 **Data Safety** - Always export your projects. Cloud sync is not yet implemented.

🎵 **Audio Performance** - Optimizations ongoing. Some machines may have high CPU usage.

---

## 🎉 Milestones

- **2026-01-30** - Project kickoff and planning
- **2026-02-15** - First synthesizer working *(Target)*
- **2026-03-01** - Basic sequencer complete *(Target)*
- **2026-04-01** - Full rack system *(Target)*
- **2026-06-01** - Beta release *(Target)*
- **2026-09-01** - Public launch *(Target)*

---

## 💭 Philosophy

> "Music production should be accessible to everyone, everywhere, without barriers of cost, platform, or technical knowledge. SynthWave is built for creators who think differently, work differently, and hear the world differently."

SynthWave embraces:
- **Neurodiversity** - Intuitive workflows for all minds
- **Accessibility** - Zero barriers to entry
- **Community** - Sharing and collaboration
- **Innovation** - Pushing web audio boundaries
- **Consciousness** - Tools for creative awakening

---

## 🔮 Future Vision

Beyond the initial launch, SynthWave aims to:

- **Native Mobile Apps** - iOS and Android versions
- **Hardware Controllers** - Custom MIDI controllers
- **VST Export** - Turn projects into plugins
- **AI Mastering** - Professional-grade automated mastering
- **Education Platform** - Built-in music theory lessons
- **Live Performance Mode** - Launchpad-style interface
- **Marketplace** - User-created machines and effects
- **Integration Hub** - Connect with other music services

---

<div align="center">

**[⭐ Star this repo](https://github.com/meistro57/SynthWave)** if you're excited about the future of web audio!

**Made with 💜 by creators, for creators**

[Website](https://synthwave.dev) • [Docs](https://synthwave.dev/docs) • [Discord](https://discord.gg/synthwave) • [Twitter](https://twitter.com/synthwaveapp)

</div>

---

## 🎵 Let's Make Some Music! 🎵

Ready to start building? Check out the [Development Guide](docs/DEVELOPMENT.md) and jump in!

```bash
pnpm install && pnpm dev
```

**Happy producing! 🎹✨**
