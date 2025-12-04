import React from 'react';
import { AnalysisResult } from '../types';

interface InteractionMatrixProps {
  data: AnalysisResult;
}

export const InteractionMatrix: React.FC<InteractionMatrixProps> = ({ data }) => {
  const { components, functions } = data;

  // Create a map for quick lookup: Subject -> Object -> Interaction Details
  const interactionMap = new Map<string, Map<string, string>>();

  functions.forEach((fn) => {
    if (!interactionMap.has(fn.subject)) {
      interactionMap.set(fn.subject, new Map());
    }
    // We append actions if there are multiple interactions between same subject/object
    const existing = interactionMap.get(fn.subject)!.get(fn.object);
    const newVal = existing ? `${existing}, ${fn.action}` : fn.action;
    interactionMap.get(fn.subject)!.set(fn.object, newVal);
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <span className="bg-blue-600 w-2 h-6 mr-2 rounded-sm"></span>
        相互作用分析矩阵 (Interaction Matrix)
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-3 border border-slate-300 bg-slate-100 text-left min-w-[150px]">
                主体 (Subject) \ 客体 (Object)
              </th>
              {components.map((comp) => (
                <th key={comp} className="p-3 border border-slate-300 bg-slate-50 min-w-[100px] font-semibold text-slate-700 whitespace-nowrap">
                  {comp}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {components.map((subject) => (
              <tr key={subject}>
                <td className="p-3 border border-slate-300 bg-slate-50 font-semibold text-slate-700 whitespace-nowrap">
                  {subject}
                </td>
                {components.map((object) => {
                  const isDiagonal = subject === object;
                  const interaction = interactionMap.get(subject)?.get(object);

                  return (
                    <td 
                      key={`${subject}-${object}`} 
                      className={`p-3 border border-slate-300 text-center ${isDiagonal ? 'bg-slate-200' : 'bg-white'}`}
                      title={interaction ? `${subject} -> ${interaction} -> ${object}` : ''}
                    >
                      {isDiagonal ? (
                        <span className="text-slate-400">-</span>
                      ) : interaction ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 font-bold text-xs mb-1">
                            +
                          </span>
                          {/* Optional: Show action text in small font if needed, otherwise tooltip */}
                        </div>
                      ) : (
                        <span className="text-slate-300"></span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-slate-500">
        * 行代表主体 (Function Carrier)，列代表客体 (Function Receiver)。(+) 表示存在相互作用。
      </div>
    </div>
  );
};