export interface AudioBook {
    fileId: string;
    fileUrl? : string;
    title: string;
    userId: string;
    originalFileName?: string;
    createdAt: Date;
    audioUrl?: string
}


export interface NavigationProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export interface UploadProps {
    audioBooks: AudioBook[];
    setAudioBooks: React.Dispatch<React.SetStateAction<AudioBook[]>>;
}

export interface AudioPlayerProps {
    audioBooks: AudioBook[];
}

export interface LandingProps {
    // No props needed for landing page
}