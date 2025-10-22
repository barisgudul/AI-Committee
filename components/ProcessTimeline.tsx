// components/ProcessTimeline.tsx

import React, { useMemo } from 'react';
import { ProcessStep } from '../types/ProcessTypes';
import { StepRenderer } from './StepRenderer';
import { StatusIcon } from './StatusIcon';
import styles from '../styles/Home.module.css';

interface ProcessTimelineProps {
  steps: ProcessStep[];
}

// Performans için sadece son N adımı göster
const MAX_VISIBLE_STEPS = 20;

// React.memo ile gereksiz re-render'ları önle
export const ProcessTimeline: React.FC<ProcessTimelineProps> = React.memo(({ steps }) => {
  // Sadece görünür adımları hesapla - useMemo ile optimize edildi
  const visibleSteps = useMemo(() => {
    if (steps.length <= MAX_VISIBLE_STEPS) {
      return steps;
    }
    // Son MAX_VISIBLE_STEPS kadar adımı göster
    return steps.slice(-MAX_VISIBLE_STEPS);
  }, [steps]);
  
  // Gizlenen adım sayısını hesapla
  const hiddenCount = steps.length - visibleSteps.length;

  if (steps.length === 0) {
    return (
      <div className={styles.timelineContainer}>
        <div className={styles.timelineEmpty}>
          <p>Henüz işlem başlamadı...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {hiddenCount > 0 && (
        <div className={styles.timelineCollapsed}>
          <span>... {hiddenCount} önceki adım gizlendi (performans için)</span>
        </div>
      )}
      {visibleSteps.map((step, index) => (
        <div key={step.id} className={styles.timelineStep}>
          <div className={styles.timelineStatus}>
            <StatusIcon status={step.status} />
          </div>
          <div className={styles.timelineContent}>
            <StepRenderer step={step} />
          </div>
          {index < visibleSteps.length - 1 && (
            <div className={styles.timelineConnector} />
          )}
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Özel karşılaştırma fonksiyonu - sadece step sayısı veya son step değiştiyse render et
  if (prevProps.steps.length !== nextProps.steps.length) {
    return false; // Re-render et
  }
  
  // Array referansı aynıysa değişiklik yoktur
  if (prevProps.steps === nextProps.steps) {
    return true; // Re-render etme
  }
  
  const prevLast = prevProps.steps[prevProps.steps.length - 1];
  const nextLast = nextProps.steps[nextProps.steps.length - 1];
  
  // Son step yoksa veya ID'leri farklıysa re-render et
  if (!prevLast || !nextLast || prevLast.id !== nextLast.id) {
    return false; // Re-render et
  }
  
  // Status değişikliğinde re-render et
  if (prevLast.status !== nextLast.status) {
    return false; // Re-render et
  }
  
  // JSON.stringify yerine shallow comparison - çok daha hızlı
  const prevPayload = prevLast.payload;
  const nextPayload = nextLast.payload;
  
  // Payload'un temel özelliklerini karşılaştır (JSON.stringify'dan çok daha hızlı)
  if (prevPayload === nextPayload) return true; // Aynı referans
  
  // content/message gibi önemli alanları kontrol et
  const prevContent = ('content' in prevPayload ? prevPayload.content : '') || 
                      ('message' in prevPayload ? prevPayload.message : '') || '';
  const nextContent = ('content' in nextPayload ? nextPayload.content : '') || 
                      ('message' in nextPayload ? nextPayload.message : '') || '';
  
  return prevContent === nextContent;
});

ProcessTimeline.displayName = 'ProcessTimeline';
