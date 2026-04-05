import ePub from 'epubjs'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'txt') {
    return await file.text()
  }

  if (ext === 'epub') {
    return await parseEpub(file)
  }

  if (ext === 'pdf') {
    return await parsePdf(file)
  }

  throw new Error(`Format non supporté : .${ext}. Formats acceptés : PDF, EPUB, TXT`)
}

async function parseEpub(file) {
  const arrayBuffer = await file.arrayBuffer()
  const book = ePub(arrayBuffer)
  await book.ready

  const spine = book.spine
  const texts = []

  for (const item of spine.items) {
    const doc = await book.load(item.href)
    if (doc && doc.body) {
      texts.push(doc.body.textContent)
    }
  }

  book.destroy()
  return texts.join('\n\n')
}

async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const texts = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    texts.push(pageText)
  }

  return texts.join('\n\n')
}
