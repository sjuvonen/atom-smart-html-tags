'use babel'

const selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

export class CloseTagFeature {
  supports (editor, event) {
    this.lastParsedTagName = undefined

    /**
     * Ignore copy-paste etc.
     */
    if (event.newText.length > 1) {
      return false
    }

    /**
    * Ignore if not completing a tag.
    */
    if (event.newText.slice(-1) !== '>') {
      return false
    }

    /**
     * Makes life easier later to check for zero here.
     */
    if (event.newRange.start.column === 0) {
      return false
    }

    const range = event.newRange
    const textLine = editor.buffer.lineForRow(range.end.row)
    const inputStart = event.newRange.start.column

    /**
     * Can ignore self-closing tags.
     */
    if (textLine.slice(inputStart - 1, inputStart) === '/') {
      return false
    }

    const tagName = this.getLastTagName(textLine, event.newRange.start.column)

    if (tagName) {
      this.lastParsedTagName = tagName
      return true
    } else {
      return false
    }
  }

  execute (editor) {
    const tagName = this.lastParsedTagName

    if (!this.isSelfClosingTag(tagName)) {
      editor.insertText(`</${tagName}>`)
      editor.moveLeft(tagName.length + 3)
      editor.buffer.groupLastChanges()
    }
  }

  /**
   * Tries to parse a tag name reading back from the given position.
   */
  getLastTagName (textLine, lastIndex) {
    /**
     * Count encountered arrow brackets for compatibility with PHP, ASP et al.
     */
    let balance = 0

    for (let i = lastIndex; i >= 0; i--) {
      if (textLine[i] === '>') {
        /**
         * This is a hack to fix the PHP object syntax inside HTML tags.
         *
         * e.g. <div title="<?= $user->name ?>">
         */
        if (textLine[i - 1] === '-') {
          continue
        }

        balance += 1
      } else if (textLine[i] === '<') {
        balance -= 1

        if (balance === 0) {
          /**
           * Only match valid HTML tags.
           *
           * Valid tags start with a character and can only contain letters,
           * numbers and a hyphen.
           *
           * Otherwise the tag could be a PHP tag or similar.
           */
          const match = textLine.slice(i + 1).match(/^[a-z0-9-]+\b/i)

          return match ? match[0] : undefined
        }
      }
    }
  }

  isSelfClosingTag (tagName) {
    return selfClosingTags.includes(tagName.toLowerCase())
  }
}
