import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const supabase = createServerSupabase()

  // Fetch session
  const { data: sessionData, error: sessionError } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (sessionError || !sessionData) {
    return NextResponse.json({ error: '审查会话不存在' }, { status: 404 })
  }
  const session = sessionData as any

  // Fetch records with prescriptions and items
  const { data: records, error: recordsError } = await supabase
    .from('review_records')
    .select(`
      *,
      prescriptions (
        id, prescription_no, prescribe_date, patient_name,
        gender, age, department, diagnosis,
        prescription_items (drug_name, drug_spec, dispense_qty, single_dose, single_dose_unit, usage_method, frequency, retail_price, subtotal)
      )
    `)
    .eq('session_id', sessionId)
    .order('reviewed_at', { ascending: true })
  if (recordsError) {
    return NextResponse.json({ error: '查询审查记录失败' }, { status: 500 })
  }
  const recordsList = (records || []) as any[]

  // Compute department stats
  const deptMap = new Map<string, { total: number; pass: number; fail: number }>()
  for (const r of recordsList) {
    const dept = (r as any).prescriptions?.department || '未知'
    const stat = deptMap.get(dept) || { total: 0, pass: 0, fail: 0 }
    stat.total++
    if (r.result === 'pass') stat.pass++
    else stat.fail++
    deptMap.set(dept, stat)
  }
  const deptStats = Array.from(deptMap.entries()).sort((a, b) => b[1].total - a[1].total)

  const failedRecords = recordsList.filter((r: any) => r.result === 'fail')

  // Create workbook
  const workbook = new ExcelJS.Workbook()

  // ===== Sheet 1: 审查汇总 =====
  const summarySheet = workbook.addWorksheet('审查汇总')
  summarySheet.columns = [
    { header: '项目', key: 'item', width: 20 },
    { header: '内容', key: 'value', width: 40 },
  ]

  const formatTime = (d: string | null) =>
    d ? new Date(d).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-'

  summarySheet.addRows([
    { item: '审查人', value: session.reviewer_name },
    { item: '审查开始时间', value: formatTime(session.started_at) },
    { item: '审查结束时间', value: formatTime(session.finished_at) },
    { item: '审查状态', value: session.status === 'completed' ? '已完成' : '已终止' },
    { item: '设定审查数量', value: session.target_count },
    { item: '实际审查数量', value: session.actual_count },
    { item: '通过数量', value: session.pass_count },
    { item: '不通过数量', value: session.fail_count },
  ])

  // Style header
  summarySheet.getRow(1).font = { bold: true }
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

  // ===== Sheet 2: 科室统计 =====
  const deptSheet = workbook.addWorksheet('科室统计')
  deptSheet.columns = [
    { header: '科室', key: 'department', width: 20 },
    { header: '抽查数', key: 'total', width: 12 },
    { header: '通过', key: 'pass', width: 12 },
    { header: '不通过', key: 'fail', width: 12 },
  ]
  for (const [dept, stat] of deptStats) {
    deptSheet.addRow({ department: dept, total: stat.total, pass: stat.pass, fail: stat.fail })
  }
  deptSheet.getRow(1).font = { bold: true }
  deptSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

  // ===== Sheet 3: 不通过处方明细 =====
  const failSheet = workbook.addWorksheet('不通过处方明细')
  failSheet.columns = [
    { header: '处方号码', key: 'no', width: 20 },
    { header: '开方日期', key: 'date', width: 16 },
    { header: '病人姓名', key: 'name', width: 12 },
    { header: '性别', key: 'gender', width: 6 },
    { header: '年龄', key: 'age', width: 8 },
    { header: '开单科室', key: 'dept', width: 14 },
    { header: '门诊诊断', key: 'diagnosis', width: 24 },
    { header: '用药信息', key: 'drugs', width: 40 },
    { header: '不通过原因', key: 'reason', width: 30 },
  ]

  for (const r of failedRecords) {
    const p = (r as any).prescriptions
    if (!p) continue
    const drugs = (p.prescription_items || [])
      .map((d: any) => `${d.drug_name} ${d.dispense_qty || ''}`)
      .join('；')
    failSheet.addRow({
      no: p.prescription_no,
      date: new Date(p.prescribe_date).toLocaleDateString('zh-CN'),
      name: p.patient_name,
      gender: p.gender || '',
      age: p.age || '',
      dept: p.department,
      diagnosis: p.diagnosis || '',
      drugs,
      reason: r.fail_reason || '',
    })
  }
  failSheet.getRow(1).font = { bold: true }
  failSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

  // Highlight reason column
  failSheet.getColumn('reason').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.font = { color: { argb: 'FFCC0000' } }
    }
  })

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()

  const fileName = encodeURIComponent(`处方审查报告_${new Date().toISOString().slice(0, 10)}.xlsx`)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
