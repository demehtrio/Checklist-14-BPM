import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Car, 
  User, 
  Settings, 
  Lightbulb, 
  Wrench, 
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layout,
  FileText,
  MapPin,
  MessageCircle,
  Camera,
  X,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseChecklistDescription, ChecklistData } from './services/geminiService';
import { POLICIAIS } from './constants/policiais';

const INITIAL_STATE: ChecklistData = {
  servico: '',
  dataArmou: new Date().toLocaleDateString('pt-BR'),
  horaArmou: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  motoristaSai: '',
  telMotoristaSai: '',
  motoristaEntra: '',
  telMotoristaEntra: '',
  viatura: '',
  placa: '',
  prefixo: '',
  kmInicial: '',
  saldoCombustivel: '',
  mapaDiario: 'SIM',
  equipamentos: [],
  luzFarolAlto: 'Todos funcionam',
  luzFarolBaixo: 'Todos funcionam',
  luzLanterna: 'Todos funcionam',
  luzFreioLanternaTraseira: ['TODAS FUNCIONANDO'],
  luzPlaca: 'Funciona',
  pneus: 'Novo',
  sistemaFreio: 'Freio funcionando',
  oleoMotor: 'Nível Normal',
  proxTrocaOleoKm: '',
  partesInternas: ['SEM ALTERAÇÃO'],
  sistemaTracao: 'Kit de tração em condições',
  partesExternas: ['Sem Alteração'],
  limpeza: 'LIMPA',
  descricaoAlteracoes: '',
  kmFinal: '',
  horaDesarmou: '',
  fotos: [],
};

const VIATURAS = [
  "6489/Ônibus", "6491/Doblô Fiat", "6492/Honda XRE-300", "6493/Honda XRE-300",
  "6494/Honda XRE-300", "6495/Honda XRE-300", "6496/Honda XRE-300", "6497/Honda XRE-300",
  "6498/Honda XRE-300", "6499/Honda XRE-300", "64100/Honda XRE-300", "64103/Honda XRE-300",
  "64104/Honda XRE-300", "64105/Honda XRE-300", "64106/Honda XRE-300", "64107/Mitsubishi L200",
  "64110/PGB5G37/RANGER", "640135/RZZ8G50/DUSTER", "640136/RZZ6G90/DUSTER", "640137/RZZ0F43/DUSTER",
  "640138/RZZ0F83/DUSTER", "640140/RZZ6E00/DUSTER", "640141/RZZ8H00/DUSTER", "640142/RZY4G58/DUSTER",
  "640143/RZZ2E03/DUSTER", "640144/SNO0C99/POLO", "640145/SNR1I38/MOTO", "640146/SNR8D25/MOTO",
  "640147/SNR8A05/MOTO", "640148/SNT5I45/MOTO", "640149/SNU9F56/MOTO", "640150/SNZ8F51/S10",
  "640151/SNZ4C21/S10", "640152/SNZ4C61/S10", "640153/SOG4H29/S10", "640154/SOG4I59/S10",
  "640155/SOG4G99/S10", "640156/SOH6A98/S10", "640157/RZY1G98/DUSTER", "640158/SOJ9C78/XRE300",
  "640159/SOJ6D28/XRE300", "640160/SOJ6D78/XRE300", "640161/UHL2H45/HILUX", "RESERVA/RZZ6D80/DUSTER",
  "RESERVA/RZX4C63/DUSTER", "1210097/SNN5E90/DUSTER", "1210105/SOB5F10/ARGO", "1210153/SOA9C08/ARGO"
];

const PLACAS = [
  "PGB5G37", "RZZ8G50", "RZZ6G90", "RZZ0F43", "RZZ0F83", "RZZ6E00", "RZZ8H00", "RZY4G58", 
  "RZZ2E03", "SNO0C99", "SNR1I38", "SNR8D25", "SNR8A05", "SNT5I45", "SNU9F56", "SNZ8F51", 
  "SNZ4C21", "SNZ4C61", "SOG4H29", "SOG4I59", "SOG4G99", "SOH6A98", "RZY1G98", "SOJ9C78", 
  "SOJ6D28", "SOJ6D78", "UHL2H45", "RZZ6D80", "RZX4C63", "SNN5E90", "SOB5F10", "SOA9C08"
].sort();

