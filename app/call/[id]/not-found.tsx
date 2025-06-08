import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="container mx-auto px-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Earning Call Not Found</h1>
              <p className="text-muted-foreground">
                The earning call you&apos;re looking for doesn&apos;t exist or may have been removed.
              </p>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/" className="flex items-center justify-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Calls</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 