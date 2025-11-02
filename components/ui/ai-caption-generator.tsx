'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, RefreshCw, Check } from 'lucide-react';

type ToneType = 'casual' | 'professional' | 'urgent' | 'inspiring';

interface Tone {
  id: ToneType;
  label: string;
  icon: string;
  description: string;
}

const tones: Tone[] = [
  { id: 'casual', label: 'Casual', icon: '😎', description: 'Friendly & approachable' },
  { id: 'professional', label: 'Professional', icon: '💼', description: 'Formal & business' },
  { id: 'urgent', label: 'Urgent', icon: '🔥', description: 'Immediate action needed' },
  { id: 'inspiring', label: 'Inspiring', icon: '✨', description: 'Motivational & uplifting' },
];

interface AICaptionGeneratorProps {
  posterContext?: string;
  onGenerate?: (caption: string, hashtags: string[]) => void;
}

export default function AICaptionGenerator({ posterContext, onGenerate }: AICaptionGeneratorProps) {
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCaption = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sampleCaptions = {
      casual: '🎯 Lowongan kerja baru nih! Buruan cek detailnya sebelum kehabisan. Cocok banget buat kamu yang lagi cari peluang karir baru! 💼',
      professional: 'Kami membuka lowongan untuk posisi yang tersedia. Silakan hubungi kontak yang tertera untuk informasi lebih lanjut mengenai persyaratan dan benefit yang ditawarkan.',
      urgent: '⚡ SEGERA! Lowongan terbatas untuk posisi ini. Kirim lamaran Anda sekarang juga! Jangan sampai kehabisan kesempatan emas ini! 🔥',
      inspiring: '✨ Waktunya meraih impian karirmu! Kesempatan emas menanti, jadilah bagian dari tim yang luar biasa. Your future starts here! 🚀',
    };

    const sampleHashtagsMap = {
      casual: ['#loker', '#lowongankerja', '#karirbaru', '#infolomba', '#jobopenings'],
      professional: ['#recruitment', '#careeropportunity', '#hiring', '#jobvacancy', '#humanresources'],
      urgent: ['#lowongankerjasegera', '#urgentrecruit', '#jobsavailable', '#segeradaftar', '#limitedslots'],
      inspiring: ['#careergoals', '#dreambig', '#successstory', '#opportunities', '#growthmindset'],
    };

    const generatedCaption = sampleCaptions[selectedTone];
    const generatedHashtags = sampleHashtagsMap[selectedTone];

    setCaption(generatedCaption);
    setHashtags(generatedHashtags);
    setIsGenerating(false);

    if (onGenerate) {
      onGenerate(generatedCaption, generatedHashtags);
    }
  };

  const handleCopy = () => {
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">AI Caption Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate engaging captions instantly
          </p>
        </div>
      </div>

      {/* Tone Selector */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Select Tone
        </label>
        <div className="grid grid-cols-2 gap-3">
          {tones.map((tone) => (
            <motion.button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedTone === tone.id
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border hover:border-primary/50 bg-card'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tone.icon}</span>
                <div>
                  <div className="font-semibold text-foreground">{tone.label}</div>
                  <div className="text-xs text-muted-foreground">{tone.description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateCaption}
        disabled={isGenerating}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Caption</span>
          </>
        )}
      </button>

      {/* Generated Caption */}
      {caption && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Caption Text */}
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Caption
              </label>
              <button
                onClick={() => generateCaption()}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full h-24 bg-transparent outline-none text-sm text-foreground resize-none"
              placeholder="Your caption will appear here..."
            />
          </div>

          {/* Hashtags */}
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Hashtags
            </label>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full px-4 py-3 bg-card hover:bg-muted border border-border rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Caption + Hashtags</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Info */}
      {!caption && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            💡 Tip: The AI will analyze your poster content and generate a caption that matches your selected tone.
          </p>
        </div>
      )}
    </div>
  );
}
