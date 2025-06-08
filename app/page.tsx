import { Metadata } from "next";
import CallScoutComponent from "@/components/call-scout";

export const metadata: Metadata = {
  title: "CallScout - Live Earnings Call Analysis",
  description: "Real-time annotated transcript analysis for earnings calls with AI-powered insights",
};

export default function Home() {
  return <CallScoutComponent />;
}
