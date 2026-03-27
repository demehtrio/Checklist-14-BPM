import { GoogleGenAI, Type } from "@google/genai";

export interface ChecklistData {
  servico: string;
  dataArmou: string;
  horaArmou: string;
  motoristaSai: string;
  telMotoristaSai: string;
  motoristaEntra: string;
  telMotoristaEntra: string;
  viatura: string;
  placa: string;
  prefixo: string;
  kmInicial: string;
  saldoCombustivel: string;
  mapaDiario: string;
  equipamentos: string[];
  luzFarolAlto: string;
  luzFarolBaixo: string;
  luzLanterna: string;
  luzFreioLanternaTraseira: string[];
  luzPlaca: string;
  pneus: string;
  sistemaFreio: string;
  oleoMotor: string;
  proxTrocaOleoKm: string;
  partesInternas: string[];
  sistemaTracao: string;
  partesExternas: string[];
  limpeza: string;
  descricaoAlteracoes: string;
  kmFinal: string;
  horaDesarmou: string;
  fotos: string[];
}

export const checklistSchema = {
  type: Type.OBJECT,
  properties: {
    servico: { type: Type.STRING, description: "Tipo de serviço (GUARNIÇÃO, PJES, MISSÃO ADM, VIAGEM, OPERAÇÃO)" },
    dataArmou: { type: Type.STRING, description: "Data da inspeção (DD/MM/AAAA)" },
    horaArmou: { type: Type.STRING, description: "Horário que armou (HH:MM)" },
    motoristaSai: { type: Type.STRING, description: "Graduação / Nome / Matrícula do motorista que sai" },
    telMotoristaSai: { type: Type.STRING, description: "Telefone do motorista que sai" },
    motoristaEntra: { type: Type.STRING, description: "Graduação / Nome / Matrícula do motorista que entra" },
    telMotoristaEntra: { type: Type.STRING, description: "Telefone do motorista que entra" },
    viatura: { type: Type.STRING, description: "Identificação da viatura (ex: 6491/Doblô Fiat)" },
    placa: { type: Type.STRING, description: "Placa da viatura (ex: ABC-1234)" },
    prefixo: { type: Type.STRING, description: "Prefixo operacional (ex: GT 14111)" },
    kmInicial: { type: Type.STRING, description: "Quilometragem inicial" },
    saldoCombustivel: { type: Type.STRING, description: "Saldo de combustível em R$" },
    mapaDiario: { type: Type.STRING, description: "Status do mapa diário (SIM, NÃO)" },
    equipamentos: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista de equipamentos presentes (Giroflex, Sirene, Rádio, Macaco, etc.)" 
    },
    luzFarolAlto: { type: Type.STRING, description: "Estado do farol alto" },
    luzFarolBaixo: { type: Type.STRING, description: "Estado do farol baixo" },
    luzLanterna: { type: Type.STRING, description: "Estado da lanterna/pisca" },
    luzFreioLanternaTraseira: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Estado das luzes de freio e lanterna traseira" 
    },
    luzPlaca: { type: Type.STRING, description: "Estado da luz de placa" },
    pneus: { type: Type.STRING, description: "Estado dos pneus" },
    sistemaFreio: { type: Type.STRING, description: "Estado do sistema de freio" },
    oleoMotor: { type: Type.STRING, description: "Nível do óleo do motor" },
    proxTrocaOleoKm: { type: Type.STRING, description: "KM da próxima troca de óleo" },
    partesInternas: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Alterações em partes internas" 
    },
    sistemaTracao: { type: Type.STRING, description: "Estado do sistema de tração (motos)" },
    partesExternas: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Alterações em partes externas" 
    },
    limpeza: { type: Type.STRING, description: "Estado de limpeza" },
    descricaoAlteracoes: { type: Type.STRING, description: "Descrição detalhada de alterações ou avarias" },
    kmFinal: { type: Type.STRING, description: "Quilometragem final" },
    horaDesarmou: { type: Type.STRING, description: "Horário que desarmou/encerrou" },
    fotos: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista de fotos (base64) anexadas" 
    },
  },
  required: ["servico", "viatura", "placa"],
};

export async function parseChecklistDescription(description: string): Promise<Partial<ChecklistData>> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analise a seguinte descrição de uma inspeção de viatura e extraia os dados para o checklist: "${description}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: checklistSchema,
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {};
  }
}

export async function extractLicensePlateFromImage(base64Image: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  // Remove data:image/png;base64, prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: "Extract the vehicle license plate from this image. Return ONLY the plate text (e.g., ABC-1234 or ABC1D23). If no plate is visible, return 'NONE'." },
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]
    }
  });

  const text = response.text?.trim();
  if (text && text !== "NONE") {
    return text;
  }
  return null;
}
