import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingRows({ rows = 3, height = "h-20" }: { rows?: number; height?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={height} />
        ))}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Gagal memuat data</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        {message}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="ml-auto">
            <RefreshCw /> Coba lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
        <div className="font-heading text-sm font-medium">{title}</div>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
