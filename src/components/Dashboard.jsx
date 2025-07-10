import React, { useState, useMemo } from 'react'
import Dropdown from './Dropdown'
import HandPieChart from './HandPieChart'
import EventLineGraph from './EventLineGraph'

function Dashboard({ data, logs }) {

    console.count('Dashboard Render')

    const { detectionHistory = [] } = data || {}

    const [selectedWindow, setSelectedWindow] = useState(5);

    // compute hitRate on every change to data.detectionHistory
    const hitRate = useMemo(() => {
        if (!detectionHistory.length) return 0
        const positives = detectionHistory.filter(Boolean).length
        return positives / detectionHistory.length
    }, [detectionHistory])

    // compute the count whenever either logs or selectedWindow changes
    const recentLogs = useMemo(() => {
        const cutoff = Date.now() - selectedWindow * 60 * 1000
        const filteredLogs = logs.filter(evt => evt.timestamp >= cutoff)
        return filteredLogs
    }, [logs, selectedWindow])

    return (
        <div id="dashboard" className="flex flex-col gap-5 w-xs rounded-xl shadow-xl p-5 dashboard text-left">
            <div className="flex justify-between px-3">
                <div className="">
                    <p className="text-lg text-gray-500">Attempts</p>
                    <h3 className="text-green-400 font-bold text-6xl">{recentLogs.length}</h3>
                </div>
                 <div className="flex flex-col align-right">
                    <p className="text-lg text-gray-500 mb-2">Time Interval</p>
                    <Dropdown onSelect={setSelectedWindow} selectedWindow={selectedWindow} />
                </div>
            </div>
            <HandPieChart logs={recentLogs} />
            <EventLineGraph logs={recentLogs} />
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
        </div>
    )
}

export default React.memo(Dashboard);