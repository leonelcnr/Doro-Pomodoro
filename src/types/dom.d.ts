// Type definitions for Document Picture-in-Picture API
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API

interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPictureEventMap {
    "enter": Event;
}

interface DocumentPictureInPicture extends EventTarget {
    requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
    window: Window | null;
    addEventListener<K extends keyof DocumentPictureInPictureEventMap>(type: K, listener: (this: DocumentPictureInPicture, ev: DocumentPictureInPictureEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof DocumentPictureInPictureEventMap>(type: K, listener: (this: DocumentPictureInPicture, ev: DocumentPictureInPictureEventMap[K]) => void, options?: boolean | EventListenerOptions): void;
}

declare global {
    interface Window {
        documentPictureInPicture?: DocumentPictureInPicture;
    }
}

export {};
