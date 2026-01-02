import { CalendarRange, Download } from 'lucide-react'
import React from 'react'
import AttendanceChart from '../AttendanceChart'

function Progress() {
    return (
        <div className="mx-4 mt-4">
            <div className="mb-3 bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-800">Parameter Progress</h3>
                        <p className="text-xs text-gray-500">Track test results over time.</p>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                    <button className="px-3 py-1 border border-gray-300 bg-gray-100 rounded-lg text-xs flex items-center gap-2 text-gray-400 whitespace-nowrap">
                        <CalendarRange size={14} />
                        15 Jan, 2024 - 20 May, 2024
                    </button>
                    <div className="flex items-center gap-2 text-xs">
                        <button className="">Graph</button>
                        <button className="text-gray-500">Table</button>
                    </div>
                </div>
            </div>

            <div className=" bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">Leukocytes</h4>
                        <p className="text-xs text-gray-500">Normal: Negative</p>
                    </div>
                    <button className="px-3 py-1 border border-gray-300 rounded-lg text-xs flex items-center gap-2 bg-gray-100">
                        <Download size={14} />
                        Export
                    </button>
                </div>
                <AttendanceChart
                    months={["Jan", "Feb", "Mar", "Apr", "May"]}
                    dogs={[20, 75, 40, 95, 45]}
                    showLegend={false}
                    showCounters={false}
                    hideHeader={true}
                    yTickStep={10}
                    ySuffix="%"
                    hRef={90}
                    vRefIndex={2}
                    interactive={true}
                    dogsLabel="Leukocytes"
                />
            </div>

            <div className=" bg-white rounded-2xl p-4 border border-gray-200 mt-3">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">Leukocytes</h4>
                        <p className="text-xs text-gray-500">Normal: Negative</p>
                    </div>
                    <button className="px-3 py-1 border border-gray-300 rounded-lg text-xs flex items-center gap-2 bg-gray-100">
                        <Download size={14} />
                        Export
                    </button>
                </div>
                <AttendanceChart
                    months={["Jan", "Feb", "Mar", "Apr", "May"]}
                    dogs={[20, 75, 40, 95, 45]}
                    showLegend={false}
                    showCounters={false}
                    hideHeader={true}
                    yTickStep={10}
                    ySuffix="%"
                    hRef={90}
                    vRefIndex={2}
                    interactive={true}
                    dogsLabel="Leukocytes"
                />
            </div>
        </div>
    )
}

export default Progress
