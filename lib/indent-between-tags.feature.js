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
    if (event.text !== '\n') {
      console.warn('fail 1')
      return false
    }

    const range = event.range
    const textLine = editor.buffer.lineForRow(range.end.row)
    const lastLine = editor.buffer.lineForRow(range.end.row - 1)

    /**
    * Only react when between '>' and '<''
    */
    if (textLine.slice(range.end.column, range.end.column + 1) !== '<') {
      console.warn(`fail 2 ('%s', '%s')`, event.text, textLine.slice(range.end.column, range.end.column + 1))
      return false
    }

    /**
    * Only react when between '>' and '<''
    */
    if (lastLine.slice(-1) !== '>') {
      console.warn('fail 3', lastLine.slice(-1))
      return false
    }

    return true
  }

  execute (editor, event) {
    editor.moveLeft(1)
    editor.insertText('\n', {
      autoIndentNewline: true,
    })
  }
}
