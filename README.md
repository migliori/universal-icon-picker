
# Universal Icon Picker

![Language: Vanilla JS](https://img.shields.io/badge/-vanilla%20js-555?logo=JavaScript)
![Dependencies: none](https://img.shields.io/badge/dependencies-none-04B54E)
![GitHub file size in bytes](https://img.shields.io/github/size/migliori/universal-icon-picker/assets/js/universal-icon-picker.min.js)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html)

Nice small Javascript **Icon Picker for any icon library**

*Vanilla Javascript* - *No dependency* - *2.6ko gzipped*

Originally forked from [aesthetic-icon-picker](https://github.com/sh-sabbir/aesthetic-icon-picker/tree/20d6aa6134311b44891809cc852dbf247a029495)

## Demo

[https://universal-icon-picker.miglisoft.com](https://universal-icon-picker.miglisoft.com)

## Features

- Load any icon library from a single JSON file
- Load the icon fonts stylesheets from local files or CDNs
- Autoload the icon fonts (JSON + stylesheets) or load them only on request
- Add as many icon libraries as you like to each instance of the plugin
- Create multiple instances and triggers on the same page
- Change the icon libraries attached to an instance whenever you want
- Group icons of the same family by categories
- Load one or more styles from the same icon family individually
- Search / Filter icons
- Built-in `onSelect()` and `onReset()` callback functions
- Attach the Icon Picker to any HTML element
- Add your favourite icon libraries very easily

## Integrated icon libraries

### Font Awesome

- All
- Solid
- Regular
- Brands

### Material Icons

- Filled
- Outlined
- Round
- Sharp
- Two-tone

### Other icon libraries

- Bootstrap Icons
- Elegant Icons
- Feather Icons
- Fomantic UI Icons
- Foundation Icons
- Happy Icons
- Icomoon
- Open-iconic
- Tabler Icons
- Weather Icons
- Zondicons

## Installation

Clone / download or install with npm

```bash
  npm install @migliori/universal-icon-picker@1.1.6
```

## Usage/Examples

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body>
    <button id="selector" title="Open the icon picker">Click to open</button>
    <script src="universal-icon-picker/assets/js/universal-icon-picker.min.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function(event) {
            var uip = new UniversalIconPicker('#selector', options);
        });
    </script>

</body>

</html>
```

## Options

| option           | type       | value                                                                                                                                  |
|------------------|------------|----------------------------------------------------------------------------------------------------------------------------------------|
| allowEmpty       | *Boolean*  | Add an empty icon selector in the beginning of each icon list.<br />Default: true                                                      |
| iconLibraries    | *Array*    | Array of JSON icon libraries in `assets/icons-libraries`.<br />Default: `null`                                                         |
| iconLibrariesCss | *Array*    | Array of CSS icon libraries in `assets/stylesheets` or from any CDN. Leave empty if your page already loads them.<br />Default: `null` |
| mode             | *String*   | `'autoload'` or `'onrequest'`. Default: `'autoload'`                                                                                   |
| onReset          | *Function* | Callback function when the user clicks the `reset` button.<br />Default: `null`                                                        |
| onSelect         | *Function* | Callback function when the user clicks the `insert` button.<br />Default: `null`                                                       |
| resetSelector    | *String*   | Selector for the HTML *reset* button on your page.<br />Default: `null`                                                                |
| loadCustomCss    | *Boolean*  | If true, universal icon picker does **not** load its own css allowing for custom css. Default: `false`                                 |
## Configuring loaded assets

Universtal icon picker will retrieve some assets from the server based on where ths script itself was retrieved from (`assets/js/universal-icon-picker.min.js`) :

1. Icons from the `assets/images`folder
2. Icon library json files from the `assets/icon-libraries` folder

Also, the naming of the library names in the sidebar is derived from their file name in `assets/icon-libraries`.

In most cases this will just work fine. For some installations, however, you need to adjust the exact paths from where to retrieve those assets.

### Configuring icon assets

Three option settings overwrite the paths for the three icons used:

| option           | type     | value                                                |
|------------------|----------|------------------------------------------------------|
| closeUrl         | *String* | Path of the close button icon (some type of "x")     |
| starUrl          | *String* | Path of the star icon for the side bar               |
| searchUrl        | *String* | Path of the magnifying glass icon for the search bar |

### Configuring library assets

Library assets are defined by `iconLibraries`. If the library does include a slash (`/`) it is assumed to be an URL or path of the library's json file. If it does not include a slash the library is searched for in the `assets/icon-libraries` folder.



### Example

```javascript
const options = {
    iconLibraries: [
        'happy-icons.min.json',
        'font-awesome.min.json'
    ],
    iconLibrariesCss: [
        'happy-icons.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    resetSelector: '#uip-reset-btn',
    onSelect: function(jsonIconData) {
        document.getElementById('output-icon').innerHTML = jsonIconData.iconMarkup;

        console.log(jsonIconData);
        /* will output something like:
        {
            "libraryId": "fa-solid",
            "libraryName": "fontAwesome",
            "iconHtml": "<i class=\"fa-solid fa-oil-can\"></i>",
            "iconMarkup": "&lt;i class=&quot;fa-solid fa-oil-can&quot;&gt;&lt;/i&gt;",
            "iconClass": "fa-solid fa-oil-can",
            "iconText": ""
        }
        */
    },
    onReset: function() {
        document.getElementById('output-icon').innerHTML = '';
    }
}

// Instanciate the Icon Picker
var uip = new UniversalIconPicker('#selector', options);
```

See the source code of the [demo](https://universal-icon-picker.miglisoft.com) for more examples

## Public methods

- ### setOptions(options)

  Update the *options* of an Icon Picker instance

  Example:

  ```javascript
    // Instanciate the Icon Picker

  var uip = new UniversalIconPicker('#selector', options);

  // later, change the icon libraries
  uip.setOptions({
      iconLibraries: ['weather-icons.min.json'],
      iconLibrariesCss: ['weather-icons.min.css']
  });

  ```

  Live demo: [https://universal-icon-picker.miglisoft.com/demo/demo-4.html](https://universal-icon-picker.miglisoft.com/demo/demo-4.html)

## Change / Upgrade Fontawesome version & icons

A built-in tool is provided to get the Fontawesome icon list from the Fontawesome API and for Bootstrap icons to scrape the Bootstrap icon list from their website.

To choose the Fontawesome version:

1. open `tools/fontawesome-icons-list.html` in your code editor and change the version number:

    ```html
    // set the fontawesome version version here
    const fontawesomeVersion = '6.0.0';
    ```

2. open it in your browser to retrieve the JSON list

3. save the complete list in `assets/icon-libraries/font-awesome.json` and each style (brands, regular, solid) in the appropriate json file (`assets/icon-libraries/font-awesome-brands.json`, ...)

4. minify the json files to `.min.json`

For Bootstrap icons use `tools/bootstrap-icons-list.html`. It scrapes the latest version from the website. You will need to add the version number manually to the generated json file.

## Screenshots

![Universal Icon Picker Screenshot](https://universal-icon-picker.miglisoft.com/demo/assets/images/screenshot.png)

## Contributing

Contributions are always welcome!

Please contact us for any improvement suggestions or send your pull requests

## Changelog

2022/02/23

- First release
- fix icon selections when changing the icon library programatically with setOptions()
- update README

2022/02/26

- detect absolute css urls starting without protocol ; ie: '//domain.com/my-font.css'
- allow more complex trigger button selectors ; ie: '#div button["name=iconpicker-opener"]'
- add the "onBeforeOpen" option
- add the "onBeforeOpen" demo (demo 5)

2022/11/18

- update npm package

2023/02/09

- add Fomantic UI icons

2023/03/09

- add loadCustomCss option
- Double click inserts icon


## License

[MIT](https://choosealicense.com/licenses/mit/)

## Credits

Thanks to Sabbir for his [Aesthetic Icon Picker](https://github.com/sh-sabbir/aesthetic-icon-picker/tree/20d6aa6134311b44891809cc852dbf247a029495), which gave me a clean & strong base code for this project.
