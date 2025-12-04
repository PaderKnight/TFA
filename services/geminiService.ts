
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FunctionGrade, FunctionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSystem = async (
  imageBase64: string,
  componentsList: string
): Promise<AnalysisResult> => {
  
  const systemInstruction = `
    你是一位精通TRIZ（发明问题解决理论）的专家，专注于功能分析（Function Analysis）。
    你的任务是根据系统图像和用户提供的基础组件列表，进行深入的功能模型分析。

    请遵循以下思维链（Chain of Thought）步骤进行思考，并将思考过程详细记录在返回结果的 'reasoning' 字段中：

    1. **组件识别与超系统补充 (Critical Step)**: 
       - 首先确认用户提供的组件。
       - **必须**识别并补充图像中隐含的“超系统组件”（Super-system components）。这些通常是环境要素，如：空气 (Air)、重力 (Gravity)、地面 (Floor/Ground)、墙壁 (Wall)、灰尘 (Dust)、外力/手 (Hand/User)、光线 (Light)、水分 (Moisture) 等。
       - 只要超系统组件与系统组件存在物理接触或作用，就必须将其纳入分析列表。

    2. **相互作用分析**:
       - 仔细观察图像中的物理连接和逻辑关系。
       - 遍历所有组件（包括新补充的超系统组件）之间的两两关系。
       - 排除不直接接触或没有实质功能关系的组合。

    3. **功能定义**:
       - 对于每一对有相互作用的组件，定义功能语句。
       - 格式：主体 (Subject) + 作用 (Action) + 客体 (Object)。
       - **注意**：Action (作用) 必须是一个动词，使用**中文**描述（例如：支撑、加热、包含、移动、腐蚀、引导）。
       - **关键约束**：Subject 和 Object 必须严格存在于组件列表中。

    4. **分类与评估**:
       - 功能类型 (type): 判断是 'Useful' (有用) 还是 'Harmful' (有害)。
       - 性能等级 (grade): 
         - 'Normal' (正常): 功能满足需求。
         - 'Insufficient' (不足): 功能存在但不够强（例如：冷却不足）。
         - 'Excessive' (过剩): 功能过强或资源浪费（例如：加热过度）。

    请严格返回符合 Schema 的 JSON 数据。'reasoning' 字段包含你的详细分析步骤文本，'components' 和 'functions' 包含结构化数据。
  `;

  const prompt = `
    用户提供的基础组件列表: ${componentsList}
    
    请分析该系统。请务必补充遗漏的超系统组件（如环境、重力等），并分析它们与组件之间的相互作用。
    在 'reasoning' 字段中，请用中文详细写出你的分析步骤，类似于：
    "第一步：识别组件...
     第二步：发现超系统元素...添加了空气、重力...
     第三步：分析相互作用...发现锤子击打钉子...
     第四步：..."
  `;

  // Clean base64 string if it contains metadata header
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG/JPEG, API is flexible
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: {
              type: Type.STRING,
              description: "详细的分析思考过程，包含步骤1到4的自然语言描述。",
            },
            components: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "最终的组件列表，必须包含用户提供的组件以及AI识别出的超系统组件（全部用中文）。",
            },
            functions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING, description: "功能的主体 (中文)" },
                  action: { type: Type.STRING, description: "具体的动作动词 (中文)" },
                  object: { type: Type.STRING, description: "功能的客体 (中文)" },
                  type: { type: Type.STRING, enum: ["Useful", "Harmful"], description: "必须返回英文枚举值" },
                  grade: { type: Type.STRING, enum: ["Normal", "Insufficient", "Excessive"], description: "必须返回英文枚举值" },
                },
                required: ["subject", "action", "object", "type", "grade"],
              },
            },
          },
          required: ["reasoning", "components", "functions"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsedData = JSON.parse(text);

    // Data Consistency Fix: 
    // Ensure all subjects and objects are included in the components list to prevent Graph errors.
    const componentSet = new Set<string>(parsedData.components || []);
    const validFunctions: any[] = [];

    if (Array.isArray(parsedData.functions)) {
        parsedData.functions.forEach((f: any) => {
            if (f.subject && f.object && f.action) {
                componentSet.add(f.subject);
                componentSet.add(f.object);
                validFunctions.push(f);
            }
        });
    }

    const uniqueComponents = Array.from(componentSet);

    // Map to internal types and add IDs
    return {
      reasoning: parsedData.reasoning || "未提供详细分析过程。",
      components: uniqueComponents,
      functions: validFunctions.map((f: any, index: number) => ({
        id: `fn-${index}`,
        subject: f.subject,
        action: f.action,
        object: f.object,
        type: f.type as FunctionType, 
        grade: f.grade as FunctionGrade, 
      })),
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("分析失败。请检查 API Key 设置或图片清晰度。");
  }
};
