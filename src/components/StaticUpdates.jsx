import React, { useMemo, useState } from 'react'
import Dropdown from './Dropdown'
import HandPieChart from './HandPieChart'
import EventLineGraph from './EventLineGraph'

function StaticUpdates ({ logs }) {

    const [selectedWindow, setSelectedWindow] = useState(5);

    const recentLogs = useMemo(() => {
        const cutoff = Date.now() - selectedWindow * 60 * 1000
        const filteredLogs = logs.filter(evt => evt.timestamp >= cutoff)
        return filteredLogs
    }, [logs, selectedWindow])


    return (
        <div className="">
            <div className="flex justify-between px-3 ">
                <div className="">
                    <p className=" text-md lg:text-lg text-gray-500 mb-2 lg:mb-0">Attempts</p>
                    <h3 className="text-green-400 font-bold text-5xl lg:text-6xl">{recentLogs.length}</h3>
                </div>
                    <div className="flex flex-col align-right">
                    <p className="text-sm lg:text-lg  text-gray-500 mb-4 lg:mb-2 text-right">Time Interval</p>
                    <Dropdown onSelect={setSelectedWindow} selectedWindow={selectedWindow} />
                </div>
            </div>
            <div className="flex flex-col sm:gap-2">
                <HandPieChart logs={recentLogs} />
                <EventLineGraph logs={recentLogs} />
            </div>
        </div>
    )

}

export default React.memo(StaticUpdates)