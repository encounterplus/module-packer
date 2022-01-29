# Change Log

# 1.0.58

### Added
- Added the ability to show images in items and spells on a page with the `show-image` property.

### Changed
- Updated dependencies and webpack options for security and performance improvements.

# 1.0.57

### Fixed
- Fixed missing dependency

# 1.0.56

### Added
- Added the `ignore` option to Module.yaml to ignore specific markdown files.
- Added FontAwesome support.

### Changed
- Changed the way image/script paths are parsed to allow absolute paths

# 1.0.55

### Added
- Added more of the Solbera fonts to the global.css
- Added ability to remove empty groups with `delete-empty-groups: true` in Module.yaml file
- Added ability to force a single page break as two-column or single-column with `(print-page-multi-column)` and `(print-page-single-column)`

### Changed
- Removed timeout from PDF page generation

### Fixed
- Fixed maps and encounters exported from campaigns not being supported
- Errors in Print output with Screen-only images

# 1.0.54

### Added
- Added experimental ability to check for broken links when building Modules/PDFs

### Fixed
- Fixed the way `.size-cover` attributes worked for figures

## 1.0.52 & #1.0.53

### Changed
- Updated many package dependencies

## 1.0.51

### Changed
- Added support for more image formats (e.g., `.svg` and `.webp`)

### Fixed
- Fixed relative linking of script `src` elements

## 1.0.50

### Fixed
- Broken monster link coloring

## 1.0.49

### Changed
- Added `.item`, `.spell`, `.roll`, `.page`, and `.monster` link styles
- Bumped included chromium version
- Removed ASAR in electron builds because of incompatibility with puppeteer

## 1.0.48

### Fixed
- Fixed issues rendering previews in VS Code
- Fixed lack of documentation in VSIX

## 1.0.47

### Changed
- Leading slashes on image paths will now automatically be ignored
- Standalone app upgraded to Electron 13

### Fixed
- Fixed scrolling in preview window

## 1.0.46

### Added
- Added `.color-links` attribute to tables and blockquotes to make links (of all types) match the table color. Colored tables no longer implicitly color the links
- Added manual control over link colors with `.blue`, `.green`, `.red`, `.yellow`, `.neutral`, `.gray`, `.purple`, and `.black` attributes
- Added `.underline` attribute for links to add underline text decoration

## 1.0.45

### Added
- Added link coloring to differentiate monsters, spells, items, and rolls

### Changed
- Made rolls automatically strip links and replace with bold when doing PDF output

## 1.0.44

### Changed
- Chaned monster stat blocks to allow a null/empty alignment

### Fixed
- Fixed the `showImage` property on monster stat blocks not being respected

## 1.0.43

### Fixed
- Fixed `copy-files` flag being applied to print/pdf output

## 1.0.42

### Changed
- Changed default expanding behavior of Module tree view to only include root project

### Fixed
- Fixed `copy-files` property not being utilized
- Fixed an error that could occur when module.yaml was empty
- Fixed modules without a name not defaulting to folder name
- Fixed module tree view showing print-only items

## 1.0.41

### Added
- Added color classes to blockquotes

### Changed
- Changed default, unspecified Table Headers to align left

### Fixed
- Fixed the description property of monster stat blocks not making it into the compendium export

## 1.0.40

### Fixed
- Added rarity to items stub
- Fixed double periods in compendium image filenames

## 1.0.39

### Fixed
- Fixed Modules showing up twice in the module view because it was including the ModuleBuild folder

## 1.0.38

### Breaking Changes
- `.size-full` and `.size-cover` will no longer automatically get grouped to the next pagebreak. They will, instead, need to be marked with the `.before-next-page-header` class

### Changes
- Made module packer copy source text files to ModuleBuild when building

### Fixed
- Fixed a module build error that could occur with null item properties

## 1.0.37

### Fixed
- Fixed catalyst-specific font sizes

## 1.0.36

### Added
- Added page and group stubs creation commands
- Added column-after and column-after-property to monster stubs
- Added images and proficiency bonus to monster stat blocks

