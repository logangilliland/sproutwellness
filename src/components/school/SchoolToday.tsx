import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Panel, Chip } from "@/components/lifeos/Bits";
import { useSchool, useRefreshSchool } from "@/hooks/useSchool";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { completeAssignment } from "@/lib/school.mutations";
import { dueLabel, isDone, overdue, prettyClass } from "@/lib/school";
import { addDays, todayKey } from "@/lib/lifeos";

/** School work that matters today, shown on the Today page. */
export function SchoolToday() {
  const { data } = useSchool();
  const { data: life } = useLifeData();
  const refresh = useRefreshSchool();
  const refreshLife = useRefreshLife();
  const today = todayKey();

  if (!data) return null;
  const schoolCategoryId = life?.categories.find((c) => c.key === "school")?.id ?? null;

  const open = data.assignments.filter((a) => !isDone(a));
  const late = overdue(data.assignments, today);
  const dueToday = open.filter((a) => a.due_date === today);
  const soon = open
    .filter((a) => a.due_date && a.due_date > today && a.due_date <= addDays(today, 7))
    .sort((x, y) => (x.due_date ?? "").localeCompare(y.due_date ?? ""))
    .slice(0, 4);

  const rows = [...late, ...dueToday, ...soon];

  return (
    <Panel
      title="School"
      action={
        <Link to="/school" className="text-xs text-primary hover:underline">
          Open school
        </Link>
      }
    >
      {rows.length ? (
        <ul className="space-y-1">
          {rows.map((a) => {
            const isLate = !!a.due_date && a.due_date < today;
            return (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={async () => {
                    await completeAssignment(a, schoolCategoryId, today);
                    refresh();
                    refreshLife();
                    toast.success(`${a.title} — School points added.`);
                  }}
                  aria-label={`Complete ${a.title}`}
                />
                <span className="flex-1 truncate">
                  {a.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {prettyClass(data.classes, a.class_id)}
                  </span>
                </span>
                <Chip tone={isLate || a.due_date === today ? "danger" : ""}>
                  {dueLabel(a, today)}
                </Chip>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing due this week. Add classes and assignments on the school page.
        </p>
      )}
    </Panel>
  );
}
