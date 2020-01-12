'use babel'

const packageName = 'smart-html-tags'

import { CompositeDisposable } from 'atom'
import { CloseTagFeature } from './close-tag.feature.js'
import { IndentBetweenTagsFeature } from './indent-between-tags.feature'

class SmartHtmlTags {
  constructor (workspace, config) {
    this.workspace = atom.workspace
    this.config = atom.config

    this.globalSubscriptions = new CompositeDisposable()
    this.subscriptions = new CompositeDisposable()

    this.features = new Map([
      ['close-tag', new CloseTagFeature()],
    ])

    this.globalSubscriptions.add(
      this.config.observe(`${packageName}.indentInsideTags`, state => this.onIndentFeatureChanged(state)),
      this.workspace.observeActiveTextEditor(() => this.onEditorChanged()),
    )
  }

  destroy () {
    this.subscriptions.dispose()
    this.globalSubscriptions.dispose()
  }

  onIndentFeatureChanged (state) {
    if (state) {
      this.features.set('indent-inside', new IndentBetweenTagsFeature())
    } else {
      this.features.delete('indent-inside')
    }
  }

  onEditorChanged () {
    this.subscriptions.dispose()
    this.editor = this.workspace.getActiveTextEditor()

    if (this.editor) {
      this.subscriptions = new CompositeDisposable(
        this.editor.onDidInsertText(event => this.onTextInserted(event)),
        this.editor.observeGrammar(grammar => this.onGrammarChanged()),
      )
    }
  }

  onGrammarChanged () {
    const grammars = this.editor.getGrammar().fileTypes
    const fileTypes = this.config.get(`${packageName}.managedFileTypes`)

    this.hasValidGrammar = fileTypes.some(type => grammars.includes(type))
  }

  onTextInserted (event) {
    if (!this.isPluginEnabledForActiveEditor()) {
      return
    }

    for (const feature of this.features.values()) {
      if (feature.supports(this.editor, event)) {
        feature.execute(this.editor, event)
        break
      }
    }
  }

  isPluginEnabledForActiveEditor () {
    return this.editor && this.hasValidGrammar
  }
}

export default {
  plugin: null,

  config: {
    managedFileTypes: {
      type: 'array',
      default: ['html', 'xml'],
      order: 1,
      title: 'Managed file types',
      description: 'Enable plugin for these file types.',
    },
    indentInsideTags: {
      type: 'boolean',
      default: true,
      order: 2,
      title: 'Indent between open and close tags',
      description: 'Create an indented block when inserting a line break between open and close tags.',
    }
  },

  activate (state) {
    this.plugin = new SmartHtmlTags()
  },

  deactivate () {
    this.plugin.destroy()
    delete this.plugin
  },
}
