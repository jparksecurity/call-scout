import { Metadata } from "next";
import EarningCallsLanding from "@/components/earning-calls-landing";

export const metadata: Metadata = {
  title: "CallScout - AI-Powered Earnings Call Analysis",
  description: "Real-time insight transcript analysis for earnings calls with AI-powered insights and annotations",
};

export default function Home() {
  return <EarningCallsLanding />;
}
