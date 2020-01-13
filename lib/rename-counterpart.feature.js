'use babel'

import { createTagFinder } from './tag-finder'

export class RenameCounterpartFeature {
  constructor () {
    createTagFinder()
      .then(tagFinder => (this.tagFinder = tagFinder))
      .catch(error => console.error(error))
  }

  supports (editor, event) {
    if (!this.tagFinder) {
      return false
    }

    this.cachedMatch = null

    const editPoint = event.newRange.start.column
    const textLine = editor.buffer.lineForRow(event.newRange.end.row)

    try {
      const [startChar, startPos] = this.lastInvalidCharacter(textLine, editPoint - 1)
      const [endChar, endPos] = this.nextInvalidCharacter(textLine, editPoint)

      if (['<', '/'].includes(startChar) && endChar) {
        this.cachedMatch = {
          chars: [startChar, endChar],
          range: [startPos, endPos],
          isEndTag: startChar === '/'
        }

        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  execute (editor, event) {
    this.tagFinder.editor = editor

    const newRange = event.newRange
    const textLine = editor.buffer.lineForRow(event.newRange.end.row)
    const [tagStartPos, tagEndPos] = this.cachedMatch.range

    const newTagName = textLine.slice(tagStartPos + 1, tagEndPos)
    const oldTagName = this.getOldTagName(textLine, event, this.cachedMatch.range)

    /**
     * Avoid infinite recursion and unneeded work.
     */
    if (oldTagName === newTagName) {
      return
    }

    /**
     * Don't allow deleting the whole tag name.
     */
    if (!newTagName || !oldTagName) {
      return
    }

    if (this.cachedMatch.isEndTag) {
      const match = this.tagFinder.findStartTag(oldTagName, newRange.start)

      if (match) {
        editor.setTextInBufferRange(match, newTagName)
        editor.buffer.groupLastChanges()
      }
    } else {
      const match = this.tagFinder.findEndTag(oldTagName, newRange.end)

      if (match) {
        editor.setTextInBufferRange(match, newTagName)
        editor.buffer.groupLastChanges()
      }
    }
  }

  lastInvalidCharacter (textLine, lastPos) {
    if (!textLine.length) {
      return
    }

    for (let i = lastPos; i >= 0; i--) {
      if (textLine[i].match(/[^a-z0-9-]/i)) {
        return [textLine[i], i]
      }
    }
  }

  nextInvalidCharacter (textLine, startPos) {
    if (!textLine.length) {
      return
    }

    for (let i = startPos; i < textLine.length; i++) {
      if (textLine[i].match(/[^a-z0-9-]/i)) {
        return [textLine[i], i]
      }
    }
  }

  getOldTagName (textLine, event, parsedRange) {
    const newRange = event.newRange
    const partBeforeModification = textLine.slice(parsedRange[0] + 1, newRange.start.column)
    const partAfterModification = textLine.slice(newRange.end.column, parsedRange[1])

    return `${partBeforeModification}${event.oldText}${partAfterModification}`
  }
}
