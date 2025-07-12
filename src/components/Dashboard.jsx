import React, { useState, useMemo } from 'react'
import LiveUpdates from './LiveUpdates'
import StaticUpdates from './StaticUpdates'

function Dashboard({ data, logs }) {

    console.count('Dashboard Render')

    return (
        <div id="dashboard" className="flex flex-col gap-5 w-xs rounded-xl shadow-xl p-5 dashboard text-left">
            <StaticUpdates logs={logs} />
            <LiveUpdates data={data} />
        </div>
    )
}

export default React.memo(Dashboard);