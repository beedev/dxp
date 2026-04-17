import React, { useRef, useState } from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';

const API_BASE = 'http://localhost:8002';

interface SpeakButtonProps {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

/**
 * Plays a TTS rendering of the given text via /api/voice/synthesize.
 * Cached by text content — clicking again while playing pauses.
 */
export function SpeakButton({ text, voice = 'nova' }: SpeakButtonProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const handleClick = async () => {
    // Pause if currently playing
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    // Resume if already fetched
    if (audioRef.current && urlRef.current) {
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    // Fetch fresh
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 4000), voice }),
      });
      if (!res.ok) {
        console.error('TTS failed', await res.text());
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      audio.onplay = () => setPlaying(true);
      await audio.play();
    } catch (err) {
      console.error('TTS error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={playing ? 'Pause' : 'Read aloud'}
      className="inline-flex items-center gap-1 text-[10px] text-[var(--dxp-text-muted)] hover:text-[var(--dxp-brand)] disabled:opacity-40"
    >
      {loading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : playing ? (
        <VolumeX size={11} />
      ) : (
        <Volume2 size={11} />
      )}
      <span>{playing ? 'Pause' : loading ? '…' : 'Listen'}</span>
    </button>
  );
}
