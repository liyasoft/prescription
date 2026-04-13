'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, History, ArrowRight, Loader2 } from 'lucide-react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@repo/ui'
import { fetchDepartments, queryPrescriptions, queryPrescriptionIds } from '@/services/prescription-service'
import { getInProgressSession, finishSession } from '@/services/review-service'
import { usePrescriptionStore } from '@/stores/prescription-store'
import { useReviewStore } from '@/stores/review-store'
import { formatDateTime } from '@/lib/utils'
import type { ReviewSession } from '@repo/shared'

export default function HomePage() {
  const router = useRouter()

  const {
    prescriptions,
    departments,
    filterStartDate,
    filterEndDate,
    filterDepartment,
    isLoading,
    isQueried,
    setPrescriptions,
    setDepartments,
    setFilter,
    setLoading,
    setQueried,
  } = usePrescriptionStore()

  const {
    reset: resetReview,
    setSessionId,
    setReviewerName,
    setTargetCount,
    setPassCount,
    setFailCount,
    setCandidateIds,
  } = useReviewStore()

  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  // Session recovery state
  const [inProgressSession, setInProgressSession] = useState<ReviewSession | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [sessionActionLoading, setSessionActionLoading] = useState(false)

  // Load departments on mount
  useEffect(() => {
    async function loadDepartments() {
      if (departments.length > 0) return
      setDepartmentsLoading(true)
      try {
        const data = await fetchDepartments()
        setDepartments(data)
      } catch {
        // Non-critical, silently fail
      } finally {
        setDepartmentsLoading(false)
      }
    }
    loadDepartments()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Check for in-progress session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getInProgressSession()
        if (session) {
          setInProgressSession(session)
          setSessionDialogOpen(true)
        }
      } catch {
        // Non-critical
      }
    }
    checkSession()
  }, [])

  async function handleQuery() {
    if (!filterStartDate || !filterEndDate) {
      setQueryError('请选择开始日期和结束日期')
      return
    }
    if (filterStartDate > filterEndDate) {
      setQueryError('开始日期不能晚于结束日期')
      return
    }
    setQueryError(null)
    setLoading(true)
    try {
      const data = await queryPrescriptions(
        filterStartDate,
        filterEndDate,
        filterDepartment === 'all' ? undefined : filterDepartment
      )
      setPrescriptions(data)
      setQueried(true)
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : '查询失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleContinueSession() {
    if (!inProgressSession) return
    setSessionActionLoading(true)
    try {
      // Restore store state from the saved session so /review doesn't redirect back
      setSessionId(inProgressSession.id)
      setReviewerName(inProgressSession.reviewer_name)
      setTargetCount(inProgressSession.target_count)
      setPassCount(inProgressSession.pass_count)
      setFailCount(inProgressSession.fail_count)

      // Rebuild candidate IDs from the session's original filter params
      if (inProgressSession.filter_start_date && inProgressSession.filter_end_date) {
        const ids = await queryPrescriptionIds(
          inProgressSession.filter_start_date,
          inProgressSession.filter_end_date,
          inProgressSession.filter_department
        )
        if (ids.length === 0) {
          setQueryError('未找到该会话对应的处方数据，无法继续审查')
          return
        }
        setCandidateIds(ids)
      } else {
        setQueryError('会话数据不完整，无法恢复')
        return
      }

      setSessionDialogOpen(false)
      router.push('/review')
    } catch {
      setQueryError('恢复会话失败，请重试')
    } finally {
      setSessionActionLoading(false)
    }
  }

  async function handleAbandonSession() {
    if (!inProgressSession) return
    setSessionActionLoading(true)
    try {
      await finishSession(inProgressSession.id, 'terminated')
      resetReview()
      setInProgressSession(null)
      setSessionDialogOpen(false)
    } catch {
      setQueryError('放弃会话失败，请重试')
    } finally {
      setSessionActionLoading(false)
    }
  }

  // Re-derive department stats on every render so the table stays in sync with the store
  const stats = (() => {
    const map = new Map<string, number>()
    prescriptions.forEach((p) => {
      map.set(p.department, (map.get(p.department) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
  })()

  const totalCount = prescriptions.length
  const deptCount = stats.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">处方审查助手</h1>
          <p className="text-sm text-muted-foreground mt-1">查询处方数据，开始随机审查</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/history')}>
          <History className="mr-2 h-4 w-4" />
          历史记录
        </Button>
      </div>

      {/* Query Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据查询</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">开始日期</label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilter({ filterStartDate: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">结束日期</label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilter({ filterEndDate: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">科室</label>
              <Select
                value={filterDepartment}
                onValueChange={(val) => setFilter({ filterDepartment: val })}
                disabled={departmentsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={departmentsLoading ? '加载中...' : '选择科室'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部科室</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleQuery}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {isLoading ? '查询中...' : '查询'}
              </Button>
            </div>
          </div>

          {queryError && (
            <p className="mt-3 text-sm text-destructive">{queryError}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isQueried && !isLoading && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalCount.toLocaleString('zh-CN')}</p>
                  <p className="text-sm text-muted-foreground mt-1">处方总数（去重）</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{deptCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">涉及科室数</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Distribution */}
          {stats.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">科室分布</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>科室名称</TableHead>
                      <TableHead className="text-right">处方数量</TableHead>
                      <TableHead className="text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map(({ department, count }) => (
                      <TableRow key={department}>
                        <TableCell className="font-medium">{department}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{count.toLocaleString('zh-CN')}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                该时间段内未查询到处方数据
              </CardContent>
            </Card>
          )}

          {/* Next Step */}
          {totalCount > 0 && (
            <div className="flex justify-end">
              <Button size="lg" onClick={() => router.push('/setup')}>
                下一步：设置审查参数
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Session Recovery Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发现未完成的审查会话</DialogTitle>
            <DialogDescription>
              {inProgressSession && (
                <>
                  审查人：<strong>{inProgressSession.reviewer_name}</strong>，
                  开始于 {formatDateTime(inProgressSession.started_at)}。
                  是否继续该会话？
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleAbandonSession}
              disabled={sessionActionLoading}
            >
              {sessionActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              放弃并重新开始
            </Button>
            <Button
              onClick={handleContinueSession}
              disabled={sessionActionLoading}
            >
              {sessionActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              继续审查
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
