"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ArrowDown, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  TranscriptWord, 
  TranscriptSegment, 
  HlsErrorData,
  EarningCall
} from "@/lib/types";
import Hls from "hls.js";

interface CallScoutComponentProps {
  earningCall: EarningCall;
}

const CallScoutComponent: React.FC<CallScoutComponentProps> = ({ earningCall }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<
    TranscriptSegment[]
  >([]);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToLive, setShowScrollToLive] = useState(false);
  const [processedSegments, setProcessedSegments] = useState<Set<string>>(
    new Set()
  ); // Track processed segments

  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const insightsScrollRef = useRef<HTMLDivElement>(null);
  const lastWordCountRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPositionRef = useRef(0);

  // URLs from earning call data
  const audioUrl = earningCall.audioUrl;
  const transcriptUrl = earningCall.transcriptUrl;

  // Helper function to convert seconds to MM:SS or HH:MM:SS format
  const formatSecondsToTimestamp = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
  };

  // Helper function to convert timestamp string to seconds
  const convertTimestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(":").map(Number);
    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Helper function to check if user is near bottom of scroll area
  const isNearBottom = (container: Element, threshold = 100): boolean => {
    return (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold
    );
  };

  // Helper function to scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (!scrollAreaRef.current) return;
    const scrollContainer = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Helper function to check if a segment is completed
  const isSegmentCompleted = (
    segment: TranscriptSegment,
    currentTime: number
  ): boolean => {
    if (segment.words.length === 0) return false;

    // Check if ALL words in the segment are visible to the user
    const visibleWords = segment.words.filter(
      (word) => word.startTime <= currentTime
    );
    const allWordsVisible = visibleWords.length === segment.words.length;

    return allWordsVisible;
  };

  // Function to call insight API when segment is completed
  const callInsightAPI = useCallback(
    async (segment: TranscriptSegment, transcriptHistory: string) => {
      try {
        // Get the full segment text
        const segmentText = segment.words.map((word) => word.text).join(" ");

        const response = await fetch("/api/generate-insight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationHistory: transcriptHistory,
            currentSentence: segmentText,
            timestamp: segment.timestamp,
            segmentId: segment.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.insight) {
            // Update the specific segment with its insight
            setTranscriptSegments((prevSegments) =>
              prevSegments.map((seg) =>
                seg.id === segment.id
                  ? { ...seg, insight: data.insight }
                  : seg
              )
            );
          }
        }
              } catch {
        // Silently handle API errors in production
      }
    },
    []
  );

  // Handle manual scroll to live
  const handleScrollToLive = () => {
    setIsUserScrolling(false);
    setShowScrollToLive(false);
    scrollToBottom(true);
  };

  // Process transcript data
  const processTranscript = useCallback((transcriptText: string) => {
    // Split by newlines and skip first metadata line
    const lines = transcriptText.split("\n").slice(1);
    const segmentsMap = new Map<string, TranscriptSegment>();

    lines.forEach((line, index) => {
      try {
        if (!line.trim()) return; // Skip empty lines

        const json = JSON.parse(line);

        // Skip non-word entries
        if (
          json.type ||
          json.s === undefined ||
          json.t === undefined ||
          json.p === undefined
        ) {
          return;
        }

        // Process individual words
        const word: TranscriptWord = {
          id: `word_${index}`,
          startTime: json.s,
          endTime: json.e || json.s + 0.5,
          text: json.t,
          paragraphId: json.p,
          speakerId: json.S || "0",
        };

        const segmentId = `seg_${json.p}`;

        if (!segmentsMap.has(segmentId)) {
          // Create new segment
          const newSegment: TranscriptSegment = {
            id: segmentId,
            timestamp: formatSecondsToTimestamp(json.s),
            words: [word],
          };
          segmentsMap.set(segmentId, newSegment);
        } else {
          // Add word to existing segment
          const existingSegment = segmentsMap.get(segmentId)!;
          existingSegment.words.push(word);
        }
      } catch {
        // Skip malformed transcript lines
      }
    });

    // Convert map to array and sort by timestamp
    const segments = Array.from(segmentsMap.values()).sort((a, b) => {
      return (
        convertTimestampToSeconds(a.timestamp) -
        convertTimestampToSeconds(b.timestamp)
      );
    });

    setTranscriptSegments(segments);
  }, []);

  // Fetch transcript data
  const fetchTranscript = useCallback(async () => {
    try {
      if (!transcriptUrl) {
        setError("Transcript URL is missing");
        return;
      }

      const response = await fetch(transcriptUrl, {
        cache: "no-cache",
      });

      if (response.ok) {
        const transcriptText = await response.text();
        processTranscript(transcriptText);
      } else {
        setError(`Failed to fetch transcript: ${response.statusText}`);
      }
    } catch (error) {
      setError(`Error fetching transcript: ${error}`);
    }
  }, [transcriptUrl, processTranscript]);

  // Fetch transcript once
  useEffect(() => {
    fetchTranscript();
  }, [fetchTranscript]);

  // Set up scroll event listener
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollPosition = scrollContainer.scrollTop;
      const scrollDirection =
        currentScrollPosition > lastScrollPositionRef.current ? "down" : "up";
      lastScrollPositionRef.current = currentScrollPosition;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // If user scrolled up, they're actively browsing
      if (scrollDirection === "up" && currentScrollPosition > 0) {
        setIsUserScrolling(true);
        setShowScrollToLive(true);
      }

      // Check if user is near bottom
      const nearBottom = isNearBottom(scrollContainer);

      // If user scrolled back to bottom, resume auto-scroll
      if (nearBottom) {
        setIsUserScrolling(false);
        setShowScrollToLive(false);
      } else if (!nearBottom && scrollDirection === "up") {
        setShowScrollToLive(true);
      }

      // Set timeout to reset user scrolling state
      scrollTimeoutRef.current = setTimeout(() => {
        if (isNearBottom(scrollContainer)) {
          setIsUserScrolling(false);
          setShowScrollToLive(false);
        }
      }, 2000); // 2 seconds of inactivity
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Smart auto-scroll when new words appear
  useEffect(() => {
    const currentWordCount = transcriptSegments.reduce(
      (count, segment) =>
        count +
        segment.words.filter((word) => word.startTime <= currentAudioTime)
          .length,
      0
    );

    // Only scroll if new words have appeared and user isn't actively scrolling
    if (
      currentWordCount > lastWordCountRef.current &&
      scrollAreaRef.current &&
      !isUserScrolling
    ) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );

      if (scrollContainer) {
        // Only auto-scroll if user is near the bottom (following the live content)
        if (isNearBottom(scrollContainer, 150)) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        } else {
          // User has scrolled up, show the scroll-to-live button
          setShowScrollToLive(true);
        }
      }
      lastWordCountRef.current = currentWordCount;
    }
  }, [transcriptSegments, currentAudioTime, isUserScrolling]);

  // Auto-scroll when insights are added to segments near the bottom
  useEffect(() => {
    if (!scrollAreaRef.current || isUserScrolling) return;

    const scrollContainer = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (scrollContainer && isNearBottom(scrollContainer, 150)) {
      // Small delay to ensure the insight is fully rendered
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [transcriptSegments, isUserScrolling]);

  // Auto-scroll insights sidebar to latest insight
  useEffect(() => {
    if (!insightsScrollRef.current) return;

    // Small delay to ensure the insight is fully rendered
    const timer = setTimeout(() => {
      insightsScrollRef.current?.scrollTo({
        top: insightsScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [transcriptSegments]);

  // Segment completion detection: Call API when segments are completed
  useEffect(() => {
    // Find completed segments that haven't been processed yet
    const completedSegments = transcriptSegments.filter((segment) => {
      const isCompleted = isSegmentCompleted(segment, currentAudioTime);
      const notProcessed = !processedSegments.has(segment.id);
      return isCompleted && notProcessed && segment.words.length > 0;
    });

    completedSegments.forEach((segment) => {
      // Mark as processed immediately to avoid duplicate calls
      setProcessedSegments((prev) => new Set([...prev, segment.id]));

      // Build conversation history (everything before this segment)
      const segmentIndex = transcriptSegments.findIndex(
        (s) => s.id === segment.id
      );
      const transcriptHistory = transcriptSegments
        .slice(0, segmentIndex)
        .map((seg) => seg.words.map((word) => word.text).join(" "))
        .join(" ");

      callInsightAPI(segment, transcriptHistory);
    });
  }, [
    transcriptSegments,
    currentAudioTime,
    processedSegments,
    callInsightAPI,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initializeAudio = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;

        hls.loadSource(audioUrl || "");
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_event: string, data: HlsErrorData) => {
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
          }
        });
      } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        // Fallback for Safari
        audio.src = audioUrl || "";
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

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("error", handleError);
      audio.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("error", handleError);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Calls</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">CallScout</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Live Earnings Call Insight — Real-time annotated transcript
                  analysis
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                earningCall.status === "live" 
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
              )}
            >
              {earningCall.status === "live" && (
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              )}
              {earningCall.status === "live" ? "Live" : "Recording"}
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
                  <h3 className="font-semibold text-lg">
                    {earningCall.company} {earningCall.quarter} {earningCall.year} Earnings Call
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {earningCall.date}
                  </p>

                  {/* Loading/Error States */}
                  {isLoading && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">
                        Loading audio...
                      </span>
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
                    style={{ maxWidth: "100%" }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {/* Insights Summary */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Key Insights</h4>
                    <Badge variant="outline" className="text-xs">
                      {
                        transcriptSegments.filter((seg) => seg.insight)
                          .length
                      }{" "}
                      total
                    </Badge>
                  </div>
                  <div 
                    ref={insightsScrollRef}
                    className="space-y-2 max-h-96 overflow-y-auto"
                  >
                    {/* Dynamic insights */}
                    {transcriptSegments.map((segment) => {
                      if (segment.insight) {
                        return (
                          <div
                            key={segment.id}
                            className="w-full text-left p-3 rounded-lg border bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          >
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-1">
                                <MessageSquare className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium mb-1">
                                  {segment.timestamp}
                                </div>
                                <div className="text-xs">
                                  {segment.insight.text}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Show message if no insights yet */}
                    {transcriptSegments.filter((seg) => seg.insight)
                      .length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Insights will appear here as the call progresses...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Transcript Section */}
          <div className="lg:col-span-2">
            <Card className="p-6 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Live Transcript</h3>
                  <Badge variant="outline" className="text-xs">
                    {formatSecondsToTimestamp(currentAudioTime)}
                  </Badge>
                </div>

                {/* Scroll to Live Button */}
                <AnimatePresence>
                  {showScrollToLive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-16 right-6 z-10"
                    >
                      <Button
                        onClick={handleScrollToLive}
                        size="sm"
                        className="shadow-lg bg-primary/90 hover:bg-primary backdrop-blur-sm"
                      >
                        <ArrowDown className="w-3 h-3 mr-1" />
                        Jump to Live
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ScrollArea
                  ref={scrollAreaRef}
                  className="space-y-4 h-[600px] pr-2"
                >
                  <div className="space-y-4">
                    <AnimatePresence>
                      {transcriptSegments
                        .filter((segment) =>
                          segment.words.some(
                            (word) => word.startTime <= currentAudioTime
                          )
                        )
                        .map((segment) => {
                          // Find the last visible word in this segment
                          const visibleWords = segment.words.filter(
                            (word) => word.startTime <= currentAudioTime
                          );
                          const lastVisibleWord =
                            visibleWords[visibleWords.length - 1];
                                                     const isCurrentSegment =
                             lastVisibleWord &&
                             currentAudioTime >= lastVisibleWord.startTime &&
                             currentAudioTime <= lastVisibleWord.endTime;

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
                                segment.insight &&
                                  "border-l-4 border-l-primary"
                              )}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <Badge
                                    variant={
                                      isCurrentSegment ? "default" : "outline"
                                    }
                                    className={cn(
                                      "text-xs",
                                      isCurrentSegment &&
                                        "bg-primary text-primary-foreground"
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
                                  </div>
                                  <p
                                    className={cn(
                                      "text-sm leading-relaxed",
                                      isCurrentSegment && "text-primary"
                                    )}
                                  >
                                    {segment.words
                                      .filter(
                                        (word) =>
                                          word.startTime <= currentAudioTime
                                      )
                                      .map((word) => {
                                        const isCurrentWord =
                                          currentAudioTime >= word.startTime &&
                                          currentAudioTime <= word.endTime;

                                        return (
                                          <span
                                            key={word.id}
                                            className={cn(
                                              "transition-colors duration-150",
                                              isCurrentWord &&
                                                "bg-primary/15 text-primary px-1 rounded"
                                            )}
                                          >
                                            {word.text}{" "}
                                          </span>
                                        );
                                      })}
                                  </p>

                                  {/* Insight Display */}
                                  {segment.insight && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: 10,
                                        scale: 0.95,
                                      }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                      }}
                                      className="mt-4 p-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50"
                                    >
                                      <div className="flex items-center space-x-2 mb-2">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900">
                                          <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 font-medium"
                                        >
                                          ✨ AI Insight
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                                        {segment.insight.text}
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
