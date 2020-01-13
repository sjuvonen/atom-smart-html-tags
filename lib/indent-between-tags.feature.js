'use babel'

/**
 * Will create an indented block between open and close tags when user inserts
 * a line break.
 */
export class IndentBetweenTagsFeature {
  supports (editor, event) {
    /**
     * Only react when inserting a new line.
     */
    if (event.newText[0] !== '\n') {
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

    return true
  }

  execute (editor) {
    editor.moveUp()
    editor.moveToEndOfLine()

    editor.insertText('\n', {
      autoIndentNewline: true
    })

    editor.buffer.groupLastChanges()
  }
}
