# Shadow Studio - Realistic Shadow Generator

A web application that generates realistic, physics-based shadows for foreground subjects on background images.

## Features

### Core Functionality
- **Auto Background Removal**: AI-powered background cutout for foreground images
- **Manual Foreground Upload**: Support for PNG images with transparency
- **Background Integration**: Composite subjects onto any background (auto-resized to 1600x900)
- **Physics-Based Shadows**: Realistic perspective shadow projection with proper geometry
- **Interactive Positioning**: Drag foreground or use preset positions (9-grid layout)

### Light Controls
- **Angle** (0-360°): Controls shadow direction
- **Elevation** (0-90°): Controls shadow length and perspective
- **Intensity** (0-2): Controls shadow darkness/strength

### Shadow Quality Controls
- **Contact Darkness**: Shadow opacity at contact points
- **Blur Radius**: Shadow softness (0-50px)
- **Falloff Distance**: How quickly shadow fades away from subject (50-400px)

### Advanced Features
- **Depth Map Support**: Optional grayscale depth maps for shadow warping on uneven surfaces
- **Image Resize**: Resize foreground and background images with aspect ratio lock
- **Real-time Preview**: Instant visual feedback for all adjustments
- **Multiple Views**: Switch between composite, shadow-only, and mask debug views

### Export Options
- Composite (final image with shadow)
- Shadow only (isolated shadow layer)
- Mask debug (subject silhouette)
- Batch export all outputs

## Installation

```bash
npm install
```

## Usage

### Development Server
```bash
npm run dev
```

Application runs at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## How to Use

1. **Load Foreground**:
   - Upload image and enable "Auto cutout" for AI background removal
   - Or upload PNG with transparency

2. **Load Background**:
   - Upload any image (auto-resized to 1600x900 canvas)

3. **Position Foreground**:
   - Use 9-grid preset positions
   - Or drag the foreground directly on canvas

4. **Adjust Light**:
   - Angle: Shadow direction
   - Elevation: Shadow length
   - Intensity: Shadow strength

5. **Fine-tune Shadow**:
   - Contact Darkness: Base shadow opacity
   - Blur Radius: Shadow softness
   - Falloff Distance: Shadow fade rate

6. **Export**:
   - Individual exports or "Export All" for batch download

## Technical Stack

- **TypeScript**: Type-safe application logic
- **Vite**: Fast build tool and dev server
- **Canvas API**: Image processing and shadow generation
- **@imgly/background-removal**: AI-powered background removal
- **Modular Architecture**: Clean separation of concerns

## Project Structure

```
src/
├── core/
│   ├── types.ts           # TypeScript interfaces
│   ├── imageLoader.ts     # Image loading & background removal
│   ├── maskExtractor.ts   # Alpha channel mask extraction
│   ├── shadowGenerator.ts # Physics-based shadow engine
│   ├── exporter.ts        # Image export functionality
│   └── app.ts             # Main application logic
└── main.ts                # UI integration
index.html                 # Application interface
```

## Algorithm Details

The shadow generation implements realistic perspective projection:

1. **Mask Extraction**: Binary mask from foreground alpha channel
2. **Contact Point Detection**: Identifies ground plane contact
3. **3D Light Position**: Calculates light source position from angle/elevation
4. **Perspective Projection**: Ray-traces each object pixel through light to ground plane
5. **Height-Based Projection**: Uses object height for accurate shadow placement
6. **Distance Falloff**: Exponential + linear opacity gradient from contact point
7. **Variable Blur**: Distance-based blur for realism
8. **Depth Integration**: Optional shadow warping for uneven surfaces
9. **Composite Blending**: Multiply blend for natural integration

## Browser Compatibility

Requires modern browser with Canvas API and WASM support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+