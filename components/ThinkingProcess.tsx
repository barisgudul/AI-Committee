// components/ThinkingProcess.tsx
import React, { FC, useState, useEffect } from 'react';
import { BrainIcon } from './Icons'; // Sadece Beyin ikonunu kullanacağız
import styles from '../styles/Home.module.css';

interface ThinkingStage {
    label: string;
}

// Aşamaları basitleştirelim
const thinkingStages: ThinkingStage[] = [
    { label: "Analiz ediliyor..." },
    { label: "Olasılıklar değerlendiriliyor..." },
    { label: "Nihai plan oluşturuluyor..." },
];

// React.memo ile gereksiz re-render'ları önle
export const ThinkingProcess: FC = React.memo(() => {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);

    useEffect(() => {
        // Her 2.5 saniyede bir, son aşamaya gelene kadar metni değiştir.
        const stageTimer = setInterval(() => {
            setCurrentStageIndex(prevIndex => {
                if (prevIndex < thinkingStages.length - 1) {
                    return prevIndex + 1;
                }
                // Son aşamaya gelindiğinde tekrar 0'a dön (sonsuz döngü)
                return 0;
            });
        }, 2500); // Metin değiştirme hızı

        // Cleanup: Component unmount olduğunda timer'ı temizle (kritik!)
        return () => {
            clearInterval(stageTimer);
        };
    }, []); // Boş dependency array - sadece mount'ta çalış

    return (
        <div className={styles.thinkingContainer}>
            <div className={styles.thinkingMessage}>
                {/* Her zaman Beyin ikonunu göster */}
                <div className={styles.thinkingIcon}>
                    <BrainIcon />
                </div>
                {/* Metni dinamik olarak değiştir */}
                <span>{thinkingStages[currentStageIndex].label}</span>
            </div>
            {/* Bu yükleme çubuğu, cevap gelene kadar sürekli hareket edecek */}
            <div className={styles.thinkingProgressBar}>
                <div className={styles.thinkingProgressInfinite}></div>
            </div>
        </div>
    );
});

ThinkingProcess.displayName = 'ThinkingProcess';