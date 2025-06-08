"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  speaker: string;
  text: string;
  hasAnnotation?: boolean;
}

const CallScoutComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Hardcoded HLS stream URL
  const audioUrl = "https://files.quartr.com/streams/2025-04-22/ec5ba86e-e8e7-4681-bea1-b1bf6085604b/1/playlists.m3u8";

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

  const transcriptSegments: TranscriptSegment[] = useMemo(() => [
    {
      id: "seg1",
      timestamp: "07:58",
      speaker: "Elon Musk",
      text: "Thank you for joining us today. I want to start by addressing some of the regulatory environment we're operating in. The government's role in shaping the future of sustainable transport cannot be understated, though I recognize this isn't directly tied to our quarterly numbers.",
      hasAnnotation: true
    },
    {
      id: "seg2", 
      timestamp: "08:25",
      speaker: "Elon Musk",
      text: "Moving to our core business metrics, Q4 has shown remarkable resilience despite global supply chain challenges. Our production numbers exceeded expectations across all vehicle lines."
    },
    {
      id: "seg3",
      timestamp: "09:15",
      speaker: "CFO Zachary Kirkhorn", 
      text: "From a financial perspective, we've maintained healthy margins while scaling production. Our energy business continues to be a significant growth driver."
    },
    {
      id: "seg4",
      timestamp: "11:29",
      speaker: "Elon Musk",
      text: "Looking ahead, I'll be dedicating more of my time to Tesla operations starting next month. This increased focus will accelerate our autonomous driving timeline and manufacturing efficiency.",
      hasAnnotation: true
    },
    {
      id: "seg5",
      timestamp: "12:00",
      speaker: "Elon Musk", 
      text: "I want to be transparent about 2025 - we expect some volatility in the first half, but our long-term trajectory remains exceptionally strong. The fundamentals of our business have never been more solid. We're not just building cars; we're architecting the future of transportation and energy.",
      hasAnnotation: true
    },
    {
      id: "seg6",
      timestamp: "12:30",
      speaker: "Elon Musk",
      text: "Our investment in autonomy and humanoid robotics represents a paradigm shift for Tesla. These aren't side projects - they're core to our identity as a technology company. The potential market size here is orders of magnitude larger than automotive.",
      hasAnnotation: true
    },
    {
      id: "seg7",
      timestamp: "15:30",
      speaker: "Analyst",
      text: "Can you provide more specifics on the timeline for full self-driving deployment?"
    },
    {
      id: "seg8", 
      timestamp: "15:45",
      speaker: "Elon Musk",
      text: "We're making significant progress on FSD. The neural network improvements we've implemented show remarkable advancement in edge case handling. I'm optimistic about broader deployment in 2024."
    }
  ], []);



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
        
        hls.on(Hls.Events.ERROR, (_event, data) => {
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
                                <span className="font-medium text-sm">
                                  {segment.speaker}
                                </span>
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