const EQUIPAMENTOS = [
  "Giroflex", "Sirene", "Rádio Transceptor", "Chave de Roda", "Macaco", 
  "Triângulo", "Estepe", "Bateria", "Buzina", "Mapa Mensal VTR", 
  "Bauleto (Moto)", "Chave do Bauleto (Moto)"
];

const PREFIXOS = [
  "GT 14100 - COMANDO",
  "GT 14200 - SUBCOMANDO",
  "GT 14000- OPERAÇÕES",
  "GT 14111",
  "GT 14112",
  "GT 14113",
  "GT 14114",
  "GT 14115",
  "GT 14116",
  "GT 14117",
  "GT 14118",
  "GT 14121",
  "GT 14211",
  "GT 14311",
  "GT 14321",
  "GT 14331",
  "GTR 14050",
  "GG 14050",
  "GG 14150",
  "GG 14250",
  "GG 14350",
  "GV 14050",
  "MP 14050",
  "VE 14111",
  "VE 14112",
  "VE 14113",
  "GT 14115 FECHA BATALHÃO",
  "GT ESCOLTA",
  "MO 14111",
  "GT DISPERSÃO",
  "OPERAÇÃO BICENTENÁRIO - 06H AS 14H",
  "GTR 14150",
  "OPERAÇÃO ENEM",
  "GE 14101",
  "GE 14102",
  "GE EXTRA - 14150",
  "GE EXTRA - 14250"
];

const SummaryItem = ({ label, value }: { label: string, value: string | string[] }) => (
  <div className="flex flex-col gap-1 p-3 bg-pmpe-blue/5 rounded-2xl border border-pmpe-blue/10">
    <span className="text-[9px] font-bold uppercase opacity-40 text-pmpe-blue">{label}</span>
    <span className="text-sm font-medium text-pmpe-blue truncate">
      {Array.isArray(value) ? value.join(', ') : value || '---'}
    </span>
  </div>
);

