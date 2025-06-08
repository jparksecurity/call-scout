"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Bell } from "lucide-react";
import { getLiveEarningCalls, getCompletedEarningCalls, getUpcomingEarningCalls } from "@/lib/data/earning-calls";
import { EarningCall } from "@/lib/types";

const EarningCallsLanding: React.FC = () => {
  const router = useRouter();
  const liveCalls = getLiveEarningCalls();
  const completedCalls = getCompletedEarningCalls();
  const upcomingCalls = getUpcomingEarningCalls();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStatusBadge = (status: EarningCall["status"]) => {
    switch (status) {
      case "live":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
            🔴 LIVE
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1">
            📊 RECORDED
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1">
            ⏰ UPCOMING
          </Badge>
        );
    }
  };

  const getActionButton = (call: EarningCall) => {
    const handleCallClick = () => {
      router.push(`/call/${call.id}`);
    };

    switch (call.status) {
      case "live":
        return (
          <Button onClick={handleCallClick} className="w-full bg-green-600 hover:bg-green-700 text-white">
            Join Live Call →
          </Button>
        );
      case "completed":
        return (
          <Button onClick={handleCallClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            View Recording
          </Button>
        );
      case "upcoming":
        return (
          <div className="w-full space-y-2">
            <Button variant="outline" className="w-full" onClick={handleCallClick}>
              View Details
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <Bell className="w-3 h-3 mr-1" />
              Set Reminder
            </Button>
          </div>
        );
    }
  };

  const LiveCallCard: React.FC<{ call: EarningCall }> = ({ call }) => (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(call.status)}
              <span className="text-sm text-gray-600">1,247 watching</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{call.company}</h3>
            <p className="text-gray-600">{call.quarter} {call.year} Earnings Call</p>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Calendar className="w-4 h-4 mr-1" />
              {call.date}
            </div>
          </div>
        </div>
        <div className="pt-2">
          {getActionButton(call)}
        </div>
      </div>
    </Card>
  );

  const RecordingCard: React.FC<{ call: EarningCall }> = ({ call }) => (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(call.status)}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{call.company}</h3>
            <p className="text-gray-600">{call.quarter} {call.year}</p>
          </div>
          <div className="text-right">
            <BarChart3 className="w-5 h-5 text-blue-500 mb-1" />
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          {call.date}
        </div>

        <div className="pt-2">
          {getActionButton(call)}
        </div>
      </div>
    </Card>
  );

  const UpcomingCard: React.FC<{ call: EarningCall }> = ({ call }) => (
    <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(call.status)}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{call.company}</h3>
            <p className="text-gray-600">{call.quarter} {call.year} Earnings Call</p>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          {call.date}
        </div>

        <div className="pt-2">
          {getActionButton(call)}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">CallScout</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <button 
                  onClick={() => scrollToSection('live-calls')}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Live Calls
                </button>
                <button 
                  onClick={() => scrollToSection('upcoming-calls')}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => scrollToSection('recordings')}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Recordings
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  About
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="flex items-center justify-center mb-6">
            <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
              🚀 AI-Powered Earnings Analysis
            </Badge>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Every Earnings Call
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Unlock actionable insights from earnings calls with AI-powered analysis. Track live calls, prepare for upcoming events, and explore comprehensive recordings.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 px-8 py-3"
              onClick={() => scrollToSection('live-calls')}
            >
              Join Live Call Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-3"
              onClick={() => scrollToSection('about')}
            >
              Explore Platform
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Companies Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">Real-time</div>
              <div className="text-gray-600">AI Analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Live Calls Section */}
        {liveCalls.length > 0 && (
          <section id="live-calls" className="mb-16 scroll-mt-20">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <h2 className="text-3xl font-bold text-gray-900">Live Earnings Calls</h2>
            </div>
            <p className="text-gray-600 mb-8">
              Join active earnings calls and get real-time AI insights as they happen
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveCalls.map((call) => (
                <LiveCallCard key={call.id} call={call} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Calls Section */}
        {upcomingCalls.length > 0 && (
          <section id="upcoming-calls" className="mb-16 scroll-mt-20">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-6 h-6 flex items-center justify-center">📅</div>
              <h2 className="text-3xl font-bold text-gray-900">Upcoming Earnings Calls</h2>
            </div>
            <p className="text-gray-600 mb-8">
              Stay ahead of the market with scheduled earnings calls and AI-powered preparation insights
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingCalls.map((call) => (
                <UpcomingCard key={call.id} call={call} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Recordings Section */}
        {completedCalls.length > 0 && (
          <section id="recordings" className="mb-16 scroll-mt-20">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-6 h-6 flex items-center justify-center">📚</div>
              <h2 className="text-3xl font-bold text-gray-900">Recent Recordings</h2>
            </div>
            <p className="text-gray-600 mb-8">
              Explore comprehensive AI analysis of past earnings calls with detailed insights and sentiment analysis
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCalls.map((call) => (
                <RecordingCard key={call.id} call={call} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View All Recordings →
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* About Section */}
      <section id="about" className="bg-white py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About CallScout</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CallScout is the leading AI-powered earnings call analysis platform, providing real-time insights 
              and comprehensive analysis to help investors make smarter decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">Advanced machine learning algorithms analyze earnings calls in real-time to extract key insights.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Insights</h3>
              <p className="text-gray-600">Get instant notifications and analysis as earnings calls happen live.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Data</h3>
              <p className="text-gray-600">Access historical data, trends, and detailed analytics for over 500 companies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <span className="text-lg font-bold">CallScout</span>
              </div>
              <p className="text-gray-600 text-sm">
                AI-powered earnings call analysis platform for smarter investment decisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><button onClick={() => scrollToSection('live-calls')} className="hover:text-gray-900 transition-colors">Live Calls</button></li>
                <li><button onClick={() => scrollToSection('upcoming-calls')} className="hover:text-gray-900 transition-colors">Upcoming Events</button></li>
                <li><button onClick={() => scrollToSection('recordings')} className="hover:text-gray-900 transition-colors">Call Archive</button></li>
                <li>AI Insights</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-gray-900 transition-colors">About Us</button></li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Help Center</li>
                <li>API Docs</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2024 CallScout. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EarningCallsLanding; 