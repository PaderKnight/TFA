import React from 'react';
import { AnalysisResult, FunctionGrade, FunctionType } from '../types';

interface FunctionTableProps {
  data: AnalysisResult;
}

export const FunctionTable: React.FC<FunctionTableProps> = ({ data }) => {
  
  // Translation Maps
  const typeMap: Record<string, string> = {
    [FunctionType.USEFUL]: '有用功能',
    [FunctionType.HARMFUL]: '有害功能',
  };

  const gradeMap: Record<string, string> = {
    [FunctionGrade.NORMAL]: '正常',
    [FunctionGrade.INSUFFICIENT]: '不足',
    [FunctionGrade.EXCESSIVE]: '过剩',
  };

  const getBadgeColor = (type: FunctionType, grade: FunctionGrade) => {
    if (type === FunctionType.HARMFUL) return "bg-red-100 text-red-700 border-red-200";
    if (grade === FunctionGrade.INSUFFICIENT) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (grade === FunctionGrade.EXCESSIVE) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <span className="bg-indigo-600 w-2 h-6 mr-2 rounded-sm"></span>
        功能建模表 (Function Modeling Table)
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 border-b border-slate-200">主体 (Subject)</th>
              <th scope="col" className="px-6 py-3 border-b border-slate-200">作用 (Action)</th>
              <th scope="col" className="px-6 py-3 border-b border-slate-200">客体 (Object)</th>
              <th scope="col" className="px-6 py-3 border-b border-slate-200">功能类型</th>
              <th scope="col" className="px-6 py-3 border-b border-slate-200">性能等级</th>
            </tr>
          </thead>
          <tbody>
            {data.functions.map((fn) => (
              <tr key={fn.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{fn.subject}</td>
                <td className="px-6 py-4 text-slate-600 italic">{fn.action}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{fn.object}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded border text-xs font-medium ${fn.type === FunctionType.HARMFUL ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                    {typeMap[fn.type] || fn.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded border text-xs font-medium ${getBadgeColor(fn.type, fn.grade)}`}>
                    {gradeMap[fn.grade] || fn.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.functions.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          尚未识别出功能。
        </div>
      )}
    </div>
  );
};