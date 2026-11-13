import type { ProjectDraft } from '../types'
import { getCategory } from '../data/categories'
import { getTemplate } from '../data/templates'
import {
  channelLabel,
  featureLabel,
  fontPairings,
  formatBytes,
  motionOptions,
  pageLabel,
} from '../data/options'
import { site } from '../data/site'
import { briefFileName } from './brief'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 18
const CONTENT_W = PAGE_W - MARGIN * 2

const NAVY = [8, 13, 25] as const
const NAVY_SOFT = [17, 27, 48] as const
const BLUE = [56, 107, 255] as const
const VIOLET = [129, 87, 245] as const
const CYAN = [34, 211, 238] as const
const WHITE = [244, 247, 255] as const
const MUTED = [163, 174, 194] as const
const INK = [20, 26, 40] as const
const INK_SOFT = [92, 102, 122] as const

type Doc = import('jspdf').jsPDF

function clean(value: string) {
  return String(value)
    .replace(/[—–]/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, '-')
    .replace(/[^\x09\x0A\x20-\xFF]/g, '')
}

function preparedLabel() {
  return new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function waitForImages(host: HTMLElement) {
  const images = Array.from(host.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            image.decode?.().catch(() => undefined).finally(resolve)
            if (!image.decode) resolve()
            return
          }
          const done = () => resolve()
          image.addEventListener('load', done, { once: true })
          image.addEventListener('error', done, { once: true })
          window.setTimeout(done, 4000)
        }),
    ),
  )
}

async function captureDesign(draft: ProjectDraft) {
  const template = getTemplate(draft.templateId)
  if (!template) return null

  const [{ createRoot }, { createElement }, miniSiteModule, imageModule] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('../components/templates/MiniSite'),
    import('html-to-image'),
  ])

  const WIDTH = 1280
  const HEIGHT = 1280

  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;pointer-events:none;z-index:-1;background:${template.palette.bg};`
  document.body.appendChild(host)
  const root = createRoot(host)

  try {
    root.render(
      createElement(miniSiteModule.MiniSite, {
        template,
        category: getCategory(draft.categoryId),
        brand: draft.brand,
        pages: draft.pages,
        features: draft.features,
        channels: draft.channels,
        motion: 'none',
        showSuites: false,
        showSampleBadge: false,
      }),
    )

    await new Promise((resolve) => window.setTimeout(resolve, 150))
    await document.fonts.ready
    await waitForImages(host)
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))

    /* html-to-image rasterises through the browser's own CSS engine, so Tailwind v4
       color-mix() and container queries survive the capture (html2canvas cannot parse them). */
    const dataUrl = await imageModule.toJpeg(host, {
      width: WIDTH,
      height: HEIGHT,
      canvasWidth: WIDTH,
      canvasHeight: HEIGHT,
      pixelRatio: 1,
      quality: 0.94,
      backgroundColor: template.palette.bg,
      style: { position: 'static', left: '0', top: '0', width: `${WIDTH}px`, height: `${HEIGHT}px` },
    })

    return { dataUrl, width: WIDTH, height: HEIGHT }
  } catch {
    return null
  } finally {
    root.unmount()
    host.remove()
  }
}

function beginPage(doc: Doc, date: string) {
  doc.setFillColor(...WHITE)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PAGE_W, 2.4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...BLUE)
  doc.text('BRIX STUDIO', MARGIN, 12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...INK_SOFT)
  doc.text('PROJECT BRIEF', MARGIN + 27, 12)
  doc.text(date, PAGE_W - MARGIN, 12, { align: 'right' })

  doc.setDrawColor(224, 228, 236)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, 15.5, PAGE_W - MARGIN, 15.5)
}

function finishPage(doc: Doc, pageNumber: number, total: number) {
  doc.setDrawColor(228, 232, 240)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...INK_SOFT)
  doc.text('Prepared with the BRIX Studio project builder', MARGIN, PAGE_H - 9)
  doc.text(`Page ${pageNumber} of ${total}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' })
}

function sectionTitle(doc: Doc, label: string, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...BLUE)
  doc.text(label.toUpperCase(), MARGIN, y)
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 1.6, MARGIN + 10, y + 1.6)
  return y + 7
}

