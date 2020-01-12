'use babel'

export class CloseTagFeature {
  supports (editor, event) {
    this.lastParsedTagName = undefined

    /**
     * Ignore copy-paste etc.
     */
    if (event.text.length > 1) {
      return false
    }

    /**
    * Ignore if not completing a tag.
    */
    if (event.text.slice(-1) !== '>') {
      return false
    }

    /**
     * Makes life easier later to check for zero here.
     */
    if (event.range.start.column === 0) {
      return false
    }

    const range = event.range
    const textLine = editor.buffer.lineForRow(range.end.row)
    const inputStart = event.range.start.column

    /**
     * Can ignore self-closing tags.
     */
    if (textLine.slice(inputStart - 1, inputStart) === '/') {
      return false
    }

    const tagName = this.getLastTagName(textLine, event.range.start.column)

    if (tagName) {
      this.lastParsedTagName = tagName
      return true
    } else {
      return false
    }
  }

  execute (editor, event) {
    const tagName = this.lastParsedTagName
    editor.insertText(`</${tagName}>`)
    editor.moveLeft(tagName.length + 3)
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
}
