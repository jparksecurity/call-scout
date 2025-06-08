import { Metadata } from "next";
import CallScoutComponent from "@/components/call-scout";

export const metadata: Metadata = {
  title: "CallScout - Live Earnings Call Insight",
  description: "Real-time insight transcript analysis for earnings calls with AI-powered insights",
};

export default function Home() {
  return <CallScoutComponent />;
}
