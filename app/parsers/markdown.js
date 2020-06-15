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

  parseDirectory(src, moduleOutput, group) {
    let that = this
    let subdirectories = fs.readdirSync(src).filter(function (file) {
      return fs.statSync(src+'/'+file).isDirectory();
    });
  
    subdirectories.forEach((subdir) => {
      let directory = src + '/' + subdir

      if (subdir == 'ModuleOutput') {
        return
      }

      if (fs.existsSync(directory + '/.ignoregroup')) {
        if (!group) { // If a root-level ignored folder, copy to output
          fs.copy(directory, moduleOutput + '/' + subdir)
        }
        return
      }

      let newGroup = new Group(uuidv4(), subdir)
      if (group) {
        newGroup.parent = group
      }

      that.module.groups.push(newGroup) 
      that.parseDirectory(directory, moduleOutput, newGroup)
    })
  
    // get all files
    let files = glob.sync(src + '/*.*')
  
    // lenght check
    if (files.length == 0) {
      return
    }
  
    const imageExtensions = ['.gif', '.jpeg', '.jpg', '.png'];
    files.forEach((file) => {
      console.log(file)

      let extension = path.extname(file)
      if (imageExtensions.includes(extension)) {
        let filename = path.basename(file)
        let newDestination = path.join(moduleOutput, filename)
        fs.copyFileSync(file, newDestination)
      }

      if (extension != '.md') {
        return
      }
  
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

      let pageContentFound = false
  
      if (content.attributes.pagebreak) {
        // split pages by headings
        // load html parser
        let $ = cheerio.load(html)
        let cover = $('.size-cover')

        // get all hedings
        $(content.attributes.pagebreak).each((i, elem) => {
  
          let name = $(elem).text()
          console.log('---')
          console.log(name)

          // create page
          let page = new Page(undefined, name)

          if (!pageContentFound && cover) {
            page.content += cover
          }

          page.content += $.html(elem)
          
          // get next elements until another heading
          $(elem).nextUntil(content.attributes.pagebreak).each((i, e) => {
            page.content += $.html(e)
            pageContentFound = true
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

          if (!prevId && group) {
            page.parent = group
          }
          
          // append page to module
          that.module.pages.push(page)
        })
  
      } 
      
      if (!pageContentFound) {
        // create single page
        let page = new Page(undefined, name)
        page.content = html

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

    let moduleOutput = path.join(src, 'ModuleOutput')
    if (!fs.existsSync(moduleOutput)) {
      fs.mkdirSync(moduleOutput)
    }
    
    let ignoreFile = path.join(moduleOutput, '.ignoregroup')
    fs.writeFileSync(ignoreFile, '')

    that.parseDirectory(src, moduleOutput);

    if (fs.existsSync(path.join(src, 'cover.jpg'))) {
      this.module.image = 'cover.jpg'
    }

    // console.log(that.module)

    // export module
    that.module.exportToXML(path.join(moduleOutput, 'module.xml'))

    // copy resources if needed
    if (!fs.existsSync(path.join(moduleOutput, 'assets'))) {
      // bleh, need to find a better way
      let packedAssets = path.join(process.resourcesPath, 'resources', 'assets')
      let localAssets = path.join(path.dirname(path.dirname(__dirname)), 'resources', 'assets')
      let dstAssets = path.join(moduleOutput, 'assets')
      fs.copySync( fs.existsSync(localAssets) ? localAssets : packedAssets, dstAssets)
    }

    // return
    let dirname = path.dirname(moduleOutput);

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
    archive.glob('./**/!(*.md)', {cwd: moduleOutput})

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize()
  }
}

util.inherits(Markdown, EventEmitter)

module.exports = Markdown