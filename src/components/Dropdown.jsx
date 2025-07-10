import { useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons'

export default function Dropdown ({ onSelect, selectedWindow }) {
  const [dropdownActive, setDropdownActive] = useState(false)
  const options = [5, 30, 60]

  const handleDropdown = option => {
    setDropdownActive(false)
    onSelect(option)
  }

  return (
    <div className="relative inline-block mb-4">
      {/* Toggle */}
      <button
        type="button"
        className="w-full bg-green-400 text-black flex gap-2 justify-between items-center"
        onClick={() => setDropdownActive(v => !v)}
        aria-haspopup="menu"
        aria-expanded={dropdownActive}
      >
        <span>{selectedWindow} min</span>
        <FontAwesomeIcon
          icon={dropdownActive ? faCaretUp : faCaretDown}
          size="md"
        />
      </button>

      {/* Menu: always rendered, but fades & blocks clicks when closed */}
      <div
        className={`
          absolute flex flex-col gap-2 top-full left-0 w-full mt-2 flex flex-col z-10
          bg-[#2a2a2a] rounded-md overflow-hidden
          transition-opacity duration-200 ease-in-out transform origin-top
          ${dropdownActive
            ? 'opacity-100 scale-y-100 visible pointer-events-auto'
            : 'opacity-0 scale-y-95 invisible pointer-events-none'}
        `}
        role="menu"
      >
        {options
          .filter(o => o !== selectedWindow)
          .map(option => (
            <button
              key={option}
              type="button"
              role="menuitem"
              className="w-full px-4 py-2"
              onClick={() => handleDropdown(option)}
            >
              {option} min
            </button>
          ))
        }
      </div>
    </div>
  )
}
