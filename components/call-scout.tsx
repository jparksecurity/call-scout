"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Volume2, VolumeX, MessageSquare, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(3600); // 1 hour default
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
  
  const transcriptRef = useRef<HTMLDivElement>(null);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const timeToSeconds = (timeStr: string) => {
    const [mins, secs] = timeStr.split(":").map(Number);
    return mins * 60 + secs;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value / 100);
    setIsMuted(value === 0);
  };

  const handleSeek = (value: number) => {
    const newTime = (value / 100) * duration;
    setCurrentTime(newTime);
  };

  const getAnnotationForTime = (timeStr: string) => {
    const timeInSeconds = timeToSeconds(timeStr);
    return annotations.find(ann => {
      const startSeconds = timeToSeconds(ann.startTime);
      const endSeconds = timeToSeconds(ann.endTime);
      return timeInSeconds >= startSeconds && timeInSeconds <= endSeconds;
    });
  };

  const getAnnotationTypeColor = (type: string) => {
    switch (type) {
      case "financial": return "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50";
      case "strategic": return "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50";
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-600/50";
    }
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case "financial": return <TrendingUp className="w-3 h-3" />;
      case "strategic": return <MessageSquare className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  useEffect(() => {
    const currentTimeStr = formatTime(currentTime);
    const segment = transcriptSegments.find(seg => seg.timestamp === currentTimeStr);
    if (segment) {
      setHighlightedSegment(segment.id);
      if (transcriptRef.current) {
        const element = transcriptRef.current.querySelector(`[data-segment-id="${segment.id}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentTime, transcriptSegments]);

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
                  <h3 className="font-semibold text-lg">Tesla Q4 2023 Earnings Call</h3>
                  <p className="text-sm text-muted-foreground">January 24, 2024</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div 
                    className="w-full h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      handleSeek(percentage);
                    }}
                  >
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentTime / duration) * 100}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlay}
                    className="w-12 h-12"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="w-8 h-8"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <div 
                    className="flex-1 h-1 bg-muted rounded-full cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      handleVolumeChange(percentage);
                    }}
                  >
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                    />
                  </div>
                </div>

                {/* Annotations Summary */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="font-medium text-sm">Key Annotations</h4>
                  <div className="space-y-2">
                    {annotations.map((annotation) => (
                      <Popover key={annotation.id}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]",
                              getAnnotationTypeColor(annotation.type),
                              activeAnnotation === annotation.id && "ring-2 ring-primary"
                            )}
                            onClick={() => {
                              const startSeconds = timeToSeconds(annotation.startTime);
                              setCurrentTime(startSeconds);
                              setActiveAnnotation(annotation.id);
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              {getAnnotationIcon(annotation.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium mb-1">
                                  {annotation.startTime} - {annotation.endTime}
                                </div>
                                <div className="text-xs line-clamp-2">
                                  {annotation.text}
                                </div>
                              </div>
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" side="right">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {getAnnotationIcon(annotation.type)}
                              <Badge variant="outline" className={getAnnotationTypeColor(annotation.type)}>
                                {annotation.type}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium">
                              {annotation.startTime} - {annotation.endTime}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {annotation.text}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
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
                  <div 
                    ref={transcriptRef}
                    className="space-y-4"
                  >
                    <AnimatePresence>
                      {transcriptSegments.map((segment) => {
                        const annotation = getAnnotationForTime(segment.timestamp);
                        const isHighlighted = highlightedSegment === segment.id;
                        
                        return (
                          <motion.div
                            key={segment.id}
                            data-segment-id={segment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "p-4 rounded-lg border transition-all duration-300",
                              isHighlighted 
                                ? "bg-primary/10 border-primary shadow-lg" 
                                : "bg-muted/50 border-border hover:bg-muted/80",
                              segment.hasAnnotation && "border-l-4 border-l-primary"
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    isHighlighted && "bg-primary text-primary-foreground"
                                  )}
                                >
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
                                
                                {annotation && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-3 p-3 rounded-md border-l-2 border-l-primary bg-primary/5"
                                  >
                                    <div className="flex items-center space-x-2 mb-1">
                                      {getAnnotationIcon(annotation.type)}
                                      <Badge 
                                        variant="outline" 
                                        className={getAnnotationTypeColor(annotation.type)}
                                      >
                                        {annotation.type} insight
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {annotation.text}
                                    </p>
                                  </motion.div>
                                )}
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