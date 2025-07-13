import {
    HandLandmarker,
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";

import React, { useRef, useEffect, useState } from 'react';

const FRAME_RATE = 15;
const FRAME_INTERVAL = 1000 / FRAME_RATE;


export default function NailDetector({ onUpdate, onDetection }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const audioRef = useRef(null);
    
    const frameTimerRef = useRef(null);
    const prevDetectionRef = useRef(false)

    const [nailBiting, setNailBiting] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false);

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
  const canvas = canvasRef.current;

  // Request a 640×580 stream (or as close as the camera supports)
  const constraints = {
    video: {
      width:  { ideal: 640 },
      height: { ideal: 580 },
      aspectRatio: { ideal: 640 / 580 }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  await video.play();

  // Now video.videoWidth / video.videoHeight should be approx. 640×580
  const videoWidth  = video.videoWidth;
  const videoHeight = video.videoHeight;

  canvas.width  = videoWidth;
  canvas.height = videoHeight;
  video.width   = videoWidth;
  video.height  = videoHeight;

  frameTimerRef.current = setInterval(() => {
    requestAnimationFrame(processVideoFrame);
  }, FRAME_INTERVAL);

  setIsInitialized(true);
};



    const drawLandmarksScaled = (handResults, faceResults, ctx, video, canvas) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw raw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (handResults.landmarks && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        const drawingUtils = new DrawingUtils(ctx);

        const mouthCenter = faceResults.faceLandmarks[0][13];
        drawingUtils.drawLandmarks([mouthCenter], { color: '#00FFFF', lineWidth: 1 });

        for (const handLandmarks of handResults.landmarks) {
          const fingertipIndices = [4, 8, 12, 16, 20];
          for (const idx of fingertipIndices) {
            drawingUtils.drawLandmarks([handLandmarks[idx]], { color: '#FF0000', lineWidth: 1 });
          }
        }
      }
    };


        /**
         * @returns {{handedness: string, finger: number, distance: number}|null}
         */
        const detectNailBitingFrame = (handResults, faceResults) => {

            const threshold = 0.08
            // determine if nail biting is gonna occur
            if (handResults.landmarks && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
              
              // Extract mouth center & draw facial landmarks
              const mouthCenter = faceResults.faceLandmarks[0][13];

              // for each hand, look at its landmarks AND its handedness
              for (let hIdx = 0; hIdx < handResults.landmarks.length; hIdx++) {
                const handLandmarks = handResults.landmarks[hIdx];
                const handedness = handResults.handedness?.[hIdx]?.[0]?.categoryName || "Unknown"

                // console.log(handedness)

                const fingertipIndices = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky

                // for each fingertip, identify if it is close to the mouth
                for (const fingertipIndex of fingertipIndices) {
                  const fingertipData = handLandmarks[fingertipIndex]

                  const distance = calculate3DDistance(fingertipData, mouthCenter)

                  if (distance < threshold) {
                    // console.log(`NAIL BITING DETECTED! Fingertip ${fingertipIndex}`);

                    // store which fingerTip it is (easy)
                    // store the handedness
                    return { handedness, finger: fingertipIndex, distance };
                  }
                }
              }
            }
            return null;
        }

        const detectTemporalNailBiting = (handResults, faceResults) => {
          // 1. Get frane result (T/F)
          const frameEvent = detectNailBitingFrame(handResults, faceResults);
          const frameResult = Boolean(frameEvent);

          let state = nailBitingStateRef.current;

        //   console.log(state.detectionHistory);

          // 2. if there is space ? add to history : move shift history up and add frame result
          state.detectionHistory.push(frameResult)
          if (state.detectionHistory.length > state.windowSize) {
            state.detectionHistory.shift(); // Remove oldest
          } else {  // 3. if frame is not full yet (edge case) -> exit function
            return
          }

          // 4. filter history for TRUE results
          const recentPositives = state.detectionHistory.filter((result) => {
            return result
          });

          // 5. calculate and set NB moment based on threshold
          const temporalDetection = (recentPositives.length / state.detectionHistory.length) > state.confidenceThreshold;

            // …after you mutate the ref…
            state = nailBitingStateRef.current

            // send a *new* copy so React notices and re-renders
            onUpdate({
              windowSize: state.windowSize,
              confidenceThreshold: state.confidenceThreshold,
              detectionHistory: [...state.detectionHistory],
            })

            // Only identify when it changes from FALSE -> TRUE
            if (!prevDetectionRef.current && temporalDetection) {
                onDetection({
                    timestamp:    Date.now(),
                    handedness:   frameEvent.handedness,
                    finger:       frameEvent.finger,
                    distance:     frameEvent.distance,
                });
            }

            prevDetectionRef.current = temporalDetection

            setNailBiting(temporalDetection)
        }

        const processVideoFrame = async () => {
            console.count("Frame")
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!handLandmarkerRef.current || !faceLandmarkerRef.current) return;

            const now = performance.now();
            const handResults = handLandmarkerRef.current.detectForVideo(video, now);
            const faceResults = faceLandmarkerRef.current.detectForVideo(video, now);

            // will return a true / false representing if a nail biting moment happened
            detectTemporalNailBiting(handResults, faceResults);
            drawLandmarksScaled(handResults, faceResults, ctx, video, canvas);
          };

          function calculate3DDistance(point1, point2, zWeight = 3) {
            const dx = point1.x - point2.x;
            const dy = point1.y - point2.y;
            const dz = (point1.z - point2.z) * zWeight;
            return Math.sqrt(dx*dx + dy*dy + dz*dz);
          }

          audioRef.current = new Audio('/bell.wav');
          audioRef.current.load();
          createLandmarkers();

          return () => {
            if (frameTimerRef.current) {
              clearInterval(frameTimerRef.current);
            }
          };
    }, []);

    useEffect(() => {
    if (nailBiting && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {/* ignore */});
    }
  }, [nailBiting]);

 return (
  <div className="flex flex-col items-center w-full lg:w-2/3">
    <div className="relative rounded-lg overflow-hidden shadow-lg w-full max-w-[640px] aspect-[4/3] lg:aspect-[640/580]">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="w-full h-auto bg-[#1c1c1c]"
      />

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className={`px-3 py-1 rounded text-sm font-medium ${
          isInitialized ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
          {isInitialized ? 'Active' : 'Loading...'}
        </div>
      </div>

      {nailBiting && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center justify-center">
            <span className="text-lg font-bold">⚠️ Nail Biting Detected</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

}