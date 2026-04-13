import React, { useState, useEffect } from 'react';
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
  History,
  FileText,
  MapPin,
  MessageCircle,
  Camera,
  X,
  Trash2,
  Edit3,
  Clock,
  Mail,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Calendar,
  Siren,
  Search,
  ChevronDown,
  Save,
  Fuel,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseChecklistDescription, ChecklistData, extractLicensePlateFromImage } from './services/geminiService';
import { POLICIAIS } from './constants/policiais';
import { 
  auth, 
  loginWithGoogle,
  logout,
  db, 
  onAuthStateChanged, 
  FirebaseUser,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the whole app, 
  // instead we rely on the UI to show the error via notification
  return errInfo;
}

const INITIAL_STATE: ChecklistData = {
  dataArmou: new Date().toLocaleDateString('pt-BR'),
  horaArmou: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  condutorEntra: '',
  telCondutorEntra: '',
  viatura: '',
  placa: '',
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
  limpeza: 'SIM',
  descricaoAlteracoes: '',
  fotos: [],
  location: undefined,
};

const VIATURA_MAP: Record<string, string> = {
  "SNZ8F51": "640150/CHEVROLET S-10",
  "SNZ4C21": "640151/CHEVROLET S-10",
  "SNZ4C61": "640152/CHEVROLET S-10",
  "SOG4H29": "640153/CHEVROLET S-10",
  "SOG4I59": "640154/CHEVROLET S-10",
  "SOG4G99": "640155/CHEVROLET S-10",
  "SOH6A98": "640156/CHEVROLET S-10",
  "UHL2H45": "640161/HILLUX",
  "RZZ8G50": "640135/RENALT DUSTER",
  "RZZ6G90": "640136/RENALT DUSTER",
  "RZZ0F43": "640137/RENALT DUSTER",
  "RZZ0F83": "640138/RENALT DUSTER",
  "RZZ0G33": "640139/RENALT DUSTER",
  "RZZ6E00": "640140/RENALT DUSTER",
  "RZZ8H00": "640141/RENALT DUSTER",
  "RZY4G58": "640142/RENALT DUSTER",
  "RZZ2E03": "640143/RENALT DUSTER",
  "RZY1G98": "640157/RENALT DUSTER",
  "SNN5E90": "1210097/RENALT DUSTER",
  "PBG5G37": "64110/FORD RANGER",
  "QYV7F75": "64107/MMC L200",
  "SNO0C99": "640144/VW POLO",
  "SOB5F10": "1210105/FIAT ARGO",
  "SOA9C08": "1210153/FIAT ARGO",
  "PFA5246": "6489/VW VOLARE",
  "PCK8556": "6491/FIAT DOBLO",
  "PDS6365": "6492/HONDA XRE300",
  "PDS6435": "6493/HONDA XRE300",
  "PDS6455": "6494/HONDA XRE300",
  "PDS6475": "6495/HONDA XRE300",
  "PDS6485": "6496/HONDA XRE300",
  "PDS6845": "6497/HONDA XRE300",
  "PEC8506": "6498/HONDA XRE300",
  "PEC8526": "6499/HONDA XRE300",
  "PEC8576": "64100/HONDA XRE300",
  "PEC9726": "64103/HONDA XRE300",
  "PEC9736": "64104/HONDA XRE300",
  "PDS1785": "64105/HONDA XRE300",
  "PDS1795": "64106/HONDA XRE300",
  "SNR1I38": "640145/HONDA XRE300",
  "SNR8D25": "640146/HONDA XRE300",
  "SNR8A05": "640147/HONDA XRE300",
  "SNT5I45": "640148/HONDA XRE300",
  "SNT5I46": "640149/HONDA XRE300",
  "SOJ6C78": "640158/HONDA XRE300",
};

const VIATURAS = Object.values(VIATURA_MAP).sort();

const PLACAS = Object.keys(VIATURA_MAP).sort();

const EQUIPAMENTOS = [
  "Giroflex", "Sirene", "Rádio Transceptor", "Chave de Roda", "Macaco", 
  "Triângulo", "Estepe", "Bateria", "Buzina", "Mapa Mensal VTR", 
  "Bauleto (Moto)", "Chave do Bauleto (Moto)"
];

const PARTES_INTERNAS = [
  "SEM ALTERAÇÃO", "BANCOS", "PAINEL", "TAPETES", "FORRO DE TETO", "MAÇANETAS", "VIDROS"
];

const PARTES_EXTERNAS = [
  "Sem Alteração", "PINTURA", "LATARIA", "PARA-CHOQUE DIANTEIRO", "PARA-CHOQUE TRASEIRO", "RETROVISORES", "ANTENA"
];

