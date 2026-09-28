'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Building,
  User,
  Globe,
  FileText,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  customerSchema,
  type CustomerFormValues,
  type Customer,
} from '@/lib/types/master-data'
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from '@/lib/actions/customers'
import {
  uploadDocumentAction,
  listDocumentsAction,
} from '@/lib/actions/documents'
import type { DocumentType } from '@/lib/types/documents'
import type { UserRole } from '@/lib/types/auth'
import { hasFullAccess, canWrite } from '@/lib/auth/permissions'
import {
  CustomerDocumentSlots,
  type CustomerCategory,
} from './customer-document-slots'

const FOREIGNER_TAG = '[สัญชาติ: ต่างชาติ]'
const THAI_TAG = '[สัญชาติ: ไทย]'

interface CustomerFormProps {
  initialData?: Customer
  userRole: UserRole
}

export function CustomerForm({ initialData, userRole }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isEdit = Boolean(initialData)
  const allowEdit = canWrite(userRole)
  const allowDelete = isEdit && hasFullAccess(userRole)

  // Clean initial note from tags
  const initialCleanNote = React.useMemo(() => {
    return (initialData?.note || '')
      .replaceAll(FOREIGNER_TAG, '')
      .replaceAll(THAI_TAG, '')
      .trim()
  }, [initialData?.note])

  // Category state (Company vs Thai Individual vs Foreigner Individual)
  const [customerCategory, setCustomerCategory] = React.useState<CustomerCategory>(() => {
    if (!initialData) return 'company'
    if (initialData.customer_type === 'company') return 'company'
    if (
      initialData.note?.includes(FOREIGNER_TAG) ||
      initialData.note?.includes('[ชาวต่างชาติ]') ||
      initialData.note?.toLowerCase().includes('foreigner')
    ) {
      return 'foreigner_individual'
    }
    return 'thai_individual'
  })

  // Staged files per document slot
  const [stagedFiles, setStagedFiles] = React.useState<Record<string, File[]>>({})
  const [missingSlots, setMissingSlots] = React.useState<DocumentType[]>([])
  const [existingDocTypes, setExistingDocTypes] = React.useState<DocumentType[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_code: initialData?.customer_code ?? '',
      customer_type: initialData?.customer_type ?? 'company',
      name: initialData?.name ?? '',
      company_name: initialData?.company_name ?? '',
      tax_id: initialData?.tax_id ?? '',
      contact_name: initialData?.contact_name ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      line_name: initialData?.line_name ?? '',
      address: initialData?.address ?? '',
      note: initialCleanNote,
    },
  })

  // Fetch existing documents on edit to track which slots are satisfied
  React.useEffect(() => {
    if (!initialData?.id) return
    listDocumentsAction('customer', initialData.id).then((res) => {
      if (res.success && res.data) {
        const types = res.data.map((d) => d.document_type as DocumentType)
        setExistingDocTypes(types)
        // Auto-switch to foreigner_individual if foreigner docs already exist
        if (
          initialData.customer_type === 'individual' &&
          types.some((t) =>
            ['PASSPORT', 'VISA', 'WORK_PERMIT', 'PINK_CARD', 'SMART_CARD', 'OVERSTAY_90_DAYS_NOTICE'].includes(t)
          )
        ) {
          setCustomerCategory('foreigner_individual')
        }
      }
    })
  }, [initialData?.id, initialData?.customer_type])

  const handleCategoryChange = (cat: CustomerCategory) => {
    setCustomerCategory(cat)
    setMissingSlots([])
    setServerError(null)
    if (cat === 'company') {
      setValue('customer_type', 'company')
    } else {
      setValue('customer_type', 'individual')
    }
  }

  const onSubmit = (values: CustomerFormValues) => {
    if (!allowEdit) return
    setServerError(null)

    // 1. Validate required documents based on category
    const missing: DocumentType[] = []
    if (customerCategory === 'foreigner_individual') {
      const requiredTypes: DocumentType[] = ['PASSPORT', 'VISA', 'WORK_PERMIT']
      for (const t of requiredTypes) {
        const hasStaged = (stagedFiles[t]?.length ?? 0) > 0
        const hasExisting = existingDocTypes.includes(t)
        if (!hasStaged && !hasExisting) {
          missing.push(t)
        }
      }
      if (missing.length > 0) {
        setMissingSlots(missing)
        setServerError(
          'กรุณาแนบไฟล์เอกสารที่จำเป็นของชาวต่างชาติให้ครบถ้วน: 1.หน้าพาสปอร์ต, 2.หน้าวีซ่า, 3.ใบอนุญาตทำงาน Work permit'
        )
        return
      }
    } else if (customerCategory === 'thai_individual') {
      const hasStaged = (stagedFiles['ID_CARD']?.length ?? 0) > 0
      const hasExisting = existingDocTypes.includes('ID_CARD')
      if (!hasStaged && !hasExisting) {
        setMissingSlots(['ID_CARD'])
        setServerError('กรุณาแนบไฟล์เอกสารที่จำเป็น: สำเนาบัตรประชาชน')
        return
      }
    } else if (customerCategory === 'company') {
      const requiredTypes: DocumentType[] = ['COMPANY_CERTIFICATE', 'DIRECTOR_ID_CARD']
      for (const t of requiredTypes) {
        const hasStaged = (stagedFiles[t]?.length ?? 0) > 0
        const hasExisting = existingDocTypes.includes(t)
        if (!hasStaged && !hasExisting) {
          missing.push(t)
        }
      }
      if (missing.length > 0) {
        setMissingSlots(missing)
        setServerError(
          'กรุณาแนบไฟล์เอกสารที่จำเป็นของนิติบุคคลให้ครบถ้วน: หนังสือรับรองบริษัท และสำเนาบัตรประชาชนกรรมการ'
        )
        return
      }
    }

    startTransition(async () => {
      // Build final note with category metadata tag
      const rawUserNote = (values.note || '')
        .replaceAll(FOREIGNER_TAG, '')
        .replaceAll(THAI_TAG, '')
        .trim()

      let finalNote = rawUserNote
      if (customerCategory === 'foreigner_individual') {
        finalNote = finalNote ? `${finalNote}\n\n${FOREIGNER_TAG}` : FOREIGNER_TAG
      } else if (customerCategory === 'thai_individual') {
        finalNote = finalNote ? `${finalNote}\n\n${THAI_TAG}` : THAI_TAG
      }

      const submissionValues: CustomerFormValues = {
        ...values,
        customer_type: customerCategory === 'company' ? 'company' : 'individual',
        note: finalNote || null,
      }

      let customerId = initialData?.id
      if (isEdit && initialData) {
        const res = await updateCustomerAction(initialData.id, submissionValues)
        if (!res.success) {
          setServerError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
          return
        }
      } else {
        const res = await createCustomerAction(submissionValues)
        if (!res.success) {
          setServerError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
          return
        }
        customerId = (res.data as { id: string }).id
      }

      // Upload all staged files for this customer
      let uploadFailures = 0
      for (const [docType, files] of Object.entries(stagedFiles)) {
        if (!files || files.length === 0) continue
        for (const file of files) {
          const formData = new FormData()
          formData.set('file', file)
          formData.set('entity_type', 'customer')
          formData.set('entity_id', customerId!)
          formData.set('document_type', docType)

          const upRes = await uploadDocumentAction(formData)
          if (!upRes.success) {
            uploadFailures++
            console.error(`Failed to upload ${file.name}:`, upRes.error)
          }
        }
      }

      if (uploadFailures > 0) {
        alert(`บันทึกข้อมูลลูกค้าสำเร็จ แต่มีเอกสารบางไฟล์อัปโหลดไม่สำเร็จ (${uploadFailures} ไฟล์)`)
      }

      router.push('/customers')
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!initialData || !allowDelete) return
    setIsDeleting(true)
    setServerError(null)

    try {
      const res = await deleteCustomerAction(initialData.id)
      if (!res.success) {
        setServerError(res.error || 'ไม่สามารถลบข้อมูลได้')
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        return
      }
      router.push('/customers')
      router.refresh()
    } catch {
      setServerError('เกิดข้อผิดพลาดในการลบข้อมูล')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top bar with back button & title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'แก้ไขข้อมูลลูกค้า/ผู้เช่า' : 'เพิ่มลูกค้า/ผู้เช่าใหม่'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `รหัส: ${initialData?.customer_code || initialData?.id}`
                : 'กรอกข้อมูลรายละเอียดลูกค้า/ผู้เช่า พร้อมแนบไฟล์เอกสารเพื่อบันทึกเข้าระบบ'}
            </p>
          </div>
        </div>

        {allowDelete && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            ลบลูกค้า/ผู้เช่า
          </Button>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Section: Basic Info */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-primary-600" />
              ข้อมูลทั่วไป
            </h2>

            {/* Category Selector Cards */}
            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                รูปแบบลูกค้า/ผู้เช่า และสัญชาติ <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. นิติบุคคล */}
                <button
                  type="button"
                  disabled={!allowEdit}
                  onClick={() => handleCategoryChange('company')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    customerCategory === 'company'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <Building
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      customerCategory === 'company' ? 'text-white' : 'text-indigo-600'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">🏢 นิติบุคคล</div>
                    <div
                      className={`text-[11px] mt-0.5 leading-snug ${
                        customerCategory === 'company' ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      บริษัท / ห้างหุ้นส่วนจำกัด
                    </div>
                    <div
                      className={`text-[10px] mt-1.5 font-medium ${
                        customerCategory === 'company' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      แนบ: หนังสือรับรองบริษัท, บัตรประชาชนกรรมการ
                    </div>
                  </div>
                </button>

                {/* 2. บุคคลธรรมดา (สัญชาติไทย) */}
                <button
                  type="button"
                  disabled={!allowEdit}
                  onClick={() => handleCategoryChange('thai_individual')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    customerCategory === 'thai_individual'
                      ? 'bg-primary-600 text-white border-primary-700 shadow-md ring-2 ring-primary-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <User
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      customerCategory === 'thai_individual' ? 'text-white' : 'text-primary-600'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">🇹🇭 คนไทย (บุคคลธรรมดา)</div>
                    <div
                      className={`text-[11px] mt-0.5 leading-snug ${
                        customerCategory === 'thai_individual' ? 'text-primary-100' : 'text-slate-500'
                      }`}
                    >
                      บุคคลธรรมดาสัญชาติไทย
                    </div>
                    <div
                      className={`text-[10px] mt-1.5 font-medium ${
                        customerCategory === 'thai_individual' ? 'text-primary-200' : 'text-slate-400'
                      }`}
                    >
                      แนบ: สำเนาบัตรประชาชน
                    </div>
                  </div>
                </button>

                {/* 3. บุคคลธรรมดา (ชาวต่างชาติ) */}
                <button
                  type="button"
                  disabled={!allowEdit}
                  onClick={() => handleCategoryChange('foreigner_individual')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    customerCategory === 'foreigner_individual'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <Globe
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      customerCategory === 'foreigner_individual' ? 'text-white' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">🌐 ชาวต่างชาติ (บุคคลธรรมดา)</div>
                    <div
                      className={`text-[11px] mt-0.5 leading-snug ${
                        customerCategory === 'foreigner_individual' ? 'text-amber-100' : 'text-slate-500'
                      }`}
                    >
                      บุคคลต่างด้าว / ต่างชาติ
                    </div>
                    <div
                      className={`text-[10px] mt-1.5 font-medium ${
                        customerCategory === 'foreigner_individual' ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      แนบ: พาสปอร์ต, วีซ่า, Work permit ฯลฯ
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customer_code">รหัสลูกค้า/ผู้เช่า</Label>
                <Input
                  id="customer_code"
                  placeholder="เช่น CUST-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)"
                  disabled={!allowEdit}
                  {...register('customer_code')}
                />
                {errors.customer_code && (
                  <p className="text-xs text-red-500">{errors.customer_code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax_id">
                  {customerCategory === 'company'
                    ? 'เลขประจำตัวผู้เสียภาษี (13 หลัก)'
                    : customerCategory === 'thai_individual'
                    ? 'เลขบัตรประจำตัวประชาชน (13 หลัก)'
                    : 'เลขประจำตัวผู้เสียภาษี / เลขบัตรต่างด้าว (ถ้ามี)'}
                </Label>
                <Input
                  id="tax_id"
                  placeholder={
                    customerCategory === 'foreigner_individual'
                      ? 'เลขประจำตัวผู้เสียภาษี หรือปล่อยว่าง'
                      : 'เลข 13 หลัก'
                  }
                  maxLength={20}
                  disabled={!allowEdit}
                  {...register('tax_id')}
                />
                {errors.tax_id && (
                  <p className="text-xs text-red-500">{errors.tax_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">
                  {customerCategory === 'company'
                    ? 'ชื่อการค้า / ป้ายร้าน'
                    : customerCategory === 'foreigner_individual'
                    ? 'ชื่อ - นามสกุล (ตาม Passport / Work permit) *'
                    : 'ชื่อ - นามสกุล (ผู้เช่า) *'}
                </Label>
                <Input
                  id="name"
                  placeholder={
                    customerCategory === 'company'
                      ? 'เช่น ร้านกาแฟอารมณ์ดี'
                      : customerCategory === 'foreigner_individual'
                      ? 'เช่น Mr. John Smith'
                      : 'เช่น นายสมชาย ใจดี'
                  }
                  disabled={!allowEdit}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_name">
                  {customerCategory === 'company'
                    ? 'ชื่อบริษัท / นิติบุคคล *'
                    : 'ชื่อสถานที่ทำงาน / ธุรกิจ (ถ้ามี)'}
                </Label>
                <Input
                  id="company_name"
                  placeholder={
                    customerCategory === 'company'
                      ? 'เช่น บริษัท อารมณ์ดี จำกัด'
                      : 'ระบุชื่อบริษัทหรือสถานที่ทำงาน (ถ้ามี)'
                  }
                  disabled={!allowEdit}
                  {...register('company_name')}
                />
                {errors.company_name && (
                  <p className="text-xs text-red-500">{errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="contact_name">
                  {customerCategory === 'company'
                    ? 'ชื่อผู้ประสานงาน / ฝ่ายจัดซื้อ'
                    : customerCategory === 'foreigner_individual'
                    ? 'ชื่อผู้ประสานงาน / ล่าม / ผู้ติดต่อสำรอง (ถ้ามี)'
                    : 'ชื่อผู้ติดต่อสำรอง (ถ้ามี)'}
                </Label>
                <Input
                  id="contact_name"
                  placeholder="เช่น คุณวิภาวรรณ (ฝ่ายจัดซื้อ)"
                  disabled={!allowEdit}
                  {...register('contact_name')}
                />
                {errors.contact_name && (
                  <p className="text-xs text-red-500">{errors.contact_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Contact Details */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-600" />
              ช่องทางการติดต่อ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  placeholder="เช่น 081-234-5678"
                  disabled={!allowEdit}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="เช่น customer@example.com"
                  disabled={!allowEdit}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="line_name">LINE ID / Name</Label>
                <Input
                  id="line_name"
                  placeholder="เช่น @aromdee_store"
                  disabled={!allowEdit}
                  {...register('line_name')}
                />
                {errors.line_name && (
                  <p className="text-xs text-red-500">{errors.line_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Customer Document Attachments */}
          <div className="pt-2 border-t border-slate-100">
            <CustomerDocumentSlots
              category={customerCategory}
              customerId={initialData?.id}
              stagedFiles={stagedFiles}
              onStagedFilesChange={(newFiles) => {
                setStagedFiles(newFiles)
                setMissingSlots([])
              }}
              missingSlots={missingSlots}
              userRole={userRole}
              disabled={!allowEdit}
            />
          </div>

          {/* Section: Address & Notes */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              ที่อยู่และหมายเหตุ
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address">ที่อยู่ / ที่อยู่สำหรับออกใบเสร็จ</Label>
                <Textarea
                  id="address"
                  placeholder="เลขที่ อาคาร ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  rows={3}
                  disabled={!allowEdit}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">หมายเหตุเพิ่มเติม</Label>
                <Textarea
                  id="note"
                  placeholder="เงื่อนไขพิเศษ ข้อมูลเพิ่มเติม หรือประวัติการติดต่อ..."
                  rows={2}
                  disabled={!allowEdit}
                  {...register('note')}
                />
                {errors.note && (
                  <p className="text-xs text-red-500">{errors.note.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/customers">
            <Button type="button" variant="outline">
              ยกเลิก
            </Button>
          </Link>
          {allowEdit && (
            <Button type="submit" disabled={isPending} className="gap-2 min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึกและอัปโหลด...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลและเอกสาร'}
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="ยืนยันการลบข้อมูลลูกค้า/ผู้เช่า"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้า/ผู้เช่า "${
          initialData?.name || initialData?.company_name
        }"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
