import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push'
const LINE_REPLY_API_URL = 'https://api.line.me/v2/bot/message/reply'

/**
 * Verify LINE webhook signature using HMAC-SHA256
 */
export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
  channelSecret?: string
): boolean {
  const secret = channelSecret || process.env.LINE_CHANNEL_SECRET
  if (!secret || !signature) return false

  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64')

    const hashBuf = Buffer.from(hash)
    const sigBuf = Buffer.from(signature)

    if (hashBuf.length !== sigBuf.length) {
      return false
    }

    return crypto.timingSafeEqual(hashBuf, sigBuf)
  } catch (err) {
    console.error('verifyLineSignature error:', err)
    return false
  }
}

export interface SendLineMessageOptions {
  toGroupId: string
  messages: Array<Record<string, unknown>>
  notificationType?: string // 'PAYABLE' | 'RECEIVABLE' | 'TEST'
  entityType?: string
  entityId?: string
  destinationId?: string | null
}

export interface SendLineMessageResult {
  success: boolean
  error?: string
  logId?: string
}

/**
 * Send Push Message via LINE Messaging API and record result to notification_logs
 */
export async function sendLineMessage({
  toGroupId,
  messages,
  notificationType = 'TEST',
  entityType = 'test',
  entityId = '00000000-0000-0000-0000-000000000000',
  destinationId = null,
}: SendLineMessageOptions): Promise<SendLineMessageResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' }
  }

  if (!toGroupId || !toGroupId.trim()) {
    return { success: false, error: 'ห้ามส่งจริงถ้าไม่มี Group ID' }
  }

  const supabase = createAdminClient() as any
  const today = new Date().toISOString().split('T')[0]
  const messagePreview = JSON.stringify(messages).slice(0, 500)

  // 1. Send to LINE API
  let isSuccess = false
  let errorMessage: string | null = null

  try {
    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: toGroupId.trim(),
        messages,
      }),
    })

    if (response.ok) {
      isSuccess = true
    } else {
      const errorJson = await response.json().catch(() => ({}))
      errorMessage = errorJson.message || `LINE API responded with HTTP ${response.status}`
      console.error('LINE API push error:', errorJson)
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Network error communicating with LINE API'
    console.error('LINE push exception:', err)
  }

  // 2. Record to notification_logs
  try {
    const { data: logRecord, error: logErr } = await supabase
      .from('notification_logs')
      .insert({
        notification_type: notificationType,
        entity_type: entityType,
        entity_id: entityId,
        destination_id: destinationId,
        notification_date: today,
        status: isSuccess ? 'sent' : 'failed',
        message: messagePreview,
        sent_at: isSuccess ? new Date().toISOString() : null,
        error_message: errorMessage,
      })
      .select('id')
      .single()

    if (logErr) {
      console.error('Failed to write notification_logs:', logErr)
    }

    return {
      success: isSuccess,
      error: errorMessage || undefined,
      logId: logRecord?.id,
    }
  } catch (err) {
    console.error('notification_logs error:', err)
    return {
      success: isSuccess,
      error: errorMessage || undefined,
    }
  }
}

/**
 * Send Reply Message (e.g. for Webhook replies)
 */
export async function replyLineMessage(
  replyToken: string,
  messages: Array<Record<string, unknown>>
): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token || !replyToken) return false

  try {
    const response = await fetch(LINE_REPLY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    })
    return response.ok
  } catch (err) {
    console.error('replyLineMessage error:', err)
    return false
  }
}
