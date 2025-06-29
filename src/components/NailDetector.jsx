import React, { useRef, useEffect, useState, useCallback } from 'react';

// Custom hook for MediaPipe initialization
const useMediaPipe = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
    ];

    let loadedCount = 0;
    const scriptElements = [];

    scripts.forEach((src, index) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scripts.length) {
          setIsLoaded(true);
        }
      };
      document.head.appendChild(script);
      scriptElements.push(script);
    });

    return () => {
      scriptElements.forEach(script => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      });
    };
  }, []);

  return isLoaded;
};

// Custom hook for nail bite detection logic
const useNailBiteDetection = () => {
  const [isDetected, setIsDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const detectionTimeoutRef = useRef(null);

  const checkNailBiting = useCallback((handResults, mouthPosition, canvasSize) => {
    if (!handResults?.multiHandLandmarks || !mouthPosition) {
      setIsDetected(false);
      setConfidence(0);
      return;
    }

    let maxConfidence = 0;
    let detectionFound = false;

    for (const handLandmarks of handResults.multiHandLandmarks) {
      // Check all fingertips (thumb, index, middle, ring, pinky)
      const fingerTips = [4, 8, 12, 16, 20];
      
      for (const tipIndex of fingerTips) {
        const fingerTip = handLandmarks[tipIndex];
        
        // Use 2D distance for more reliable detection
        const distance2D = Math.hypot(
          (fingerTip.x - mouthPosition.x) * canvasSize.width,
          (fingerTip.y - mouthPosition.y) * canvasSize.height
        );

        // Normalize distance based on face size (approximate)
        const normalizedDistance = distance2D / canvasSize.width;
        
        // Calculate confidence (inverse of distance, clamped)
        const detectionConfidence = Math.max(0, 1 - (normalizedDistance * 20));
        
        if (normalizedDistance < 0.08) { // More reliable 2D threshold
          detectionFound = true;
          maxConfidence = Math.max(maxConfidence, detectionConfidence);
        }
      }
    }

    setConfidence(maxConfidence);

    // Add temporal smoothing - require detection for 300ms
    if (detectionFound && maxConfidence > 0.3) {
      if (!detectionTimeoutRef.current) {
        detectionTimeoutRef.current = setTimeout(() => {
          setIsDetected(true);
        }, 300);
      }
    } else {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
      setIsDetected(false);
    }
  }, []);

  return { isDetected, confidence, checkNailBiting };
};

// Utility functions
const getMouthCenter = (faceLandmarks) => {
  // Use multiple mouth landmarks for better center calculation
  const upperLip = faceLandmarks[13];
  const lowerLip = faceLandmarks[14];
  const leftCorner = faceLandmarks[308];
  const rightCorner = faceLandmarks[78];
  
  return {
    x: (upperLip.x + lowerLip.x + leftCorner.x + rightCorner.x) / 4,
    y: (upperLip.y + lowerLip.y + leftCorner.y + rightCorner.y) / 4
  };
};

const drawLandmarks = (ctx, handResults, mouthPosition, canvasSize) => {
  // Draw mouth position
  if (mouthPosition) {
    ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(
      mouthPosition.x * canvasSize.width,
      mouthPosition.y * canvasSize.height,
      6, 0, 2 * Math.PI
    );
    ctx.fill();
  }

  // Draw fingertips
  if (handResults?.multiHandLandmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    
    handResults.multiHandLandmarks.forEach(handLandmarks => {
      fingerTips.forEach(tipIndex => {
        const tip = handLandmarks[tipIndex];
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(
          tip.x * canvasSize.width,
          tip.y * canvasSize.height,
          4, 0, 2 * Math.PI
        );
        ctx.fill();
      });
    });
  }
};

// Main component
const NailBiteDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastMouthRef = useRef(null);
  
  const isMediaPipeLoaded = useMediaPipe();
  const { isDetected, confidence, checkNailBiting } = useNailBiteDetection();
  
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDetection = useCallback(async () => {
    if (!isMediaPipeLoaded || !videoRef.current || !canvasRef.current) return;

    try {
      // Initialize MediaPipe models
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6
      });

      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.4
      });

      // State for current detection results
      let currentHandResults = null;
      let currentFaceResults = null;

      const processFrame = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        const canvasSize = { width: canvas.width, height: canvas.height };
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvasSize.width, canvasSize.height);

        // Get mouth position
        let mouthPosition = lastMouthRef.current;
        if (currentFaceResults?.multiFaceLandmarks?.[0]) {
          mouthPosition = getMouthCenter(currentFaceResults.multiFaceLandmarks[0]);
          lastMouthRef.current = mouthPosition;
        }

        // Draw landmarks
        drawLandmarks(ctx, currentHandResults, mouthPosition, canvasSize);

        // Check for nail biting
        checkNailBiting(currentHandResults, mouthPosition, canvasSize);
      };

      // Set up result handlers
      hands.onResults((results) => {
        currentHandResults = results;
        processFrame();
      });

      faceMesh.onResults((results) => {
        currentFaceResults = results;
        processFrame();
      });

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            // Staggered processing for better performance
            await hands.send({ image: videoRef.current });
            
            // Process face less frequently
            if (Math.random() < 0.3) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        camera.start();
        setIsInitialized(true);
      };
    } catch (error) {
      console.error('Failed to initialize detection:', error);
    }
  }, [isMediaPipeLoaded, checkNailBiting]);

  useEffect(() => {
    if (isMediaPipeLoaded && !isInitialized) {
      initializeDetection();
    }
  }, [isMediaPipeLoaded, isInitialized, initializeDetection]);

  return (
    <div className="relative max-w-2xl mx-auto p-4">
      <div className="relative rounded-lg overflow-hidden shadow-lg">
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
          className="block w-full h-auto bg-gray-900"
        />
        
        {/* Status indicators */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <div className={`px-3 py-1 rounded text-sm font-medium ${
            isInitialized ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
          }`}>
            {isInitialized ? 'Active' : 'Loading...'}
          </div>
          
          {confidence > 0 && (
            <div className="px-3 py-1 rounded text-sm bg-blue-500 text-white">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>

        {/* Detection alert */}
        {isDetected && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold">⚠️ Nail Biting Detected</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Green dots: Fingertips • Blue dot: Mouth center</p>
        <p>Keep your hands visible for best detection</p>
      </div>
    </div>
  );
};

export default NailBiteDetector;