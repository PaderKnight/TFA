
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Maximize, ZoomIn } from 'lucide-react';
import { AnalysisResult, FunctionGrade, FunctionType } from '../types';

interface FunctionGraphProps {
  data: AnalysisResult;
}

export const FunctionGraph: React.FC<FunctionGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // Function to calculate bounds and zoom to fit
  const handleZoomToFit = () => {
    if (!svgRef.current || !gRef.current || !zoomRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = gRef.current;
    
    // Get the bounding box of the content
    const bounds = (g.node() as SVGGraphicsElement).getBBox();
    
    if (bounds.width === 0 || bounds.height === 0) return;

    const parentWidth = containerRef.current.clientWidth;
    const parentHeight = containerRef.current.clientHeight;
    const padding = 40;

    const scaleX = (parentWidth - padding * 2) / bounds.width;
    const scaleY = (parentHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1.5);

    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const translateX = parentWidth / 2 - scale * midX;
    const translateY = parentHeight / 2 - scale * midY;

    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform as any, 
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  };

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    
    // Initial Setup
    const setupGraph = (width: number, height: number) => {
      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);
      
      svg.selectAll("*").remove();

      // 1. Setup Zoom
      const g = svg.append("g");
      gRef.current = g;

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });
      
      zoomRef.current = zoom;
      svg.call(zoom).on("dblclick.zoom", null);

      // 2. Define Arrow Markers
      const defs = svg.append("defs");

      defs.append("marker")
        .attr("id", "arrow-useful")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25) 
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#2563eb")
        .attr("d", "M0,-5L10,0L0,5");

      defs.append("marker")
        .attr("id", "arrow-harmful")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#dc2626")
        .attr("d", "M0,-5L10,0L0,5");

      // 3. Prepare Data
      const nodes = data.components.map(id => ({ id }));
      const links = data.functions.map(fn => ({
        source: fn.subject,
        target: fn.object,
        type: fn.type,
        grade: fn.grade,
        action: fn.action
      }));

      // 4. Simulation
      const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(60));

      // 5. Draw Links
      const linkGroup = g.append("g").attr("class", "links");
      
      const link = linkGroup.selectAll("path")
        .data(links)
        .join("path")
        .attr("fill", "none")
        .attr("stroke-width", (d) => d.grade === FunctionGrade.EXCESSIVE ? 4 : 2)
        .attr("stroke", (d) => d.type === FunctionType.HARMFUL ? "#dc2626" : "#2563eb")
        .attr("stroke-dasharray", (d) => {
          if (d.type === FunctionType.HARMFUL) return "0"; 
          if (d.grade === FunctionGrade.INSUFFICIENT) return "8,4";
          return "0";
        })
        .attr("marker-end", (d) => `url(#arrow-${d.type === FunctionType.HARMFUL ? 'harmful' : 'useful'})`);

      const linkLabel = g.append("g")
        .selectAll("text")
        .data(links)
        .join("text")
        .text(d => d.action)
        .attr("font-size", "11px")
        .attr("font-family", "sans-serif")
        .attr("fill", "#475569")
        .attr("text-anchor", "middle")
        .attr("dy", -5)
        .style("background", "white")
        .style("pointer-events", "none");

      // 7. Draw Nodes
      const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation) as any);

      node.append("rect")
        .attr("width", 110)
        .attr("height", 44)
        .attr("x", -55)
        .attr("y", -22)
        .attr("rx", 6)
        .attr("fill", "white")
        .attr("stroke", "#334155")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(3px 3px 2px rgba(0,0,0,0.1))");

      node.append("text")
        .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("dy", 5)
        .attr("font-size", "13px")
        .attr("font-weight", "bold")
        .attr("fill", "#1e293b")
        .each(function(d) {
            const self = d3.select(this);
            if (d.id.length > 8) {
                self.text(d.id.substring(0, 7) + "...");
            }
        });

      // 8. Update positions
      simulation.on("tick", () => {
          link.attr("d", (d: any) => {
              const dx = d.target.x - d.source.x;
              const dy = d.target.y - d.source.y;
              const dr = Math.sqrt(dx * dx + dy * dy); 
              return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
          });

          linkLabel
              .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
              .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

          node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      // Auto-fit after simulation settles
      setTimeout(() => {
          handleZoomToFit();
      }, 1000);

      return simulation;
    };

    // Initial draw
    let simulation = setupGraph(container.clientWidth, container.clientHeight);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
           simulation.stop();
           simulation = setupGraph(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      simulation.stop();
      resizeObserver.disconnect();
    };
  }, [data]);

  // Drag behavior helper
  function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <span className="bg-emerald-600 w-2 h-6 mr-2 rounded-sm"></span>
            功能模型图 (图形化)
        </h2>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs mb-4 p-3 bg-slate-50 rounded border border-slate-200 flex-shrink-0">
        <div className="flex items-center">
            <span className="w-8 h-0.5 bg-blue-600 mr-2"></span>有用功能 (正常)
        </div>
        <div className="flex items-center">
            <span className="w-8 h-0 border-t-2 border-dashed border-blue-600 mr-2"></span>有用功能 (不足)
        </div>
        <div className="flex items-center">
            <span className="w-8 h-1 bg-blue-600 mr-2"></span>有用功能 (过剩)
        </div>
        <div className="flex items-center">
            <span className="w-8 h-0.5 bg-red-600 mr-2"></span>有害功能
        </div>
        <span className="text-slate-400 ml-auto flex items-center gap-1">
             <ZoomIn size={12}/> 滚轮缩放 / 拖拽平移
        </span>
      </div>

      <div ref={containerRef} className="flex-grow border border-slate-100 rounded-lg bg-slate-50 relative overflow-hidden h-full min-h-[400px]">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing block"></svg>

        {/* Floating Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button 
                onClick={handleZoomToFit}
                className="bg-white p-2 rounded-full shadow-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="自动适配视图 (Fit View)"
            >
                <Maximize size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
