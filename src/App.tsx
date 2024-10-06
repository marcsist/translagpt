import React from 'react'
import Header from './components/Header'
import TranslationInterface from './components/TranslationInterface'

function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <TranslationInterface />
    </div>
  )
}

export default App