### Fixed
- Fixed typo in monster link creation
- Fixed .size-full and .size-content images sometimes disappearing in modules

### Changed
- Made the Build Module command build the default module if no module selected in tree view

## 1.0.35

### Added
- Added support for .catalyst class font size
- Added commands to create stubs
- Added navigation from Extension menu items to headers

### Changed
- Changed page view for VS Code extension to be expanded by default

### Fixed
- Fixed broken font spacing on statblock titles

## 1.0.34

### Changed
- Changed many sizes to use rem instead of px so EncounterPlus can scale content appropriately.=

## 1.0.33

### Added
- Added `Cmd-K` shortcut for creating links (`Ctrl-K` on Windows)
- Added "Create Monster Link", "Create Spell Link", and "Create Item Link" commands (no default keybindings)

### Changed
- Changed front from Bookinsanity to Bookinsanity remake to handle accented characters
- Made most links bold by default in PDF output. Table of content links still remain the same

## 1.0.32

### Added
- Added `print-link-update` option to Module Projects to allow compendium links to link to D&D Beyond instead when outputting to PDF. Valid values are "None", "D&D Beyond Entries", and "D&D Beyond Search"
- Links now support a `.no-link-update` attribute to ignore PDF output updates
- Item links now support a `.magic-item` or `.equipment` attribute to link to proper PDF entries
- Added additional anchor IDs to make linking more consistent with PDF output and Module Output

## 1.0.31

### Breaking Changes
- `.size-cover`, `.print-bottom-left`, `.print-bottom-right`, `.print-top-left`, and `.print-top-right` no long apply margins in PDF output. Added `.with-margin` attribute to augment to get the older spacing
- `.print-bottom-left`, `.print-bottom-right`, `.print-top-left`, and `.print-top-right` will now appear on top of footer

### Fixed
- Fixed `cover` images for pages only working in root folder
- Fixed monsters, spells, and items only allowing same-folder paths for images/tokens

## 1.0.30

### Added
- Added `.print-center` attribute
- Added `column-after` and `column-after-property` properties to monster stat blocks

### Changed
- Optimization: Exporting to PDF no longer processes maps or encounters

### Fixed
- Fixed module view in VS Code showing ignored groups/folders

## 1.0.29

### Fixed
- Fixed preview and lack of readme in Webpacked extension

## 1.0.28

### Added
- Added CLI build option. Use it by invoking `python launcher.py run --path <module path>` and `python launcher.py run --path <module path> --output pdf`

