import type { Metadata } from "next";
import { Notice } from "@/components/notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { requireRole } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: t.settings.title };

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const settings = await getSettings();

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.title}</CardTitle>
          <CardDescription>{t.settings.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initial={{
              bookingWindowDays: settings.bookingWindowDays,
              cancelDeadlineHours: settings.cancelDeadlineHours,
              materializeHorizonWeeks: settings.materializeHorizonWeeks,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
