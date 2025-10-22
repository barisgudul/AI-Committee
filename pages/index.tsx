// pages/index.tsx

import React, { useState, useRef, useEffect, FC, FormEvent, useMemo, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { SendIcon, BrainIcon, ArbiterLogoIcon, ArrowRightIcon } from '../components/Icons';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { useOrchestration } from '../hooks/useOrchestration';
import { ProcessStep } from '../types/ProcessTypes';
import { ThinkingProcess } from '../components/ThinkingProcess'; // <-- 1. EKLENEN IMPORT

// State yapımızı güncelliyoruz
interface UserMessage {
  role: 'user';
  text: string;
}
interface ModelMessage {
  role: 'model';
  initialAnalysis: string;
  refinedAnalysis: string;
}
type Message = UserMessage | ModelMessage;

// --- YENİ KARŞILAMA EKRANI BİLEŞENİ ---
const WelcomeScreen: FC<{ onSuggestionClick: (suggestion: string) => void }> = ({ onSuggestionClick }) => {
    // Önerileri daha zengin bir yapıya çevirelim
    const suggestions = [
        {
            title: "Blog Sitesi Kurulumu",
            description: "Next.js ve Supabase ile adım adım plan oluştur.",
            query: "Next.js ve Supabase ile bir blog sitesi nasıl kurarım?",
        },
        {
            title: "Kütüphane Karşılaştırması",
            description: "React form yönetimi için en iyi kütüphaneleri analiz et.",
            query: "React'ta form yönetimi için en iyi kütüphaneleri karşılaştır.",
        },
        {
            title: "Component Oluşturma",
            description: "TailwindCSS ile responsive bir kart bileşeni tasarla.",
            query: "TailwindCSS kullanarak responsive bir kart bileşeni oluştur.",
        },
        {
            title: "API Endpoint'leri Yazma",
            description: "Bir Express.js API'si için temel CRUD işlemlerini hazırla.",
            query: "Bir Express.js API'si için temel CRUD işlemlerini yaz.",
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
                    <button key={i} className={styles.suggestionCard} onClick={() => onSuggestionClick(sugg.query)}>
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
        <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
    ), [message.text]);

    return (
        <div className={`${styles.messageContainer} ${styles.userMessage}`}>
            <div className={styles.messageContent}>
                {renderedContent}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.message.text === nextProps.message.text;
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
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    
    // --- 2. YENİ STATE: Anında yükleme durumu için ---
    const [isSending, setIsSending] = useState(false);
    
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
    
    // İşlem tamamlanma durumunu track etmek için ref kullan (döngü önleme!)
    const lastProcessedComplete = useRef(false);
    
    // Asıl "işlem devam ediyor" durumu, backend'den adımlar geldiğinde aktif olur.
    const isLoading = !isComplete && processSteps.length > 0;
    
    // --- 3. BİRLEŞTİRİLMİŞ YÜKLEME DURUMU ---
    // isSending: Kullanıcı butona bastığı an true olur.
    // isLoading: Backend'den ilk veri geldiğinde true olur.
    // isThinking: İkisinden biri true ise, arayüz yükleme modundadır.
    const isThinking = isSending || isLoading;
    
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

    const handleSubmit = useCallback(async (e?: FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isThinking) return;

        // --- 4. GÖNDERİM BAŞLADIĞINDA STATE'İ GÜNCELLE ---
        setIsSending(true);
        lastProcessedComplete.current = false; // Yeni işlem başladı, ref'i sıfırla

        const newUserMessage: UserMessage = { role: 'user', text: input };
        // Son MAX_HISTORY_MESSAGES mesajı tut (bellek optimizasyonu)
        const newHistory = [...history, newUserMessage].slice(-MAX_HISTORY_MESSAGES);
        setHistory(newHistory);
        setInput('');

        // Orchestration hook'unu kullan
        try {
            await submit(input, history.map(msg => {
                if (msg.role === 'user') {
                    return { role: 'user', parts: [{ text: msg.text }] };
                } else { // msg.role === 'model'
                    return { role: 'model', parts: [{ text: msg.refinedAnalysis }] };
                }
            }));
        } catch (submitError) {
            console.error('Submit error:', submitError);
            setIsSending(false); // Gönderim başarısız olursa da yüklemeyi durdur
        }
    }, [input, isThinking, history, submit]);

    // YENİ FONKSİYON: ENTER VE SHIFT+ENTER KONTROLÜ - useCallback ile optimize edildi
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Yeni satır oluşturmasını engelle
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <div className={styles.page}>
            <main className={styles.chatContainer}>
                <div className={styles.messageList}>
                    {/* Karşılama mesajı ve öneriler */}
                    {history.length === 0 && !isThinking && processSteps.length === 0 ? (
                        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                    ) : (
                        <>
                            {/* Geçmiş mesajları göster - optimize edilmiş rendering */}
                            {history.map((msg, index) =>
                                msg.role === 'user' ? (
                                    <UserMessageComponent 
                                        key={`user-${index}-${msg.text.substring(0, 20)}`} 
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

            <footer className={styles.footer}>
                <form onSubmit={handleSubmit} className={styles.inputForm}>
                    <textarea
                        ref={textareaRef}
                        className={`${styles.input} ${isThinking ? styles.inputThinking : ''}`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isThinking ? "Cevap hazırlanıyor..." : "Bir fikir veya görev girin..."}
                        disabled={isThinking}
                        rows={1} // Tek satır olarak başla
                        onKeyDown={handleKeyDown} // Klavye olaylarını dinle
                    />
                    <button type="submit" className={styles.sendButton} disabled={isThinking || !input.trim()}>
                        <SendIcon />
                    </button>
                </form>
                <p className={styles.disclaimer}>ArbiterAI - Personal Power Tool</p>
            </footer>
        </div>
    );
}