/**
 * Image processing utilities for client-side operations
 */
export interface CropOptions {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ResizeOptions {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
}
/**
 * Crop an image file
 */
export declare function cropImage(file: File, cropOptions: CropOptions): Promise<Blob>;
/**
 * Resize an image while maintaining aspect ratio
 */
export declare function resizeImage(file: File, options: ResizeOptions): Promise<Blob>;
/**
 * Get image dimensions from file
 */
export declare function getImageDimensions(file: File): Promise<{
    width: number;
    height: number;
}>;
/**
 * Validate image file
 */
export declare function validateImageFile(file: File): {
    valid: boolean;
    error?: string;
};
/**
 * Validate video file
 */
export declare function validateVideoFile(file: File): {
    valid: boolean;
    error?: string;
};
/**
 * Convert blob to File object
 */
export declare function blobToFile(blob: Blob, filename: string): File;
//# sourceMappingURL=image-processing.d.ts.map