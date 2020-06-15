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
    
    // Get subdirectories
    let subdirectories = fs.readdirSync(src).filter(function (file) {
      return fs.statSync(src+'/'+file).isDirectory();
    });
  
    // Recursively loop through subdirectories
    subdirectories.forEach((subdir) => {
      // subdir is the name of the folder,
      // get absolute path
      let directory = src + '/' + subdir 

      // Skip ModuleOutput - that's where we're moving
      // all of our image files to
      if (subdir == 'ModuleOutput') {
        return
      }

      // Skip any folder with an ".ignoregroup" file for the purpose of
      // creating groups or reading .md files. However, copy
      // their content to the module output (as they may be an
      // image or resource folder)
      if (fs.existsSync(directory + '/.ignoregroup')) {
        if (!group) { // If a root-level ignored folder, copy to output
          fs.copySync(directory, moduleOutput + '/' + subdir)
        }
        return
      }

      // Create a new group with a random UUID
      // and assign the parent
      let newGroup = new Group(uuidv4(), subdir)
      if (group) {
        newGroup.parent = group
      }

      // Push group to list of groups and recursively start
      // parsing subdirectory
      that.module.groups.push(newGroup) 
      that.parseDirectory(directory, moduleOutput, newGroup)
    })
  
    // Ensure there are files in the modules directory
    let files = glob.sync(src + '/*.*')
    if (files.length == 0) {
      return
    }
  
    files.forEach((file) => {
      console.log(file)

      // Copy all images to the base ModuleOutput folder
      // This allows you to create same-directory image
      // references when authoring markdown
      const imageExtensions = ['.gif', '.jpeg', '.jpg', '.png']
      let extension = path.extname(file)
      if (imageExtensions.includes(extension)) {
        let filename = path.basename(file)
        let newDestination = path.join(moduleOutput, filename)
        fs.copyFileSync(file, newDestination)
      }

      // All code below is for parsing markdown files,
      // so ignore any non-markdown files
      if (extension != '.md') {
        return
      }
  
      // read source md file
      let data = fs.readFileSync(file, 'utf8')
  
      // parse front matter
      let content = fm(data)
  
      // render markdown to html
      let html = md.render(content.body)  
      // console.log(html);
  
      // get name or filename
      let name = content.attributes.name || path.basename(file)
  
      var lookup = {}
  
      let cover = undefined
      let pagebreakContentFound = false
      if (content.attributes.pagebreak) {
        // split pages by headings
        // load html parser
        let $ = cheerio.load(html)

        // get all headings
        $(content.attributes.pagebreak).each((i, elem) => {
          let name = $(elem).text()
          console.log('---')
          console.log(name)

          // Create page
          let page = new Page(undefined, name)
          page.content += $.html(elem)
          
          // get next elements until another heading
          $(elem).nextUntil(content.attributes.pagebreak).each((i, e) => {
            // Special case cover images - they will be moved
            // to the beginning of the page later
            if ($(e).find('.size-cover').length > 0) {
              cover = e
            } else {
              page.content += $.html(e)
            }
            
            pagebreakContentFound = true
          })

          lookup[page.slug] = page  
          let selector = trim(content.attributes.pagebreak.split(elem.tagName)[0], ',')

          // get previous elements until another heading
          let prevId = $(elem).prevAll(selector).first().text()
          
          // set parent based on id
          if (prevId) {
            let prevSlug = slgfy(prevId)
            console.log(prevSlug)
            page.parent = lookup[prevSlug]
          }

          // If there is a cover image, apply to top current page
          if (cover) {
            page.content = $.html(cover) + page.content
            cover = undefined
          }

          // If the page has no parent and there is a group, 
          // make page belong to that group
          if (!prevId && group) {
            page.parent = group
          }
          
          // append page to module
          that.module.pages.push(page)
        })
      } 
      
      // If a page hasn't otherwise been created by
      // pagebreak parsing logic, use full HTML
      // to create page
      if (!pagebreakContentFound) {
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

    // Create a ModuleOutput folder so the main
    // folder gets minimally altered
    let moduleOutput = path.join(src, 'ModuleOutput')
    if (!fs.existsSync(moduleOutput)) {
      fs.mkdirSync(moduleOutput)
    }    
    
    // Make sure repeated runs don't include the ModuleOutput
    // folder
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