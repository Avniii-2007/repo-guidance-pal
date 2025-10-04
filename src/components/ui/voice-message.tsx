import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessageProps {
  onSendVoiceMessage?: (audioBlob: Blob, duration: number) => Promise<void>;
  disabled?: boolean;
}

export const VoiceMessage = ({ onSendVoiceMessage, disabled }: VoiceMessageProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(blob);
        setRecordedAudio(audioUrl);
        setAudioBlob(blob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Record in 1 second chunks
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your message...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "You can now preview or send your voice message.",
      });
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !recordedAudio) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const sendVoiceMessage = async () => {
    if (audioBlob && onSendVoiceMessage) {
      try {
        await onSendVoiceMessage(audioBlob, recordingDuration);
        resetRecording();
      } catch (error) {
        console.error('Error sending voice message:', error);
        toast({
          title: "Failed to send",
          description: "Could not send voice message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const resetRecording = useCallback(() => {
    setRecordedAudio(null);
    setAudioBlob(null);
    setIsPlaying(false);
    setRecordingDuration(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If we have a recorded audio, show playback controls
  if (recordedAudio) {
    return (
      <div className="flex items-center gap-2 p-2 ultra-card rounded-lg">
        <audio
          ref={audioRef}
          src={recordedAudio}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          disabled={disabled}
          className="hover-lift"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1 text-sm text-muted-foreground">
          Voice message • {formatDuration(recordingDuration)}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetRecording}
          disabled={disabled}
          className="text-xs"
        >
          Cancel
        </Button>
        
        <Button
          type="button"
          size="sm"
          onClick={sendVoiceMessage}
          disabled={disabled}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      </div>
    );
  }

  // Recording interface
  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Recording... {formatDuration(recordingDuration)}
        </div>
      )}
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={isRecording ? stopRecording : startRecording}
        className={`transition-all duration-300 ${
          isRecording 
            ? "bg-red-500/20 border-red-500 hover:bg-red-500/30 animate-pulse" 
            : "hover-lift"
        }`}
      >
        {isRecording ? (
          <Square className="h-4 w-4 fill-red-500 text-red-500" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
}

export const AudioPlayer = ({ audioUrl, duration, className = "" }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !duration) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        className="h-8 w-8 hover:bg-primary/20"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-6 flex items-center">
            <div className="flex gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-primary rounded-full transition-all duration-150 ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  style={{
                    height: `${Math.random() * 16 + 8}px`,
                    opacity: currentTime / totalDuration > i / 20 ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>
    </div>
  );
};