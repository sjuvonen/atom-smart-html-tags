'use babel'

import { CompositeDisposable } from 'atom'
import { CloseTagFeature } from './close-tag.feature'
import { IndentBetweenTagsFeature } from './indent-between-tags.feature'
import { RenameCounterpartFeature } from './rename-counterpart.feature'

/* global atom */

const packageName = 'smart-html-tags'

const featureMappings = new Map([
  ['closeTags', CloseTagFeature],
  ['indentInsideTags', IndentBetweenTagsFeature],
  ['renameCounterpart', RenameCounterpartFeature]
])

class SmartHtmlTags {
  constructor (workspace, config) {
    this.workspace = atom.workspace
    this.config = atom.config

    this.globalSubscriptions = new CompositeDisposable()
    this.subscriptions = new CompositeDisposable()

    this.features = new Map()

    this.globalSubscriptions.add(
      this.workspace.observeActiveTextEditor(() => this.onEditorChanged())
    )

    for (const configKey of featureMappings.keys()) {
      const subscription = this.config.observe(`${packageName}.${configKey}`, (state) => {
        this.onFeatureChanged(configKey, state)
      })

      this.globalSubscriptions.add(subscription)
    }

    this._renameCounterpart = new RenameCounterpartFeature()
  }

  destroy () {
    this.subscriptions.dispose()
    this.globalSubscriptions.dispose()
  }

  onFeatureChanged (name, state) {
    if (!featureMappings.has(name)) {
      console.warn(`Trying to toggle a non-existing feature '${name}'.`)
      return
    }

    if (state) {
      const Feature = featureMappings.get(name)
      this.features.set(name, new Feature())
    } else {
      this.features.delete(name)
    }
  }

  onEditorChanged () {
    this.subscriptions.dispose()
    this.editor = this.workspace.getActiveTextEditor()

    if (this.editor) {
      this.subscriptions = new CompositeDisposable(
        this.editor.observeGrammar(() => this.onGrammarChanged()),
        this.editor.buffer.onDidChange(event => this.onTextChanged(event))
      )
    }
  }

  onGrammarChanged () {
    const grammars = this.editor.getGrammar().fileTypes
    const fileTypes = this.config.get(`${packageName}.managedFileTypes`)

    this.hasValidGrammar = fileTypes.some(type => grammars.includes(type))
  }

  onTextChanged (event) {
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
      description: 'Enable plugin for these file types.'
    },
    closeTags: {
      type: 'boolean',
      default: true,
      order: 2,
      title: 'Insert closing tags automatically',
      description: 'Adds the closing tag upon completing the opening tag.'
    },
    indentInsideTags: {
      type: 'boolean',
      default: true,
      order: 3,
      title: 'Indent between open and close tags',
      description: 'Create an indented block when inserting a line break between open and close tags.'
    },
    renameCounterpart: {
      type: 'boolean',
      default: true,
      order: 4,
      title: 'Synchronize tag names',
      description: 'Rename matching open/close tag when editing its counterpart.'
    }
  },

  activate (state) {
    this.plugin = new SmartHtmlTags()
  },

  deactivate () {
    this.plugin.destroy()
    delete this.plugin
  }
}
