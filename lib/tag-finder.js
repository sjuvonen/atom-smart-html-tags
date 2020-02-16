'use babel'

import { Range } from 'atom'

export class TagFinder {
  constructor (editor = null) {
    this.editor = editor
  }

  findStartTag (tagName, endPosition) {
    if (!this.isValidTagName(tagName)) {
      return null
    }

    const pattern = this.patternForTagName(tagName)
    const scanRange = new Range([0, 0], endPosition)
    let nested = 0
    let matchedRange = null

    this.editor.backwardsScanInBufferRange(pattern, scanRange, ({ match, range, stop }) => {
      if (match[1]) {
        if (nested <= 0) {
          stop()

          matchedRange = range
          matchedRange.start = matchedRange.start.translate([0, 1])
          matchedRange.end = matchedRange.start.translate([0, tagName.length])
        } else {
          nested--
        }
      } else {
        nested++
      }
    })

    return matchedRange
  }

  findEndTag (tagName, startPosition) {
    if (!this.isValidTagName(tagName)) {
      return null
    }

    const pattern = this.patternForTagName(tagName)
    const scanRange = new Range(startPosition, this.editor.buffer.getEndPosition())
    let nested = 0
    let matchedRange = null

    this.editor.scanInBufferRange(pattern, scanRange, ({ match, range, stop }) => {
      if (match[3]) {
        if (nested <= 0) {
          stop()

          matchedRange = range.translate([0, 2], [0, -1])
        } else {
          nested--
        }
      } else {
        nested++
      }
    })

    return matchedRange
  }

  patternForTagName (tagName) {
    return new RegExp(`(<${tagName}(\\s+[^>]*?)?>)|(</(${tagName})([^a-z0-9>:-][^>]*)?>)`, 'gi')
  }

  isValidTagName (tagName) {
    return tagName.match(/^[a-z][a-z0-9-:]*$/i)
  }
}