const LUZES_TRASEIRAS = [
  "TODAS FUNCIONANDO", "Luz de Freio Dir. Queimada", "Luz de Freio Esq. Queimada", "Lanterna Traseira Dir. Queimada", "Lanterna Traseira Esq. Queimada"
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

const SearchableSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Selecione...", 
  required = false,
  rightElement = null,
  variant = 'default'
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  options: string[],
  placeholder?: string,
  required?: boolean,
  rightElement?: React.ReactNode,
  variant?: 'default' | 'dark' | 'green'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getContainerStyles = () => {
    if (!required) return 'space-y-2 relative';
    if (variant === 'dark') return 'space-y-2 relative p-3 bg-white/10 rounded-2xl border border-white/20';
    return 'space-y-2 relative p-3 bg-pmpe-blue/5 rounded-2xl border border-pmpe-blue/20';
  };

  const getLabelStyles = () => {
    if (variant === 'dark') return required ? 'text-white' : 'text-white/70';
    return required ? 'text-pmpe-blue' : 'opacity-50';
  };

  const getInputStyles = () => {
    if (variant === 'dark') return 'bg-white/10 border-white/20 text-white focus:ring-white/20 placeholder:text-white/40';
    return required ? 'bg-white border-pmpe-blue/10 text-pmpe-blue focus:ring-pmpe-blue/20' : 'bg-[#F9F9F7] border-black/10 text-pmpe-blue focus:ring-pmpe-blue/20';
  };

  const getIconStyles = () => {
    if (variant === 'dark') return 'text-white';
    return 'text-pmpe-blue';
  };

  return (
    <div className={`${getContainerStyles()} ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className={`text-xs font-bold uppercase ${getLabelStyles()}`}>{label} {required && '*'}</label>
        {rightElement}
      </div>
      <div className="relative">
        <input 
          type="text"
          className={`w-full p-3 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-medium ${getInputStyles()}`}
          placeholder={placeholder}
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            onChange(val); // Allow custom values
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(""); // Clear search to show all options on focus
          }}
        />
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${getIconStyles()} ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[100] w-full mt-1 bg-white border border-pmpe-blue/10 rounded-2xl shadow-2xl p-2 space-y-1 overflow-hidden"
          >
            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.slice(0, 100).map((opt, i) => (
                  <button
                    key={`${opt}-${i}`}
                    type="button"
                    className="w-full text-left p-3 hover:bg-pmpe-blue/5 rounded-xl text-sm transition-colors font-medium text-pmpe-blue"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {opt}
                  </button>
                ))
              ) : (
                <p className="text-xs text-center py-6 text-gray-400 font-medium">Nenhum resultado encontrado</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default function App() {
  const isOnline = useOnlineStatus();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'check' | 'history' | 'settings'>('check');
  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    condutores: false,
    tecnico: false,
    equipamentos: false,
    iluminacao: false,
    mecanica: false,
    partes: false,
    observacoes: false,
    fotos: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const [history, setHistory] = useState<ChecklistData[]>([]);
  const [formData, setFormData] = useState<ChecklistData>(INITIAL_STATE);
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingPlate, setIsExtractingPlate] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processando...');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        setIsAdmin(currentUser.email === "demetriomarques@gmail.com");
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore History Sync
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(collection(db, 'checklists'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        isSyncing: doc.metadata.hasPendingWrites
      } as ChecklistData));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'checklists');
    });

    return () => unsubscribe();
  }, [user, isAuthReady, isAdmin]);

  // Load from localStorage on mount (for current form draft only)
  useEffect(() => {
    const savedCurrent = localStorage.getItem('viatura_current_form');
    if (savedCurrent) {
      try {
        setFormData(JSON.parse(savedCurrent));
      } catch (e) {
        console.error('Failed to load current form', e);
      }
    }

    const savedSubmitted = localStorage.getItem('viatura_is_submitted');
    if (savedSubmitted === 'true') setIsSubmitted(true);

    const savedShowSuccess = localStorage.getItem('viatura_show_success');
    if (savedShowSuccess === 'true') setShowSuccess(true);

    const savedTab = localStorage.getItem('viatura_active_tab');
    if (savedTab === 'history') setActiveTab('history');
    if (savedTab === 'settings') setActiveTab('settings');
  }, []);

  // Save draft to localStorage (Debounced to avoid lag with photos)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        // Only save to localStorage if the data isn't too large
        const serialized = JSON.stringify(formData);
        if (serialized.length < 2000000) { // 2MB limit for localStorage
          localStorage.setItem('viatura_current_form', serialized);
        }
        localStorage.setItem('viatura_is_submitted', String(isSubmitted));
        localStorage.setItem('viatura_show_success', String(showSuccess));
        localStorage.setItem('viatura_active_tab', activeTab);
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [formData, isSubmitted, showSuccess, activeTab]);

  const compressImage = (base64Str: string, maxWidth = 500, maxHeight = 500): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Quality 0.4 is usually enough for identification and keeps size very low
          resolve(canvas.toDataURL('image/jpeg', 0.4));
        } catch (e) {
          reject(e);
        }
      };
      img.src = base64Str;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log("File change detected:", files.length, "files");
    setLoadingMessage('Processando imagens...');
    setIsLoading(true);
    try {
      const newFotos: string[] = [];
      const fileList = Array.from(files) as File[];
      for (const file of fileList) {
        console.log("Processing file:", file.name, file.size);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(base64);
        console.log("Compressed size:", compressed.length);
        newFotos.push(compressed);
      }

      setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, ...newFotos].slice(0, 8)
      }));
      console.log("Photos updated in state");
    } catch (error) {
      console.error('Error processing images:', error);
      showNotification('Erro ao processar imagens.');
    } finally {
      setIsLoading(false);
      console.log("File processing finished");
    }
  };

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

  const handleExtractPlate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingPlate(true);
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const compressed = await compressImage(base64String);
      const plate = await extractLicensePlateFromImage(compressed);
      if (plate && plate !== 'NONE') {
        // Normalize plate: uppercase and remove non-alphanumeric characters
        const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Find the viatura for this plate
        const viatura = VIATURA_MAP[normalizedPlate];
        
        setFormData(prev => ({ 
          ...prev, 
          placa: normalizedPlate,
          viatura: viatura || prev.viatura,
          fotos: [...prev.fotos, compressed].slice(0, 8)
        }));
        
        if (!viatura) {
          alert(`Placa identificada: ${normalizedPlate}. Viatura não encontrada na base de dados.`);
        }
      } else {
        alert('Não foi possível identificar a placa na imagem.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao processar a imagem.');
    } finally {
      setIsExtractingPlate(false);
    }
  };

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getCurrentLocation = (): Promise<{ latitude: number, longitude: number, accuracy: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser.");
        resolve(undefined);
        return;
      }

      // Set a shorter timeout for the initial high-accuracy request
      const timeoutId = setTimeout(() => {
        console.warn("Location request timed out");
        resolve(undefined);
      }, 6000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn("Error getting location:", error.message);
          resolve(undefined);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit initiated");
    if (!user) {
      showNotification('Usuário não autenticado.');
      return;
    }

    // Validation for Required Fields
    if (!formData.viatura) {
      showNotification('Por favor, selecione a Viatura.');
      return;
    }
    if (!formData.placa) {
      showNotification('Por favor, informe a Placa.');
      return;
    }
    if (!formData.condutorEntra) {
      showNotification('Por favor, selecione o Condutor.');
      return;
    }

    // Validation for KM
    const kmIni = parseFloat(formData.kmInicial);
    if (isNaN(kmIni)) {
      showNotification('O KM deve ser um número válido.');
      return;
    }

    setLoadingMessage('Obtendo localização e salvando...');
    setIsLoading(true);
    
    try {
      console.log("Getting location...");
      const location = await getCurrentLocation();
      console.log("Location obtained:", location);

      // Check total size of photos to avoid Firestore 1MB limit
      const totalPhotosSize = formData.fotos.reduce((acc, foto) => acc + foto.length, 0);
      console.log("Total photos size:", totalPhotosSize);
      
      if (totalPhotosSize > 850000) { // ~850KB limit to be safe
        showNotification('As fotos anexadas são muito grandes. Tente remover algumas ou usar fotos menores.');
        setIsLoading(false);
        return;
      }

      const dataToSave = {
        ...formData,
        location: location || null,
        userId: user.uid,
        userEmail: user.email,
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp(),
      };

      console.log("Saving to Firestore...");
      if (formData.id) {
        await updateDoc(doc(db, 'checklists', formData.id), dataToSave);
        console.log("Document updated");
      } else {
        const docRef = await addDoc(collection(db, 'checklists'), dataToSave);
        console.log("Document created with ID:", docRef.id);
        setFormData(prev => ({ ...prev, id: docRef.id, location }));
      }
      
      setIsSubmitted(true);
      setShowSuccess(true);
      showNotification('Checklist salvo com sucesso!', 'success');
    } catch (error: any) {
      console.error("Submit error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'checklists');
      const errorMsg = error?.message?.includes('too large') 
        ? 'O checklist está muito grande (limite de fotos excedido).' 
        : 'Erro ao salvar checklist. Verifique sua conexão e tente novamente.';
      showNotification(errorMsg);
    } finally {
      setIsLoading(false);
      console.log("Submit finished");
    }
  };

  const deleteFromHistory = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      await deleteDoc(doc(db, 'checklists', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `checklists/${id}`);
    }
  };

  const resetForm = () => {
    if (!window.confirm('Tem certeza que deseja limpar todo o formulário? Todos os dados preenchidos serão perdidos.')) return;
    setFormData({
      ...INITIAL_STATE,
      dataArmou: new Date().toLocaleDateString('pt-BR'),
      horaArmou: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
    setIsSubmitted(false);
    setShowSuccess(false);
    localStorage.removeItem('viatura_current_form');
    localStorage.removeItem('viatura_is_submitted');
    localStorage.removeItem('viatura_show_success');
  };

  const resumeFromHistory = (entry: ChecklistData) => {
    setFormData(entry);
    setIsSubmitted(false);
    setShowSuccess(false);
    setActiveTab('check');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded password for the prototype
    if (adminPassword === '14bpmadmin') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setActiveTab('settings');
      setAdminPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('check');
  };

  const clearHistory = () => {
    if (window.confirm('Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.')) {
      setHistory([]);
    }
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

  const removeFoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const shareWhatsApp = (data = formData) => {
    const FIELD_LABELS: Record<string, string> = {
      dataArmou: "Data",
      horaArmou: "Hora",
      condutorEntra: "Condutor",
      telCondutorEntra: "Telefone",
      viatura: "Viatura",
      placa: "Placa",
      kmInicial: "KM",
      saldoCombustivel: "Saldo Combustível",
      mapaDiario: "Mapa Diário",
      equipamentos: "Equipamentos",
      luzFarolAlto: "Farol Alto",
      luzFarolBaixo: "Farol Baixo",
      luzLanterna: "Lanterna/Pisca",
      luzFreioLanternaTraseira: "Freio/Lanterna Traseira",
      luzPlaca: "Luz de Placa",
      pneus: "Pneus",
      sistemaFreio: "Sistema de Freio",
      oleoMotor: "Óleo Motor",
      proxTrocaOleoKm: "Próx. Troca Óleo (KM)",
      partesInternas: "Partes Internas",
      sistemaTracao: "Sistema de Tração",
      partesExternas: "Partes Externas",
      limpeza: "Limpeza",
      descricaoAlteracoes: "Observações",
    };

    let message = `📋 *CHECKLIST VIATURA - 14º BPM*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    const sections = [
      {
        title: "📍 IDENTIFICAÇÃO",
        fields: ['dataArmou', 'horaArmou', 'viatura', 'placa', 'mapaDiario']
      },
      {
        title: "👤 CONDUTOR",
        fields: ['condutorEntra', 'telCondutorEntra']
      },
      {
        title: "⚙️ ESTADO TÉCNICO",
        fields: ['kmInicial', 'saldoCombustivel', 'limpeza']
      },
      {
        title: "🛠️ EQUIPAMENTOS",
        fields: ['equipamentos']
      },
      {
        title: "💡 ILUMINAÇÃO",
        fields: ['luzFarolAlto', 'luzFarolBaixo', 'luzLanterna', 'luzPlaca', 'luzFreioLanternaTraseira']
      },
      {
        title: "🔧 MECÂNICA E PNEUS",
        fields: ['pneus', 'sistemaFreio', 'oleoMotor', 'proxTrocaOleoKm', 'sistemaTracao']
      },
      {
        title: "🛡️ CONSERVAÇÃO",
        fields: ['partesInternas', 'partesExternas']
      },
      {
        title: "📝 OBSERVAÇÕES",
        fields: ['descricaoAlteracoes']
      }
    ];

    sections.forEach(section => {
      message += `*${section.title}*\n`;
      section.fields.forEach(key => {
        const value = (data as any)[key];
        const label = FIELD_LABELS[key];
        if (!label) return;

        let displayValue = "";
        if (Array.isArray(value)) {
          displayValue = value.length > 0 ? value.join(', ') : "Nenhum";
        } else {
          displayValue = (value !== undefined && value !== null && String(value).trim() !== '') ? String(value) : "Não informado";
        }
        message += `• *${label}:* ${displayValue}\n`;
      });
      message += `\n`;
    });

    if (data.fotos && data.fotos.length > 0) {
      message += `📸 *Fotos:* ${data.fotos.length} anexadas\n`;
    }

    if (data.location) {
      message += `📍 *Localização:* https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_Gerado via ViaturaCheck 14º BPM_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const shareEmail = () => {
    const subject = `Checklist Viatura - ${formData.viatura} - ${formData.dataArmou}`;
    const body = `CHECKLIST DE VIATURA - 14º BPM

DADOS DO SERVIÇO:
Viatura: ${formData.viatura}
Placa: ${formData.placa}
Data: ${formData.dataArmou}
Hora: ${formData.horaArmou}

CONDUTORES:
Condutor: ${formData.condutorEntra}
Telefone: ${formData.telCondutorEntra}

ESTADO TÉCNICO:
KM: ${formData.kmInicial}

EQUIPAMENTOS E CONDIÇÕES:
Equipamentos: ${formData.equipamentos.join(', ')}
Pneus: ${formData.pneus}
Limpeza: ${formData.limpeza}
Óleo Motor: ${formData.oleoMotor}

OBSERVAÇÕES:
${formData.descricaoAlteracoes || 'Nenhuma alteração registrada.'}

Gerado via ViaturaCheck 14º BPM.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const generatePDF = async (previewOnly = false, data = formData) => {
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
      doc.text('CHECKLIST - 14º BPM', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Batalhão Cel PM Manoel de Souza Ferraz', pageWidth / 2, 22, { align: 'center' });
      doc.text('14º BPM - Polícia Militar de Pernambuco', pageWidth / 2, 28, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 35, { align: 'center' });

      let currentY = 50;

      const addSection = (title: string, sectionData: [string, string][]) => {
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
          body: sectionData,
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
        ['Placa', data.placa],
        ['Viatura', data.viatura],
        ['Data', data.dataArmou],
        ['HORA*', data.horaArmou],
        ['Mapa Diário', data.mapaDiario],
      ]);

      // CONDUTOR
      addSection('CONDUTOR', [
        ['CONDUTOR', data.condutorEntra],
        ['Telefone do CONDUTOR*', data.telCondutorEntra],
      ]);

      // Estado Técnico
      addSection('Estado Técnico', [
        ['KM*', data.kmInicial],
        ['Saldo Combustível', data.saldoCombustivel],
        ['Limpeza', data.limpeza],
        ['Equipamentos', data.equipamentos.join(', ') || 'Nenhum'],
      ]);

      // Iluminação
      addSection('Iluminação', [
        ['Farol Alto', data.luzFarolAlto],
        ['Farol Baixo', data.luzFarolBaixo],
        ['Lanterna/Pisca', data.luzLanterna],
        ['Luz de Placa', data.luzPlaca],
        ['Luz de Freio/Traseira', data.luzFreioLanternaTraseira.join(', ')],
      ]);

      // Mecânica
      addSection('Mecânica e Pneus', [
        ['Pneus', data.pneus],
        ['Sistema de Freio', data.sistemaFreio],
        ['Óleo Motor', data.oleoMotor],
        ['Próx. Troca Óleo KM', data.proxTrocaOleoKm],
        ['Sistema de Tração', data.sistemaTracao],
      ]);

      // Conservação
      addSection('Conservação', [
        ['Partes Internas', data.partesInternas.join(', ')],
        ['Partes Externas', data.partesExternas.join(', ')],
      ]);

      // Observações
      addSection('Observações', [
        ['Descrição de Alterações', data.descricaoAlteracoes || 'Sem alterações registradas.'],
      ]);

      // Fotos
      if (data.fotos.length > 0) {
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

        data.fotos.forEach((foto, index) => {
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
          
          if (index % 2 !== 0 || index === data.fotos.length - 1) {
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
          `Página ${i} de ${pageCount} - CHECKLIST - 14º BPM - Documento Oficial PMPE`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      if (previewOnly) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setPreviewFilename(`Checklist_${data.viatura.replace(/\//g, '_')}_${new Date().getTime()}.pdf`);
        setShowPdfPreview(true);
      } else {
        doc.save(`Checklist_${data.viatura.replace(/\//g, '_')}_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-pmpe-bg text-[#141414] font-sans pb-20">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-pmpe-blue/20 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-pmpe-blue animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest text-pmpe-blue">{loadingMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAuthReady ? (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center">
              <Loader2 className="w-12 h-12 text-pmpe-blue animate-spin" />
              <p className="font-bold text-pmpe-blue uppercase tracking-widest">Iniciando Sistema...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="min-h-screen flex items-center justify-center p-6 bg-pmpe-bg">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-8 max-w-md w-full text-center border-b-8 border-pmpe-red"
            >
              <div className="w-24 h-24 bg-pmpe-blue rounded-full flex items-center justify-center shadow-xl">
                <img 
                  src="https://i.pinimg.com/originals/44/e4/8c/44e48c5ff461edb7623bab64bd898d8d.png" 
                  alt="Brasão PMPE" 
                  className="w-16 h-16 object-contain brightness-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-pmpe-blue uppercase tracking-tight">ViaturaCheck</h1>
                <p className="text-xs text-black/60 font-medium uppercase tracking-widest">14º BPM - PMPE</p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Acesse o sistema com sua conta institucional para realizar o checklist das viaturas.
              </p>
              <button
                onClick={() => loginWithGoogle()}
                className="w-full bg-pmpe-blue text-white p-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-pmpe-blue/90 transition-all shadow-xl flex items-center justify-center gap-3 border-b-4 border-pmpe-red"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Entrar com Google
              </button>
            </motion.div>
          </div>
        ) : (
          <>
        {/* Header */}
      <header className="bg-pmpe-blue text-white p-6 sticky top-0 z-50 shadow-lg border-b-4 border-pmpe-red">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 flex items-center justify-center shrink-0">
              <img 
                src="https://i.pinimg.com/originals/44/e4/8c/44e48c5ff461edb7623bab64bd898d8d.png" 
                alt="Brasão 14º BPM" 
                className="w-16 h-16 object-contain brightness-110 contrast-110 drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ViaturaCheck - 14º BPM</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] md:text-xs font-medium opacity-90 uppercase tracking-wide">
                  Batalhão Cel PM Manoel de Souza Ferraz
                </p>
                <button 
                  onClick={() => logout()}
                  className="md:hidden text-[9px] font-bold uppercase text-white/50 hover:text-pmpe-red transition-colors"
                >
                  [Sair]
                </button>
              </div>
              <p className="text-[9px] opacity-70 uppercase tracking-widest">14º BPM - Polícia Militar de Pernambuco</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 bg-white/10 p-1 rounded-2xl border border-white/20">
              <button 
                onClick={() => setActiveTab('check')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'check' ? 'bg-white text-pmpe-blue shadow-lg' : 'text-white hover:bg-white/10'}`}
              >
                Novo Checklist
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-pmpe-blue shadow-lg' : 'text-white hover:bg-white/10'}`}
              >
                Histórico
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-pmpe-red" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pmpe-red">Offline</span>
                </>
              )}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs font-mono opacity-50">{new Date().toLocaleDateString()}</p>
              <button 
                onClick={() => logout()}
                className="text-[9px] font-bold uppercase text-white/50 hover:text-pmpe-red transition-colors"
              >
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content (Always visible) */}
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {activeTab === 'check' ? (
          <>
            {/* AI Assistant Section */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pmpe-red" />
              <h2 className="font-semibold text-lg text-pmpe-blue">Assistente de Preenchimento</h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 text-[10px] font-bold uppercase text-pmpe-red/60 hover:text-pmpe-red transition-colors"
              title="Limpar todo o formulário"
            >
              <Trash2 className="w-3 h-3" />
              Limpar Tudo
            </button>
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
          {!isSubmitted && (
            <>
          {/* Section: Identificação */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('identificacao')}
            >
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Identificação</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.identificacao ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.identificacao && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={expandedSections.identificacao ? "overflow-visible" : "overflow-hidden"}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <SearchableSelect 
                      label="Placa"
                      value={formData.placa}
                      onChange={(val) => {
                        const viatura = VIATURA_MAP[val] || formData.viatura;
                        setFormData({...formData, placa: val, viatura});
                      }}
                      options={PLACAS}
                      placeholder="Selecione a placa"
                      required
                      variant="default"
                      rightElement={
                        <label className="cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase text-pmpe-blue hover:text-pmpe-red transition-colors">
                          {isExtractingPlate ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Camera className="w-3 h-3" />
                          )}
                          {isExtractingPlate ? 'Extraindo...' : 'Extrair da Foto'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={handleExtractPlate}
                            disabled={isExtractingPlate}
                          />
                        </label>
                      }
                    />

                    <SearchableSelect 
                      label="Viatura"
                      value={formData.viatura}
                      onChange={(val) => {
                        // Find the plate for this viatura
                        const plate = Object.keys(VIATURA_MAP).find(k => VIATURA_MAP[k] === val);
                        setFormData({...formData, viatura: val, placa: plate || formData.placa});
                      }}
                      options={VIATURAS}
                      placeholder="Selecione a viatura"
                      required
                      variant="default"
                    />

                    <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                      <label className="text-xs font-bold uppercase text-pmpe-blue">Data *</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-white border border-pmpe-blue/5 rounded-xl text-sm font-medium text-pmpe-blue focus:ring-2 focus:ring-pmpe-blue/20 outline-none placeholder:text-pmpe-blue/40"
                        value={formData.dataArmou}
                        onChange={(e) => setFormData({...formData, dataArmou: e.target.value})}
                        placeholder="DD/MM/AAAA"
                        required
                      />
                    </div>

                    <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                      <label className="text-xs font-bold uppercase text-pmpe-blue">HORA*</label>
                      <div className="relative">
                        <input 
                          type="text"
                          className="w-full p-3 pr-12 bg-white border border-pmpe-blue/5 rounded-xl text-sm font-medium text-pmpe-blue focus:ring-2 focus:ring-pmpe-blue/20 outline-none placeholder:text-pmpe-blue/40"
                          value={formData.horaArmou}
                          onChange={(e) => setFormData({...formData, horaArmou: e.target.value})}
                          placeholder="HH:MM"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, horaArmou: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-pmpe-blue/40 hover:text-pmpe-blue transition-colors"
                          title="Usar hora atual"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                      <label className="text-xs font-bold uppercase text-pmpe-blue">Mapa Diário? *</label>
                      <div className="flex gap-4 pt-2">
                        {['SIM', 'NÃO'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({ ...formData, mapaDiario: opt })}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                              formData.mapaDiario === opt
                                ? 'bg-pmpe-blue text-white border-transparent shadow-md'
                                : 'bg-white text-pmpe-blue border-pmpe-blue/10 hover:border-pmpe-blue/30'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

          {/* Section: CONDUTOR */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('condutores')}
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">CONDUTOR</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.condutores ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.condutores && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={expandedSections.condutores ? "overflow-visible" : "overflow-hidden"}
                >
                  <div className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect 
                  label="CONDUTOR (Grad / Nome / Mat)"
                  value={formData.condutorEntra}
                  onChange={(val) => setFormData({...formData, condutorEntra: val})}
                  options={POLICIAIS}
                  placeholder="Selecione o policial"
                  required
                  variant="default"
                />
                <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                  <label className="text-xs font-bold uppercase text-pmpe-blue">Telefone do CONDUTOR*</label>
                  <input 
                    type="tel"
                    className="w-full p-3 bg-white border border-pmpe-blue/5 rounded-xl text-sm font-medium text-pmpe-blue focus:ring-2 focus:ring-pmpe-blue/20 outline-none placeholder:text-pmpe-blue/40"
                    placeholder="(81) 9..."
                    value={formData.telCondutorEntra}
                    onChange={(e) => setFormData({...formData, telCondutorEntra: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

          {/* Section: Quilometragem e Abastecimento */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('tecnico')}
            >
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Estado Técnico</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.tecnico ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.tecnico && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={expandedSections.tecnico ? "overflow-visible" : "overflow-hidden"}
                >
                  <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                        <label className="text-xs font-bold uppercase text-pmpe-blue">KM*</label>
                        <input 
                          type="number"
                          className="w-full p-3 bg-white border border-pmpe-blue/5 rounded-xl text-sm font-medium text-pmpe-blue focus:ring-2 focus:ring-pmpe-blue/20 outline-none placeholder:text-pmpe-blue/40"
                          value={formData.kmInicial}
                          onChange={(e) => setFormData({...formData, kmInicial: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                        <label className="text-xs font-bold uppercase text-pmpe-blue">LIMPEZA? *</label>
                        <div className="flex gap-4 pt-2">
                          {['SIM', 'NÃO'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, limpeza: opt })}
                              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                                formData.limpeza === opt
                                  ? 'bg-pmpe-blue text-white border-transparent shadow-md'
                                  : 'bg-white text-pmpe-blue border-pmpe-blue/10 hover:border-pmpe-blue/30'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 bg-white border border-pmpe-blue/10 rounded-2xl">
                      <label className="text-xs font-bold uppercase text-pmpe-blue/70">Saldo Combustível R$</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-white border border-pmpe-blue/5 rounded-xl text-sm text-pmpe-blue placeholder:text-pmpe-blue/40 outline-none focus:ring-2 focus:ring-pmpe-blue/20"
                        value={formData.saldoCombustivel}
                        onChange={(e) => setFormData({...formData, saldoCombustivel: e.target.value})}
                      />
                    </div>
                  </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

          {/* Section: Equipamentos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('equipamentos')}
            >
              <div className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Equipamentos</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.equipamentos ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.equipamentos && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={expandedSections.equipamentos ? "overflow-visible" : "overflow-hidden"}
                >
                  <div className="space-y-6 pt-6">
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
                                ? 'bg-pmpe-blue text-white border-transparent shadow-lg scale-[1.02]' 
                                : 'bg-[#F9F9F7] text-black/60 border-black/5 hover:border-pmpe-blue/20'
                            }`}
                          >
                            {eq}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section: Iluminação */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('iluminacao')}
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Iluminação</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.iluminacao ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.iluminacao && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 pt-6">
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

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase opacity-50">Luz de Freio e Lanterna Traseira</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LUZES_TRASEIRAS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('luzFreioLanternaTraseira', item)}
                    className={`p-3 rounded-xl text-xs text-left transition-all border ${
                      formData.luzFreioLanternaTraseira.includes(item) 
                        ? 'bg-pmpe-blue text-white border-transparent shadow-md' 
                        : 'bg-[#F9F9F7] text-black/60 border-black/5 hover:border-pmpe-blue/20'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

          {/* Section: Mecânica e Pneus */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('mecanica')}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Mecânica e Pneus</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.mecanica ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.mecanica && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 pt-6">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section: Partes Internas e Externas */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('partes')}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Partes Internas e Externas</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.partes ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.partes && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 pt-6">
                    <div className="space-y-4">
              <label className="text-xs font-bold uppercase opacity-50">Partes Internas</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PARTES_INTERNAS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('partesInternas', item)}
                    className={`p-3 rounded-xl text-xs text-left transition-all border ${
                      formData.partesInternas.includes(item) 
                        ? 'bg-pmpe-blue text-white border-transparent shadow-md' 
                        : 'bg-[#F9F9F7] text-black/60 border-black/5 hover:border-pmpe-blue/20'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase opacity-50">Partes Externas</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PARTES_EXTERNAS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('partesExternas', item)}
                    className={`p-3 rounded-xl text-xs text-left transition-all border ${
                      formData.partesExternas.includes(item) 
                        ? 'bg-pmpe-blue text-white border-transparent shadow-md' 
                        : 'bg-[#F9F9F7] text-black/60 border-black/5 hover:border-pmpe-blue/20'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {(formData.viatura.toLowerCase().includes('moto') || formData.viatura.toLowerCase().includes('xre')) && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Sistema de Tração (Motos)</label>
                <select 
                  className="w-full p-3 bg-[#F9F9F7] border border-black/10 rounded-xl text-sm"
                  value={formData.sistemaTracao}
                  onChange={(e) => setFormData({...formData, sistemaTracao: e.target.value})}
                >
                  <option value="Kit de tração em condições">Kit de tração em condições</option>
                  <option value="Kit de tração desgastado">Kit de tração desgastado</option>
                  <option value="Kit de tração sem condições (Baixar VTR)">Kit de tração sem condições (Baixar VTR)</option>
                </select>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

          {/* Section: Observações */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('observacoes')}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Observações e Avarias</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.observacoes ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.observacoes && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 pt-6">
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
        </motion.div>
      )}
    </AnimatePresence>
  </div>

          {/* Section: Fotos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10">
            <div 
              className="flex items-center justify-between cursor-pointer border-b border-pmpe-blue/5 pb-4"
              onClick={() => toggleSection('fotos')}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-pmpe-blue opacity-60" />
                <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Fotos da Viatura</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-pmpe-blue transition-transform duration-300 ${expandedSections.fotos ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.fotos && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.fotos.map((foto, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-black/5 bg-gray-50">
                    <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFoto(index)}
                      className="absolute top-2 right-2 p-2 bg-pmpe-red text-white rounded-full shadow-lg z-10"
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
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
          </div>
          </>
          )}

          {/* Submit, PDF and WhatsApp Buttons */}
          <div className="grid grid-cols-1 gap-4">
            {!isSubmitted ? (
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-pmpe-blue text-white p-6 rounded-3xl font-bold uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 border-b-4 border-pmpe-red ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pmpe-blue/90'}`}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 text-pmpe-gold" />}
                {isLoading ? 'Salvando...' : 'Finalizar Checklist'}
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
                    <SummaryItem label="Viatura" value={formData.viatura} />
                    <SummaryItem label="Placa" value={formData.placa} />
                    <SummaryItem label="Data" value={formData.dataArmou} />
                    <SummaryItem label="Hora Armou" value={formData.horaArmou} />
                    <SummaryItem label="Mapa Diário" value={formData.mapaDiario} />
                    <SummaryItem label="Limpeza" value={formData.limpeza} />
                    <SummaryItem label="CONDUTOR" value={formData.condutorEntra} />
                    <SummaryItem label="Equipamentos" value={formData.equipamentos} />
                    {formData.location && (
                      <SummaryItem 
                        label="Localização" 
                        value={`${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}`} 
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-[32px] p-6 shadow-lg border border-pmpe-blue/5 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-pmpe-blue/60 tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Opções de Compartilhamento
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => generatePDF(true)}
                        disabled={isGeneratingPDF}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-pmpe-blue/5 text-pmpe-blue rounded-2xl hover:bg-pmpe-blue/10 transition-all border border-pmpe-blue/10 disabled:opacity-50"
                      >
                        {isGeneratingPDF ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6 text-pmpe-red" />}
                        <span className="text-[9px] font-bold uppercase">Gerar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={shareEmail}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-pmpe-blue/5 text-pmpe-blue rounded-2xl hover:bg-pmpe-blue/10 transition-all border border-pmpe-blue/10"
                      >
                        <Mail className="w-6 h-6" />
                        <span className="text-[9px] font-bold uppercase">Enviar E-mail</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    className="w-full bg-pmpe-blue text-white p-6 rounded-3xl font-bold uppercase tracking-widest hover:bg-pmpe-blue/90 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Enviar via WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-gray-100 text-gray-600 p-6 rounded-3xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-md flex items-center justify-center gap-3"
                  >
                    <Layout className="w-6 h-6" />
                    Novo Checklist
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
        </>
        ) : (
          <>
            {activeTab === 'history' ? (
              <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-pmpe-blue">Histórico de Checklists</h2>
              <span className="bg-pmpe-blue/10 text-pmpe-blue px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                {history.length} Registros
              </span>
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-[40px] p-12 text-center border border-pmpe-blue/10 shadow-xl">
                <div className="w-20 h-20 bg-pmpe-blue/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-10 h-10 text-pmpe-blue/20" />
                </div>
                <h3 className="text-lg font-bold text-pmpe-blue">Nenhum registro encontrado</h3>
                <p className="text-sm text-gray-500 mt-2">Os checklists realizados aparecerão aqui.</p>
                <button 
                  onClick={() => setActiveTab('check')}
                  className="mt-6 bg-pmpe-blue text-white px-6 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest"
                >
                  Iniciar Novo Checklist
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => {
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-[32px] p-6 shadow-lg border border-pmpe-blue/5 space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-pmpe-blue">{entry.viatura}</h3>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium uppercase">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {entry.dataArmou}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {entry.horaArmou}
                            </span>
                            {entry.location && (
                              <a 
                                href={`https://www.google.com/maps?q=${entry.location.latitude},${entry.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-pmpe-blue hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MapPin className="w-3 h-3" />
                                Ver Local
                              </a>
                            )}
                            {entry.isSyncing && (
                              <span className="flex items-center gap-1 text-pmpe-gold animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Sincronizando...
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => shareWhatsApp(entry)}
                            className="p-3 bg-pmpe-blue/5 text-pmpe-blue rounded-2xl hover:bg-pmpe-blue/10 transition-all"
                            title="Enviar via WhatsApp"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => generatePDF(true, entry)}
                            className="p-3 bg-pmpe-blue/5 text-pmpe-blue rounded-2xl hover:bg-pmpe-blue/10 transition-all"
                            title="Gerar PDF"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => resumeFromHistory(entry)}
                            className="p-3 bg-pmpe-blue/5 text-pmpe-blue rounded-2xl hover:bg-pmpe-blue/10 transition-all"
                            title="Continuar/Editar"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteFromHistory(entry.id || '')}
                            className="p-3 bg-pmpe-red/5 text-pmpe-red rounded-2xl hover:bg-pmpe-red/10 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-pmpe-blue/5 rounded-2xl border border-pmpe-blue/10">
                          <span className="text-[8px] font-bold uppercase opacity-40 text-pmpe-blue block mb-1">CONDUTOR</span>
                          <span className="text-xs font-medium text-pmpe-blue truncate">
                            {entry.condutorEntra?.includes('/') 
                              ? entry.condutorEntra.split('/')[1] 
                              : entry.condutorEntra}
                          </span>
                        </div>
                        <div className="p-3 bg-pmpe-blue/5 rounded-2xl border border-pmpe-blue/10">
                          <span className="text-[8px] font-bold uppercase opacity-40 text-pmpe-blue block mb-1">KM Inicial</span>
                          <span className="text-xs font-medium text-pmpe-blue">{entry.kmInicial}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-pmpe-blue">Configurações Administrativas</h2>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-pmpe-red text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
                  <Layout className="w-5 h-5 text-pmpe-blue opacity-60" />
                  <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Gerenciamento de Dados</h3>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={clearHistory}
                    className="w-full p-4 bg-pmpe-red/5 text-pmpe-red rounded-2xl text-sm font-bold flex items-center justify-between hover:bg-pmpe-red/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5" />
                      <span>Limpar Todo o Histórico</span>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 opacity-30" />
                  </button>

                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href",     dataStr);
                      downloadAnchorNode.setAttribute("download", `historico_viaturacheck_${new Date().toISOString().split('T')[0]}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="w-full p-4 bg-pmpe-blue/5 text-pmpe-blue rounded-2xl text-sm font-bold flex items-center justify-between hover:bg-pmpe-blue/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      <span>Exportar Dados (JSON)</span>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 opacity-30" />
                  </button>
                </div>
              </div>

              {/* Session block removed for restoration */}

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-pmpe-blue/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-pmpe-blue/5 pb-4">
                  <User className="w-5 h-5 text-pmpe-blue opacity-60" />
                  <h3 className="font-bold uppercase text-xs tracking-widest text-pmpe-blue">Informações do Sistema</h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Versão do App</span>
                    <span className="font-bold text-pmpe-blue">2.0.0 (PWA)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Batalhão</span>
                    <span className="font-bold text-pmpe-blue">14º BPM - PMPE</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Total de Registros Local</span>
                    <span className="font-bold text-pmpe-blue">{history.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        </>
      )}

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
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pmpe-blue/10 rounded-2xl flex items-center justify-center text-pmpe-blue">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-pmpe-blue">Acesso Restrito</h2>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Administração 14º BPM</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword('');
                    setLoginError(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-40 text-pmpe-blue tracking-widest">Senha de Administrador</label>
                  <input 
                    type="password"
                    autoFocus
                    className={`w-full p-4 bg-[#F9F9F7] border ${loginError ? 'border-pmpe-red' : 'border-black/10'} rounded-2xl text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-pmpe-blue/20`}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setLoginError(false);
                    }}
                    placeholder="••••••••"
                  />
                  {loginError && (
                    <p className="text-[10px] text-pmpe-red font-bold text-center uppercase tracking-wider">Senha incorreta. Tente novamente.</p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-pmpe-blue text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-pmpe-blue/90 shadow-lg shadow-pmpe-blue/20 transition-all"
                >
                  Entrar no Painel
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pmpe-blue/40 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-[40px] shadow-2xl text-center space-y-6 max-w-md w-full border-t-8 border-pmpe-blue">
              <div className="w-20 h-20 bg-pmpe-gold/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-pmpe-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-pmpe-blue">Checklist Finalizado!</h2>
                <p className="text-sm text-gray-500">Os dados foram salvos com sucesso. Agora você pode compartilhar ou gerar o PDF.</p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => generatePDF(true)}
                    disabled={isGeneratingPDF}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-white text-pmpe-blue border-2 border-pmpe-blue/10 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-pmpe-red" />}
                    Gerar PDF
                  </button>
                  <button 
                    onClick={() => shareWhatsApp()}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-pmpe-blue text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-pmpe-blue/90 transition-all shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar via WhatsApp
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-4 bg-gray-100 text-pmpe-blue rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                >
                  Finalizar e Voltar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pmpe-blue/10 p-4 flex justify-around md:hidden z-40">
        <button 
          onClick={() => setActiveTab('check')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'check' ? 'text-pmpe-blue scale-110' : 'opacity-40 text-pmpe-blue'}`}
        >
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Check</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-pmpe-blue scale-110' : 'opacity-40 text-pmpe-blue'}`}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Histórico</span>
        </button>
        <button 
          onClick={() => {
            if (isAdmin) {
              setActiveTab('settings');
            } else {
              setShowAdminLogin(true);
            }
          }}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-pmpe-blue scale-110' : 'opacity-40 text-pmpe-blue'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Ajustes</span>
        </button>
      </nav>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-24 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] border ${
              notification.type === 'error' 
                ? 'bg-pmpe-red text-white border-white/20' 
                : 'bg-green-500 text-white border-white/20'
            }`}
          >
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-sm font-bold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-auto p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPdfPreview && pdfPreviewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pmpe-blue text-white">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-pmpe-gold" />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Pré-visualização do PDF</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPdfPreview(false);
                    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 bg-gray-100 relative overflow-hidden">
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              </div>
              
              <div className="p-6 bg-white border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfPreviewUrl;
                    link.download = previewFilename;
                    link.click();
                  }}
                  className="bg-pmpe-blue text-white p-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-pmpe-blue/90 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Confirmar Download
                </button>
                <button
                  onClick={() => {
                    setShowPdfPreview(false);
                    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }}
                  className="bg-gray-100 text-gray-600 p-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Voltar para Ajustes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
