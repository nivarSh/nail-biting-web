import { useMemo } from 'react'

export default function LiveUpdates ({ data }) {

    const { detectionHistory = [] } = data || {}

    // compute hitRate on every change to data.detectionHistory
    const hitRate = useMemo(() => {
        if (!detectionHistory.length) return 0
        const positives = detectionHistory.filter(Boolean).length
        return positives / detectionHistory.length
    }, [detectionHistory])

    return (
    <div className="w-full bg-[#2a2a2a] rounded-lg shadow-lg p-4">
        <div className="text-gray-500">
        
            {/* Debug info */}
            { data && (
            <div className="text-sm">
                <div>Recent positives: {detectionHistory.filter(d => d).length}
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Recent Positives</span>
                        <span className="text-green-400">{(hitRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-400 rounded overflow-hidden">
                        <div
                        className="h-full bg-green-400 transition-all duration-300 ease-out"
                        style={{ width: `${hitRate * 100}%` }}
                        />
                    </div>
                </div>
            </div>
            )}
        </div>
    </div>
    )
}