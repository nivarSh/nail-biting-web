import {
    HandLandmarker,
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";

import React, { useRef, useEffect } from 'react';

export default function HandDetector() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    const faceLandmarkerRef = useRef(null);

    const MOUTH_LANDMARKS = [
      // inner lip lower
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
      // inner lip lower
      42, 41, 38, 12, 268, 
    ];

    useEffect(() => {
        const createHandLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
            );

            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                numHands: 2,
            });

            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
              },
              runningMode: 'VIDEO',
              numFaces: 1,
            });

            startVideo();
        };

        const startVideo = async () => {
            const video = videoRef.current;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();
            requestAnimationFrame(processVideoFrame)
        };

        const processVideoFrame = async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!handLandmarkerRef.current || !faceLandmarkerRef.current) return;

            const now = performance.now();
            const handResults = handLandmarkerRef.current.detectForVideo(video, now);
            const faceResults = faceLandmarkerRef.current.detectForVideo(video, now);

            console.log('Hand Results:', handResults);
            console.log('Face Results:', faceResults);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate scaling and positioning to maintain aspect ratio
            const videoAspect = video.videoWidth / video.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (videoAspect > canvasAspect) {
                // Video is wider than canvas - fit by height
                drawHeight = canvas.height;
                drawWidth = drawHeight * videoAspect;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Video is taller than canvas - fit by width
                drawWidth = canvas.width;
                drawHeight = drawWidth / videoAspect;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
            
            // Draw hands
            if (handResults.landmarks && handResults.landmarks.length > 0) {

              // Save the current transformation matrix
              ctx.save();
              
              // Apply transformation to match the video scaling
              ctx.translate(offsetX, offsetY);
              ctx.scale(drawWidth / canvas.width, drawHeight / canvas.height);

              const drawingUtils = new DrawingUtils(ctx);

              for (const landmarks of handResults.landmarks) {
                  drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                      color: '#00FF00',
                      lineWidth: 2,
                  });
                  drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1 });
              }
              
              // Restore the original transformation matrix
              ctx.restore();
            }

            // Draw face mesh
            if (faceResults.faceLandmarks) {

              const drawingUtils = new DrawingUtils(ctx);

              // Save the current transformation matrix
              ctx.save();
              
              // Apply transformation to match the video scaling
              ctx.translate(offsetX, offsetY);
              ctx.scale(drawWidth / canvas.width, drawHeight / canvas.height);

              for (const landmarks of faceResults.faceLandmarks) {
                const mouthPoints = MOUTH_LANDMARKS.map(i => landmarks[i]);
                drawingUtils.drawLandmarks(mouthPoints, { color: '#00FFFF', lineWidth: 1 });
              }

              // Restore the original transformation matrix
              ctx.restore();
            }

            requestAnimationFrame(processVideoFrame);
          };

          createHandLandmarker();
    }, []);

    return (
        <div className="relative rounded-lg overflow-hidden shadow-lg w-[640px] h-[480px]">
          <video
            ref={videoRef}
            className="hidden"
            width="640"
            height="480"
            autoPlay
            muted
            playsInline
          />
          
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="absolute top-0 left-0 bg-gray-900"
          />
        </div>
    )
}