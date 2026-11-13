import { Bot, FileText, Mail, MessageCircle, MessagesSquare, Phone, Smartphone } from 'lucide-react'
import { cx } from '../../lib/cx'

function MessengerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7.2 14.4V8.3l2.9 3.6 1.9-2.6 1.8 2.6 3-3.6v6.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.4-4.1A8 8 0 1 1 20 11.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.4c.3-.2.7-.1.9.2l1 1.5c.1.2.1.5-.1.7l-.6.6c.4 1 1.2 1.8 2.2 2.2l.6-.6c.2-.2.5-.2.7-.1l1.5 1c.3.2.4.6.2.9-.4.7-1.2 1.2-2 1.1-2.9-.3-5.2-2.6-5.5-5.5-.1-.8.4-1.6 1.1-2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ViberMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3.6h8.6A3.9 3.9 0 0 1 18.5 7.5v3.8a3.9 3.9 0 0 1-3.9 3.9h-2.9l-3.6 2.6v-2.6H6a3.9 3.9 0 0 1-3.9-3.9V7.5A3.9 3.9 0 0 1 6 3.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.1 7.6c.3-.2.7-.1.9.2l.9 1.4c.1.2.1.4 0 .6l-.5.6c.4.9 1.1 1.6 2 2l.6-.5c.2-.2.4-.2.6-.1l1.4.8c.3.2.4.6.2.9-.4.6-1.1 1-1.8.9-2.5-.3-4.5-2.3-4.8-4.8-.1-.7.3-1.4.9-1.8Z"
        fill="currentColor"
      />
    </svg>
  )
}

const map: Record<string, typeof Bot> = {
  chatbot: Bot,
  'live-chat': MessagesSquare,
  call: Phone,
  sms: Smartphone,
  email: Mail,
  form: FileText,
}

export function ChannelIcon({ id, className }: { id: string; className?: string }) {
  const Lucide = map[id]
  const classes = cx('h-4 w-4', className)
  if (id === 'messenger') return <MessengerMark className={classes} />
  if (id === 'whatsapp') return <WhatsAppMark className={classes} />
  if (id === 'viber') return <ViberMark className={classes} />
  if (Lucide) return <Lucide className={classes} />
  return <MessageCircle className={classes} />
}
