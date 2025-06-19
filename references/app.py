# Import packages
# cv2: OpenCV library, gives access to webcam
# mediapipe: machine learning library that tracks hands and facial data
# math: library to calculate square root

import cv2
import mediapipe as mp
import math

# Initialize mediapipe hands and face detection
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.7)

# Function to calculate the Euclidean distance between two points
def euclidean_distance(point1, point2):
    return math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)

# Start capturing video
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

# The forever loop that is constantly checking if the user is biting their nails
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Convert the BGR image to RGB
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the image for hands and face landmarks
    hand_results = hands.process(img_rgb)
    face_results = face_mesh.process(img_rgb)

    # Draw the face landmarks
    if face_results.multi_face_landmarks:
        for face_landmarks in face_results.multi_face_landmarks:
            mp_drawing.draw_landmarks(frame, face_landmarks, mp_face_mesh.FACEMESH_TESSELATION)

            # Extract the mouth coordinates (example using landmark 13 and 14 since they are related to the mouth
            mouth_bottom = [face_landmarks.landmark[13].x * frame.shape[1], face_landmarks.landmark[13].y * frame.shape[0]]
            # mouth_top = [face_landmarks.landmark[14].x * frame.shape[1], face_landmarks.landmark[14].y * frame.shape[0]]

    # Draw the hand landmarks
    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # List of fingertip landmarks
            fingertip_landmarks = [
                mp_hands.HandLandmark.THUMB_TIP,
                mp_hands.HandLandmark.INDEX_FINGER_TIP,
                mp_hands.HandLandmark.MIDDLE_FINGER_TIP,
                mp_hands.HandLandmark.RING_FINGER_TIP,
                mp_hands.HandLandmark.PINKY_TIP
            ]

            for fingertip in fingertip_landmarks:
                # Get the fingertip coordinates
                    fingertip_coords = [
                    hand_landmarks.landmark[fingertip].x * frame.shape[1],
                    hand_landmarks.landmark[fingertip].y * frame.shape[0]
                ]
                    # Calculate distance between index finger tip and mouth
                    distance_to_mouth = euclidean_distance(fingertip_coords, mouth_bottom)

                    # threshold distance can be changed based on effectiveness
                    threshold_distance = 50

                    if distance_to_mouth < threshold_distance:
                        cv2.putText(frame, "Nail Biting Detected!", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    # Display the resulting frame
    cv2.imshow('Webcam Feed', frame)

    # Break loop on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()