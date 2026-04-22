# AuditSystem-Win

A standalone desktop application for managing audit workflows, designed for offline use on Windows machines.

## Features

- **6-Stage Audit Workflow**: Notice → Survey → Plan → Evidence → Working Paper → Final Report
- **Offline Operation**: All data stored locally in SQLite database
- **Document Generation**: Fill Word templates using docxtemplater
- **Modern UI**: Built with Vue 3, Tailwind CSS, and Electron

## Tech Stack

- **Frontend**: Vue 3 + Vite + TypeScript
- **Backend**: Electron + SQLite3
- **Styling**: Tailwind CSS
- **Document Processing**: docxtemplater
- **Build Tool**: Electron Builder

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

This will start the Vue development server and Electron app.

### Production Build

### Build Application
```bash
npm run build
```

### Package Application
```bash
npm run electron:build
```

This will generate platform-specific installers in the `dist/` directory:
- **Windows**: `KQQ-Audit-System Setup x.x.x.exe` (installer) and portable version
- **macOS**: `KQQ-Audit-System-x.x.x.dmg` (disk image) and `.zip` archive

### Platform-Specific Packaging Guides
- [Windows Packaging Guide](PACKAGING_GUIDE.md) - Complete Windows build and deployment
- [macOS Packaging Guide](MACOS_PACKAGING_GUIDE.md) - macOS build, signing, and distribution
- [Windows Deployment Notes](WINDOWS_DEPLOYMENT_NOTES.md) - Advanced Windows-specific considerations

## Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # Vue 3 frontend
│   ├── assets/
│   ├── components/
│   ├── views/      # Workflow stage views
│   ├── stores/     # Pinia state management
│   └── utils/
├── shared/         # Shared types and utilities
└── database/       # SQLite database layer
```

## Database Schema

The application uses SQLite with the following main tables:
- `audit_stages` - Definition of the 6 workflow stages
- `audit_cases` - Individual audit cases
- `stage_progress` - Progress tracking for each case
- `evidence_items` - Evidence documents and notes
- `working_papers` - Generated working papers

## Installation and Deployment

### Windows Installation
1. Download the installer from the releases page
2. Run `KQQ-Audit-System Setup x.x.x.exe`
3. Follow the installation wizard
4. Launch the application from Start Menu or desktop shortcut

### macOS Installation
1. Download the `.dmg` file from the releases page
2. Double-click to mount the disk image
3. Drag `KQQ-Audit-System.app` to the Applications folder
4. Eject the disk image and launch from Applications or Launchpad

**Note**: On first run, you may need to right-click the app and select "Open" to bypass Gatekeeper security, or allow it in System Preferences → Security & Privacy.

### System Requirements

#### Windows
- **OS**: Windows 10/11 (64-bit)
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 500MB available space
- **Permissions**: Administrator rights for installation
- **Additional**: Microsoft Visual C++ Redistributable 2015-2022

#### macOS
- **OS**: macOS 10.15 (Catalina) or later
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB available space
- **Architecture**: Intel 64-bit or Apple Silicon (ARM64)
- **Additional**: Xcode Command Line Tools for building from source

### Installation Guides
- [Quick Start Guide](INSTALLATION_QUICK_START.md) - Simple installation steps
- [Complete Packaging Guide](PACKAGING_GUIDE.md) - Detailed Windows build and deployment
- [macOS Packaging Guide](MACOS_PACKAGING_GUIDE.md) - macOS build, signing, and distribution
- [Windows Deployment Notes](WINDOWS_DEPLOYMENT_NOTES.md) - Advanced Windows-specific considerations

### Troubleshooting

#### Windows
- **Missing VC++ Runtime**: Install [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- **Antivirus False Positives**: Add application to exclusion list
- **Template Files Missing**: Reinstall application or verify `resources/templates/` directory

#### macOS
- **Gatekeeper Blocking**: Right-click app and select "Open", or allow in System Preferences → Security & Privacy
- **Xcode Tools Missing**: Run `xcode-select --install` to install command line tools
- **App Crashes on Launch**: Check Console logs for detailed error messages
- **Icon Display Issues**: Ensure `public/icon.icns` file exists with all required sizes

## Development Notes

- All database operations should go through the `@database` module
- Use IPC for communication between renderer and main processes
- Word templates are stored in the `resources/templates/` directory
- The application is designed for Windows but can be built for other platforms

## License

MIT