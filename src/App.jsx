import { useState } from 'react'
import './App.css'
import NailDetector from './components/NailDetector'
import NailDetectorSimple from './components/NailDetectorSimple'
import Simple from './components/simple_example'

function App() {

  return (
    <>
      <h1 className="text-green-500 mb-1">Nail Biting</h1>
      <div className="">
        <p>Say goodbye to your bad nail-biting habit!</p>
      </div>
      <Simple />
    </>
  )
}

export default App
