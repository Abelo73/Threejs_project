# 3D CAD Editor - Three.js + React Assessment

A 3D modeling and CAD editor built with Three.js and React, featuring basic 3D object manipulation and transformation tools. This project demonstrates proficiency in Three.js, React integration, and fundamental CAD workflows.

## ✨ Features

### Core Functionality
- 🎨 Create and manipulate 3D primitives (Box, Sphere, Cylinder)
- 🖱️ Object selection with raycasting and visual highlighting
- 🛠️ Transform controls for moving, rotating, and scaling objects
- 📊 Real-time object property display (position, rotation, scale)
- 🌐 Interactive 3D viewport with OrbitControls
- 📐 Grid and axes helpers for better spatial orientation

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/threejs-cad-editor.git
   cd threejs-cad-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Project Structure

- `src/App.jsx` - Main application component with Three.js scene setup
- `src/App.css` - Styling for the application
- `public/` - Static assets and HTML template

## 🧩 Technologies Used

- [Three.js](https://threejs.org/) - 3D library for rendering and scene management
- [React](https://reactjs.org/) - UI library for building the interface
- [Vite](https://vitejs.dev/) - Build tool and development server
- [three-stdlib](https://github.com/pmndrs/three-stdlib) - For TransformControls

## 📝 Features in Development

### Planned Features
- [ ] 2D Sketching Mode
  - Rectangle and Circle drawing on XZ plane
  - Grid snapping for precise placement
  - Preview outlines while drawing

- [ ] Extrusion Tools
  - Convert 2D sketches to 3D meshes
  - Adjustable extrusion height
  - Support for complex polygons

- [ ] Scene Persistence
  - Export/import scene to/from JSON
  - Save/load functionality

- [ ] Enhanced UI/UX
  - Undo/Redo functionality
  - Dimension display and measurement tools
  - Object grouping and hierarchy

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) for the powerful 3D library
- The open-source community for inspiration and support
