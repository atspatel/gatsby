function renderInline(text) {
  const pattern = /\*\*([^*]+)\*\*|\*([^*\n]+)\*/g
  const nodes = []
  let last = 0
  let match = pattern.exec(text)
  let key = 0
  while (match) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    if (match[1] != null) nodes.push(<strong key={key}>{match[1]}</strong>)
    else nodes.push(<em key={key}>{match[2]}</em>)
    key += 1
    last = match.index + match[0].length
    match = pattern.exec(text)
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function blocksFrom(text) {
  const blocks = []
  let paragraph = []
  let list = null

  function flushParagraph() {
    if (paragraph.length === 0) return
    blocks.push({ type: 'p', lines: paragraph })
    paragraph = []
  }

  function flushList() {
    if (!list) return
    blocks.push(list)
    list = null
  }

  function startList(type) {
    if (!list || list.type !== type) {
      flushList()
      list = { type, items: [], gap: false }
    }
    list.gap = false
  }

  for (const raw of String(text || '').replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line || line === '---') {
      flushParagraph()
      if (list) list.gap = true
      continue
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h', text: heading[1] })
      continue
    }

    const marked = line.match(/^✦\s*(.*)$/)
    if (marked) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h', text: marked[1] })
      continue
    }

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      flushParagraph()
      startList('ul')
      list.items.push([bullet[1]])
      continue
    }

    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    if (numbered) {
      flushParagraph()
      startList('ol')
      list.items.push([numbered[1]])
      continue
    }

    const indented = /^\s+\S/.test(raw)
    if (list && (indented || !list.gap)) {
      const item = list.items[list.items.length - 1]
      if (list.gap) item.push('')
      item.push(line.replace(/^\s*--\s+/, ''))
      list.gap = false
      continue
    }

    flushList()
    paragraph.push(line.replace(/^\s*--\s+/, ''))
  }

  flushParagraph()
  flushList()
  return blocks
}

export default function RichText({ text }) {
  const blocks = blocksFrom(text)
  if (blocks.length === 0) return null

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        if (block.type === 'h') return <h3 key={index}>{renderInline(block.text)}</h3>
        if (block.type === 'ul' || block.type === 'ol') {
          const Tag = block.type
          return (
            <Tag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.map((line, lineIndex) => (
                    <span key={lineIndex}>
                      {lineIndex > 0 && <br />}
                      {line && renderInline(line)}
                    </span>
                  ))}
                </li>
              ))}
            </Tag>
          )
        }
        return (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
