# Shadow Studio - Realistic Shadow Generator

A web application that generates realistic, physics-based shadows for foreground subjects on background images.

## Features

### Core Functionality
- **Foreground Compositing**: Upload PNG images with transparency cutouts
- **Background Integration**: Composite subjects onto any background image
- **Realistic Shadow Generation**: Physics-based shadows that match subject silhouettes
- **Directional Lighting**: Full control over light angle (0-360°) and elevation (0-90°)

### Shadow Quality Controls
- **Contact Shadow**: Dark, sharp shadow at contact points with rapid falloff
- **Distance-Based Blur**: Shadow blur increases with distance from subject
- **Opacity Falloff**: Natural opacity decrease away from contact area
- **Silhouette Matching**: Shadow follows actual subject shape

### Advanced Features
- **Depth Map Support**: Optional grayscale depth maps for shadow warping on uneven surfaces
- **Real-time Preview**: Instant visual feedback as you adjust parameters
- **Multiple Views**: Switch between composite, shadow-only, and mask debug views

### Export Options
- `composite.png` - Final image with shadow
- `shadow_only.png` - Isolated shadow layer
- `mask_debug.png` - Subject silhouette mask
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

The application will open at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## How to Use

1. **Load Images**:
   - Upload a foreground image (PNG with transparency)
   - Upload a background image
   - Optionally upload a depth map (grayscale image)

2. **Adjust Light**:
   - Set light angle (0-360°) to control shadow direction
   - Set light elevation (0-90°) to control shadow length

3. **Fine-tune Shadow**:
   - Contact Darkness: Intensity of shadow at contact point
   - Blur Radius: Maximum blur amount for distant shadow areas
   - Falloff Distance: How quickly shadow fades with distance

4. **Export**:
   - Click individual export buttons for specific outputs
   - Use "Export All" to download all three images at once

## Technical Stack

- **TypeScript**: Type-safe application logic
- **Vite**: Fast build tool and dev server
- **Canvas API**: Image processing and shadow generation
- **Modular Architecture**: Clean separation of concerns

## Project Structure

```
src/
├── core/
│   ├── types.ts           # TypeScript interfaces
│   ├── imageLoader.ts     # Image loading utilities
│   ├── maskExtractor.ts   # Alpha channel mask extraction
│   ├── shadowGenerator.ts # Shadow generation engine
│   ├── exporter.ts        # Image export functionality
│   └── app.ts             # Main application logic
└── main.ts                # UI integration
index.html                 # Application interface
```

## Sample Images

Test images are available at: [https://github.com/amcnyusa/Shadow-Files](https://github.com/amcnyusa/Shadow-Files)

## Algorithm Details

The shadow generation algorithm implements:

1. **Mask Extraction**: Binary mask from foreground alpha channel
2. **Contact Point Detection**: Identifies lowest point of subject silhouette
3. **Shadow Projection**: Projects shadow based on light angle and elevation
4. **Distance Calculation**: Computes distance from each shadow pixel to contact point
5. **Opacity Gradient**: Applies exponential falloff for contact shadow + linear base opacity
6. **Variable Blur**: Increases blur radius with distance from contact
7. **Depth Integration**: Optional shadow warping based on depth map values
8. **Composite Blending**: Multiply blend mode for realistic shadow integration

## Browser Compatibility

Requires modern browser with Canvas API support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
