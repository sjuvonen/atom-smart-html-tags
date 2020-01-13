'use babel'

/* global atom */

export function createTagFinder () {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const bmPath = atom.packages.getActivePackage('bracket-matcher').path
        const TagFinder = require(`${bmPath}/lib/tag-finder`)

        resolve(new TagFinder())
      } catch (error) {
        reject(error)
      }
    })
  })
}
