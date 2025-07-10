import { useState, useEffect } from 'react'
import './App.css'
import NailDetector from './components/NailDetector'
import Dashboard from './components/Dashboard'

function App() {

  // Lift state up from NailDetector into Dashboard. useRef Object
  const [detectionData, setDetectionData] = useState({
    detectionHistory: [],
    windowSize: 30,               // frames
    confidenceThreshold: 0.4,
  })

  // Have a timestamp into localStorage of the nailbiting events

  // 1. lazy‐load any existing timestamps
  const [eventLogs, setEventLogs] = useState(() => {
      const raw = localStorage.getItem('nailLogs')
      return raw ? JSON.parse(raw) : []
  })

  // 2. write back whenever it changes
  useEffect(() => {
    localStorage.setItem('nailLogs', JSON.stringify(eventLogs))
  }, [eventLogs])

  const maxSize = 60 * 60 * 1000  // 60 minutes

  // 3. callback you hand to your detector
  const handleDetection = (e) => {
    setEventLogs(prev => {
      // drop old events outside your window
      const cutoff = Date.now() - maxSize
      const filtered = prev.filter(t => t.timestamp >= cutoff)
      return [...filtered, e]
    })
  }



  return (
    <>
      <div className="mb-4 text-center text-sm text-gray-600">
        <p>Red dots: Fingertips • Blue dot: Mouth center</p>
        <p>Keep your hands and face visible for best detection.</p>
      </div>
      <div className="flex gap-4 items-center h-[580px]">
        <NailDetector onUpdate={setDetectionData} onDetection={handleDetection} />
        <Dashboard data={detectionData} logs={eventLogs} />
      </div>
    </>
  )
}

export default App
