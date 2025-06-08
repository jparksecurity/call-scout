import { EarningCall } from "@/lib/types";

export const EARNING_CALLS: EarningCall[] = [
  {
    id: "tesla-q1-2025",
    company: "Tesla",
    quarter: "Q1",
    year: 2025,
    date: "April 22, 2025",
    audioUrl: "https://files.quartr.com/streams/2025-04-22/ec5ba86e-e8e7-4681-bea1-b1bf6085604b/1/playlists.m3u8",
    transcriptUrl: "https://files.quartr.com/streams/2025-04-22/ec5ba86e-e8e7-4681-bea1-b1bf6085604b/1/live_transcript.jsonl",
    status: "completed"
  },
  {
    id: "apple-q2-2025",
    company: "Apple",
    quarter: "Q2",
    year: 2025,
    date: "May 1, 2025",
    audioUrl: "https://files.quartr.com/streams/2025-05-01/e37c88b7-cb01-4170-87c8-960681d8add1/4/playlists.m3u8",
    transcriptUrl: "https://files.quartr.com/streams/2025-05-01/e37c88b7-cb01-4170-87c8-960681d8add1/4/live_transcript.jsonl",
    status: "live"
  },
  {
    id: "microsoft-q3-2025",
    company: "Microsoft",
    quarter: "Q3",
    year: 2025,
    date: "April 30, 2025",
    audioUrl: "https://files.quartr.com/streams/2025-04-30/a2504d42-8793-40ef-bd87-7b6c7e19574f/3/playlists.m3u8",
    transcriptUrl: "https://files.quartr.com/streams/2025-04-30/a2504d42-8793-40ef-bd87-7b6c7e19574f/3/live_transcript.jsonl",
    status: "live"
  },
  {
    id: "nvidia-q2-2025",
    company: "NVIDIA",
    quarter: "Q2",
    year: 2025,
    date: "August 27, 2025",
    status: "upcoming"
  },
  {
    id: "oracle-q4-2025",
    company: "Oracle",
    quarter: "Q4",
    year: 2025,
    date: "June 10, 2025",
    status: "upcoming"
  },
  {
    id: "adobe-q2-2025",
    company: "Adobe",
    quarter: "Q2",
    year: 2025,
    date: "June 11, 2025",
    status: "upcoming"
  },
  {
    id: "salesforce-q1-2025",
    company: "Salesforce",
    quarter: "Q1",
    year: 2025,
    date: "June 12, 2025",
    status: "upcoming"
  },
  {
    id: "broadcom-q2-2025",
    company: "Broadcom",
    quarter: "Q2",
    year: 2025,
    date: "June 13, 2025",
    status: "upcoming"
  },
  {
    id: "costco-q3-2025",
    company: "Costco",
    quarter: "Q3",
    year: 2025,
    date: "June 15, 2025",
    status: "upcoming"
  },
  {
    id: "fedex-q4-2025",
    company: "FedEx",
    quarter: "Q4",
    year: 2025,
    date: "June 18, 2025",
    status: "upcoming"
  }
];

export const getEarningCallById = (id: string): EarningCall | undefined => {
  return EARNING_CALLS.find(call => call.id === id);
};

export const getLiveEarningCalls = (): EarningCall[] => {
  return EARNING_CALLS.filter(call => call.status === "live");
};

export const getCompletedEarningCalls = (): EarningCall[] => {
  return EARNING_CALLS.filter(call => call.status === "completed");
};

export const getUpcomingEarningCalls = (): EarningCall[] => {
  return EARNING_CALLS.filter(call => call.status === "upcoming");
}; 