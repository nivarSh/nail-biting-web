

export default function Dropdown ({ onSelect, selectedWindow }) {

    const options = [5, 30, 60]

    return (
        <div className="flex justify-between mb-4">
            {options.map(option => (
                    <button
                    key={option} 
                    onClick={() => onSelect(option)} 
                    className={`${
                        option === selectedWindow 
                        ? 'bg-green-400 text-black'
                        : 'bg-[#2a2a2a]'
                    }`}>
                        {option} min
                    </button>
                )
            )}
        </div>
    )
}