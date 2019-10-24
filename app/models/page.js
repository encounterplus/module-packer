const slugify = require('slugify')
const uuidv4 = require('uuid/v4')

class Page {
  constructor(id = uuidv4(), name = "Unknown page") {
    this.id = id
    this.name = name
    this.slug = slugify(name, {lower: true, remove: /[*+~.()'"!:@]/g})
    this.parent = null
    this.content = ""

  }
}

module.exports = Page