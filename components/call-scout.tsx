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

interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentParagraphRef = useRef<{ id: string | null; text: string; timestamp?: string }>({ id: null, text: '' });

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

  // Process transcript data
  const processTranscript = useCallback((transcriptText: string) => {
    // Split by newlines and skip first metadata line
    const lines = transcriptText.split('\n').slice(1);
    
    lines.forEach((line) => {
      try {
        if (!line.trim()) return; // Skip empty lines
        
        const json = JSON.parse(line);
        
        // Skip non-entry messages
        if (json.type && json.type !== 'entry') {
          return;
        }

        // Process messages that have transcript data
        if (json.p !== undefined && json.t !== undefined) {
          // Start a new paragraph if 'p' changes
          if (json.p !== currentParagraphRef.current.id) {
            // Save the previous paragraph if it has content
            if (currentParagraphRef.current.id && currentParagraphRef.current.text.trim()) {
              const newSegment: TranscriptSegment = {
                id: `seg_${currentParagraphRef.current.id}`,
                timestamp: currentParagraphRef.current.timestamp || '00:00',
                text: currentParagraphRef.current.text.trim(),
                hasAnnotation: false
              };
              
              setTranscriptSegments(prev => [...prev, newSegment]);
            }
            
            // Start new paragraph with the first word's timestamp
            const timestampFormatted = formatSecondsToTimestamp(json.s || 0);
            currentParagraphRef.current = { 
              id: json.p, 
              text: json.t + ' ',
              timestamp: timestampFormatted
            };
          } else {
            // Append to current paragraph
            currentParagraphRef.current.text += json.t + ' ';
          }
        }
      } catch (e) {
        console.error('Error parsing JSON line:', e);
      }
    });

    // Save the final paragraph if it exists
    if (currentParagraphRef.current.id && currentParagraphRef.current.text.trim()) {
      const finalSegment: TranscriptSegment = {
        id: `seg_${currentParagraphRef.current.id}`,
        timestamp: currentParagraphRef.current.timestamp || '00:00',
        text: currentParagraphRef.current.text.trim(),
        hasAnnotation: false
      };
      
      setTranscriptSegments(prev => [...prev, finalSegment]);
    }
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

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
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
                  <Badge variant="outline">
                    {transcriptSegments.length} segments
                  </Badge>
                </div>

                <ScrollArea className="space-y-4 h-[600px] pr-2">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {transcriptSegments.map((segment) => (
                        <motion.div
                          key={segment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-lg border transition-all duration-300",
                            "bg-muted/50 border-border hover:bg-muted/80",
                            segment.hasAnnotation && "border-l-4 border-l-primary"
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                {segment.timestamp}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                {segment.hasAnnotation && (
                                  <MessageSquare className="w-3 h-3 text-primary" />
                                )}
                              </div>
                              <p className="text-sm leading-relaxed">
                                {segment.text}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
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