import { Metadata } from "next";
import { notFound } from "next/navigation";
import CallScoutComponent from "@/components/call-scout";
import { getEarningCallById, EARNING_CALLS } from "@/lib/data/earning-calls";

interface CallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return EARNING_CALLS.map((call) => ({
    id: call.id,
  }));
}

export async function generateMetadata({ params }: CallPageProps): Promise<Metadata> {
  const { id } = await params;
  const earningCall = getEarningCallById(id);
  
  if (!earningCall) {
    return {
      title: "Call Not Found - CallScout",
    };
  }

  return {
    title: `${earningCall.company} ${earningCall.quarter} ${earningCall.year} - CallScout`,
    description: earningCall.description || `${earningCall.company} earnings call analysis with AI-powered insights`,
  };
}

export default async function CallPage({ params }: CallPageProps) {
  const { id } = await params;
  const earningCall = getEarningCallById(id);

  if (!earningCall) {
    notFound();
  }

  return <CallScoutComponent earningCall={earningCall} />;
} 