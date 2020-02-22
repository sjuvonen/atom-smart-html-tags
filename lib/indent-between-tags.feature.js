'use babel'

import { FeatureBase } from './feature-base'

/**
 * Will create an indented block between open and close tags when user inserts
 * a line break.
 */
export class IndentBetweenTagsFeature extends FeatureBase {
  supports (editor, event) {
    if (this.isLocked()) {
      return false
    }

    /**
     * Detect and ignore copy-pasting content.
     */
    if (!/^\n\s*$/.test(event.newText)) {
      return false
    }

    const range = event.newRange
    const textLine = editor.buffer.lineForRow(range.end.row)
    const lastLine = editor.buffer.lineForRow(range.end.row - 1)

    /**
     * Only react when between '>' and '<'.
     *
     * Have to use trim() here because autoindent seems to be executed first
     * and therefore there will be additional space that wasn't there when
     * user pressed Enter.
     *
     * Will have the side effect that indentation will seem messed up if user
     * actually inputted whitespace, moved the cursor back, and then inserted
     * a line break. User error.
     *
     */
    if (textLine.trim()[0] !== '<') {
      return false
    }

    /**
     * Only react when between '>' and '<'.
     *
     * Using trim() here for the sake of coherency WRT previous condition.
     */
    if (lastLine.trim().slice(-1) !== '>') {
      return false
    }

    console.log('ALLOW INDENTATION', event)

    return true
  }

  execute (editor) {
    this.lock(() => {
      editor.moveUp()
      editor.moveToEndOfLine()

      editor.insertText('\n', {
        autoIndentNewline: true
      })

      editor.buffer.groupLastChanges()
    })
  }
}
