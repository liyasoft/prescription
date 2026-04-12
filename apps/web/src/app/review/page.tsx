'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, StopCircle, Loader2 } from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Textarea,
} from '@repo/ui'
import { usePrescriptionStore } from '@/stores/prescription-store'
import { useReviewStore } from '@/stores/review-store'
import { getPrescriptionWithItems } from '@/services/prescription-service'
import { addReviewRecord, finishSession, getReviewedPrescriptionIds } from '@/services/review-service'
import { formatDate } from '@/lib/utils'
import type { PrescriptionWithItems } from '@repo/shared'

export default function ReviewPage() {
  const router = useRouter()

  const { prescriptions } = usePrescriptionStore()
  const {
    sessionId,
    reviewerName,
    targetCount,
    passCount,
    failCount,
    candidateIds,
    reviewedIds,
    setCandidateIds,
    setReviewedIds,
    setPassCount,
    setFailCount,
    setCurrentIndex,
    addReviewedId,
    incrementPass,
    incrementFail,
    getNextRandomId,
    reset: resetReview,
  } = useReviewStore()

  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [failDialogOpen, setFailDialogOpen] = useState(false)
  const [failReason, setFailReason] = useState('')
  const [failReasonError, setFailReasonError] = useState('')

  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [isTerminating, setIsTerminating] = useState(false)

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

  const reviewedCount = passCount + failCount
  const progressPercent = targetCount > 0 ? Math.round((reviewedCount / targetCount) * 100) : 0

  const loadNextPrescription = useCallback(async (currentReviewedIds: string[]) => {
    const { candidateIds: ids } = useReviewStore.getState()
    const remaining = ids.filter((id) => !currentReviewedIds.includes(id))
    if (remaining.length === 0) {
      setCurrentPrescription(null)
      return
    }
    const randomIndex = Math.floor(Math.random() * remaining.length)
    const nextId = remaining[randomIndex]
    setIsLoading(true)
    setError(null)
    try {
      const prescription = await getPrescriptionWithItems(nextId)
      setCurrentPrescription(prescription)
    } catch {
      setError('加载处方失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // On mount: validate session, bootstrap state, load first prescription
  useEffect(() => {
    async function init() {
      if (!sessionId) {
        router.replace('/')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Restore candidate IDs from prescription store if not already set
        let ids = candidateIds
        if (ids.length === 0) {
          ids = prescriptions.map((p) => p.id)
          if (ids.length === 0) {
            // No prescriptions in store — go back to home
            router.replace('/')
            return
          }
          setCandidateIds(ids)
        }

        // Load already-reviewed IDs from DB to support session recovery
        const alreadyReviewed = await getReviewedPrescriptionIds(sessionId)
        if (alreadyReviewed.length > 0) {
          setReviewedIds(alreadyReviewed)
          setCurrentIndex(alreadyReviewed.length)
        }

        const remaining = ids.filter((id) => !alreadyReviewed.includes(id))
        if (remaining.length === 0 || alreadyReviewed.length >= targetCount) {
          setCompleteDialogOpen(true)
          setIsLoading(false)
          return
        }

        const randomIndex = Math.floor(Math.random() * remaining.length)
        const nextId = remaining[randomIndex]
        const prescription = await getPrescriptionWithItems(nextId)
        setCurrentPrescription(prescription)
      } catch {
        setError('初始化失败，请返回首页重试')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitReview(result: 'pass' | 'fail', reason?: string) {
    if (!sessionId || !currentPrescription) return
    setIsSubmitting(true)
    setError(null)

    try {
      await addReviewRecord(sessionId, currentPrescription.id, result, reason)

      const newReviewedIds = [...reviewedIds, currentPrescription.id]
      addReviewedId(currentPrescription.id)

      if (result === 'pass') {
        incrementPass()
      } else {
        incrementFail()
      }

      const newReviewedCount = reviewedIds.length + 1

      if (newReviewedCount >= targetCount) {
        await finishSession(sessionId, 'completed')
        setCompleteDialogOpen(true)
        setCurrentPrescription(null)
        return
      }

      await loadNextPrescription(newReviewedIds)
    } catch {
      setError('提交审查结果失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePassClick() {
    submitReview('pass')
  }

  function handleFailClick() {
    setFailReason('')
    setFailReasonError('')
    setFailDialogOpen(true)
  }

  async function handleFailConfirm() {
    const trimmed = failReason.trim()
    if (!trimmed) {
      setFailReasonError('请填写不通过原因')
      return
    }
    setFailDialogOpen(false)
    await submitReview('fail', trimmed)
  }

  async function handleTerminate() {
    if (!sessionId) return
    setIsTerminating(true)
    try {
      await finishSession(sessionId, 'terminated')
      resetReview()
      router.replace('/')
    } catch {
      setError('终止审查失败，请重试')
      setIsTerminating(false)
    }
    setTerminateDialogOpen(false)
  }

  function handleViewResults() {
    router.push('/history')
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">加载处方中...</p>
      </div>
    )
  }

  // Fatal error (no session, etc.)
  if (error && !currentPrescription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={() => router.replace('/')}>返回首页</Button>
      </div>
    )
  }

  const p = currentPrescription

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                第 {reviewedCount + (p ? 1 : 0)} / {targetCount} 张
              </span>
              <span className="text-sm text-muted-foreground">审查人：{reviewerName}</span>
              <Badge variant="secondary" className="text-green-700 bg-green-50">
                通过 {passCount}
              </Badge>
              <Badge variant="secondary" className="text-red-700 bg-red-50">
                不通过 {failCount}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminateDialogOpen(true)}
              disabled={isSubmitting}
            >
              <StopCircle className="mr-1.5 h-4 w-4 text-destructive" />
              终止审查
            </Button>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{progressPercent}%</p>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive px-1">{error}</p>
      )}

      {p && (
        <>
          {/* Prescription Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">处方信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 text-sm">
                <InfoRow label="处方编号" value={p.prescription_no} />
                <InfoRow label="开方日期" value={formatDate(p.prescribe_date)} />
                <InfoRow label="患者姓名" value={p.patient_name} />
                <InfoRow label="性别" value={p.gender ?? '—'} />
                <InfoRow label="年龄" value={p.age ?? '—'} />
                <InfoRow label="科室" value={p.department} />
                <InfoRow label="诊断" value={p.diagnosis ?? '—'} className="col-span-2" />
              </div>
            </CardContent>
          </Card>

          {/* Drug Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">药品明细</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">序号</TableHead>
                      <TableHead>药品名称</TableHead>
                      <TableHead>药品规格</TableHead>
                      <TableHead>产地</TableHead>
                      <TableHead className="text-right">发药数量</TableHead>
                      <TableHead className="text-right">单次用量</TableHead>
                      <TableHead className="text-right">零售价</TableHead>
                      <TableHead className="text-right">小计</TableHead>
                      <TableHead>用法</TableHead>
                      <TableHead>频次</TableHead>
                      <TableHead>医生嘱托</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.prescription_items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
                          暂无药品明细
                        </TableCell>
                      </TableRow>
                    ) : (
                      p.prescription_items.map((item, idx) => {
                        const singleDose =
                          item.single_dose && item.single_dose_unit
                            ? `${item.single_dose}${item.single_dose_unit}`
                            : item.single_dose ?? '—'
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium">{item.drug_name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.drug_spec ?? '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{item.manufacturer ?? '—'}</TableCell>
                            <TableCell className="text-right">{item.dispense_qty ?? '—'}</TableCell>
                            <TableCell className="text-right">{singleDose}</TableCell>
                            <TableCell className="text-right">
                              {item.retail_price != null ? `¥${item.retail_price.toFixed(2)}` : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.subtotal != null ? `¥${item.subtotal.toFixed(2)}` : '—'}
                            </TableCell>
                            <TableCell>{item.usage_method ?? '—'}</TableCell>
                            <TableCell>{item.frequency ?? '—'}</TableCell>
                            <TableCell className="max-w-[160px] truncate" title={item.doctor_advice ?? ''}>
                              {item.doctor_advice ?? '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pb-6">
            <Button
              size="lg"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 min-w-[140px]"
              onClick={handleFailClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-5 w-5" />
              )}
              审查不通过
            </Button>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
              onClick={handlePassClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              审查通过
            </Button>
          </div>
        </>
      )}

      {/* Fail Reason Dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>填写不通过原因</DialogTitle>
            <DialogDescription>
              请详细描述该处方不通过审查的原因，此信息将记录在审查报告中。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea
              placeholder="请输入不通过原因..."
              value={failReason}
              onChange={(e) => {
                setFailReason(e.target.value)
                if (e.target.value.trim()) setFailReasonError('')
              }}
              rows={4}
              className={failReasonError ? 'border-destructive' : ''}
            />
            {failReasonError && (
              <p className="text-xs text-destructive">{failReasonError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFailDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleFailConfirm}
            >
              确认不通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认终止审查</DialogTitle>
            <DialogDescription>
              终止后本次审查将标记为已终止，无法继续。
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1 text-sm">
            <p>已审查：<strong>{reviewedCount}</strong> / {targetCount} 张</p>
            <p>通过：<strong className="text-green-600">{passCount}</strong> 张 &nbsp; 不通过：<strong className="text-red-600">{failCount}</strong> 张</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)} disabled={isTerminating}>
              继续审查
            </Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={isTerminating}>
              {isTerminating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认终止
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审查完成</DialogTitle>
            <DialogDescription>
              本次随机审查已全部完成，以下是审查汇总。
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2 text-sm">
            <p>审查人：<strong>{reviewerName}</strong></p>
            <p>目标数量：<strong>{targetCount}</strong> 张</p>
            <p>实际审查：<strong>{reviewedCount}</strong> 张</p>
            <div className="flex gap-6 pt-1">
              <span className="text-green-600 font-semibold">通过 {passCount} 张</span>
              <span className="text-red-600 font-semibold">不通过 {failCount} 张</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleViewResults}>
              查看审查结果
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <span className="text-muted-foreground">{label}：</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
