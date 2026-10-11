import { Alert, AlertDescription } from "@/components/ui/alert";
import { t } from "@/i18n";

type NoticeKey = keyof typeof t.notices;
type ErrorKey = keyof typeof t.errors;

/** Flash message driven by `?notice=` / `?error=` keys set by server actions after a redirect. */
export function Notice({ notice, error }: { notice?: string | string[]; error?: string | string[] }) {
  const noticeKey = Array.isArray(notice) ? notice[0] : notice;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const bad = errorKey && errorKey in t.errors ? t.errors[errorKey as ErrorKey] : null;
  const good = noticeKey && noticeKey in t.notices ? t.notices[noticeKey as NoticeKey] : null;
  if (!bad && !good) return null;
  return (
    <Alert variant={bad ? "destructive" : "default"}>
      <AlertDescription>{bad ?? good}</AlertDescription>
    </Alert>
  );
}