export default function App() {
  const [formData, setFormData] = useState<ChecklistData>(INITIAL_STATE);
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseChecklistDescription(aiInput);
      setFormData(prev => ({ ...prev, ...parsed }));
      setAiInput('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Checklist Submitted:', formData);
    setIsSubmitted(true);
    setShowSuccess(true);
  };

  const resetForm = () => {
    setFormData({
      ...INITIAL_STATE,
      dataArmou: new Date().toLocaleDateString('pt-BR'),
      horaArmou: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      horaDesarmou: '',
    });
    setIsSubmitted(false);
    setShowSuccess(false);
  };

  const toggleArrayItem = (field: keyof ChecklistData, item: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          fotos: [...prev.fotos, base64String]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const shareWhatsApp = () => {
    const parts = formData.viatura.split('/');
    let patrimonio = '';
    let placaFromVtr = '';
    let modelo = '';

    if (parts.length === 3) {
      [patrimonio, placaFromVtr, modelo] = parts;
    } else if (parts.length === 2) {
      [patrimonio, modelo] = parts;
    } else {
      patrimonio = parts[0];
    }

    const placaFinal = formData.placa || placaFromVtr;

    // Clean up prefixo (take only the code before the dash if it exists)
    const prefixoFormatado = formData.prefixo.split(' - ')[0];
    
    // Extract matricula from motoristaEntra (usually Grad / Nome / Mat)
    const matMatch = formData.motoristaEntra.match(/(\d+[-\d]*)$/);
    const matricula = matMatch ? matMatch[1] : '';
    const motoristaNome = formData.motoristaEntra.split('/')[1]?.trim() || formData.motoristaEntra.split('/')[0]?.trim() || formData.motoristaEntra;

    const message = `🪙 Pat: ${patrimonio.trim() || ''}
⛔ Placa: ${placaFinal.trim() || ''}
📟 Prefixo: ${prefixoFormatado.trim()}
🧮 Emprego: ${formData.servico}
🚓 Vtr: ${modelo.trim() || patrimonio.trim() || ''}
🔓 Km inic: ${formData.kmInicial}
📅 Data: ${formData.dataArmou}
⌚ Hora que armou: ${formData.horaArmou}
🔐 Km final: ${formData.kmFinal}
⌚ Hora que desarmou: ${formData.horaDesarmou}
👮🏻‍♂️ Mot: ${motoristaNome}
⚠️ Mat: ${matricula}${formData.fotos.length > 0 ? `\n📸 Fotos: ${formData.fotos.length} anexadas` : ''}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(0, 48, 135); // pmpe-blue
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add Logo to PDF
      try {
        const logoUrl = "http://www.pm.pe.gov.br/wp-content/uploads/2021/03/logo_14_bpm-150x150.png";
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = logoUrl;
        
        await Promise.race([
          new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout loading logo")), 3000))
        ]);

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const base64Logo = canvas.toDataURL("image/png");
          doc.addImage(base64Logo, 'PNG', 10, 5, 25, 25);
        }
      } catch (e) {
        console.warn("Could not add logo to PDF:", e);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Check List - 14º BPM', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Batalhão Cel PM Manoel de Souza Ferraz', pageWidth / 2, 22, { align: 'center' });
      doc.text('14º BPM - Polícia Militar de Pernambuco', pageWidth / 2, 28, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 35, { align: 'center' });

      let currentY = 50;

      const addSection = (title: string, data: [string, string][]) => {
        // Check if we need a new page for the section title
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 48, 135);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 14, currentY);
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          head: [['Campo', 'Informação']],
          body: data,
          theme: 'striped',
          headStyles: { fillColor: [0, 48, 135] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 14, right: 14 },
          didDrawPage: (data: any) => {
            currentY = data.cursor.y;
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      };

      // Identificação
      addSection('Identificação', [
        ['Serviço', formData.servico],
        ['Placa', formData.placa],
        ['Viatura', formData.viatura],
        ['Prefixo', formData.prefixo],
        ['Data', formData.dataArmou],
        ['Hora que Armou', formData.horaArmou],
        ['Mapa Diário', formData.mapaDiario],
      ]);

      // Motoristas
      addSection('Motoristas', [
        ['Motorista que Sai', formData.motoristaSai],
        ['Tel. Motorista Sai', formData.telMotoristaSai],
        ['Motorista que Entra', formData.motoristaEntra],
        ['Tel. Motorista Entra', formData.telMotoristaEntra],
      ]);

      // Estado Técnico
      addSection('Estado Técnico', [
        ['KM Inicial', formData.kmInicial],
        ['Saldo Combustível', formData.saldoCombustivel],
        ['KM Final', formData.kmFinal || 'Não informado'],
        ['Hora que Desarmou', formData.horaDesarmou],
        ['Limpeza', formData.limpeza],
        ['Equipamentos', formData.equipamentos.join(', ') || 'Nenhum'],
      ]);

      // Iluminação
      addSection('Iluminação', [
        ['Farol Alto', formData.luzFarolAlto],
        ['Farol Baixo', formData.luzFarolBaixo],
        ['Lanterna/Pisca', formData.luzLanterna],
        ['Luz de Placa', formData.luzPlaca],
        ['Luz de Freio/Traseira', formData.luzFreioLanternaTraseira.join(', ')],
      ]);

      // Mecânica
      addSection('Mecânica e Pneus', [
        ['Pneus', formData.pneus],
        ['Sistema de Freio', formData.sistemaFreio],
        ['Óleo Motor', formData.oleoMotor],
        ['Próx. Troca Óleo KM', formData.proxTrocaOleoKm],
        ['Sistema de Tração', formData.sistemaTracao],
      ]);

      // Conservação
      addSection('Conservação', [
        ['Partes Internas', formData.partesInternas.join(', ')],
        ['Partes Externas', formData.partesExternas.join(', ')],
      ]);

      // Observações
      addSection('Observações', [
        ['Descrição de Alterações', formData.descricaoAlteracoes || 'Sem alterações registradas.'],
      ]);

      // Fotos
      if (formData.fotos.length > 0) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(0, 48, 135);
        doc.setFont('helvetica', 'bold');
        doc.text('FOTOS ANEXADAS', 14, currentY);
        currentY += 10;

        const imgWidth = 80;
        const imgHeight = 60;
        const margin = 14;
        const spacing = 10;

        formData.fotos.forEach((foto, index) => {
          if (currentY + imgHeight > 280) {
            doc.addPage();
            currentY = 20;
          }

          const x = index % 2 === 0 ? margin : margin + imgWidth + spacing;
          try {
            // Auto-detect format from base64 string
            const format = foto.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(foto, format, x, currentY, imgWidth, imgHeight);
          } catch (err) {
            console.error("Error adding image to PDF:", err);
          }
          
          if (index % 2 !== 0 || index === formData.fotos.length - 1) {
            currentY += imgHeight + spacing;
          }
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} - Check List - 14º BPM - Documento Oficial PMPE`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`Checklist_${formData.viatura.replace(/\//g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-pmpe-bg text-[#141414] font-sans pb-20">
      {/* Header */}
      <header className="bg-pmpe-blue text-white p-6 sticky top-0 z-50 shadow-lg border-b-4 border-pmpe-red">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-pmpe-gold/40 shrink-0">
              <img 
                src="http://www.pm.pe.gov.br/wp-content/uploads/2021/03/logo_14_bpm-150x150.png" 
                alt="Brasão 14º BPM" 
                className="w-12 h-12 object-contain brightness-110 contrast-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Check List - 14º BPM</h1>
              <p className="text-[10px] md:text-xs font-medium opacity-90 uppercase tracking-wide">
                Batalhão Cel PM Manoel de Souza Ferraz
              </p>
              <p className="text-[9px] opacity-70 uppercase tracking-widest">14º BPM - Polícia Militar de Pernambuco</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs font-mono opacity-50">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* AI Assistant Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-pmpe-red" />
            <h2 className="font-semibold text-lg text-pmpe-blue">Assistente de Preenchimento</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 italic">
            Descreva o estado da viatura em linguagem natural e eu preencho o formulário para você.
          </p>
          <div className="relative">
            <textarea
              className="w-full p-4 bg-[#F9F9F7] border border-black/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pmpe-blue/20 transition-all min-h-[100px]"
              placeholder="Ex: Viatura 6491 está com o farol direito queimado, pneu meia vida e o rádio não funciona..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />
            <button
              onClick={handleAiParse}
              disabled={isParsing || !aiInput.trim()}
              className="absolute bottom-4 right-4 bg-pmpe-blue text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-pmpe-blue/90 disabled:opacity-50 transition-all shadow-md"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-pmpe-gold" />}
              {isParsing ? 'Analisando...' : 'Preencher com IA'}
            </button>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Identificação */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <Car className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Identificação</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Serviço *</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.servico}
                  onChange={(e) => setFormData({...formData, servico: e.target.value})}
                  required
                >
                  <option value="">Selecione o serviço</option>
                  <option value="GUARNIÇÃO">GUARNIÇÃO</option>
                  <option value="PJES">PJES</option>
                  <option value="MISSÃO ADM">MISSÃO ADM</option>
                  <option value="VIAGEM">VIAGEM</option>
                  <option value="OPERAÇÃO">OPERAÇÃO</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Placa *</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.placa}
                  onChange={(e) => setFormData({...formData, placa: e.target.value})}
                  required
                >
                  <option value="">Selecione a placa</option>
                  {PLACAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Viatura *</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.viatura}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parts = val.split('/');
                    let extractedPlaca = '';
                    if (parts.length === 3) {
                      extractedPlaca = parts[1].trim();
                    }
                    setFormData({...formData, viatura: val, placa: extractedPlaca || formData.placa});
                  }}
                  required
                >
                  <option value="">Selecione a viatura</option>
                  {VIATURAS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Prefixo *</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.prefixo}
                  onChange={(e) => setFormData({...formData, prefixo: e.target.value})}
                  required
                >
                  <option value="">Selecione o prefixo</option>
                  {PREFIXOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Data *</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.dataArmou}
                  onChange={(e) => setFormData({...formData, dataArmou: e.target.value})}
                  placeholder="DD/MM/AAAA"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Hora que Armou *</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.horaArmou}
                  onChange={(e) => setFormData({...formData, horaArmou: e.target.value})}
                  placeholder="HH:MM"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Motoristas */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <User className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Motoristas</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Motorista que Sai (Grad / Nome / Mat)</label>
                  <select 
                    className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                    value={formData.motoristaSai}
                    onChange={(e) => setFormData({...formData, motoristaSai: e.target.value})}
                  >
                    <option value="">Selecione o policial</option>
                    {POLICIAIS.map((p, i) => <option key={`sai-${p}-${i}`} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Telefone Motorista que Sai</label>
                  <input 
                    type="tel"
                    className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                    placeholder="(81) 9..."
                    value={formData.telMotoristaSai}
                    onChange={(e) => setFormData({...formData, telMotoristaSai: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Motorista que Entra (Grad / Nome / Mat) *</label>
                  <select 
                    className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                    value={formData.motoristaEntra}
                    onChange={(e) => setFormData({...formData, motoristaEntra: e.target.value})}
                    required
                  >
                    <option value="">Selecione o policial</option>
                    {POLICIAIS.map((p, i) => <option key={`entra-${p}-${i}`} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Telefone Motorista que Entra *</label>
                  <input 
                    type="tel"
                    className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                    placeholder="(81) 9..."
                    value={formData.telMotoristaEntra}
                    onChange={(e) => setFormData({...formData, telMotoristaEntra: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Estado Técnico */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <Settings className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Estado Técnico</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">KM Inicial *</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.kmInicial}
                  onChange={(e) => setFormData({...formData, kmInicial: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Saldo Combustível R$</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.saldoCombustivel}
                  onChange={(e) => setFormData({...formData, saldoCombustivel: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">KM Final</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.kmFinal}
                  onChange={(e) => setFormData({...formData, kmFinal: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Hora que Desarmou</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.horaDesarmou}
                  onChange={(e) => setFormData({...formData, horaDesarmou: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase opacity-50">Equipamentos Presentes</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EQUIPAMENTOS.map(eq => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleArrayItem('equipamentos', eq)}
                    className={`p-3 rounded-xl text-xs text-left transition-all border ${
                      formData.equipamentos.includes(eq) 
                        ? 'bg-pmpe-blue text-white border-transparent shadow-md' 
                        : 'bg-[#F9F9F7] text-black/60 border-black/5 hover:border-pmpe-blue/20'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Iluminação */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <Lightbulb className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Iluminação</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Farol Alto', field: 'luzFarolAlto' },
                { label: 'Farol Baixo', field: 'luzFarolBaixo' },
                { label: 'Lanterna/Pisca', field: 'luzLanterna' },
                { label: 'Luz de Placa', field: 'luzPlaca' }
              ].map(item => (
                <div key={item.field} className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">{item.label}</label>
                  <select 
                    className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                    value={(formData as any)[item.field]}
                    onChange={(e) => setFormData({...formData, [item.field]: e.target.value})}
                  >
                    <option value="Todos funcionam">Todos funcionam</option>
                    <option value="Direito queimado">Direito queimado</option>
                    <option value="Esquerdo queimado">Esquerdo queimado</option>
                    <option value="Todas queimados">Todas queimados</option>
                    <option value="Funciona">Funciona</option>
                    <option value="Queimada">Queimada</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Mecânica e Pneus */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <Wrench className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Mecânica e Pneus</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Pneus</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.pneus}
                  onChange={(e) => setFormData({...formData, pneus: e.target.value})}
                >
                  <option value="Novo">Novo</option>
                  <option value="Meia vida">Meia vida</option>
                  <option value="Inutilizável (Motivo de baixa)">Inutilizável (Motivo de baixa)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Sistema de Freio</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.sistemaFreio}
                  onChange={(e) => setFormData({...formData, sistemaFreio: e.target.value})}
                >
                  <option value="Freio funcionando">Freio funcionando</option>
                  <option value="Freio falhando">Freio falhando</option>
                  <option value="Sem Freios (Motivo de baixa)">Sem Freios (Motivo de baixa)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Óleo Motor</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.oleoMotor}
                  onChange={(e) => setFormData({...formData, oleoMotor: e.target.value})}
                >
                  <option value="Nível Normal">Nível Normal</option>
                  <option value="Nível Baixo">Nível Baixo</option>
                  <option value="Nível sem condições (Baixar VTR)">Nível sem condições (Baixar VTR)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Próx. Troca Óleo KM</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.proxTrocaOleoKm}
                  onChange={(e) => setFormData({...formData, proxTrocaOleoKm: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section: Observações */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <AlertCircle className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Observações e Avarias</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-50">Descrição de Alterações</label>
              <textarea 
                className="w-full p-4 bg-[#F9F9F7] border border-black/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px]"
                placeholder="Descreva aqui qualquer detalhe adicional, avarias em lataria, vidros, bancos, etc."
                value={formData.descricaoAlteracoes}
                onChange={(e) => setFormData({...formData, descricaoAlteracoes: e.target.value})}
              />
            </div>
          </div>

          {/* Section: Fotos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
              <Camera className="w-5 h-5 text-pmpe-blue opacity-60" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Fotos da Viatura</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.fotos.map((foto, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-black/5 bg-gray-50">
                    <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-pmpe-red text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {formData.fotos.length < 8 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-pmpe-blue/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-pmpe-blue/5 transition-all text-pmpe-blue/40 hover:text-pmpe-blue">
                    <Camera className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase">Adicionar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-black/40 italic">Anexe até 8 fotos (avarias, pneus, hodômetro, etc.)</p>
            </div>
          </div>

          {/* Submit, PDF and WhatsApp Buttons */}
          <div className="grid grid-cols-1 gap-4">
            {!isSubmitted ? (
              <button
                type="submit"
                className="w-full bg-pmpe-blue text-white p-6 rounded-3xl font-bold uppercase tracking-widest hover:bg-pmpe-blue/90 transition-all shadow-xl flex items-center justify-center gap-3 border-b-4 border-pmpe-red"
              >
                <CheckCircle2 className="w-6 h-6 text-pmpe-gold" />
                Finalizar Checklist
              </button>
            ) : (
              <div className="space-y-6">
                {/* Checklist Summary */}
                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-pmpe-blue/10 space-y-8">
                  <div className="flex items-center justify-between border-b border-pmpe-blue/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-pmpe-blue text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <ClipboardCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-pmpe-blue uppercase text-sm tracking-widest">Checklist Preenchido</h3>
                        <p className="text-[10px] text-black/40 italic">Revise os dados e preencha o encerramento</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase text-pmpe-red hover:bg-pmpe-red/5 px-3 py-2 rounded-xl transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                      Editar Tudo
                    </button>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryItem label="Serviço" value={formData.servico} />
                    <SummaryItem label="Viatura" value={formData.viatura} />
                    <SummaryItem label="Prefixo" value={formData.prefixo} />
                    <SummaryItem label="Placa" value={formData.placa} />
                    <SummaryItem label="Data" value={formData.dataArmou} />
                    <SummaryItem label="Hora Armou" value={formData.horaArmou} />
                    <SummaryItem label="Motorista Sai" value={formData.motoristaSai} />
                    <SummaryItem label="Motorista Entra" value={formData.motoristaEntra} />
                  </div>

                  {/* Editable Fields (Finalization) */}
                  <div className="bg-pmpe-gold/5 p-6 rounded-[32px] border border-pmpe-gold/20 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-5 h-5 text-pmpe-gold" />
                      <h4 className="font-bold text-pmpe-blue uppercase text-[10px] tracking-widest">Dados de Encerramento (Final do Serviço)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase opacity-50">KM Final</label>
                        <input 
                          type="number"
                          className="w-full p-4 bg-white border border-pmpe-blue/10 rounded-2xl text-sm focus:ring-2 focus:ring-pmpe-blue/20 outline-none transition-all shadow-sm"
                          value={formData.kmFinal}
                          onChange={(e) => setFormData({...formData, kmFinal: e.target.value})}
                          placeholder="KM ao desarmar"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase opacity-50">Hora que Desarmou</label>
                        <input 
                          type="text"
                          className="w-full p-4 bg-white border border-pmpe-blue/10 rounded-2xl text-sm focus:ring-2 focus:ring-pmpe-blue/20 outline-none transition-all shadow-sm"
                          value={formData.horaDesarmou}
                          onChange={(e) => setFormData({...formData, horaDesarmou: e.target.value})}
                          placeholder="HH:MM"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-pmpe-blue/60 italic text-center">Preencha estes campos para que o PDF e o WhatsApp sejam gerados com os dados de encerramento.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full bg-gray-100 text-gray-600 p-6 rounded-3xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-md flex items-center justify-center gap-3"
                >
                  <Layout className="w-6 h-6" />
                  Novo Checklist
                </button>
                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="w-full bg-white text-pmpe-blue p-6 rounded-3xl font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3 border-2 border-pmpe-blue/20 disabled:opacity-50"
                >
                  {isGeneratingPDF ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6 text-pmpe-red" />}
                  {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="w-full bg-[#25D366] text-white p-6 rounded-3xl font-bold uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-6 h-6" />
                  WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

        {/* External Link Section */}
        <div className="mt-8">
          <a
            href="https://www.google.com/maps/d/viewer?mid=1T7E9H28gZYwllXXBaTcCqilot6Y&ll=-7.992107360606224%2C-34.88517113691404&z=12"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-pmpe-gold/10 text-pmpe-blue p-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-pmpe-gold/20 transition-all flex items-center justify-center gap-3 border border-pmpe-gold/30 text-center"
          >
            <MapPin className="w-5 h-5 text-pmpe-red flex-shrink-0" />
            MAPA DA REDE CREDENCIADA E VALOR MÁX PERMITIDO PARA ABASTECIMENTO
          </a>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pmpe-blue/40 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-[40px] shadow-2xl text-center space-y-4 max-w-sm w-full border-t-8 border-pmpe-blue">
              <div className="w-20 h-20 bg-pmpe-gold/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-pmpe-gold" />
              </div>
              <h2 className="text-2xl font-bold text-pmpe-blue">Enviado com Sucesso!</h2>
              <p className="text-sm text-gray-500">O checklist da viatura foi registrado no sistema PMPE.</p>
              
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-pmpe-blue/60">KM Final</label>
                  <input 
                    type="number"
                    className="w-full p-2 bg-white border border-pmpe-blue/10 rounded-lg text-sm"
                    value={formData.kmFinal}
                    onChange={(e) => setFormData({...formData, kmFinal: e.target.value})}
                    placeholder="KM Final"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-pmpe-blue/60">Hora que Desarmou</label>
                  <input 
                    type="text"
                    className="w-full p-2 bg-white border border-pmpe-blue/10 rounded-lg text-sm"
                    value={formData.horaDesarmou}
                    onChange={(e) => setFormData({...formData, horaDesarmou: e.target.value})}
                    placeholder="HH:MM"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={shareWhatsApp}
                  className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-[#128C7E] flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar via WhatsApp
                </button>
                <button 
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="w-full py-4 bg-white text-pmpe-blue border-2 border-pmpe-blue/20 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-pmpe-red" />}
                  {isGeneratingPDF ? 'Gerando PDF...' : 'Baixar PDF do Checklist'}
                </button>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-4 bg-pmpe-blue text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-pmpe-blue/90"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pmpe-blue/10 p-4 flex justify-around md:hidden z-40">
        <button className="flex flex-col items-center gap-1 text-pmpe-blue">
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Check</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 text-pmpe-blue">
          <Layout className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Histórico</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 text-pmpe-blue">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
