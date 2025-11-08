// pages/index.tsx

import React, { useState, useRef, useEffect, FC, FormEvent, useMemo, useCallback } from 'react';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { SendIcon, BrainIcon, ArbiterLogoIcon, ArrowRightIcon, ImageIcon } from '../components/Icons';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { useOrchestration } from '../hooks/useOrchestration';
import { useCodeAnalysis } from '../hooks/useCodeAnalysis';
import { ProcessStep } from '../types/ProcessTypes';
import { ThinkingProcess } from '../components/ThinkingProcess';
import { FileDropZone } from '../components/FileDropZone';
import { FileList } from '../components/FileList';
import { useFileUpload } from '../hooks/useFileUpload';
import { formatFileSize } from '../types/FileTypes';

// State yapımızı güncelliyoruz
interface UserMessage {
  role: 'user';
  text: string;
  images?: Array<{ data: string; mimeType: string }>; // base64 fotoğraflar
}
interface ModelMessage {
  role: 'model';
  initialAnalysis: string;
  refinedAnalysis: string;
}
type Message = UserMessage | ModelMessage;

// --- YENİ KARŞILAMA EKRANI BİLEŞENİ ---
const WelcomeScreen: FC<{ 
  onSuggestionClick: (suggestion: string) => void;
  onCodeAnalysisClick: () => void;
}> = ({ onSuggestionClick, onCodeAnalysisClick }) => {
    // Önerileri daha zengin bir yapıya çevirelim
    const suggestions = [
        {
            title: "📁 Kod Klasörü Analizi",
            description: "Tüm projeni sürükle-bırak ile yükle ve AI'ya incelet.",
            query: "",
            isCodeAnalysis: true
        },
        {
            title: "Blog Sitesi Kurulumu",
            description: "Next.js ve Supabase ile adım adım plan oluştur.",
            query: "Next.js ve Supabase ile bir blog sitesi nasıl kurarım?",
            isCodeAnalysis: false
        },
        {
            title: "Kütüphane Karşılaştırması",
            description: "React form yönetimi için en iyi kütüphaneleri analiz et.",
            query: "React'ta form yönetimi için en iyi kütüphaneleri karşılaştır.",
            isCodeAnalysis: false
        },
        {
            title: "Component Oluşturma",
            description: "TailwindCSS ile responsive bir kart bileşeni tasarla.",
            query: "TailwindCSS kullanarak responsive bir kart bileşeni oluştur.",
            isCodeAnalysis: false
        },
        {
            title: "API Endpoint'leri Yazma",
            description: "Bir Express.js API'si için temel CRUD işlemlerini hazırla.",
            query: "Bir Express.js API'si için temel CRUD işlemlerini yaz.",
            isCodeAnalysis: false
        }
    ];

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeHeader}>
                <ArbiterLogoIcon />
                <h1 className={styles.welcomeTitle}>ArbiterAI</h1>
            </div>
            <div className={styles.suggestionsGrid}>
                {suggestions.map((sugg, i) => (
                    <button 
                        key={i} 
                        className={styles.suggestionCard} 
                        onClick={() => sugg.isCodeAnalysis ? onCodeAnalysisClick() : onSuggestionClick(sugg.query)}
                    >
                        <div className={styles.cardText}>
                            <strong>{sugg.title}</strong>
                            <span>{sugg.description}</span>
                        </div>
                        <div className={styles.cardIcon}><ArrowRightIcon /></div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Markdown için kod bloğu render bileşeni
const markdownComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code({inline, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={styles.inlineCode} {...props}>{children}</code>
    );
  }
};

// AI Mesajını gösterecek yeni component - React.memo ile optimize edildi
const ModelMessageComponent: FC<{ 
    message: ModelMessage;
}> = React.memo(({ message }) => {
    // Markdown içeriğini memoize et
    const renderedContent = useMemo(() => (
        <ReactMarkdown components={markdownComponents}>
            {message.refinedAnalysis}
        </ReactMarkdown>
    ), [message.refinedAnalysis]);

    return (
        <div className={styles.messageContainer}>
            <div className={styles.avatar}>
                <BrainIcon />
            </div>
            <div className={styles.messageContent}>
                {renderedContent}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Sadece refinedAnalysis değişirse re-render et
    return prevProps.message.refinedAnalysis === nextProps.message.refinedAnalysis;
});

ModelMessageComponent.displayName = 'ModelMessageComponent';

// Kullanıcı mesajını gösterecek component - React.memo ile optimize edildi
const UserMessageComponent: FC<{ 
    message: UserMessage;
}> = React.memo(({ message }) => {
    // Markdown içeriğini memoize et
    const renderedContent = useMemo(() => (
        message.text ? <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown> : null
    ), [message.text]);

    // Fotoğrafları render et
    const renderedImages = useMemo(() => {
        if (!message.images || message.images.length === 0) return null;
        
        return (
            <div className={styles.imagePreviewContainer}>
                {message.images.map((img, index) => (
                    <div key={index} className={styles.imagePreview}>
                        <Image 
                            src={`data:${img.mimeType};base64,${img.data}`}
                            alt={`Yüklenen fotoğraf ${index + 1}`}
                            className={styles.previewImage}
                            width={300}
                            height={300}
                            unoptimized
                        />
                    </div>
                ))}
            </div>
        );
    }, [message.images]);

    return (
        <div className={`${styles.messageContainer} ${styles.userMessage}`}>
            <div className={styles.messageContent}>
                {renderedImages}
                {renderedContent}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.message.text === nextProps.message.text &&
           JSON.stringify(prevProps.message.images) === JSON.stringify(nextProps.message.images);
});

UserMessageComponent.displayName = 'UserMessageComponent';

// FINAL_ANSWER ve FINAL_PLAN adımlarını render eden component - React.memo ile optimize edildi
const FinalStepRenderer: FC<{ steps: ProcessStep[] }> = React.memo(({ steps }) => {
    const finalSteps = useMemo(() => 
        steps.filter(s => s.type === 'FINAL_ANSWER' || s.type === 'FINAL_PLAN'),
        [steps]
    );
    
    // Her step'in render'ını memoize et
    const renderedSteps = useMemo(() => {
        if (finalSteps.length === 0) return null;
        
        return finalSteps.map(step => {
            if (step.type === 'FINAL_ANSWER') {
                return (
                    <div key={step.id} className={styles.finalAnswerSection}>
                        <ReactMarkdown components={markdownComponents}>
                            {step.payload.content}
                        </ReactMarkdown>
                    </div>
                );
            } else if (step.type === 'FINAL_PLAN') {
                const plan = step.payload.plan;
                return (
                    <div key={step.id} className={styles.finalPlanSection}>
                        <h3>🎯 Nihai Karar</h3>
                        <ReactMarkdown components={markdownComponents}>
                            {plan.finalDecision}
                        </ReactMarkdown>
                        
                        <h3>💡 Gerekçe</h3>
                        <ReactMarkdown components={markdownComponents}>
                            {plan.justification}
                        </ReactMarkdown>
                        
                        <h3>📋 Uygulama Planı</h3>
                        {plan.implementationPlan.map(p => (
                            <div key={p.step} className={styles.planStep}>
                                <h4>Adım {p.step}: {p.title}</h4>
                                <ReactMarkdown components={markdownComponents}>
                                    {p.details}
                                </ReactMarkdown>
                            </div>
                        ))}
                    </div>
                );
            }
            return null;
        });
    }, [finalSteps]);
    
    return <>{renderedSteps}</>;
}, (prevProps, nextProps) => {
    // Özel karşılaştırma - final step sayısı ve içeriği aynıysa re-render etme
    const prevFinal = prevProps.steps.filter(s => s.type === 'FINAL_ANSWER' || s.type === 'FINAL_PLAN');
    const nextFinal = nextProps.steps.filter(s => s.type === 'FINAL_ANSWER' || s.type === 'FINAL_PLAN');
    
    if (prevFinal.length !== nextFinal.length) return false;
    if (prevFinal.length === 0) return true;
    
    // Son final step'i karşılaştır
    const prevLast = prevFinal[prevFinal.length - 1];
    const nextLast = nextFinal[nextFinal.length - 1];
    
    return prevLast?.id === nextLast?.id && 
           JSON.stringify(prevLast?.payload) === JSON.stringify(nextLast?.payload);
});

FinalStepRenderer.displayName = 'FinalStepRenderer';

// localStorage için sabitler
const STORAGE_KEY = 'ai-komitesi-history';
const MAX_HISTORY_MESSAGES = 20; // Maksimum saklanacak mesaj sayısı (performans için sınırlandı)
const MAX_MESSAGE_LENGTH = 10000; // Maksimum mesaj uzunluğu (karakterde)

// Mesajı truncate et (çok uzun mesajlar için)
const truncateMessage = (message: Message): Message => {
    if (message.role === 'user') {
        if (message.text.length > MAX_MESSAGE_LENGTH) {
            return {
                ...message,
                text: message.text.substring(0, MAX_MESSAGE_LENGTH) + '\n\n... (mesaj çok uzun olduğu için kısaltıldı)'
            };
        }
        return message;
    } else {
        if (message.refinedAnalysis.length > MAX_MESSAGE_LENGTH) {
            return {
                ...message,
                refinedAnalysis: message.refinedAnalysis.substring(0, MAX_MESSAGE_LENGTH) + '\n\n... (mesaj çok uzun olduğu için kısaltıldı)'
            };
        }
        return message;
    }
};

// localStorage'dan history yükle
const loadHistoryFromStorage = (): Message[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as Message[];
            // Son MAX_HISTORY_MESSAGES mesajı al
            return parsed.slice(-MAX_HISTORY_MESSAGES);
        }
    } catch (error) {
        console.error('History yüklenemedi:', error);
        // Hatalı veri varsa temizle
        localStorage.removeItem(STORAGE_KEY);
    }
    return [];
};

// localStorage'a history kaydet
const saveHistoryToStorage = (history: Message[]) => {
    if (typeof window === 'undefined') return;
    try {
        // Son MAX_HISTORY_MESSAGES mesajı al ve truncate et
        const toSave = history.slice(-MAX_HISTORY_MESSAGES).map(truncateMessage);
        const jsonString = JSON.stringify(toSave);
        
        // localStorage quota kontrolü (5MB limiti)
        if (jsonString.length > 4.5 * 1024 * 1024) {
            console.warn('History çok büyük, daha az mesaj kaydediliyor');
            // Daha az mesaj kaydet
            const reducedHistory = history.slice(-Math.floor(MAX_HISTORY_MESSAGES / 2)).map(truncateMessage);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
        } else {
            localStorage.setItem(STORAGE_KEY, jsonString);
        }
    } catch (error) {
        console.error('History kaydedilemedi:', error);
        // Storage dolu olabilir, temizle ve daha az veri kaydet
        try {
            localStorage.removeItem(STORAGE_KEY);
            // Son 5 mesajı kaydetmeyi dene
            const minimalHistory = history.slice(-5).map(truncateMessage);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory));
        } catch {
            // ignore - storage tamamen dolu
            console.error('localStorage tamamen dolu, history kaydedilemedi');
        }
    }
};