### Changed
- Removed CLI from electron app (it wasn't working well)

## 1.0.27

### Breaking Changes
- Removed `compress-images` functionality temporarily (hopefully)

### Added
- `compendium` option now allowed for `include-in` page property. This will allow pages to be used for compendium entries in E+, but will not show up as pages in PDF or E+ output.
- Added linux build

### Changed
- Webpacked VS Code extension to improve load time and performance
- Changed property naming to be more consistent in style:
  - `autoIncrementVersion` module.yaml property may now be `auto-increment-version`
  - `compressImages` module.yaml property may now be `compress-images`
  - `printCover` module.yaml property may now be `print-cover`

## 1.0.26

### Fixed
- Fixed standalone apps not showing their UI

## 1.0.25

### Added
- Added Large Quote blockquote style
- Added `print-cover-only` option to pages to make pages only contain cover contents
- Added `.purple` table style

### Changed
- Made YAML parse errors more descriptive to help identify location of issues

### Fixed
- Fixed an issue where the Module projects could not be scanned on Windows

## 1.0.24

### Added
- Added support for custom colors and classes on items and spells. Colors supported are green, blue, red, yellow, orange, gray, neutral, and purple
- Added purple color to monster stat blocks

### Breaking Changes
- Changed `property` to `properties` on item descriptions. It is now an array

### Changed
- Changed Sidebar tables to avoid floating if there isn't sufficient width (i.e., less than 400 px)

### Fixed
- Fixed two-column monster statblocks as not spanning across columns when exporting to PDF
- Fixed items not supporting multiple properties
- Fixed spells and items not supporting line breaks in their descriptions.

## 1.0.23

### Added
- Added Items and Spells YAML compendium entry support
- Added CLI interface for app. Arguments are "<path> <mode>", where <path> is the path of the module, and <mode> is optional and can be `pdf` (to create a PDF) or `module` (to create a module file). The `module` mode is default

### Changed
- Updated VS Code Engine to 1.51

### Fixed
- Fixed Create Module.yaml button not working
- Fixed manually-chosen slugs on monsters not being respected

## 1.0.22

### Fixed
- Ignore unix-style hidden folders (e.g., ".folder") to ignore version controlled system hidden files

## 1.0.21

### Changed
- `parent` value now supported generically on pages and groups
- Removed deprecated `role` field from Monsters

## 1.0.20

### Fixed
- Fixed module packer creating a compendium.xml when there was no compendium data

## 1.0.19

### Added
- Added ability to export compendium items (monsters) with module
- Added the ability to include maps
- Added the ability to include encounters
- Added the ability to have nested pages under other nested pages

### Changed
- `.size-full` attribute now groups ahead of module pagebreaks like `.size-full` does

## 1.0.18

### Fixed
- Fixed sidebar tables not having proper width by default
- Fixed page contents being inappropriately wrapped in HTML/Body tags when exporting to module
- Fixed nested pages generated from pagebreaks not maintaining sort order
- Fixed pages duplicating on PDF output when placed at root level

## 1.0.17

### Added
- Generic `.center` attribute
- Added `compressImages` option to Module project to compress images upon output.
- Added additional logging messages

### Changed
- Made `.float-left` and `.float-right` apply to more elements

## 1.0.16

### Breaking Changes
- Changed `.headerTitle` to `.header-title` to be consistent with others

### Added
- Console log messages when building with the VS Code extension
- `.print-float-right`, `.print-float-left`, and `.print-two-column` attributes to float only in print layouts
- VS Code E+ View now accurately shows order of pages and groups

### Changed
- Swapped page footer orientation between odd and even pages 
- Decreased font size of figure captions

### Fixed
- Newline handling in Trait/Action descriptions for monsters
- Z-index on print-bottom-left and bottom-right now allow content to overlap

## 1.0.15

### Breaking Changes
- `print-only` option on pages changed to use new `include-in` option

### Added
- `.toc` style for unordered lists. Creates table of content entries with automatic page numbers.
- `include-in` module project option available for both group and page definitions to allow inclusion of groups and/or pages in specific targets. Valid values are `all` (default), `print`, and `module`.
- `printCover` module project option for a print cover page.
- Even and odd pages now print the footer and page number on opposite sides as would be expected when printing.

### Changed
- Allowed front-matter keys to be case insensitive

### Fixed
- Fixed broken drop caps lettering
- Fixed pages not respecting manual slug definitions
- Fixed sidebar table style being overly stretched on single-column print layouts

## 1.0.14

### Added
- Better handling for relative image links (particularly useful for shared images)
- Ability for PDF export to link to pages
- Added `parent-page` front matter attribute to allow pages to be nested under other pages without pagebreaks

### Changed: 
- Changed to have stylesheet use LESS to produce minimized CSS.

### Fixed
- Fixed some blockquote styles breaking between pages/columns.

## 1.0.13

### Added
- Bookinsanity font as body for export to PDF
- `.two-column` div style
- `.flavortext` blockquote style
- `.print-bottom-left` and `.print-bottom-right` image styles (for PDF export)

### Changed
- Changed statblock dimensions to allow a bit more room for attributes with two digit modifiers.

### Fixed
- Fixed same-order page sort being reversed when exporting to PDF 
- Fixed challenge ratings not showing XP value if value was over 1
- Fixed auto-italics in monster stat block being case sensitive

## 1.0.12

### Added
- `.square` bullet style for unordered lists
- `print-only` option for front-matter
- `.blue, .green, .yellow, .red, .gray, .neutral` styles for monster stat blocks

### Fixed
- Fixed `Cannot read property 'children' of undefined` error

## 1.0.11

### Added
- `Monster` code-fence style for creating Monster Stat blocks in YAML
- `(print-column)` tag for column breaks when exporting to PDF
- `.caption` attribute for images to add a caption to images (by placing them in a Figure element)
- `footer` and `hide-footer` front matter options for pages

### Changed
- Building a module or Exporting a module to PDF now save all files in the VS Code workspace
- In VS Code, when clicking on Module or Group items in the Module View Panel, the relevant YAML file will be shown for edit

### Fixed
- Fixed "Create Module Project File" message not being dismissed after a module project file was created.

## 1.0.10

### Added
- `module-pagebreaks` attribute in front-matter for automatic pagebreaks specifically for EncounterPlus output.
- `pdf-pagebreaks` attribute in front-matter for automatic pagebreaks specifically for PDF output.
- `order` attribute in page front-matter to specify the ordering of pages
- Can now add a `Group.yaml` for group settings (like `name`, `slug`, and `order`)
- New Styles:
  - BlockQuotes
    - paper
    - flowchart, and flowchart-with-link
  - Images
    - float-left
    - float-right
  - Tables
    - neutral (table color)
    - shop (table style)
    - shopH1 (row style)
    - shopH2 (row style)

### Changed
- Visual Studio Extension engine target is now 1.45 for compatibiltiy with Coder

### Breaking
- Table style `.statblock` is now `.sidebar`
- `pagebreak` must now be specified as either `module-pagebreaks` or `pdf-pagebreaks`
- `module.json` changed to `Module.yaml` to be consistent with page front-matter. Format changed from JSON to YAML for easier human-readability.

## 1.0.9

### Added
- "print-only" attribute for items that should only appear in PDF export.
- "screen-only" attribute for items that should only appear in EncounterPlus

### Fixed
- Standalone app could not download chromium rendering engine

## 1.0.8

### Added
- Export to PDF capabilities
- Custom EncounterPlus views Visual Studio Code Extension
- Ability to detect and handle mutliple projects in a given folder

### Fixed
- Some elements overlapped with statblocks
- Size-cover images not working above first pagebreak when using heading pagebreaks

## 1.0.7

### Added
- Support for markdown-it-decorate attributes
- "Create Module.json" command.

### Changed
- Made page, group, and module IDs more deterministic in generation - based off the Module ID.

### Fixed
- Fixed heading underlines extending into stat blocks in preview


## 1.0.6

### Added
- Added statbock table style and additional table handling (column span, cell span, etc.)

### Fixed
- Improved handling of selection when using format toggles
- Improved detection of word selection on format toggles
- Fixed bug in group slug generation
- Fixed blockquote styling
- Fixed background image being broken again.


## 1.0.5
### Added
- Added Visual Studio Code Extension part of Module Packer
  - Previews markdown as it would appear in EncounterPlus
  - Can invoke module packer from Visual Studio Code
  - Adds tools for working with Markdown in Visual Studio Code
- Added support for setting Module properties via `module.json` file
- Added help button to Module Packer
- Added support for additional markdown syntax: underline, subscript, superscript, mark
- Added {.headerTitle}, {.green}, {.blue}, {.red}, {.yellow}, and {.gray} styles attributes for tables

### Changed
- `ModuleOutput` folder was renamed to `ModuleBuild`
- Codebase was changed to use typescript


## 0.9.3
### Added
- Support for image size attributes
- Allow drag-and-drop of module folder onto window


## 0.9.2
### Added
- Support for creating groups based on directories in Module folder
- Support for cover images on pages generated from pagebreaks

### Changed
- If pagebreaks are specified, but none are detected, a page will still be created
- Made module output generate in its own `ModuleOutput` folder rather than modifying contents of the original folder

### Fixed
- Fixed errors in font names in CSS style
- Fixed default page background image not rendering in some viewers