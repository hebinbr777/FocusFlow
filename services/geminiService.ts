import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

/**
 * Uses Gemini to break down a complex task into smaller, actionable subtasks.
 */
export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("API Key missing");
    return ["Verificar requisitos", "Executar tarefa", "Revisar trabalho"];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Quebre a tarefa "${taskTitle}" em 3 a 5 sub-tarefas acionáveis e curtas.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return [];
  }
};

/**
 * Generates a motivational quote or tip based on the user's current context.
 */
export const getDailyMotivation = async (pendingCount: number, completedCount: number): Promise<string> => {
    if (!apiKey) return "Mantenha o foco e continue avançando!";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `O usuário tem ${pendingCount} tarefas pendentes e completou ${completedCount} hoje. Dê uma frase curta, motivacional e amigável (máximo 20 palavras) em Português.`,
      });
      return response.text || "Vamos lá, você consegue!";
    } catch (error) {
      console.error("Error fetching motivation:", error);
      return "Cada passo conta para o seu sucesso.";
    }
};

/**
 * Analyzes weekly productivity
 */
export const analyzeWeeklyProgress = async (completedTasks: number, habitsMaintained: number): Promise<string> => {
    if (!apiKey) return "Bom trabalho essa semana!";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analise: completei ${completedTasks} tarefas e mantive ${habitsMaintained} hábitos essa semana. Dê um feedback curto e construtivo de 1 parágrafo.`,
        });
        return response.text || "Ótimo progresso!";
    } catch (e) {
        return "Continue assim!";
    }
}
