import { CheckCircle2, Download, Edit, Eye, Plus } from "lucide-react";
import { PatientInfoCardProps, ReportsHistoryProps } from "../types";


export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  name,
  type,
  breed,
  image,
  sex,
  age,
  gender,
}) => {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden shadow-sm border border-gray-200">
      <div className="relative h-64">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">{name}</h2>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-400 border border-gray-300">
              {type} - {breed}
            </span>
          </div>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center ">
            <Edit size={18} className="text-primary hover:text-primary/60" />
          </button>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-2 text-sm">
            <p className="font-semibold text-gray-600 mb-1">Sex</p>
            <p className="px-4 rounded-lg text-gray-400 border border-gray-200">{sex}</p>
          </div>
          <div className="flex gap-2 text-sm">
            <p className="font-semibold text-gray-600 mb-1">Age</p>
            <p className="px-4 rounded-lg text-gray-400 border border-gray-200">{age}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reports History Component
export const ReportsHistory: React.FC<ReportsHistoryProps> = ({ petName, reports }) => {
  return (
    <div className="mx-4 mt-6 rounded-3xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 ">Reports History</h3>
        </div>
        <button className="px-4 py-1 bg-primary text-white font-semibold flex items-center gap-2 hover:bg-blue-700 rounded-md">
          <Plus size={18} />
          New Test
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2 w-45">
        View all reports associated with {petName}.
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-500">Date</span>
          <span className="text-sm font-semibold text-gray-500">Status</span>
          <span className="text-sm font-semibold text-gray-500">Actions</span>
        </div>

        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center justify-between border-b border-gray-100 last:border-b-0"
          >
            <span className="text-gray-700 font-light text-sm">{report.date}</span>
            <span
              className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-primary`}
            >
              {report.status === 'signed' && (
                <CheckCircle2 size={16} className="text-green-600" />
              )}
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
            <div className="flex items-center gap-2">
              <button className="">
                <Eye size={16} className="text-gray-600" />
              </button>
              <button className="">
                <Download size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};