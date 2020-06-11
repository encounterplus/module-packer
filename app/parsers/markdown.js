const slugify = require('slugify')
const markdownItAttrs = require('markdown-it-attrs')
const markdownItAnchor = require("markdown-it-anchor")
const fs = require('fs-extra')
const fm = require('front-matter')
const glob = require('glob')
const path = require('path')
const archiver = require('archiver')
const Page = require('../models/page')
const Group = require('../models/group')
const cheerio = require('cheerio')
const EventEmitter = require('events').EventEmitter
const util = require('util')
const uuidv4 = require('uuid/v4')

function slgfy(s) {
  return slugify(s, {lower: true, remove: /[*+~.()'"!:@&’]/g, strict: true})
}

const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
})

// setup markdown
md
  .use(markdownItAttrs)
  .use(markdownItAnchor);

function trim (s, c) {
  if (c === "]") c = "\\]";
  if (c === "\\") c = "\\\\";
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
    ), "");
}



class Markdown {
  constructor(module) {
    this.module = module;
  }

  parseDirectory(src, group) {
    let that = this
    let subdirectories = fs.readdirSync(src).filter(function (file) {
      return fs.statSync(src+'/'+file).isDirectory();
    });
  
    subdirectories.forEach((subdir) => {
      let directory = src + '/' + subdir

      if (fs.existsSync(directory + '/.ignoregroup')) {
        return
      }

      let newGroup = new Group(uuidv4(), subdir)
      if (group) {
        newGroup.parent = group
      }

      that.module.groups.push(newGroup) 
      that.parseDirectory(directory, newGroup)
    })
  
    // get all markdown files
    let files = glob.sync(src + '/*.md')
  
    // lenght check
    if (files.length == 0) {
      return
    }
  
    files.forEach((file) => {
      console.log(file)
  
      // read source md file
      let data = fs.readFileSync(file, 'utf8')
  
      // parse front matter
      let content = fm(data)
  
      // render markdown to html
      let html = md.render(content.body)
  
      console.log(html);
  
      // get name or filename
      let name = content.attributes.name || path.basename(file)
  
      var lookup = {}
  
      if (content.attributes.pagebreak) {
        // split pages by headings
        // load html parser
        let $ = cheerio.load(html)
  
        // get all hedings
        $(content.attributes.pagebreak).each((i, elem) => {
  
          let name = $(elem).text()
          console.log('---')
          console.log(name)
  
          // create page
          let page = new Page(undefined, name)
          page.content += $.html(elem)
  
          // get next elements until another heading
          $(elem).nextUntil(content.attributes.pagebreak).each((i, e) => {
            page.content += $.html(e)
          })
  
          lookup[page.slug] = page
  
          let selector = trim(content.attributes.pagebreak.split(elem.tagName)[0], ',')
          // console.log(selector)
  
          // get previous elements until another heading
          let prevId = $(elem).prevAll(selector).first().text()
          
  
          // set parent based on id
          if (prevId) {
            let prevSlug = slgfy(prevId)
            console.log(prevSlug)
            page.parent = lookup[prevSlug]
          }

          if (!page.parent && group) {
            page.parent = group
          }
          
          // append page to module
          that.module.pages.push(page)
        })
  
      } else {
        // create single page
        let page = new Page(undefined, name)
        page.content = html

        // As
        if (group) {
          page.parent = group
        }
  
        // append page to module
        that.module.pages.push(page)
      }
    })
  }

  process(src) {
    console.log('processing path: %s', src)
    console.log('module: %s', this.module.name)

    let that = this

    that.parseDirectory(src);

    if (fs.existsSync(path.join(src, 'cover.jpg'))) {
      this.module.image = 'cover.jpg'
    }

    // console.log(that.module)

    // export module
    that.module.exportToXML(path.join(src, 'module.xml'))

    // copy resources if needed
    if (!fs.existsSync(path.join(src, 'assets'))) {
      // bleh, need to find a better way
      let packedAssets = path.join(process.resourcesPath, 'resources', 'assets')
      let localAssets = path.join(path.dirname(path.dirname(__dirname)), 'resources', 'assets')
      let dstAssets = path.join(src, 'assets')
      let assetsIgnore = path.join(dstAssets, '.ignoregroup')
      fs.copySync( fs.existsSync(localAssets) ? localAssets : packedAssets, dstAssets)
      fs.writeFileSync(assetsIgnore, '')
    }

    // return
    let dirname = path.dirname(src);

    // create archive
    let filename = path.join(dirname, this.module.slug + '.module')
    var output = fs.createWriteStream(filename)
    var archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes')
      console.log('FINISHED')
      that.emit('success', filename)
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      throw err
    });

    // pipe archive data to the file
    archive.pipe(output)

    // // append files from a sub-directory, putting its contents at the root of archive
    // archive.directory(src, false)

    // all files except source md
    archive.glob('./**/!(*.md)', {cwd: src})

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize()
  }
}

util.inherits(Markdown, EventEmitter)

module.exports = Markdown