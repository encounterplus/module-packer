const slugify = require('slugify')
const uuidv4 = require('uuid/v4')

class Group {
  constructor(id = uuidv4(), name = "Unknown Group") {
    this.id = id
    this.name = name
    this.slug = slugify(name, {lower: true, remove: /[*+~.()'"!:@&’]/g, strict: true})
    this.parent = null
  }
}

module.exports = Group