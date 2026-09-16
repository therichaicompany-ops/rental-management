'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarClock, AlertCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'
import type { DueTask } from '@/lib/actions/dashboard'

function isOverdue(d: string): boolean {
  return d < new Date().toISOString().slice(0, 10)
}

function isToday(d: string): boolean {
  return d === new Date().toISOString().slice(0, 10)
}

interface TaskDueListProps {
  tasks: DueTask[]
}

export function TaskDueList({ tasks }: TaskDueListProps) {
  const { t, locale } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'

  function formatDate(s: string): string {
    return new Date(s).toLocaleDateString(intlLocale, {
      day: 'numeric',
      month: 'short',
    })
  }

  const getStatusLabel = (status: string) => {
    if (status === 'todo') return t.opening.checklist
    if (status === 'in_progress') return t.opening.currentStage
    if (status === 'done') return t.common.success
    return status
  }

  if (tasks.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t.dashboard.noUrgentTasks}
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {tasks.map((task) => {
        const overdue = isOverdue(task.due_date)
        const today = isToday(task.due_date)

        return (
          <div key={task.id} className="flex items-start gap-3 py-3 hover:bg-muted/30 px-1 rounded transition-colors">
            <div className="mt-0.5 shrink-0">
              {overdue ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : today ? (
                <CalendarClock className="h-4 w-4 text-orange-500" />
              ) : (
                <Clock className="h-4 w-4 text-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.task_name}</p>
              <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground mt-0.5">
                <span className="truncate">{task.location_name}</span>
                {task.assigned_name && (
                  <span className="text-muted-foreground/70">· {task.assigned_name}</span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              <span
                className={`text-xs font-semibold tabular-nums ${
                  overdue ? 'text-red-600' : today ? 'text-orange-600' : 'text-slate-600'
                }`}
              >
                {formatDate(task.due_date)}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0"
              >
                {getStatusLabel(task.status)}
              </Badge>
            </div>

            <Link
              href={`/opening/${task.opening_project_id}`}
              className="shrink-0 self-center text-primary hover:underline text-xs ml-1"
            >
              {t.common.view}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
