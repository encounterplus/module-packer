## Controlling IDs

Every element (pages, groups, maps, and encounters) in a module for EncounterPlus has an `id` value, including the module itself. The same is true for compendium elements (items, spells, and monsters). AND, the module itself allows an `id` value to be specified. This ID is how EncounterPlus knows whether, when imported, your element will overwrite an existing element or whether it will create a new element.

When you use module-packer to create an element, the ID for any given element is a function of the element's slug and the module's ID. This means that every time you recompile your module you can expect a given page to have the same ID as it has last time as long as neither the module ID nor the page's slug changed.

So, for most cases, you want to follow these rules about specifying IDs:
- **DO** specify a [randomly generated ID](https://www.uuidgenerator.net) for your module itself (i.e., **DO** set the ID value in module.yaml).
- Do **NOT** specify an ID for any page, group, map, encounter, item, spell, or monster that you create.

The only time you would really stray from these guidelines is if you are intentionally trying to replace the element from another module or the built-in compendium. However, to do this, you will need to know the ID of the existing item (which will involve extracting a module/compendium export and reading the XML to find out the ID).

## Attribute Targeting

Usually, when writing content in a markdown file, adding a special attribute to an element on the page is as simple as placing the attribute(s) in curly braces after the element (e.g., `{.red}` to make a table/monster/item/etc. red-colored.)

However, sometimes it becomes ambiguous as to which item is attempting to be attributed. Take, for example, the following blockquote:

```Markdown
> "What is that smell?! Oh. Oh no. No, no, no! Gods no!" - **Percy**
{.flavortext}
```

One might think that they are applying the `flavortext` attribute to the entire blockquote. However, because the blockquote's text ended with a bolded element, that attribute is actually being applied to the bold element.

Luckily, there is a way to address this. The module-packer and the VS Code extension utilize the [markdown-it-decorate extension](https://github.com/stereoplegic/markdown-it-decorate) to allow targeting a specific element. Essentially, this allows you to say "apply this style to the most-recent blockquote". To do that, we would change our attribute to look like the following:

```Markdown
> "What is that smell?! Oh. Oh no. No, no, no! Gods no!" - **Percy**
<!--{blockquote:.flavortext}-->
```

The [markdown-it-decorate extension](https://github.com/stereoplegic/markdown-it-decorate) also allows another powerful feature: inline CSS styles. If you're inclined to set an inline-CSS style, you can do so like the following:

```Markdown
<!--{container:.two-column style="height: 350px"}-->
```

This example would apply the `two-column` class to the preceding div and apply an inline-style of setting the height to 350 pixels.

## Manually Nesting Pages or Groups

TODO

## Linking Pages

TODO

## Advanced Layouts

TODO

### Float Left/Right

TODO

### Wrap Text Around Images

TODO

### Multi-Column Content in Single-Column Pages

TODO

### Print-Only or Module-Only Items

TODO

### Hiding Footer Text

TODO

### Full Page Cover Images

TODO

## Running from the Command Line

TODO

## Splitting Monster Block Columns on Specific Properties

TODO