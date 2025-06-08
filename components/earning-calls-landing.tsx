"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Play, Eye } from "lucide-react";
import { EARNING_CALLS, getLiveEarningCalls, getCompletedEarningCalls, getUpcomingEarningCalls } from "@/lib/data/earning-calls";
import { EarningCall } from "@/lib/types";

const EarningCallsLanding: React.FC = () => {
  const router = useRouter();
  const liveCalls = getLiveEarningCalls();
  const completedCalls = getCompletedEarningCalls();
  const upcomingCalls = getUpcomingEarningCalls();

  const getStatusBadge = (status: EarningCall["status"]) => {
    switch (status) {
      case "live":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            <Eye className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "upcoming":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
    }
  };

  const getActionButton = (call: EarningCall) => {
    const handleCallClick = () => {
      router.push(`/call/${call.id}`);
    };

    const baseProps = {
      onClick: handleCallClick,
      className: "w-full"
    };

    switch (call.status) {
      case "live":
        return (
          <Button {...baseProps} className="bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Join Live Call
          </Button>
        );
      case "completed":
        return (
          <Button {...baseProps} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Recording
          </Button>
        );
      case "upcoming":
        return (
          <Button {...baseProps} variant="outline" disabled>
            <Clock className="w-4 h-4 mr-2" />
            Not Available Yet
          </Button>
        );
    }
  };

  const CallCard: React.FC<{ call: EarningCall }> = ({ call }) => (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border hover:border-primary/30">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{call.company}</h3>
            <p className="text-lg text-muted-foreground">
              {call.quarter} {call.year} Earnings Call
            </p>
          </div>
          {getStatusBadge(call.status)}
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{call.date}</span>
        </div>

        <div className="pt-2">
          {getActionButton(call)}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">CallScout</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              AI-powered earnings call analysis with real-time insights and transcript annotation
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Live Calls Section */}
          {liveCalls.length > 0 && (
            <section>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-2xl font-semibold">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveCalls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Calls Section */}
          {upcomingCalls.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Upcoming Calls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingCalls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Calls Section */}
          {completedCalls.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Recent Recordings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCalls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {EARNING_CALLS.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Earning Calls Available</h3>
                <p className="text-muted-foreground">
                  Check back later for upcoming earnings calls and live streams.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningCallsLanding; 