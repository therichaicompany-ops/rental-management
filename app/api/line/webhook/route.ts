import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, replyLineMessage } from '@/lib/services/line-messaging-service'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  return NextResponse.json(
    { status: 'ok', message: 'LINE Webhook endpoint is active' },
    { status: 200 }
  )
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-line-signature')

    // 1. Verify x-line-signature
    const isValid = verifyLineSignature(rawBody, signature)
    if (!isValid) {
      console.warn('LINE Webhook: Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const events: Array<Record<string, any>> = payload.events || []
    let supabase: any = null
    try {
      supabase = createAdminClient()
    } catch (e) {
      console.error('Webhook: Supabase admin client initialization failed:', e)
    }

    for (const event of events) {
      const source = event.source || {}
      const targetGroupId = source.groupId || source.roomId

      // 1. Auto-register or reactivate group destination whenever an event is received from a group/room
      if (targetGroupId && supabase) {
        try {
          const { data: existing } = await supabase
            .from('line_destinations')
            .select('id, name')
            .eq('line_group_id', targetGroupId)
            .maybeSingle()

          if (!existing) {
            await supabase.from('line_destinations').insert({
              name: `กลุ่ม LINE (${new Date().toLocaleDateString('th-TH')})`,
              destination_type: 'group',
              line_group_id: targetGroupId,
              is_active: true,
            })
          } else {
            await supabase
              .from('line_destinations')
              .update({ is_active: true })
              .eq('id', existing.id)
          }
        } catch (e) {
          console.error('Error auto-registering line destination:', e)
        }
      }

      // 2. Handle Bot Joining a Group / Room
      if (event.type === 'join' && targetGroupId && event.replyToken) {
        await replyLineMessage(event.replyToken, [
          {
            type: 'text',
            text: `✅ เชื่อมต่อระบบแจ้งเตือนสัญญาเช่าเรียบร้อยแล้ว!\n\n🆔 Group ID:\n${targetGroupId}\n\nคุณสามารถนำ Group ID นี้ไปตั้งค่าในหน้า /settings/line ของระบบได้ทันทีครับ`,
          },
        ])
      }

      // 3. Handle Bot Leaving a Group / Room
      if (event.type === 'leave' && targetGroupId && supabase) {
        await supabase
          .from('line_destinations')
          .update({ is_active: false })
          .eq('line_group_id', targetGroupId)
      }

      // 4. Handle User Text Message (asking for ID or triggering response)
      if (
        event.type === 'message' &&
        event.message?.type === 'text' &&
        event.replyToken
      ) {
        const text = (event.message.text || '').trim().toLowerCase()
        const isAskingId =
          text.includes('#id') ||
          text.includes('groupid') ||
          text.includes('group id') ||
          text === 'id' ||
          text === '#ไอดี' ||
          text === 'ไอดี'

        if (isAskingId) {
          const currentId = targetGroupId || source.userId || 'ไม่พบ ID'
          await replyLineMessage(event.replyToken, [
            {
              type: 'text',
              text: `🆔 LINE ${targetGroupId ? 'Group ID' : 'User ID'}:\n${currentId}\n\nคัดลอกค่านี้ไปใส่ในหน้าตั้งค่ากลุ่มแจ้งเตือน (Settings > LINE) ได้ทันทีครับ`,
            },
          ])
        }
      }
    }

    return NextResponse.json({ success: true, count: events.length }, { status: 200 })
  } catch (err) {
    console.error('LINE Webhook Error:', err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
