/**
 * Color Extractor Utility
 * Extracts dominant colors from images using ColorThief
 */

export interface ExtractedColors {
  dominant: string;
  palette: string[];
  vibrant: string;
  muted: string;
}

/**
 * Extract dominant color and palette from image
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = async () => {
      try {
        // Create canvas to get pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size (smaller for performance)
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Extract colors
        const colorMap = new Map<string, number>();
        const colorSamples: number[][] = [];
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Skip very dark or very light pixels
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 235) continue;
          
          const colorKey = `${r},${g},${b}`;
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
          colorSamples.push([r, g, b]);
        }
        
        // Find dominant color (most frequent)
        let dominantColor = [128, 128, 128];
        let maxCount = 0;
        
        colorMap.forEach((count, colorKey) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = colorKey.split(',').map(Number);
          }
        });
        
        // Calculate average color for muted version
        let avgR = 0, avgG = 0, avgB = 0;
        colorSamples.forEach(([r, g, b]) => {
          avgR += r;
          avgG += g;
          avgB += b;
        });
        const count = colorSamples.length || 1;
        avgR = Math.round(avgR / count);
        avgG = Math.round(avgG / count);
        avgB = Math.round(avgB / count);
        
        // Find vibrant color (high saturation)
        let vibrantColor = dominantColor;
        let maxSaturation = 0;
        
        colorSamples.forEach(([r, g, b]) => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          
          if (saturation > maxSaturation) {
            maxSaturation = saturation;
            vibrantColor = [r, g, b];
          }
        });
        
        // Create palette (dominant + variations)
        const palette = [
          rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]),
          rgbToHex(...lighten(dominantColor, 0.2) as [number, number, number]),
          rgbToHex(...darken(dominantColor, 0.2) as [number, number, number]),
          rgbToHex(...saturate(dominantColor, 0.3) as [number, number, number]),
          rgbToHex(...desaturate(dominantColor, 0.3) as [number, number, number]),
        ];
        
        resolve({
          dominant: rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]),
          palette,
          vibrant: rgbToHex(vibrantColor[0], vibrantColor[1], vibrantColor[2]),
          muted: rgbToHex(avgR, avgG, avgB),
        });
        
      } catch (error) {
        console.error('Color extraction error:', error);
        // Return default gray if extraction fails
        resolve({
          dominant: '#808080',
          palette: ['#808080', '#A0A0A0', '#606060', '#909090', '#707070'],
          vibrant: '#808080',
          muted: '#808080',
        });
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for color extraction');
      // Return default gray if image load fails
      resolve({
        dominant: '#808080',
        palette: ['#808080', '#A0A0A0', '#606060', '#909090', '#707070'],
        vibrant: '#808080',
        muted: '#808080',
      });
    };
    
    img.src = imageUrl;
  });
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Lighten color
 */
function lighten(rgb: number[], amount: number): number[] {
  return rgb.map(c => Math.min(255, c + (255 - c) * amount));
}

/**
 * Darken color
 */
function darken(rgb: number[], amount: number): number[] {
  return rgb.map(c => Math.max(0, c * (1 - amount)));
}

/**
 * Increase saturation
 */
function saturate(rgb: number[], amount: number): number[] {
  const [r, g, b] = rgb;
  const gray = (r + g + b) / 3;
  return [
    r + (r - gray) * amount,
    g + (g - gray) * amount,
    b + (b - gray) * amount,
  ];
}

/**
 * Decrease saturation
 */
function desaturate(rgb: number[], amount: number): number[] {
  const [r, g, b] = rgb;
  const gray = (r + g + b) / 3;
  return [
    r - (r - gray) * amount,
    g - (g - gray) * amount,
    b - (b - gray) * amount,
  ];
}

/**
 * Get complementary color
 */
export function getComplementaryColor(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Get complementary (opposite on color wheel)
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

/**
 * Check if color is light or dark
 */
export function isLightColor(hex: string): boolean {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

/**
 * Get readable text color (black or white) for background
 */
export function getContrastColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}
