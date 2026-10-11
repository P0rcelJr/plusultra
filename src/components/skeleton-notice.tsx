import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fill, t } from "@/i18n";

// Placeholder home card shown by every role until its real screens land in later phases.
export function SkeletonNotice({ title, name }: { title: string; name: string }) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{fill(t.home.greeting, { name })}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t.home.skeletonNotice}</p>
      </CardContent>
    </Card>
  );
}
