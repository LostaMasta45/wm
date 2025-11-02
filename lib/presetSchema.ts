import { z } from 'zod';

export const PresetSettingsSchema = z.object({
  canvas: z.object({
    ratio: z.string().default('3:4'),
    width: z.number().int().positive().default(1080),
    height: z.number().int().positive().default(1440),
    backgroundColor: z.string().default('#FFFFFF'),
  }),
  background: z.object({
    assetId: z.string().uuid().optional(),
    mode: z.enum(['cover']).default('cover'),
    blur: z.number().min(0).max(40).default(0),
    tint: z.object({
      color: z.string().default('#000000'),
      opacity: z.number().min(0).max(1).default(0),
    }),
  }),
  poster: z.object({
    paddingPct: z.number().min(0).max(30).default(0),
    shadow: z.object({
      enabled: z.boolean().default(true),
      blur: z.number().min(0).default(20),
      opacity: z.number().min(0).max(1).default(0.2),
      y: z.number().default(4),
    }),
    border: z.object({
      enabled: z.boolean().default(false),
      width: z.number().min(0).default(2),
      color: z.string().default('#FFFFFF'),
      radius: z.number().min(0).default(0),
    }),
    minScale: z.number().min(0.1).max(1).default(0.2),
    maxFill: z.boolean().default(false),
  }),
  watermark: z.object({
    assetId: z.string().uuid().optional(),
    mode: z.enum(['full', 'contain', 'tile']).default('full'),
    opacity: z.number().min(0).max(1).default(0.12),
    containScale: z.number().min(0).max(2).default(0.8),
    tile: z.object({
      angleDeg: z.number().min(0).max(90).default(30),
      gap: z.number().min(10).max(300).default(160),
      scale: z.number().min(0.1).max(2).default(0.6),
    }),
  }),
  footer: z.object({
    enabled: z.boolean().default(true),
    text: z.string().default('Tidak dipungut biaya apapun. Waspada penipuan.'),
    font: z.object({
      family: z.string().default('Inter'),
      weight: z.number().min(100).max(900).default(600),
      sizePx: z.number().min(10).max(60).default(28),
      tracking: z.number().default(0),
    }),
    color: z.string().default('#111111'),
    safePaddingPx: z.number().min(0).max(100).default(32),
    logoAssetId: z.string().uuid().nullable().default(null),
    align: z.enum(['left', 'center', 'right']).default('center'),
  }),
  exports: z.array(
    z.object({
      tag: z.string(),
      w: z.number().int().positive().optional(),
      h: z.number().int().positive().optional(),
      mm: z.object({ w: z.number(), h: z.number() }).optional(),
      dpi: z.number().int().positive().optional(),
      format: z.enum(['png', 'jpg', 'pdf']),
      quality: z.number().min(50).max(100).default(92),
    })
  ),
});

export type PresetSettings = z.infer<typeof PresetSettingsSchema>;

// Default preset settings
export const defaultPresetSettings: PresetSettings = {
  canvas: {
    ratio: '3:4',
    width: 1080,
    height: 1440,
    backgroundColor: '#FFFFFF',
  },
  background: {
    mode: 'cover',
    blur: 0,
    tint: {
      color: '#000000',
      opacity: 0,
    },
  },
  poster: {
    paddingPct: 0,
    shadow: {
      enabled: true,
      blur: 20,
      opacity: 0.2,
      y: 4,
    },
    border: {
      enabled: false,
      width: 2,
      color: '#FFFFFF',
      radius: 0,
    },
    minScale: 0.2,
    maxFill: false,
  },
  watermark: {
    mode: 'full',
    opacity: 0.12,
    containScale: 0.8,
    tile: {
      angleDeg: 30,
      gap: 160,
      scale: 0.6,
    },
  },
  footer: {
    enabled: true,
    text: 'Tidak dipungut biaya apapun. Waspada penipuan.',
    font: {
      family: 'Inter',
      weight: 600,
      sizePx: 28,
      tracking: 0,
    },
    color: '#111111',
    safePaddingPx: 32,
    logoAssetId: null,
    align: 'center',
  },
  exports: [
    {
      tag: '3x4_1080x1440',
      w: 1080,
      h: 1440,
      format: 'png',
      quality: 92,
    },
  ],
};
