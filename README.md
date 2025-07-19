# Nail-Biting Detection Web App

### Overview

This project is a browser-based, real-time nail-biting detection application built with React, Vite, and Tailwind CSS. It uses MediaPipe’s Vision Tasks (HandLandmarker and FaceLandmarker) to track hand and mouth landmarks via the user’s webcam. The app processes video frames, analyzes 3D spatial relationships between fingertips and facial landmarks, and triggers audible and visual alerts when a nail-biting event is detected. All events are logged locally (via localStorage) and visualized on an interactive dashboard.

### Key Features

- Real-Time Detection: Continuously captures webcam feed and runs MediaPipe hand and face landmark models to detect nail-biting gestures.

- 3D Spatial Analysis: Considers depth (z values) as well as 2D (x, y) positions to reduce false positives.

- Configurable Frame Rate: Adjustable processing interval (e.g., 15 fps or 30 fps) to balance performance and detection accuracy.

- Temporal Smoothing: Uses a rolling window of recent frames (default: 30 frames) and a confidence threshold (default: 40%) to reduce false positive detections.

- Alerts and Notifications: Plays a sound effect on each nail-biting event and displays a message.

- Local Logging: Stores timestamped detection events in localStorage for persistence across sessions.

- Interactive Dashboard:

    - Hand Distribution: Pie chart showing left vs. right hand nail-biting counts.

    - Event Timeline: Line graph illustrating nail-biting frequency over time interval.

    - Live Updates: Real-time feed of recent detection events.

    - Responsive Layout: Adapts video/canvas and dashboard components to various screen sizes and aspect ratios.

### Future Improvements
- Mobile/Desktop Packaging: Wrap with Electron or React Native for persistent background detection.



### Getting Started

##### Production
`docker build -f prod.Dockerfile -t nail-prod .`
`docker run -p 3000:80 nail-prod`

##### Development
`docker build -f dev.Dockerfile -t nail-dev .`

```
docker run \
  -p 5173:5173 \
  -v ${PWD}:/app \
  -v /app/node_modules \
  -e CHOKIDAR_USEPOLLING=true \
  nail-dev
```