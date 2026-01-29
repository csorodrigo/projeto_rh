/**
 * Export Utilities
 * Functions for exporting org chart to various formats
 */

import type { OrgNode } from '@/types/organogram'

/**
 * Export org chart as PNG image
 */
export async function exportToPNG(
  svgElement: SVGSVGElement | null,
  filename = 'organograma.png',
  quality = 2
): Promise<void> {
  if (!svgElement) {
    throw new Error('SVG element not found')
  }

  // Get SVG dimensions
  const bbox = svgElement.getBBox()
  const width = bbox.width
  const height = bbox.height

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width * quality
  canvas.height = height * quality

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Scale for quality
  ctx.scale(quality, quality)

  // Convert SVG to image
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      // Download
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        const link = document.createElement('a')
        link.download = filename
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)

        resolve()
      }, 'image/png')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}

/**
 * Export org chart as PDF
 * Uses dynamic import to avoid bundling jsPDF in main bundle
 */
export async function exportToPDF(
  svgElement: SVGSVGElement | null,
  filename = 'organograma.pdf',
  paperSize: 'a4' | 'a3' | 'letter' = 'a4'
): Promise<void> {
  if (!svgElement) {
    throw new Error('SVG element not found')
  }

  try {
    // Dynamic import to reduce bundle size
    const { default: jsPDF } = await import('jspdf')

    const bbox = svgElement.getBBox()

    // Paper sizes in mm
    const paperSizes = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      letter: { width: 215.9, height: 279.4 },
    }

    const paper = paperSizes[paperSize]
    const orientation = bbox.width > bbox.height ? 'landscape' : 'portrait'

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize,
    })

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const pageWidth = orientation === 'landscape' ? paper.height : paper.width
        const pageHeight = orientation === 'landscape' ? paper.width : paper.height

        // Calculate scaling to fit page
        const scale = Math.min(
          pageWidth / bbox.width,
          pageHeight / bbox.height
        )

        const imgWidth = bbox.width * scale
        const imgHeight = bbox.height * scale

        // Center on page
        const x = (pageWidth - imgWidth) / 2
        const y = (pageHeight - imgHeight) / 2

        pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight)
        pdf.save(filename)

        URL.revokeObjectURL(url)
        resolve()
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG for PDF'))
      }

      img.src = url
    })
  } catch (error) {
    throw new Error('Failed to load PDF library: ' + (error as Error).message)
  }
}

/**
 * Export org structure as JSON
 */
export function exportToJSON(
  hierarchyData: OrgNode[],
  filename = 'organograma.json'
): void {
  const json = JSON.stringify(hierarchyData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * Generate shareable link for org chart
 * In a real app, this would create a unique token and save to DB
 */
export async function shareOrgChart(
  filters?: Record<string, string>
): Promise<string> {
  // In production, you'd generate a unique token and store settings
  const baseUrl = window.location.origin
  const path = '/funcionarios/organograma'

  const params = new URLSearchParams(filters)
  const shareUrl = `${baseUrl}${path}${params.toString() ? '?' + params.toString() : ''}`

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl)
    return shareUrl
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)

    return shareUrl
  }
}

/**
 * Print org chart
 */
export function printOrgChart(): void {
  window.print()
}

/**
 * Export as CSV (flat list)
 */
export function exportToCSV(
  hierarchyData: OrgNode[],
  filename = 'organograma.csv'
): void {
  // Flatten tree
  const flatData: Array<{
    id: string
    name: string
    jobTitle: string
    department: string | null
    email: string | undefined
    managerId: string | null | undefined
    level: number
    subordinateCount: number
  }> = []

  function flatten(node: OrgNode) {
    flatData.push({
      id: node.id,
      name: node.name,
      jobTitle: node.jobTitle,
      department: node.department,
      email: node.email,
      managerId: node.managerId,
      level: node.level,
      subordinateCount: node.subordinates.length,
    })
    node.subordinates.forEach(flatten)
  }

  hierarchyData.forEach(flatten)

  // Convert to CSV
  const headers = [
    'ID',
    'Nome',
    'Cargo',
    'Departamento',
    'Email',
    'ID Gestor',
    'Nível',
    'Subordinados Diretos',
  ]
  const rows = flatData.map((row) => [
    row.id,
    row.name,
    row.jobTitle,
    row.department || '',
    row.email || '',
    row.managerId || '',
    row.level,
    row.subordinateCount,
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()

  URL.revokeObjectURL(url)
}
