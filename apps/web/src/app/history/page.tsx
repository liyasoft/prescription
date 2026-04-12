'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, History } from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui'
import type { ReviewSession } from '@repo/shared'
import { getHistorySessions } from '@/services/review-service'
import { formatDateTime } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  completed: '已完成',
  terminated: '已终止',
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
        已完成
      </Badge>
    )
  }
  if (status === 'terminated') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
        已终止
      </Badge>
    )
  }
  return <Badge variant="outline">{STATUS_LABEL[status] ?? status}</Badge>
}

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getHistorySessions()
      .then((data) => setSessions(data))
      .catch(() => setError('加载历史记录失败，请刷新重试'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="h-5 w-5" />
            <span className="text-sm">历史审查记录</span>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>历史审查记录</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="text-center py-12 text-destructive">{error}</p>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <History className="h-10 w-10 opacity-30" />
                <p>暂无审查记录</p>
                <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                  开始第一次审查
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>审查人</TableHead>
                    <TableHead>审查时间</TableHead>
                    <TableHead className="text-right">审查数量</TableHead>
                    <TableHead className="text-right">通过</TableHead>
                    <TableHead className="text-right">不通过</TableHead>
                    <TableHead className="text-center">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/result/${session.id}`)}
                    >
                      <TableCell className="font-medium">{session.reviewer_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(session.started_at)}
                        {session.finished_at
                          ? ` ~ ${formatDateTime(session.finished_at)}`
                          : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        {session.actual_count}
                        <span className="text-muted-foreground text-xs">
                          /{session.target_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {session.pass_count}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {session.fail_count}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={session.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
