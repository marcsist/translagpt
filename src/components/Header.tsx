import React from 'react'
import { Menu, Plus } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <button className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-md font-medium text-gray-800">Spaces Inc. / Portal</h1>
      </div>
      <div className="flex items-center">
        <button className="bg-neutral-100 text-black px-3 py-2 rounded-lg text-sm font-medium flex items-center mr-4">
          <Plus className="w-4 h-4 mr-1" /> New session
        </button>
        <img src="https://i.pravatar.cc/40" alt="User Avatar" className="w-8 h-8 rounded-lg" />
      </div>
    </header>
  )
}

export default Header