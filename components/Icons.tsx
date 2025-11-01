// components/Icons.tsx

export const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 .646-.12 1.263-.34 1.83l.86 1.17c.18.24.18.58 0 .82l-1.3 1.68a.5.5 0 0 1-.78.08c-.275-.347-.55-.693-.825-1.04a5.5 5.5 0 0 0-4.91 0c-.275.347-.55.693-.825 1.04a.5.5 0 0 1-.78-.08l-1.3-1.68a.5.5 0 0 1 0-.82l.86-1.17A3.5 3.5 0 0 1 8.5 8.5 3.5 3.5 0 0 1 12 5Z" />
    <path d="M12 5a3.5 3.5 0 0 0-3.5 3.5c0 .646.12 1.263.34 1.83m6.32 0c.22-.567.34-1.184.34-1.83A3.5 3.5 0 0 0 12 5m0 0V3" />
    <path d="M14.5 3.5c.333.333.5.833.5 1.5m-5 0c-.333.333-.5.833-.5 1.5" />
    <path d="M6.5 12.5a5.5 5.5 0 0 0 11 0" />
    <path d="M12 18a5.5 5.5 0 0 0 5.5-5.5m-11 0A5.5 5.5 0 0 0 12 18m0 0v2.5" />
  </svg>
);

export const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// --- YENİ GEMINI YÜKLEME İNDİKATÖRÜ ---
export const GeminiLoadingIndicator = () => (
    <div style={{
        width: '100%',
        height: '4px',
        borderRadius: '2px',
        background: 'linear-gradient(90deg, #4285F4, #9B59B6, #F4B400, #DB4437, #4285F4)',
        backgroundSize: '400% 100%',
        animation: 'gemini-loading 3s linear infinite'
    }}>
        <style>{`
            @keyframes gemini-loading {
                0% { background-position: 400% 50%; }
                100% { background-position: 0% 50%; }
            }
        `}</style>
    </div>
);

// --- YENİ ÖZGÜN ARBITER LOGOSU (SparklesIcon yerine) ---
export const ArbiterLogoIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--text-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="var(--secondary-text-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="var(--secondary-text-color)" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// --- KARTLAR İÇİN DAHA MİNİMALİST BİR İKON (CompassIcon yerine) ---
export const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

export const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1.51-1V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
  </svg>
);

export const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);
