"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

interface Annotation {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
  type: "financial" | "strategic" | "general";
}

interface TranscriptWord {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  paragraphId: string;
  speakerId: string;
}

interface TranscriptSegment {
  id: string;
  timestamp: string;
  words: TranscriptWord[];
  hasAnnotation?: boolean;
}

interface HlsErrorData {
  fatal?: boolean;
  type?: string;
}

const CallScoutComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastWordCountRef = useRef(0);

  // URLs
  const audioUrl = "https://files.quartr.com/streams/2025-04-22/ec5ba86e-e8e7-4681-bea1-b1bf6085604b/1/playlists.m3u8";
  const transcriptUrl = "https://files.quartr.com/streams/2025-04-22/ec5ba86e-e8e7-4681-bea1-b1bf6085604b/1/live_transcript.jsonl";

  const annotations: Annotation[] = [
    {
      id: "1",
      startTime: "07:58",
      endTime: "08:24",
      text: "Elon opens with commentary on government role; interesting but not financial.",
      type: "general"
    },
    {
      id: "2", 
      startTime: "11:29",
      endTime: "11:37",
      text: "Musk says he'll allocate more time to Tesla next month.",
      type: "strategic"
    },
    {
      id: "3",
      startTime: "12:00", 
      endTime: "15:00",
      text: "Signals an uneven 2025 but strong long-term outlook.",
      type: "financial"
    },
    {
      id: "4",
      startTime: "12:30",
      endTime: "12:45", 
      text: "Long-term bet: autonomy & humanoid robots reposition Tesla.",
      type: "strategic"
    }
  ];

  // Helper function to convert seconds to MM:SS or HH:MM:SS format
  const formatSecondsToTimestamp = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  // Helper function to convert timestamp string to seconds
  const convertTimestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Process transcript data
  const processTranscript = useCallback((transcriptText: string) => {
    // Split by newlines and skip first metadata line
    const lines = transcriptText.split('\n').slice(1);
    const segmentsMap = new Map<string, TranscriptSegment>();
    
    lines.forEach((line, index) => {
      try {
        if (!line.trim()) return; // Skip empty lines
        
        const json = JSON.parse(line);
        
        // Skip non-word entries
        if (json.type || json.s === undefined || json.t === undefined || json.p === undefined) {
          return;
        }

        // Process individual words
        const word: TranscriptWord = {
          id: `word_${index}`,
          startTime: json.s,
          endTime: json.e || json.s + 0.5,
          text: json.t,
          paragraphId: json.p,
          speakerId: json.S || '0'
        };

        const segmentId = `seg_${json.p}`;
        
        if (!segmentsMap.has(segmentId)) {
          // Create new segment
          const newSegment: TranscriptSegment = {
            id: segmentId,
            timestamp: formatSecondsToTimestamp(json.s),
            words: [word],
            hasAnnotation: false
          };
          segmentsMap.set(segmentId, newSegment);
        } else {
          // Add word to existing segment
          const existingSegment = segmentsMap.get(segmentId)!;
          existingSegment.words.push(word);
        }
      } catch (e) {
        console.error('Error parsing JSON line:', e);
      }
    });

    // Convert map to array and sort by timestamp
    const segments = Array.from(segmentsMap.values()).sort((a, b) => {
      return convertTimestampToSeconds(a.timestamp) - convertTimestampToSeconds(b.timestamp);
    });

    setTranscriptSegments(segments);
  }, []);

  // Fetch transcript data
  const fetchTranscript = useCallback(async () => {
    try {
      const response = await fetch(transcriptUrl, {
        cache: 'no-cache'
      });

      if (response.ok) {
        const transcriptText = await response.text();
        processTranscript(transcriptText);
      } else {
        console.error('Failed to fetch transcript:', response.statusText);
        setError(`Failed to fetch transcript: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setError(`Error fetching transcript: ${error}`);
    }
  }, [transcriptUrl, processTranscript]);

  // Fetch transcript once
  useEffect(() => {
    fetchTranscript();
  }, [fetchTranscript]);

  // Auto-scroll when new words appear
  useEffect(() => {
    const currentWordCount = transcriptSegments.reduce((count, segment) => 
      count + segment.words.filter(word => word.startTime <= currentAudioTime).length, 0
    );

    // Only scroll if new words have appeared
    if (currentWordCount > lastWordCountRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
      lastWordCountRef.current = currentWordCount;
    }
  }, [transcriptSegments, currentAudioTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initializeAudio = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsRef.current = hls;
        
        hls.loadSource(audioUrl);
        hls.attachMedia(audio);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          console.log("HLS manifest loaded successfully");
        });
        
        hls.on(Hls.Events.ERROR, (_event: string, data: HlsErrorData) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("Network error loading audio stream");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Media error - trying to recover");
                hls.recoverMediaError();
                break;
              default:
                setError(`Fatal error: ${data.type}`);
                setIsLoading(false);
                break;
            }
          } else {
            console.warn("Non-fatal HLS error:", data);
          }
        });

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS media attached");
        });
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari
        audio.src = audioUrl;
        audio.crossOrigin = "anonymous";
        setIsLoading(false);
      } else {
        setError("HLS is not supported in this browser");
        setIsLoading(false);
      }

      // Audio event listeners
      const handleLoadedMetadata = () => {
        setIsLoading(false);
      };

      const handleError = () => {
        setError("Failed to load audio");
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentAudioTime(audio.currentTime);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      audio.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    };

    const cleanup = initializeAudio();

    return () => {
      cleanup?.();
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CallScout</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Live Earnings Call Insight — Real-time annotated transcript analysis
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audio Player Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Tesla Q1 2025 Earnings Call</h3>
                  <p className="text-sm text-muted-foreground">April 22, 2025</p>
                  
                  {/* Loading/Error States */}
                  {isLoading && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Loading audio...</span>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded-md">
                      {error}
                    </div>
                  )}
                </div>

                {/* Native Audio Player */}
                <div className="flex justify-center">
                  <audio
                    ref={audioRef}
                    controls
                    preload="metadata"
                    className="w-full"
                    style={{ maxWidth: '100%' }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {/* Annotations Summary */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="font-medium text-sm">Key Annotations</h4>
                  <div className="space-y-2">
                    {annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border",
                          annotation.type === "financial" 
                            ? "bg-green-500/20 text-green-700 border-green-500/30" 
                            : annotation.type === "strategic"
                            ? "bg-blue-500/20 text-blue-700 border-blue-500/30"
                            : "bg-gray-500/20 text-gray-700 border-gray-500/30"
                        )}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-1">
                            {annotation.type === "financial" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : annotation.type === "strategic" ? (
                              <MessageSquare className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium mb-1">
                              {annotation.startTime} - {annotation.endTime}
                            </div>
                            <div className="text-xs">
                              {annotation.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Transcript Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Live Transcript</h3>
                    <Badge variant="outline" className="text-xs">
                      {formatSecondsToTimestamp(currentAudioTime)}
                    </Badge>
                  </div>

                <ScrollArea ref={scrollAreaRef} className="space-y-4 h-[600px] pr-2">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {transcriptSegments
                        .filter(segment => segment.words.some(word => word.startTime <= currentAudioTime))
                        .map((segment, index, filteredSegments) => {
                          // Find the last visible word in this segment
                          const visibleWords = segment.words.filter(word => word.startTime <= currentAudioTime);
                          const lastVisibleWord = visibleWords[visibleWords.length - 1];
                          const isCurrentSegment = lastVisibleWord && 
                            currentAudioTime >= lastVisibleWord.startTime && 
                            currentAudioTime <= lastVisibleWord.endTime + 2; // 2 second buffer
                          
                          return (
                            <motion.div
                              key={segment.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "p-4 rounded-lg border transition-all duration-300",
                                isCurrentSegment 
                                  ? "bg-primary/10 border-primary/30 shadow-md" 
                                  : "bg-muted/50 border-border hover:bg-muted/80",
                                segment.hasAnnotation && "border-l-4 border-l-primary"
                              )}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <Badge 
                                    variant={isCurrentSegment ? "default" : "outline"} 
                                    className={cn(
                                      "text-xs",
                                      isCurrentSegment && "bg-primary text-primary-foreground"
                                    )}
                                  >
                                    {segment.timestamp}
                                  </Badge>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {isCurrentSegment && (
                                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    )}
                                    {segment.hasAnnotation && (
                                      <MessageSquare className="w-3 h-3 text-primary" />
                                    )}
                                  </div>
                                  <p className={cn(
                                    "text-sm leading-relaxed",
                                    isCurrentSegment && "font-medium"
                                  )}>
                                    {segment.words
                                      .filter(word => word.startTime <= currentAudioTime)
                                      .map(word => {
                                        const isCurrentWord = currentAudioTime >= word.startTime && 
                                                            currentAudioTime <= word.endTime;
                                        
                                        return (
                                          <motion.span
                                            key={word.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className={cn(
                                              "inline-block px-1 rounded transition-colors duration-150",
                                              isCurrentWord && "font-medium bg-primary/15"
                                            )}
                                          >
                                            {word.text}{' '}
                                          </motion.span>
                                        );
                                      })}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallScoutComponent; 