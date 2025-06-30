import {
    HandLandmarker,
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";

import React, { useRef, useEffect, useState } from 'react';

export default function HandDetector() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const [nailBiting, setNailBiting] = useState(false)

    // Temporal tracking state
    const nailBitingStateRef = useRef({
      detectionHistory: [], // Rolling window of recent detections
      windowSize: 30, // frames (~1 second at 30fps)
      confidenceThreshold: 0.4, // 40% of recent frames must be positive
    });

    useEffect(() => {
        const createLandmarkers = async () => {
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
                minHandDetectionConfidence: 0.7,
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

        const drawLandmarksScaled = (handResults, faceResults, ctx, video, canvas) => {
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

            // determine if nail biting is gonna occur
            if (handResults.landmarks && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {

              // Save the current transformation matrix
              ctx.save();
              ctx.translate(offsetX, offsetY); // Apply transformation to match the video scaling
              ctx.scale(drawWidth / canvas.width, drawHeight / canvas.height);

              const drawingUtils = new DrawingUtils(ctx);
              
              // draw mouth center
              const mouthCenter = faceResults.faceLandmarks[0][13];
              drawingUtils.drawLandmarks([mouthCenter], { color: '#00FFFF', lineWidth: 1 });

              for (const handLandmarks of handResults.landmarks) {
                const fingertipIndices = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky

                for (const fingertipIndex of fingertipIndices) {
                  const fingertip = handLandmarks[fingertipIndex]
                  drawingUtils.drawLandmarks([fingertip], { color: '#FF0000', lineWidth: 1 });
                }
              }
              // Restore the original transformation matrix
              ctx.restore();
            }
        }

        const detectNailBitingFrame = (handResults, faceResults) => {
            setNailBiting(false)

            // determine if nail biting is gonna occur
            if (handResults.landmarks && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
              
              // Extract mouth center & draw facial landmarks
              const mouthCenter = faceResults.faceLandmarks[0][13];

              for (const handLandmarks of handResults.landmarks) {

                const fingertipIndices = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky

                for (const fingertipIndex of fingertipIndices) {
                  const fingertip = handLandmarks[fingertipIndex]

                  const distance = calculate3DDistance(fingertip, mouthCenter)

                  if (fingertipIndex === 8){
                    console.log(`Fingertip ${fingertipIndex} distance to mouth: ${distance.toFixed(4)}`);
                  }

                  if (distance < 0.05) {
                    setNailBiting(true)
                    console.log(`NAIL BITING DETECTED! Fingertip ${fingertipIndex}`);
                  }
                }
              }
            }
        }

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

            // will return a true / false representing if a nail biting moment happened
            detectNailBitingFrame(handResults, faceResults)
            drawLandmarksScaled(handResults, faceResults, ctx, video, canvas)

            requestAnimationFrame(processVideoFrame);
          };

          function calculate3DDistance(point1, point2, zWeight = 3) {
            const dx = point1.x - point2.x;
            const dy = point1.y - point2.y;
            const dz = (point1.z - point2.z) * zWeight;
            return Math.sqrt(dx*dx + dy*dy + dz*dz);
          }

          createLandmarkers();
    }, []);

    return (
      <>
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

        { nailBiting && (
            <h1>NAIL BITING OCCURED!!!!!</h1>
        )}
      </>
    )
}