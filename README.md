# 3D Hand-Tracked Particle System

An interactive, real-time 3D particle system that responds to hand gestures using your webcam. Create a holographic galaxy that reacts to your movements without any video data leaving your device.

## Features

- **Real-time Hand Tracking**: Uses MediaPipe to track your hand position and gestures in 3D space
- **Interactive Particle Effects**: Manipulate a dynamic particle system with intuitive hand gestures
- **Multiple Shapes**: Cycle through different particle formations
- **Color Changing**: Change particle colors with your hand gestures
- **Physics-Based Interactions**: Particles respond to hand position and movement with repulsion and attraction forces
- **Privacy-First**: All processing happens locally in your browser—no video data is sent anywhere

## Hand Gesture Controls

| Gesture | Action |
|---------|--------|
| ✌️ Peace Sign | Switch to next particle shape |
| ✊ Fist | Change particle color |
| 🤏 Pinch / Open Hand | Expand or contract particles |
| 🖐 Move Hand | Rotate the galaxy |
| ☝️ Point/Index Finger | Repel particles away from your finger |
| ✊✊ Two Fists | Create a black hole effect |
| 🤏🤏 Two Pinches | Scale the entire galaxy |

## Getting Started

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Webcam/camera
- Well-lit environment for best hand tracking accuracy

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Allow camera permissions when prompted
4. Start creating!

## How It Works

1. **Hand Tracking**: MediaPipe's hand detection model identifies your hand landmarks in real-time
2. **Gesture Recognition**: The system analyzes hand poses to detect specific gestures
3. **Particle Simulation**: Three.js renders the 3D particle system with physics-based interactions
4. **Real-time Rendering**: All computations happen locally for instant, responsive feedback

## Technologies Used

- **Three.js**: 3D graphics library for WebGL rendering
- **MediaPipe Hands**: Hand detection and tracking AI model
- **WebGL**: GPU-accelerated graphics rendering
- **HTML5 Canvas**: Display surface for 3D graphics

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Tips for Best Results

- Ensure adequate lighting (natural light works best)
- Keep your hands fully visible to the camera
- Use one or both hands to control the system
- Slowly move your hand to rotate the galaxy smoothly
- Experiment with different gesture combinations

## Performance

The system is optimized to run smoothly on most modern devices. Performance depends on:
- Device GPU capability
- Browser hardware acceleration
- Number of particles on screen

## Privacy

✅ **All processing is local** - Your camera feed never leaves your device or connects to any server.

## License

This project is open source and available for personal and educational use.

## Contributing

Feel free to fork this project and submit pull requests for improvements!
