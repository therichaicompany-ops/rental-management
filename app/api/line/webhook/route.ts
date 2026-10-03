import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, replyLineMessage } from '@/lib/services/line-messaging-service'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const supabase = createAdminClient() as any

    for (const event of events) {
      const source = event.source || {}
      const groupId = source.groupId

      // Handle Bot Joining a Group
      if (event.type === 'join' && source.type === 'group' && groupId) {
        // Upsert into line_destinations
        const { data: existing } = await supabase
          .from('line_destinations')
          .select('id, name')
          .eq('line_group_id', groupId)
          .maybeSingle()

        if (!existing) {
          await supabase.from('line_destinations').insert({
            name: `กลุ่ม LINE ใหม่ (${new Date().toLocaleDateString('th-TH')})`,
            destination_type: 'group',
            line_group_id: groupId,
            is_active: true,
          })
        } else {
          await supabase
            .from('line_destinations')
            .update({ is_active: true })
            .eq('id', existing.id)
        }

        // Send a greeting reply with Group ID
        if (event.replyToken) {
          await replyLineMessage(event.replyToken, [
            {
              type: 'text',
              text: `✅ เชื่อมต่อระบบแจ้งเตือนสัญญาเช่าเรียบร้อยแล้ว!\n\n🆔 Group ID:\n${groupId}\n\nคุณสามารถนำ Group ID นี้ไปตั้งค่าในหน้า /settings/line ของระบบได้ทันทีครับ`,
            },
          ])
        }
      }

      // Handle Bot Leaving a Group
      if (event.type === 'leave' && source.type === 'group' && groupId) {
        await supabase
          .from('line_destinations')
          .update({ is_active: false })
          .eq('line_group_id', groupId)
      }

      // Handle User Text Message in Group (e.g. requesting Group ID)
      if (
        event.type === 'message' &&
        event.message?.type === 'text' &&
        event.replyToken
      ) {
        const text = (event.message.text || '').trim().toLowerCase()
        if (
          text === '#id' ||
          text === '#groupid' ||
          text === 'group id' ||
          text === 'groupid'
        ) {
          const currentId = groupId || source.userId || 'ไม่พบ ID'
          await replyLineMessage(event.replyToken, [
            {
              type: 'text',
              text: `🆔 LINE ${groupId ? 'Group ID' : 'ID'}:\n${currentId}\n\nคัดลอกค่านี้ไปใส่ในหน้าตั้งค่ากลุ่มแจ้งเตือนได้เลยครับ`,
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
