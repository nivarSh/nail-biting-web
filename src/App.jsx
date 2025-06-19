import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NailDetector from './components/NailDetector'

function App() {

  return (
    <>
      <h1 className="text-green-500 mb-1">Nail Biting</h1>
      <div className="">
        <p>Say goodbye to your bad nail-biting habit!</p>
      </div>
      <NailDetector />
    </>
  )
}

export default App