export default function Home() {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    
    // --- 2. YENİ STATE: Anında yükleme durumu için ---
    const [isSending, setIsSending] = useState(false);
    
    // --- FILE UPLOAD STATE ---
    const [showFileModal, setShowFileModal] = useState(false);
    const [showAnalyzeButton, setShowAnalyzeButton] = useState(false);
    const fileUpload = useFileUpload();
    
    // --- IMAGE UPLOAD STATE ---
    const [selectedImages, setSelectedImages] = useState<Array<{ data: string; mimeType: string }>>([]);
    
    // Component mount olduğunda history'yi yükle
    useEffect(() => {
        const loaded = loadHistoryFromStorage();
        setHistory(loaded);
        setIsHistoryLoaded(true);
    }, []);
    
    // History değiştiğinde localStorage'a kaydet (ama sadece yüklendikten sonra)
    useEffect(() => {
        if (isHistoryLoaded && history.length > 0) {
            saveHistoryToStorage(history);
        }
    }, [history, isHistoryLoaded]);
    
    // Yeni orchestration hook'u
    const {
        processSteps,
        isComplete,
        error,
        submit,
        reset
    } = useOrchestration();
    
    // Kod analizi hook'u
    const { analyzeCode } = useCodeAnalysis();
    
    // İşlem tamamlanma durumunu track etmek için ref kullan (döngü önleme!)
    const lastProcessedComplete = useRef(false);
    
    // Asıl "işlem devam ediyor" durumu, backend'den adımlar geldiğinde aktif olur.
    const isLoading = !isComplete && processSteps.length > 0;
    
    // --- 3. BİRLEŞTİRİLMİŞ YÜKLEME DURUMU ---
    // isSending: Kullanıcı butona bastığı an true olur.
    // isLoading: Backend'den ilk veri geldiğinde true olur.
    // isThinking: İkisinden biri true ise, arayüz yükleme modundadır.
    const isThinking = isSending || isLoading;

    const statusCardClass = useMemo(() => {
        const modifier = styles[`statusCard-${fileUpload.uploadStatus.status}`];
        return [styles.statusCard, modifier].filter(Boolean).join(' ');
    }, [fileUpload.uploadStatus.status]);

    const uploadStatusLabel = useMemo(() => {
        switch (fileUpload.uploadStatus.status) {
            case 'uploading':
                return 'Dosyalar okunuyor';
            case 'processing':
                return 'Sunucuya aktarılıyor';
            case 'completed':
                return 'Yükleme tamamlandı';
            case 'error':
                return 'Yükleme hatası';
            default:
                return 'Hazır';
        }
    }, [fileUpload.uploadStatus.status]);

    const uploadStatusMessage = fileUpload.uploadStatus.error
        ? fileUpload.uploadStatus.error
        : fileUpload.uploadStatus.message || 'Hazırsanız dosyalarınızı ekleyin.';

    const sessionDisplay = fileUpload.sessionId
        ? `${fileUpload.sessionId.slice(0, 8)}…${fileUpload.sessionId.slice(-4)}`
        : 'Henüz oluşturulmadı';

    const lastUploadDisplay = fileUpload.stats.lastUploadAt
        ? new Date(fileUpload.stats.lastUploadAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : 'Bekleniyor';

    const fileSummaryText = fileUpload.files.length > 0
        ? `${fileUpload.files.length} dosya seçildi, analiz için hazır.`
        : 'Henüz dosya seçmediniz. Soldan yüklemeye başlayın.';
    
    // Process steps'i filtrele - useMemo ile sadece değiştiğinde hesapla
    const filteredSteps = useMemo(() => 
        processSteps.filter(s => s.type !== 'FINAL_ANSWER' && s.type !== 'FINAL_PLAN'),
        [processSteps]
    );

    // Scroll optimizasyonu - sadece history uzunluğu değiştiğinde scroll yap
    const historyLength = history.length;
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [historyLength]); // Sadece mesaj sayısı değiştiğinde scroll

    // Backend'den ilk veri geldiğinde ve işlem tamamlandığında state'leri yönet
    // DÜZELTME: history'yi dependency'den çıkararak döngüyü önledik!
    useEffect(() => {
        // Backend'den ilk veri paketi geldiğinde, anlık yükleme durumunu kapatabiliriz.
        if (processSteps.length > 0) {
            setIsSending(false);
        }

        // İşlem tamamlandığında history'ye ekle
        // Kritik: Sadece bir kez çalıştır (ref ile kontrol)
        if (isComplete && processSteps.length > 0 && !lastProcessedComplete.current) {
            lastProcessedComplete.current = true; // İşaretleme yap
            
            setHistory(prevHistory => {
                const lastMessage = prevHistory[prevHistory.length - 1];
                // Son mesaj kullanıcıysa ve henüz model cevabı eklenmemişse
                if (lastMessage?.role === 'user') {
                    const finalAnswerStep = processSteps.find(step => step.type === 'FINAL_ANSWER');
                    const finalPlanStep = processSteps.find(step => step.type === 'FINAL_PLAN');
                    
                    let finalAnswer = '';
                    if (finalAnswerStep) {
                        finalAnswer = finalAnswerStep.payload.content;
                    } else if (finalPlanStep) {
                        const plan = finalPlanStep.payload.plan;
                        finalAnswer = `### 🎯 Nihai Karar\n${plan.finalDecision}\n\n### 💡 Gerekçe\n${plan.justification}\n\n### 📋 Uygulama Planı\n${plan.implementationPlan.map(p => `**Adım ${p.step}: ${p.title}**\n${p.details}`).join('\n\n')}`;
                    } else {
                        finalAnswer = 'Analiz tamamlandı.';
                    }
                    
                    const newModelMessage: ModelMessage = {
                        role: 'model',
                        initialAnalysis: 'Analiz süreci tamamlandı',
                        refinedAnalysis: finalAnswer
                    };
                    
                    // Son MAX_HISTORY_MESSAGES mesajı tut (bellek optimizasyonu)
                    const newHistory = [...prevHistory, newModelMessage];
                    return newHistory.slice(-MAX_HISTORY_MESSAGES);
                }
                return prevHistory;
            });
            
            reset(); // Orchestration state'ini sıfırla
            setIsSending(false);
        }
        
        // Bir hata oluşursa da 'isSending' durumunu sıfırla
        if (error) {
            setIsSending(false);
        }
    }, [isComplete, processSteps, error, reset]); // history kaldırıldı!

    // OTOMATİK BÜYÜME İÇİN useEffect
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Önce sıfırla
            textarea.style.height = `${textarea.scrollHeight}px`; // Sonra içeriğin yüksekliğine ayarla
        }
    }, [input]); // Her input değiştiğinde çalış

    // --- YENİ FONKSİYON --- useCallback ile optimize edildi
    const handleSuggestionClick = useCallback((suggestion: string) => {
        setInput(suggestion);
        textareaRef.current?.focus(); // Input'a odaklan
    }, []);

    // --- FOTOĞRAF İŞLEME FONKSİYONLARI ---
    const convertFileToBase64 = useCallback((file: File): Promise<{ data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // base64 string'inden "data:image/jpeg;base64," kısmını temizle
                const base64Data = result.includes(',') ? result.split(',')[1] : result;
                resolve({
                    data: base64Data,
                    mimeType: file.type || 'image/jpeg'
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    const handleImageSelect = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            return;
        }

        try {
            const convertedImages = await Promise.all(
                imageFiles.map(file => convertFileToBase64(file))
            );
            setSelectedImages(prev => [...prev, ...convertedImages]);
        } catch (error) {
            console.error('Fotoğraf yükleme hatası:', error);
            alert('Fotoğraf yüklenirken bir hata oluştu');
        }
    }, [convertFileToBase64]);

    const handleImageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImageSelect(e.target.files);
            // Input'u temizle ki aynı dosya tekrar seçilebilsin
            e.target.value = '';
        }
    }, [handleImageSelect]);

    const handleImageClick = useCallback(() => {
        imageInputRef.current?.click();
    }, []);

    const removeImage = useCallback((index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleImageDrop = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageSelect(files);
        }
    }, [handleImageSelect]);

    const handleImageDragOver = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleSubmit = useCallback(async (e?: FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && selectedImages.length === 0) || isThinking) return;

        // --- 4. GÖNDERİM BAŞLADIĞINDA STATE'İ GÜNCELLE ---
        setIsSending(true);
        lastProcessedComplete.current = false; // Yeni işlem başladı, ref'i sıfırla

        const newUserMessage: UserMessage = { 
            role: 'user', 
            text: input || (selectedImages.length > 0 ? '[Fotoğraf gönderildi]' : ''),
            images: selectedImages.length > 0 ? selectedImages : undefined
        };
        // Son MAX_HISTORY_MESSAGES mesajı tut (bellek optimizasyonu)
        const newHistory = [...history, newUserMessage].slice(-MAX_HISTORY_MESSAGES);
        setHistory(newHistory);
        setInput('');
        setSelectedImages([]); // Fotoğrafları temizle

        // Orchestration hook'unu kullan
        try {
            // History'yi Content formatına çevir
            const historyContent = history.map(msg => {
                if (msg.role === 'user') {
                    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
                    
                    // Text ekle (varsa)
                    if (msg.text && msg.text.trim()) {
                        parts.push({ text: msg.text });
                    }
                    
                    // Images ekle (varsa)
                    if (msg.images && msg.images.length > 0) {
                        msg.images.forEach(img => {
                            parts.push({
                                inlineData: {
                                    mimeType: img.mimeType,
                                    data: img.data
                                }
                            });
                        });
                    }
                    
                    return { role: 'user' as const, parts };
                } else { // msg.role === 'model'
                    return { role: 'model' as const, parts: [{ text: msg.refinedAnalysis }] };
                }
            });

            // Yeni mesajı ekle
            const newParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
            if (input.trim()) {
                newParts.push({ text: input });
            }
            if (selectedImages.length > 0) {
                selectedImages.forEach(img => {
                    newParts.push({
                        inlineData: {
                            mimeType: img.mimeType,
                            data: img.data
                        }
                    });
                });
            }

            const taskText = input.trim() || (selectedImages.length > 0 ? 'Bu fotoğrafları analiz et' : '');
            await submit(taskText, [
                ...historyContent,
                ...(newParts.length > 0 ? [{ role: 'user' as const, parts: newParts }] : [])
            ]);
        } catch (submitError) {
            console.error('Submit error:', submitError);
            setIsSending(false); // Gönderim başarısız olursa da yüklemeyi durdur
        }
    }, [input, selectedImages, isThinking, history, submit]);

    // YENİ FONKSİYON: ENTER VE SHIFT+ENTER KONTROLÜ - useCallback ile optimize edildi
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Yeni satır oluşturmasını engelle
            handleSubmit();
        }
    }, [handleSubmit]);

    // Yeni sohbet başlatma fonksiyonu - useCallback ile optimize edildi
    const handleNewChat = useCallback(() => {
        setHistory([]);
        reset();
        setIsSending(false);
        // localStorage'ı temizle
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [reset]);
    
    // --- FILE UPLOAD FONKSİYONLARI ---
    const handleCodeAnalysisClick = useCallback(() => {
        setShowFileModal(true);
    }, []);
    
    const handleFilesSelected = useCallback(async (files: FileList | File[]) => {
        await fileUpload.uploadFiles(files);
        setShowAnalyzeButton(true);
    }, [fileUpload]);
    
    const handleAnalyzeCode = useCallback(async () => {
        if (!fileUpload.sessionId || fileUpload.files.length === 0) {
            alert('Lütfen önce dosyaları yükleyin');
            return;
        }
        
        // Debug: SessionId'yi kontrol et
        console.log('[ANALYZE] SessionId:', fileUpload.sessionId);
        console.log('[ANALYZE] Files count:', fileUpload.files.length);
        
        // YÜKLEME TAMAMLANANA DEK BEKLE (gating)
        // uploadStatus.completed durumunu bekle, kısa backoff ile birkaç kez dene
        let waitAttempts = 0;
        const maxWaitAttempts = 5; // ~2.5s toplam (5 * 500ms)
        while (
            waitAttempts < maxWaitAttempts &&
            (fileUpload.uploadStatus.status === 'uploading' || fileUpload.uploadStatus.status === 'processing')
        ) {
            await new Promise(r => setTimeout(r, 500));
            waitAttempts += 1;
        }
        
        setShowFileModal(false);
        setIsSending(true);
        lastProcessedComplete.current = false;
        
        // Dosya listesi özeti oluştur
        const fileListSummary = fileUpload.files
            .slice(0, 10)
            .map(f => `- ${f.path}`)
            .join('\n');
        const moreFiles = fileUpload.files.length > 10 ? `\n... ve ${fileUpload.files.length - 10} dosya daha` : '';
        
        const analysisMessage = `📁 **Kod Analizi Başlatıldı**\n\n${fileUpload.files.length} dosya analiz ediliyor:\n${fileListSummary}${moreFiles}`;
        const newUserMessage: UserMessage = { role: 'user', text: analysisMessage };
        setHistory(prev => [...prev, newUserMessage]);
        
        // Yeni bir model mesajı oluştur (streaming için)
        const streamingMessage: ModelMessage = {
            role: 'model',
            initialAnalysis: '',
            refinedAnalysis: ''
        };
        
        // Başlangıç mesajını history'ye ekle
        setHistory(prev => [...prev, streamingMessage]);
        
        // Kullanıcıya net geri bildirim: başlangıç ve olası bekleme
        const waitedMs = waitAttempts * 500;
        if (waitedMs > 0) {
            setHistory(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    updated[updated.length - 1] = {
                        ...lastMessage,
                        refinedAnalysis: `⏳ Analiz başlatılıyor... Yüklemelerin tamamlanması bekleniyor (~${waitedMs}ms)`
                    };
                }
                return updated;
            });
        } else {
            setHistory(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    updated[updated.length - 1] = {
                        ...lastMessage,
                        refinedAnalysis: '🔍 Analiz başlatılıyor...'
                    };
                }
                return updated;
            });
        }
        
        try {
            // useCodeAnalysis hook'unu kullan
            await analyzeCode(
                fileUpload.sessionId,
                history.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.role === 'user' ? msg.text : msg.refinedAnalysis }]
                })),
                'full',
                // onUpdate callback - streaming güncellemeleri
                (text) => {
                    setHistory(prev => {
                        const updated = [...prev];
                        const lastMessage = updated[updated.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            updated[updated.length - 1] = {
                                ...lastMessage,
                                refinedAnalysis: text
                            };
                        }
                        return updated;
                    });
                },
                // onComplete callback - analiz tamamlandı
                (text) => {
                    setHistory(prev => {
                        const updated = [...prev];
                        const lastMessage = updated[updated.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            updated[updated.length - 1] = {
                                ...lastMessage,
                                refinedAnalysis: text,
                                initialAnalysis: text
                            };
                        }
                        return updated;
                    });
                    setIsSending(false);
                },
                // onError callback - hata durumu
                (errorMsg) => {
                    setHistory(prev => {
                        const updated = [...prev];
                        const lastMessage = updated[updated.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            updated[updated.length - 1] = {
                                ...lastMessage,
                                refinedAnalysis: `❌ **Hata**\n\n${errorMsg}`
                            };
                        }
                        return updated;
                    });
                    setIsSending(false);
                }
            );
            
            // Analiz sonrası dosyaları temizle (isteğe bağlı)
            // fileUpload.clearAllFiles();
            
        } catch (error) {
            console.error('Code analysis error:', error);
            setIsSending(false);
            
            // Hata mesajını göster
            const errorMessage: ModelMessage = {
                role: 'model',
                initialAnalysis: '',
                refinedAnalysis: `❌ **Analiz Hatası**\n\n${error instanceof Error ? error.message : 'Kod analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.'}`
            };
            setHistory(prev => [...prev, errorMessage]);
        }
    }, [fileUpload, history, analyzeCode]);
    
    // Dosyalar değiştiğinde analyze butonunu göster/gizle
    useEffect(() => {
        setShowAnalyzeButton(fileUpload.files.length > 0);
    }, [fileUpload.files.length]);

    return (
        <div className={styles.page}>
            {/* Yeni Sohbet Butonu - sadece history varsa göster */}
            {history.length > 0 && !isThinking && (
                <div className={styles.newChatButtonContainer}>
                    <button onClick={handleNewChat} className={styles.newChatButton}>
                        ✨ Yeni Sohbet
                    </button>
                </div>
            )}
            
            <main className={styles.chatContainer}>
                <div className={styles.messageList}>
                    {/* Karşılama mesajı ve öneriler */}
                    {history.length === 0 && !isThinking && processSteps.length === 0 ? (
                        <WelcomeScreen 
                            onSuggestionClick={handleSuggestionClick} 
                            onCodeAnalysisClick={handleCodeAnalysisClick}
                        />
                    ) : (
                        <>
                            {/* Geçmiş mesajları göster - optimize edilmiş rendering */}
                            {history.map((msg, index) =>
                                msg.role === 'user' ? (
                                    <UserMessageComponent 
                                        key={`user-${index}-${msg.text?.substring(0, 20) || ''}-${msg.images?.length || 0}`} 
                                        message={msg}
                                    />
                                ) : (
                                    <ModelMessageComponent 
                                        key={`model-${index}-${msg.refinedAnalysis.substring(0, 20)}`} 
                                        message={msg}
                                    />
                                )
                            )}
                        </>
                    )}
                    
                    {/* --- 5. YENİ YÜKLEME GÖSTERİMİ MANTIĞI --- */}
                    {isThinking && (
                        <div className={styles.messageContainer}>
                             <div className={styles.avatar}><BrainIcon /></div>
                             <div className={styles.messageContent}>
                                 {/* Henüz backend'den adım gelmediyse genel animasyonu göster */}
                                 {isSending && processSteps.length === 0 ? (
                                     <ThinkingProcess />
                                 ) : (
                                     <>
                                         {/* Adımlar gelmeye başlayınca detaylı timeline'ı göster */}
                                         <ProcessTimeline steps={filteredSteps} />
                                         
                                         {/* Final cevapları canlı olarak göster */}
                                         <FinalStepRenderer steps={processSteps} />
                                     </>
                                 )}
                                 
                                 {error && (
                                     <div className={styles.errorMessage}>
                                         <strong>Hata:</strong> {error}
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            {/* File Upload Modal */}
            {showFileModal && (
                <div className={styles.fileModalBackdrop} onClick={() => setShowFileModal(false)}>
                    <div className={styles.fileModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.fileModalHeader}>
                            <h2>Kod Klasörü Analizi</h2>
                            <button 
                                className={styles.modalCloseButton}
                                onClick={() => setShowFileModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.fileModalContent}>
                            <aside className={styles.modalSidebar}>
                                <div className={styles.sidebarIntro}>
                                    <span className={styles.sidebarEyebrow}>Yükleme Merkezi</span>
                                    <h3>Kod klasörünü birkaç saniyede içeri al</h3>
                                    <p>Proje klasörünü sürükle-bırak ya da seç. Desteklenmeyen ya da tekrarlayan dosyaları otomatik filtreliyoruz.</p>
                                </div>
                                <FileDropZone 
                                    onFilesSelected={handleFilesSelected}
                                    uploadStatus={fileUpload.uploadStatus}
                                    disabled={fileUpload.uploadStatus.status === 'uploading'}
                                    className={styles.sidebarDropZone}
                                />
                                <div className={statusCardClass}>
                                    <div className={styles.statusHeader}>
                                        <span className={styles.statusDot} />
                                        <span className={styles.statusLabel}>{uploadStatusLabel}</span>
                                    </div>
                                    <p className={styles.statusMessage}>{uploadStatusMessage}</p>
                                </div>
                                <div className={styles.statGrid}>
                                    <div className={styles.statCard}>
                                        <span className={styles.statLabel}>Toplam Dosya</span>
                                        <span className={styles.statValue}>{fileUpload.files.length}</span>
                                    </div>
                                    <div className={styles.statCard}>
                                        <span className={styles.statLabel}>Toplam Boyut</span>
                                        <span className={styles.statValue}>{fileUpload.files.length > 0 ? formatFileSize(fileUpload.totalSize) : '0 Bytes'}</span>
                                    </div>
                                    <div className={styles.statCard}>
                                        <span className={styles.statLabel}>Atlanan</span>
                                        <span className={styles.statValue}>{fileUpload.stats.ignoredCount + fileUpload.stats.skippedCount}</span>
                                        <span className={styles.statHint}>ignored + filtrelenen</span>
                                    </div>
                                    <div className={styles.statCard}>
                                        <span className={styles.statLabel}>Çift Kopya</span>
                                        <span className={styles.statValue}>{fileUpload.stats.duplicateCount}</span>
                                        <span className={styles.statHint}>tekilleştirildi</span>
                                    </div>
                                </div>
                                <div className={styles.sessionCard}>
                                    <div className={styles.sessionRow}>
                                        <span className={styles.sessionLabel}>Oturum Kimliği</span>
                                        <code className={styles.sessionValue}>{sessionDisplay}</code>
                                    </div>
                                    <div className={styles.sessionRow}>
                                        <span className={styles.sessionLabel}>Son Yükleme</span>
                                        <span className={styles.sessionValue}>{lastUploadDisplay}</span>
                                    </div>
                                </div>
                            </aside>
                            <section className={styles.modalMain}>
                                <div className={styles.modalMainHeader}>
                                    <div>
                                        <h3>Proje Dosyaları</h3>
                                        <p>{fileSummaryText}</p>
                                    </div>
                                    {showAnalyzeButton && fileUpload.files.length > 0 && (
                                        <button 
                                            className={styles.analyzeButton}
                                            onClick={handleAnalyzeCode}
                                            disabled={fileUpload.uploadStatus.status === 'uploading'}
                                        >
                                            🔍 Analiz Et ({fileUpload.files.length})
                                        </button>
                                    )}
                                </div>
                                <div className={styles.modalMainBody}>
                                    {fileUpload.files.length > 0 ? (
                                        <FileList 
                                            files={fileUpload.files}
                                            onRemoveFile={fileUpload.removeFile}
                                            onClearAll={fileUpload.clearAllFiles}
                                            getFileContent={fileUpload.getFileContent}
                                        />
                                    ) : (
                                        <div className={styles.modalEmptyState}>
                                            <div className={styles.modalEmptyIcon}>🗂️</div>
                                            <p>Başlamak için soldaki alana dosya veya klasör bırakın.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            <footer className={styles.footer}>
                {/* Fotoğraf Önizleme */}
                {selectedImages.length > 0 && (
                    <div className={styles.selectedImagesContainer}>
                        {selectedImages.map((img, index) => (
                            <div key={index} className={styles.selectedImageWrapper}>
                                <Image 
                                    src={`data:${img.mimeType};base64,${img.data}`}
                                    alt={`Seçili fotoğraf ${index + 1}`}
                                    className={styles.selectedImage}
                                    width={60}
                                    height={60}
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    className={styles.removeImageButton}
                                    onClick={() => removeImage(index)}
                                    aria-label="Fotoğrafı kaldır"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSubmit} className={styles.inputForm}>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageInputChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className={styles.imageButton}
                        onClick={handleImageClick}
                        disabled={isThinking}
                        aria-label="Fotoğraf ekle"
                    >
                        <ImageIcon />
                    </button>
                    <textarea
                        ref={textareaRef}
                        className={`${styles.input} ${isThinking ? styles.inputThinking : ''}`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isThinking ? "Cevap hazırlanıyor..." : "Bir fikir veya görev girin..."}
                        disabled={isThinking}
                        rows={1} // Tek satır olarak başla
                        onKeyDown={handleKeyDown} // Klavye olaylarını dinle
                        onDrop={handleImageDrop} // Fotoğraf sürükle-bırak
                        onDragOver={handleImageDragOver}
                    />
                    <button 
                        type="submit" 
                        className={styles.sendButton} 
                        disabled={isThinking || (!input.trim() && selectedImages.length === 0)}
                    >
                        <SendIcon />
                    </button>
                </form>
                <p className={styles.disclaimer}>ArbiterAI - Personal Power Tool</p>
            </footer>
        </div>
    );
}