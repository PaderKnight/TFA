
import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

interface AnalysisReasoningProps {
  reasoning: string;
}

export const AnalysisReasoning: React.FC<AnalysisReasoningProps> = ({ reasoning }) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="text-base font-bold text-slate-800 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
          AI 思考过程 (Chain of Thought)
        </h3>
        <p className="text-xs text-slate-500 mt-1 pl-6">
          基于 TRIZ 逻辑的逐步推演路径
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="prose prose-sm prose-slate max-w-none">
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded border border-slate-100">
            {reasoning}
          </div>
        </div>
        
        <div className="mt-6 flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <Bot className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-800">
            <p className="font-semibold mb-1">AI 分析完成</p>
            上述推理过程已被转换为右侧的结构化模型。您可以切换视图查看具体矩阵或图表。
          </div>
        </div>
      </div>
    </div>
  );
};
