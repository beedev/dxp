import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';

const API_BASE = 'http://localhost:8002';

interface MicButtonProps {
  disabled?: boolean;
  /** Called once the recording has been transcribed by Whisper. */
  onTranscribed: (text: string) => void;
}

/**
 * Click-to-record microphone button. On click:
 *   1. Requests microphone access (first time)
 *   2. Records audio via MediaRecorder (webm/opus)
 *   3. Second click stops and uploads to /api/voice/transcribe (Whisper)
 *   4. Calls onTranscribed(text) with the result
 */
export function MicButton({ disabled, onTranscribed }: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [supported, setSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof MediaRecorder === 'undefined'
    ) {
      setSupported(false);
    }
  }, []);

  const start = async () => {
    if (disabled || recording || transcribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append('file', blob, 'recording.webm');
          const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
            method: 'POST',
            body: form,
          });
          if (res.ok) {
            const data = await res.json();
            onTranscribed((data.text || '').trim());
          } else {
            console.error('Transcribe failed', await res.text());
          }
        } catch (err) {
          console.error('Transcribe error', err);
        } finally {
          setTranscribing(false);
          // Release mic
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
      setSupported(false);
    }
  };

  const stop = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  if (!supported) {
    return null; // Browser doesn't support or mic denied
  }

  const onClick = recording ? stop : start;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || transcribing}
      title={recording ? 'Stop recording' : 'Dictate a message'}
      className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-[var(--dxp-radius)] disabled:opacity-40 ${
        recording
          ? 'bg-[var(--dxp-danger)] text-white animate-pulse'
          : 'text-[var(--dxp-text-muted)] hover:bg-[var(--dxp-border-light)] hover:text-[var(--dxp-brand)]'
      }`}
    >
      {transcribing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : recording ? (
        <Square size={14} className="fill-white" />
      ) : (
        <Mic size={16} />
      )}
    </button>
  );
}
