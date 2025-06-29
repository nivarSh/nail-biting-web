// V1

import React, { useRef, useEffect, useState } from 'react';

const NailBiteDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [nailBitingDetected, setNailBitingDetected] = useState(false);
  const lastMouthRef = useRef(null);

  useEffect(() => {
    // Camera Utils
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
    script1.crossOrigin = 'anonymous';
    document.head.appendChild(script1);

    // Control utils
    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js';
    script2.crossOrigin = 'anonymous';
    document.head.appendChild(script2);

    // Drawing utils
    const script3 = document.createElement('script');
    script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
    script3.crossOrigin = 'anonymous';
    document.head.appendChild(script3);

    // hands utils
    const script4 = document.createElement('script');
    script4.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    script4.crossOrigin = 'anonymous';
    document.head.appendChild(script4);

    // face mesh
    const script5 = document.createElement('script');
    script5.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script5.crossOrigin = 'anonymous';
    document.head.appendChild(script5);

    script5.onload = () => {
      initializeMediaPipe();
    };

    return () => {
      [script1, script2, script3, script4, script5].forEach(script => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      });
    };
  }, []);

  const initializeMediaPipe = async () => {
    if (typeof window.Hands !== 'undefined' && typeof window.FaceMesh !== 'undefined') {
      // Initialize Hands
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      // Initialize FaceMesh
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false, // Disable refinement for better performance
        minDetectionConfidence: 0.3, // Lower threshold for better detection
        minTrackingConfidence: 0.3
      });

      let currentHandResults = null;
      let currentFaceResults = null;
      let lastHandTime = 0;
      let lastFaceTime = 0;

      // fires each time you get a new hand result
      const processFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas || !videoRef.current) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Always draw the current video frame
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        let nailBiting = false;
        let mouthPosition = null;

        // Get mouth position from face results if available
        if (currentFaceResults?.multiFaceLandmarks?.length) {
          const lm = currentFaceResults.multiFaceLandmarks[0];
          mouthPosition = {
            x: (lm[13].x + lm[14].x) / 2,
            y: (lm[13].y + lm[14].y) / 2,
            z: (lm[13].z + lm[14].z) / 2
          };
          lastMouthRef.current = mouthPosition;
        } else {
          mouthPosition = lastMouthRef.current;
        }

        if (mouthPosition) {
          ctx.fillStyle = 'blue';
          ctx.beginPath();
          ctx.arc(mouthPosition.x * canvas.width,
                  mouthPosition.y * canvas.height,
                  5, 0, 2*Math.PI);
          ctx.fill();
        }


        // Check for nail biting if we have hand detection and mouth position
        if (currentHandResults && currentHandResults.multiHandLandmarks && mouthPosition) {
          for (const handLandmarks of currentHandResults.multiHandLandmarks) {
            const fingerTips = [4, 8, 12, 16, 20];
            
            for (const tipIndex of fingerTips) {
              const fingerTip = handLandmarks[tipIndex];
              const distance = euclideanDistance3D(fingerTip, mouthPosition);

              const tipX = fingerTip.x * canvas.width;
              const tipY = fingerTip.y * canvas.height;
              ctx.fillStyle = 'green';
              ctx.beginPath();
              ctx.arc(tipX, tipY, 5, 0, 2*Math.PI);
              ctx.fill();

              if (tipIndex == 8){
                console.log(distance)
              }
              
              if (distance < 0.03) { // Adjust threshold as needed
                nailBiting = true;
                break;
              }
            }
            
            if (nailBiting) break;
          }
        }
        
        setNailBitingDetected(nailBiting);
      };

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
        video: { width: 640, height: 480 } 
      });
      
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        
        if (typeof window.Camera !== 'undefined') {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              const now = performance.now();

              if (now - lastHandTime > 33) {
                await hands.send({ image: videoRef.current })
                lastHandTime = now;
              }
              if ( now - lastFaceTime > 100) {
                await faceMesh.send({ image: videoRef.current})
                lastFaceTime = now
              }
            },
            width: 640,
            height: 480
          });
          
          camera.start();
        }
      };
    }
  };

  const euclideanDistance3D = (p1, p2) => {
    // if either point is missing a z, fall back to 2D
    if (p1.z == null || p2.z == null) {
      return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
    return Math.sqrt(
      (p1.x - p2.x) ** 2 +
      (p1.y - p2.y) ** 2 +
      (p1.z - p2.z) ** 2
    );
  };


  return (
    <div className="relative">
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
        className="block"
      />
      
      {nailBitingDetected && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded text-center font-bold">
          Nail biting event
        </div>
      )}
    </div>
  );
};

export default NailBiteDetector;