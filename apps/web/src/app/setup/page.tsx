'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Play } from 'lucide-react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Label,
} from '@repo/ui'
import { usePrescriptionStore } from '@/stores/prescription-store'
import { useReviewStore } from '@/stores/review-store'
import { createSession } from '@/services/review-service'
import { formatDate } from '@/lib/utils'

export default function SetupPage() {
  const router = useRouter()

  const {
    prescriptions,
    filterStartDate,
    filterEndDate,
    filterDepartment,
    isQueried,
  } = usePrescriptionStore()

  const {
    reset: resetReview,
    setSessionId,
    setReviewerName,
    setTargetCount,
    setCandidateIds,
  } = useReviewStore()

  const [reviewerName, setReviewerNameLocal] = useState('')
  const [countInput, setCountInput] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = prescriptions.length

  // Redirect if no prescriptions loaded (direct navigation)
  useEffect(() => {
    if (!isQueried || total === 0) {
      router.replace('/')
    }
  }, [isQueried, total, router])

  // Derived validation
  const parsedCount = parseInt(countInput, 10)
  const countValid =
    !isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= total
  const nameValid = reviewerName.trim().length > 0
  const formValid = nameValid && countValid

  // Summary label
  const dateRangeLabel =
    filterStartDate && filterEndDate
      ? `${formatDate(filterStartDate)} ~ ${formatDate(filterEndDate)}`
      : '—'
  const departmentLabel =
    filterDepartment && filterDepartment !== 'all' ? filterDepartment : '全部科室'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValid) return

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const session = await createSession({
        reviewerName: reviewerName.trim(),
        targetCount: parsedCount,
        filterStartDate: filterStartDate || null,
        filterEndDate: filterEndDate || null,
        filterDepartment:
          filterDepartment && filterDepartment !== 'all'
            ? filterDepartment
            : null,
      })

      resetReview()
      setSessionId(session.id)
      setReviewerName(reviewerName.trim())
      setTargetCount(parsedCount)
      setCandidateIds(prescriptions.map((p) => p.id))

      router.push('/review')
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : '创建审查会话失败，请重试'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render until redirect check passes
  if (!isQueried || total === 0) return null

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回上一步
      </button>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">审查参数设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置本次随机审查的基本信息
        </p>
      </div>

      {/* Query summary */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-sm text-muted-foreground">
            已查询：
            <span className="text-foreground font-medium">
              {dateRangeLabel}
            </span>
            {' '}
            <span className="text-foreground font-medium">
              {departmentLabel}
            </span>
            （共{' '}
            <span className="text-foreground font-semibold">
              {total.toLocaleString('zh-CN')}
            </span>{' '}
            张处方）
          </p>
        </CardContent>
      </Card>

      {/* Setup form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">审查参数</CardTitle>
          <CardDescription>填写以下信息后开始随机抽取审查</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Reviewer name */}
            <div className="space-y-1.5">
              <Label htmlFor="reviewer-name">
                审查人姓名
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="reviewer-name"
                type="text"
                placeholder="请输入审查人姓名"
                value={reviewerName}
                onChange={(e) => setReviewerNameLocal(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                className="max-w-sm"
              />
            </div>

            {/* Random count */}
            <div className="space-y-1.5">
              <Label htmlFor="review-count">
                随机审查数量
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="review-count"
                type="number"
                placeholder={`请输入 1 ~ ${total} 之间的数字`}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                min={1}
                max={total}
                disabled={isSubmitting}
                className="max-w-sm"
              />
              <p className="text-xs text-muted-foreground">
                可审查范围：1 ~ {total.toLocaleString('zh-CN')}
              </p>
            </div>

            {/* Error message */}
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                size="lg"
                disabled={!formValid || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? '正在创建会话...' : '开始审查'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