function paragraph(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  width: number,
  options: { size?: number; color?: readonly [number, number, number]; lineHeight?: number; font?: string } = {},
) {
  const size = options.size ?? 10
  const lineHeight = options.lineHeight ?? size * 0.52
  doc.setFont(options.font ?? 'helvetica', 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...(options.color ?? INK))
  const lines = doc.splitTextToSize(clean(text), width) as string[]
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

function keyValueRows(doc: Doc, rows: { label: string; value: string }[], y: number) {
  const labelWidth = 44
  const valueWidth = CONTENT_W - labelWidth - 6
  rows.forEach((row) => {
    const wrapped = doc.splitTextToSize(clean(row.value || 'Not provided'), valueWidth) as string[]
    const rowHeight = Math.max(6.5, wrapped.length * 4.4 + 2)
    doc.setDrawColor(235, 238, 244)
    doc.setLineWidth(0.15)
    doc.line(MARGIN, y + rowHeight, PAGE_W - MARGIN, y + rowHeight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...INK_SOFT)
    doc.text(clean(row.label), MARGIN, y + 4.6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...INK)
    doc.text(wrapped, MARGIN + labelWidth, y + 4.6)
    y += rowHeight
  })
  return y
}

function chips(doc: Doc, items: string[], y: number) {
  let x = MARGIN
  const maxX = PAGE_W - MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  if (!items.length) {
    return paragraph(doc, 'None selected', MARGIN, y + 4, CONTENT_W, { size: 9, color: INK_SOFT })
  }
  items.forEach((item) => {
    const label = clean(item)
    const width = doc.getTextWidth(label) + 8
    if (x + width > maxX) {
      x = MARGIN
      y += 8
    }
    doc.setFillColor(243, 246, 252)
    doc.setDrawColor(220, 226, 238)
    doc.roundedRect(x, y, width, 7, 3.5, 3.5, 'FD')
    doc.setTextColor(...INK)
    doc.text(label, x + 4, y + 4.7)
    x += width + 2.5
  })
  return y + 11
}

function bullets(doc: Doc, items: string[], y: number, columns = 1) {
  if (!items.length) {
    return paragraph(doc, 'None selected', MARGIN, y + 4, CONTENT_W, { size: 9, color: INK_SOFT })
  }
  const rows = Math.ceil(items.length / columns)
  const columnWidth = CONTENT_W / columns
  items.forEach((item, index) => {
    const column = Math.floor(index / rows)
    const row = index % rows
    const x = MARGIN + column * columnWidth
    const lineY = y + row * 6
    doc.setFillColor(...BLUE)
    doc.circle(x + 1.2, lineY - 1.2, 0.8, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    const lines = doc.splitTextToSize(clean(item), columnWidth - 6) as string[]
    doc.text(lines, x + 4, lineY)
  })
  return y + rows * 6 + 2
}

export async function downloadBriefPdf(draft: ProjectDraft) {
  const [{ jsPDF }, design] = await Promise.all([import('jspdf'), captureDesign(draft)])

  const category = getCategory(draft.categoryId)
  const template = getTemplate(draft.templateId)
  const motion = motionOptions.find((option) => option.id === draft.motion)
  const typography = fontPairings.find((pairing) => pairing.id === draft.brand.fontKey)?.name ?? draft.brand.fontKey
  const businessName = draft.brand.businessName.trim() || 'New website project'
  const contactName = draft.details.contactName.trim() || 'Not provided'
  const date = preparedLabel()

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })

  /* ---- Cover ---- */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  const graphics = doc as unknown as {
    GState: new (options: { opacity: number }) => object
    setGState: (state: object) => void
  }
  graphics.setGState(new graphics.GState({ opacity: 0.22 }))
  doc.setFillColor(...BLUE)
  doc.circle(198, 10, 78, 'F')
  doc.setFillColor(...VIOLET)
  doc.circle(10, 288, 64, 'F')
  graphics.setGState(new graphics.GState({ opacity: 1 }))

  doc.setFillColor(...BLUE)
  doc.roundedRect(MARGIN, 26, 13, 13, 3.2, 3.2, 'F')
  doc.setFillColor(...VIOLET)
  doc.roundedRect(MARGIN + 7.5, 32.5, 5.5, 5.5, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('BS', MARGIN + 3.1, 34.2)
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('BRIX', MARGIN + 20, 32.2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.6)
  doc.setTextColor(...MUTED)
  doc.text('S T U D I O', MARGIN + 20.4, 37.4)

  doc.setDrawColor(...CYAN)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, 52, MARGIN + 20, 52)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...CYAN)
  doc.text('PROJECT BRIEF', MARGIN + 25, 53)

  doc.setFont('times', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...WHITE)
  const titleLines = doc.splitTextToSize(clean(businessName), CONTENT_W) as string[]
  doc.text(titleLines.slice(0, 3), MARGIN, 78)

  let coverY = 78 + Math.min(titleLines.length, 3) * 11.5
  if (draft.brand.tagline.trim()) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...MUTED)
    const tagline = doc.splitTextToSize(clean(draft.brand.tagline.trim()), CONTENT_W) as string[]
    doc.text(tagline.slice(0, 2), MARGIN, coverY)
    coverY += tagline.slice(0, 2).length * 5.6
  }

  const metaY = 182
  const meta: { label: string; value: string }[] = [
    { label: 'Prepared for', value: contactName },
    { label: 'Email', value: draft.details.email.trim() || 'Not provided' },
    { label: 'Business type', value: category?.name ?? 'Not selected' },
    { label: 'Design direction', value: template ? `${template.name} — ${template.style}` : 'Not selected' },
    { label: 'Prepared on', value: date },
  ]
  meta.forEach((row, index) => {
    const y = metaY + index * 12
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(row.label.toUpperCase(), MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...WHITE)
    doc.text(doc.splitTextToSize(clean(row.value), CONTENT_W) as string[], MARGIN, y + 5)
    doc.setDrawColor(38, 50, 78)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, y + 8, PAGE_W - MARGIN, y + 8)
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('Prepared with the BRIX Studio project builder. Selections reflect the saved draft at download.', MARGIN, 277)
  doc.text(site.name, PAGE_W - MARGIN, 277, { align: 'right' })

  /* ---- Page 2: overview & contact ---- */
  doc.addPage()
  beginPage(doc, date)
  let y = 27
  y = sectionTitle(doc, 'Project overview', y)
  y = keyValueRows(
    doc,
    [
      { label: 'Business name', value: businessName },
      { label: 'Business type', value: category?.name ?? 'Not selected' },
      { label: 'Design direction', value: template ? `${template.name} (${template.style})` : 'Not selected' },
      { label: 'Pages', value: draft.pages.map(pageLabel).join(', ') },
      { label: 'Motion', value: motion ? `${motion.label} - ${motion.description}` : 'Not specified' },
    ],
    y + 2,
  )

  y += 9
  y = sectionTitle(doc, 'Contact details', y)
  y = keyValueRows(
    doc,
    [
      { label: 'Full name', value: contactName },
      { label: 'Email', value: draft.details.email.trim() || 'Not provided' },
      { label: 'Phone', value: draft.details.phone.trim() || 'Not provided' },
      { label: 'Location', value: draft.details.location.trim() || 'Not provided' },
      { label: 'Existing website', value: draft.details.existingUrl.trim() || 'None' },
    ],
    y + 2,
  )

  y += 9
  y = sectionTitle(doc, 'Required pages', y)
  y = chips(doc, draft.pages.map(pageLabel), y + 2)

  y += 4
  y = sectionTitle(doc, 'Features & functionality', y)
  y = bullets(doc, draft.features.map(featureLabel), y + 2, 2)

  y += 4
  y = sectionTitle(doc, 'Communication channels', y)
  chips(doc, draft.channels.map(channelLabel), y + 2)

  /* ---- Page 3: design ---- */
  doc.addPage()
  beginPage(doc, date)
  y = 27
  y = sectionTitle(doc, 'Selected design', y)

  doc.setFont('times', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...INK)
  doc.text(clean(template ? `${template.name}` : 'No design selected'), MARGIN, y + 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...INK_SOFT)
  doc.text(clean(template ? template.tagline : 'Choose a design direction in the project builder.'), MARGIN, y + 9)
  y += 16

  if (design) {
    const maxW = 150
    const maxH = 132
    const ratio = design.width / design.height
    let imageW = maxW
    let imageH = imageW / ratio
    if (imageH > maxH) {
      imageH = maxH
      imageW = imageH * ratio
    }
    const x = MARGIN + (CONTENT_W - imageW) / 2
    doc.setFillColor(...NAVY_SOFT)
    doc.roundedRect(x - 1.5, y - 1.5, imageW + 3, imageH + 3, 2.5, 2.5, 'F')
    doc.addImage(design.dataUrl, 'JPEG', x, y, imageW, imageH)
    y += imageH + 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...INK_SOFT)
    doc.text(
      'Preview rendered from your saved selections. Sample copy and photography are illustrative.',
      MARGIN,
      y,
    )
    y += 9
  } else {
    const panelH = 44
    doc.setFillColor(...NAVY)
    doc.roundedRect(MARGIN, y, CONTENT_W, panelH, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('DESIGN PREVIEW UNAVAILABLE', MARGIN + 8, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...WHITE)
    doc.text('The chosen direction is summarised below.', MARGIN + 8, y + 19)
    doc.setFont('times', 'bold')
    doc.setFontSize(16)
    doc.text(clean(template?.name ?? 'Not selected'), MARGIN + 8, y + 32)
    y += panelH + 9
  }

  y = sectionTitle(doc, 'Brand palette', y)
  const paletteRows = [
    { label: 'Primary', color: draft.brand.primary },
    { label: 'Accent', color: draft.brand.accent },
    { label: 'Template ground', color: template?.palette.bg ?? '#ffffff' },
    { label: 'Template surface', color: template?.palette.surface ?? '#f4f4f4' },
  ]
  const swatchW = 32
  paletteRows.forEach((swatch, index) => {
    const x = MARGIN + index * (swatchW + 6)
    doc.setFillColor(swatch.color)
    doc.setDrawColor(222, 227, 236)
    doc.roundedRect(x, y + 2, swatchW, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...INK_SOFT)
    doc.text(swatch.label.toUpperCase(), x, y + 20.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...INK)
    doc.text(swatch.color.toUpperCase(), x, y + 25)
  })
  y += 32

  y = sectionTitle(doc, 'Typography & motion', y)
  y = keyValueRows(
    doc,
    [
      { label: 'Typography', value: typography },
      { label: 'Motion preference', value: motion ? `${motion.label} (${motion.tempo})` : 'Not specified' },
      {
        label: 'Layout character',
        value: template ? `${template.layout} layout, ${template.fontKey} typography` : 'Not selected',
      },
    ],
    y + 2,
  )

  /* ---- Page 4: notes & assets ---- */
  const addContentPage = () => {
    doc.addPage()
    beginPage(doc, date)
    return 27
  }

  doc.addPage()
  beginPage(doc, date)
  y = 27
  y = sectionTitle(doc, 'About the business', y)
  const aboutRaw = draft.details.about.trim()
  const about = aboutRaw.length > 1700 ? `${aboutRaw.slice(0, 1700)}...` : aboutRaw
  if (about) {
    const lines = doc.splitTextToSize(clean(about), CONTENT_W) as string[]
    const maxLines = 34
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...INK)
    doc.text(lines.slice(0, maxLines), MARGIN, y + 4)
    y += Math.min(lines.length, maxLines) * 4.6 + 4
  } else {
    y = paragraph(doc, 'No business description was provided.', MARGIN, y + 4, CONTENT_W, {
      size: 9,
      color: INK_SOFT,
    })
  }

  y += 6
  if (y > 196) y = addContentPage()
  y = sectionTitle(doc, 'Assets & references', y)
  const assetRows: { label: string; value: string }[] = []
  if (draft.details.assetLinks.trim()) {
    const links = draft.details.assetLinks.trim()
    assetRows.push({
      label: 'Asset links',
      value: links.length > 600 ? `${links.slice(0, 600)}...` : links,
    })
  }
  if (draft.details.attachments.length) {
    const files = draft.details.attachments
    const shown = files.slice(0, 8).map((file) => `${file.name} (${formatBytes(file.size)})`)
    if (files.length > 8) shown.push(`and ${files.length - 8} more`)
    assetRows.push({ label: 'Selected files', value: shown.join('\n') })
  }
  assetRows.push({
    label: 'Handling',
    value: "Files selected in the builder stay on the customer's device and are attached separately to the handover email.",
  })
  y = keyValueRows(doc, assetRows, y + 2)

  if (y > 208) y = addContentPage()
  y += 9
  y = sectionTitle(doc, 'Project specifications', y)
  y = bullets(
    doc,
    [
      `${draft.pages.length} page${draft.pages.length === 1 ? '' : 's'} in the planned navigation`,
      `${draft.features.length} optional feature${draft.features.length === 1 ? '' : 's'} selected`,
      `${draft.channels.length} communication channel${draft.channels.length === 1 ? '' : 's'} selected`,
      motion ? `Animation: ${motion.label} at ${motion.tempo} tempo` : 'Animation preference not specified',
      template ? `Design system: ${template.name} (${template.style})` : 'Design system not selected',
    ],
    y + 2,
  )

  if (y > 222) y = addContentPage()
  y += 8
  y = sectionTitle(doc, 'Next steps', y)
  y = paragraph(
    doc,
    'Review the details above. If anything is incorrect, update the brief in the project builder and download a fresh PDF. Send the PDF with any brand assets to the studio to begin scoping.',
    MARGIN,
    y + 4,
    CONTENT_W,
    { size: 9.5, color: INK },
  )

  const cardY = Math.min(y + 10, PAGE_H - 46)
  doc.setFillColor(...NAVY)
  doc.roundedRect(MARGIN, cardY, CONTENT_W, 22, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...CYAN)
  doc.text('PREPARED BY BRIX STUDIO', MARGIN + 7, cardY + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.text(site.email, MARGIN + 7, cardY + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text(date, PAGE_W - MARGIN - 7, cardY + 15, { align: 'right' })

  /* ---- Page numbering ---- */
  const total = doc.getNumberOfPages()
  for (let page = 2; page <= total; page += 1) {
    doc.setPage(page)
    finishPage(doc, page, total)
  }

  doc.save(briefFileName(draft, 'pdf'))
}
