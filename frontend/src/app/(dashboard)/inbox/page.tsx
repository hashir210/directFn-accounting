import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InboxPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Inbox</CardTitle>
          <CardDescription>Centralize messages and requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="secondary">Coming soon</Badge>
          <p className="text-sm text-muted-foreground">This module is planned for a future phase.</p>
          <Button render={<Link href="/dashboard" />} className="w-full">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
