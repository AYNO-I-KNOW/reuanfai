// poppler wrappers; execFile (no shell) so paths are never interpreted
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const PDF_MAX_BUFFER = 16 * 1024 * 1024

export async function extractPage(pdf: string, page: number) {
  const { stdout } = await run('pdftotext', ['-f', String(page), '-l', String(page), '-layout', pdf, '-'], {
    encoding: 'utf8',
    maxBuffer: PDF_MAX_BUFFER,
  })
  return stdout.replaceAll('\f', '').trim()
}

export async function pageCount(pdf: string) {
  const { stdout } = await run('pdfinfo', [pdf], { encoding: 'utf8' })
  const pages = Number(/^Pages:\s+(\d+)/m.exec(stdout)?.[1])
  if (!(pages > 0)) throw new Error('pdfinfo: cannot read page count')
  return pages
}
