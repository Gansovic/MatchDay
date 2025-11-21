interface ShowOptions<T> {
    title: string;
    message: string;
    estimatedDuration?: number;
    operation: () => Promise<T>;
    onProgress?: (progress: number) => void;
}
declare class LoadingDialogService {
    private static instance;
    private currentDialog;
    private currentRoot;
    static getInstance(): LoadingDialogService;
    show<T>({ title, message, estimatedDuration, operation, onProgress }: ShowOptions<T>): Promise<T>;
    private render;
    hide(): void;
}
export declare const LoadingDialog: LoadingDialogService;
export {};
//# sourceMappingURL=loading-dialog.d.ts.map