# Change Log

## [Unreleased]

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