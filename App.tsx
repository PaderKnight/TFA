
import React, { useState, useCallback } from 'react';
import { LayoutDashboard, Table, Network, Upload, BrainCircuit, X, Loader2, PanelLeftOpen, PanelLeftClose, Settings } from 'lucide-react';
import { AnalysisState, ViewMode } from './types';
import { analyzeSystem } from './services/geminiService';
import { InteractionMatrix } from './components/InteractionMatrix';
import { FunctionTable } from './components/FunctionTable';
import { FunctionGraph } from './components/FunctionGraph';
import { AnalysisReasoning } from './components/AnalysisReasoning';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.SETUP);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [state, setState] = useState<AnalysisState>({
    image: null,
    rawComponentList: '',
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setState(prev => ({ ...prev, image: null }));
  };

  const handleAnalysis = useCallback(async () => {
    if (!state.image || !state.rawComponentList.trim()) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const result = await analyzeSystem(state.image, state.rawComponentList);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        result,
      }));
      // Default to GRAPH view and Open Sidebar
      setCurrentView(ViewMode.GRAPH);
      setShowSidebar(true);
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err.message || "未知错误" 
      }));
    }
  }, [state.image, state.rawComponentList]);

  const renderContent = () => {
    if (state.isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">正在进行智能分析...</h2>
          <p className="text-slate-500 mt-2">AI 正在识别组件、补充超系统要素并分析相互作用。</p>
        </div>
      );
    }

    if (!state.result && currentView !== ViewMode.SETUP) {
      return (
        <div className="text-center py-20">
            <p className="text-slate-500">暂无分析数据，请返回设置页面。</p>
            <button 
                onClick={() => setCurrentView(ViewMode.SETUP)}
                className="mt-4 text-blue-600 underline"
            >
                返回设置
            </button>
        </div>
      );
    }

    switch (currentView) {
      case ViewMode.SETUP:
        return (
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BrainCircuit className="text-blue-600" />
                  系统配置 (System Configuration)
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  上传系统图像并列出核心组件，AI 将自动补充环境要素（超系统）并生成功能模型。
                </p>
              </div>
              
              <div className="p-8 grid md:grid-cols-2 gap-8">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">系统图像 / 图纸</label>
                  <div className={`relative border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center transition-all ${state.image ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'}`}>
                    {state.image ? (
                      <>
                        <img src={state.image} alt="System" className="h-full w-full object-contain rounded p-2" />
                        <button 
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md text-slate-600 hover:text-red-600 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 mb-2">点击或拖拽上传图片</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Component List Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">核心组件列表 (用逗号分隔)</label>
                  <textarea
                    className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-slate-700"
                    placeholder="例如：钉子, 锤子, 木板..."
                    value={state.rawComponentList}
                    onChange={(e) => setState(prev => ({ ...prev, rawComponentList: e.target.value }))}
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p className="font-semibold mb-1">提示：</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>只需列出核心物理组件</li>
                      <li>AI 会自动补充空气、重力等超系统环境</li>
                      <li>图片越清晰，分析越准确</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleAnalysis}
                    disabled={!state.image || !state.rawComponentList.trim() || state.isAnalyzing}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
                      ${(!state.image || !state.rawComponentList.trim() || state.isAnalyzing) 
                        ? 'bg-slate-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:transform active:scale-95'}`}
                  >
                    {state.isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-5 h-5" />
                        开始功能分析
                      </>
                    )}
                  </button>
                </div>
              </div>

              {state.error && (
                <div className="bg-red-50 text-red-700 p-4 border-t border-red-100 text-center text-sm">
                  {state.error}
                </div>
              )}
            </div>
          </div>
        );
      case ViewMode.MATRIX:
        return <InteractionMatrix data={state.result!} />;
      case ViewMode.TABLE:
        return <FunctionTable data={state.result!} />;
      case ViewMode.GRAPH:
        return <FunctionGraph data={state.result!} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden md:block">TRIZ Function Analyzer</h1>
        </div>

        {/* View Switcher - Only visible when results exist */}
        {state.result && !state.isAnalyzing && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setCurrentView(ViewMode.SETUP)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === ViewMode.SETUP ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
             >
                <Settings size={16} />
                <span className="hidden sm:inline">配置</span>
             </button>
             <button 
                onClick={() => setCurrentView(ViewMode.MATRIX)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === ViewMode.MATRIX ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
             >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">矩阵</span>
             </button>
             <button 
                onClick={() => setCurrentView(ViewMode.TABLE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === ViewMode.TABLE ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
             >
                <Table size={16} />
                <span className="hidden sm:inline">表格</span>
             </button>
             <button 
                onClick={() => setCurrentView(ViewMode.GRAPH)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === ViewMode.GRAPH ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
             >
                <Network size={16} />
                <span className="hidden sm:inline">模型图</span>
             </button>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
            {state.result && !state.isAnalyzing && (
                <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`p-2 rounded-md transition-colors ${showSidebar ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                    title={showSidebar ? "隐藏思考过程" : "显示思考过程"}
                >
                   {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                </button>
            )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar - Reasoning */}
        {state.result && showSidebar && !state.isAnalyzing && (
            <aside className="w-80 bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col transition-all duration-300 h-full">
                <AnalysisReasoning reasoning={state.result.reasoning} />
            </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 relative bg-slate-50/50">
           {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
