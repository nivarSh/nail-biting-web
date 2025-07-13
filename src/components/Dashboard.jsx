import React, { useState, useMemo } from 'react'
import LiveUpdates from './LiveUpdates'
import StaticUpdates from './StaticUpdates'

function Dashboard({ data, logs }) {

    // console.count('Dashboard Render')

    return (
        <div id="dashboard" className="flex flex-col-reverse gap-1 gap-5 w-full lg:w-1/3 rounded-xl shadow-xl p-5 dashboard text-left lg:flex-col"> 
            <StaticUpdates logs={logs} />
            <LiveUpdates data={data} />
        </div>
    )
}

export default React.memo(Dashboard);