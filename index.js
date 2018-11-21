'use strict'

const regex = /(?:^|\n)[\?\!]{3}(\+)? ?(?:([\u4e00-\u9fa5_a-zA-Z0-9\-]+(?: +[\u4e00-\u9fa5_a-zA-Z0-9\-]+)*?)?(?: +"(.*?)")|([\u4e00-\u9fa5_a-zA-Z0-9\-]+(?: +[\u4e00-\u9fa5_a-zA-Z0-9\-]+)*?)) *(?:\n|$)/gm;
// const regex = /(?:^|\n)[\?\!]{3}(\+)? ?(?:([\w\-]+(?: +[\w\-]+)*?)?(?: +"(.*?)")|([\w\-]+(?: +[\w\-]+)*?)) *(?:\n|$)/gm;

var tab = '\t'
var tabSize = 4
var lineFeed = '\n'
var space = ' '

module.exports = function blockPlugin (opts) {
  function blockTokenizer (eat, value, silent) {
    var length = value.length + 1
    var index = 0
    var subvalue = ''
    var fenceCount
    var marker
    var character
    var queue
    var content
    var exdentedContent
    var closing
    var exdentedClosing
    var indent
    var now
    var self = this
    var settings = self.options
    var commonmark = settings.commonmark
    var gfm = settings.gfm
    var tokenizers = self.blockTokenizers
    var interruptors = self.interruptParagraph
    var index = value.indexOf(lineFeed)
    var length = value.length
    var position
    var subvalue
    var character
    var size
    var now

    while (index < length) {
      // Eat everything if there’s no following newline.
      if (index === -1) {
        index = length
        break
      }

      // Stop if the next character is NEWLINE.
      if (value.charAt(index + 1) === lineFeed) {
        break
      }

      // In commonmark-mode, following indented lines are part of the paragraph.
      if (commonmark) {
        size = 0
        position = index + 1

        while (position < length) {
          character = value.charAt(position)

          if (character === tab) {
            size = tabSize
            break
          } else if (character === space) {
            size++
          } else {
            break
          }

          position++
        }

        if (size >= tabSize && character !== lineFeed) {
          index = value.indexOf(lineFeed, index + 1)
          continue
        }
      }

      subvalue = value.slice(index + 1)

      position = index
      index = value.indexOf(lineFeed, index + 1)
    }

    subvalue = value.slice(0, index)
    // console.log(subvalue)
    // console.log(value)
    if (silent) {
      return true
    }

    now = eat.now()
    now.column += subvalue.length
    now.offset += subvalue.length
    let res = regex.exec(subvalue)
    // subvalue += value
    if (res !== null) {
      if (silent) {
        return true
      }
      let val = res[2] || res[4]
      // console.log(val)
      let title = res[3] || ''
      if (res[0][0] == '!') {
        title = res[4]
        val = ''
      }
      // console.log(subvalue)
      // console.log(subvalue.replace(regexonce, ''))
      // console.log(subvalue.replace(regexonce, ''))
      // console.log(subvalue)
      // console.log(now)
      let childval = subvalue.replace(regex, '').split('\n')
      // console.log(childval)
      childval.forEach((e, idx) => {
        childval[idx] = e.replace(/\s{4}/, '')
      })
      childval = childval.join('\n')
      return eat(subvalue)({
        type: 'details',
        value: val,
        title: title,
        children: self.tokenizeBlock(childval, now)
      })
    }
  }

  const Parser = this.Parser

  // Inject blockTokenizer
  const blockTokenizers = Parser.prototype.blockTokenizers
  const blockMethods = Parser.prototype.blockMethods
  blockTokenizers.details = blockTokenizer
  blockMethods.splice(blockMethods.indexOf('paragraph') - 1, 0, 'details')

  // Inject details to interrupt rules
  const interruptParagraph = Parser.prototype.interruptParagraph
  const interruptList = Parser.prototype.interruptList
  const interruptBlockquote = Parser.prototype.interruptBlockquote
  interruptParagraph.splice(interruptParagraph.indexOf('paragraph') - 1, 0, ['details'])
  interruptList.splice(interruptList.indexOf('paragraph') - 1, 0, ['details'])
  interruptBlockquote.splice(interruptBlockquote.indexOf('paragraph') - 1, 0, ['details'])

  const Compiler = this.Compiler

  // Stringify for details block
  if (Compiler != null) {
    const visitors = Compiler.prototype.visitors
    visitors.details = function (node) {
      // return '$$\n' + node.value + '\n$$'
      console.log('visited in index.js')
      return node.value
    }
  }
}