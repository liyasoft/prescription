'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Download, Plus, Loader2, ArrowLeft } from 'lucide-react'
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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@repo/ui'
import type { ReviewSession, ReviewRecordWithPrescription, DepartmentStats } from '@repo/shared'
import { getSessionWithRecords } from '@/services/review-service'
import { formatDate, formatDateTime } from '@/lib/utils'

function computeDepartmentStats(records: ReviewRecordWithPrescription[]): DepartmentStats[] {
  const map = new Map<string, DepartmentStats>()
  for (const record of records) {
    const dept = record.prescriptions.department
    if (!map.has(dept)) {
      map.set(dept, { department: dept, total: 0, pass: 0, fail: 0 })
    }
    const stat = map.get(dept)!
    stat.total += 1
    if (record.result === 'pass') stat.pass += 1
    else stat.fail += 1
  }
  return Array.from(map.values()).sort((a, b) => a.department.localeCompare(b.department, 'zh'))
}

function groupFailedByDepartment(
  records: ReviewRecordWithPrescription[]
): Map<string, ReviewRecordWithPrescription[]> {
  const map = new Map<string, ReviewRecordWithPrescription[]>()
  for (const record of records) {
    if (record.result !== 'fail') continue
    const dept = record.prescriptions.department
    if (!map.has(dept)) map.set(dept, [])
    map.get(dept)!.push(record)
  }
  return map
}

export default function ResultPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<ReviewSession | null>(null)
  const [records, setRecords] = useState<ReviewRecordWithPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    getSessionWithRecords(sessionId)
      .then(({ session, records }) => {
        setSession(session)
        setRecords(records)
      })
      .catch(() => setError('加载审查结果失败，请刷新重试'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?sessionId=${sessionId}`)
      if (!res.ok) throw new Error('导出失败')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `审查报告_${sessionId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">{error ?? '未找到审查记录'}</p>
      </div>
    )
  }

  const deptStats = computeDepartmentStats(records)
  const failedByDept = groupFailedByDepartment(records)
  const failedDepts = Array.from(failedByDept.keys()).sort((a, b) =>
    a.localeCompare(b, 'zh')
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/history')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回历史记录
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              导出Excel报告
            </Button>
            <Button onClick={() => router.push('/')}>
              <Plus className="mr-2 h-4 w-4" />
              开始新一轮审查
            </Button>
          </div>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>审查结果汇总</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">审查人：</span>
                <span className="font-medium">{session.reviewer_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">审查时间：</span>
                <span className="font-medium">
                  {formatDateTime(session.started_at)}
                  {session.finished_at ? ` ~ ${formatDateTime(session.finished_at)}` : ''}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Card className="border">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{session.actual_count}</p>
                  <p className="text-sm text-muted-foreground mt-1">总审查数</p>
                </CardContent>
              </Card>
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{session.pass_count}</p>
                  <p className="text-sm text-green-600 mt-1">通过数</p>
                </CardContent>
              </Card>
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{session.fail_count}</p>
                  <p className="text-sm text-red-600 mt-1">不通过数</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card>
          <CardHeader>
            <CardTitle>科室统计</CardTitle>
          </CardHeader>
          <CardContent>
            {deptStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科室</TableHead>
                    <TableHead className="text-right">抽查数</TableHead>
                    <TableHead className="text-right">通过</TableHead>
                    <TableHead className="text-right">不通过</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptStats.map((stat) => (
                    <TableRow key={stat.department}>
                      <TableCell className="font-medium">{stat.department}</TableCell>
                      <TableCell className="text-right">{stat.total}</TableCell>
                      <TableCell className="text-right text-green-600">{stat.pass}</TableCell>
                      <TableCell className="text-right text-red-600">{stat.fail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Failed Prescriptions */}
        {failedDepts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>不通过处方详情</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {failedDepts.map((dept) => {
                  const deptRecords = failedByDept.get(dept)!
                  return (
                    <AccordionItem key={dept} value={dept} className="border rounded-md px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{dept}</span>
                          <Badge variant="destructive">{deptRecords.length} 张不通过</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {deptRecords.map((record) => {
                            const rx = record.prescriptions
                            const drugSummary = rx.prescription_items
                              .map((item) =>
                                item.dispense_qty
                                  ? `${item.drug_name}×${item.dispense_qty}`
                                  : item.drug_name
                              )
                              .join('、')
                            return (
                              <div
                                key={record.id}
                                className="rounded-md border bg-muted/30 p-3 text-sm space-y-1"
                              >
                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                  <span>
                                    <span className="text-muted-foreground">处方号：</span>
                                    <span className="font-mono">{rx.prescription_no}</span>
                                  </span>
                                  <span>
                                    <span className="text-muted-foreground">日期：</span>
                                    {formatDate(rx.prescribe_date)}
                                  </span>
                                  <span>
                                    <span className="text-muted-foreground">患者：</span>
                                    {rx.patient_name}
                                    {rx.gender ? `（${rx.gender}）` : ''}
                                    {rx.age ? `，${rx.age}岁` : ''}
                                  </span>
                                  {rx.diagnosis && (
                                    <span>
                                      <span className="text-muted-foreground">诊断：</span>
                                      {rx.diagnosis}
                                    </span>
                                  )}
                                </div>
                                {drugSummary && (
                                  <div>
                                    <span className="text-muted-foreground">药品：</span>
                                    {drugSummary}
                                  </div>
                                )}
                                {record.fail_reason && (
                                  <div className="text-red-600 font-medium">
                                    不通过原因：{record.fail_reason}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
