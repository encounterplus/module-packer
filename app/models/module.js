const slugify = require('slugify')
const uuidv4 = require('uuid/v4')
const fs = require('fs')
const xml2js = require('xml2js')

class Module {
  constructor(id = uuidv4(), name = 'Unknown module') {
    this.id = id
    this.name = name
    this.slug = slugify(name, {lower: true})
    this.description = null
    this.author = null
    this.code = null
    this.category = null
    this.image = null

    this.pages = []
    this.groups = []
    this.maps = []
    this.encounters = []
  }

  exportToXML(dst) {
  	let mod = {
  		$: {id: this.id}, 
  		name: this.name, 
  		slug: this.slug, 
  		description: this.description,
  		author: this.author,
  		code: this.code,
  		category: this.category,
  		image: this.image,
  	}

  	// pages
  	let pages = this.pages.map(page => {
  		// console.log(page)
  		let attrs = {id: page.id}
  		if (page.parent) {
  			attrs.parent = page.parent.id
  		}
  		return {$: attrs, name: page.name, slug: page.slug, content: page.content}
  	})

  	mod.page = pages

  	// create xml builder
  	let builder = new xml2js.Builder({rootName: 'module'})
		let xml = builder.buildObject(mod)

		// write xml to file
		fs.writeFileSync(dst, xml)
  }
}

module.exports = Module