/* eslint-disable no-console */
/*jshint esversion: 8 */
const scriptUrl = new URL(document.currentScript.src);
const iconPickerUrl = scriptUrl.origin + scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/js') + 1);
const loadedDependencies = [];

const i18nMessages = {
    en: {
        all_icons: "All icons",
        all_label: "All",
        close_label: "Close",
        icon_picker: "Universal Icon Picker",
        insert_label: "Insert",
        search_label: "Search",
        search_placeholder: "Filter by name…"
    },
    fr: {
        all_icons: "Toutes les icônes",
        all_label: "Tout",
        close_label: "Fermer",
        icon_picker: "Sélecteur d’icônes universel",
        insert_label: "Insérer",
        search_label: "Rechercher",
        search_placeholder: "Filtrer par nom…"
    }
};

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory('UniversalIconPicker'));
    } else if (typeof exports === 'object') {
        module.exports = factory('UniversalIconPicker');
    } else {
        root['UniversalIconPicker'] = factory('UniversalIconPicker');
    }
}(this, function () {
    'use strict';

    const createDomEle = function (string) {
        const ele = document.createElement('div');
        ele.innerHTML = string;
        return ele.firstChild;
    };

    const debounce = function (func, wait, immediate) {
        let timeout;
        return function () {
            const context = this,
                args = arguments;
            const later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    const escapeHtml = function (text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#039;',
        };

        return text.replace(/[&<>"']/g, function (m) {
            return map[m];
        });
    };

    /**
     * Merge defaults with user options
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     */
    const extend = function (defaults, options) {
        let prop, extended = {};
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }

        return extended;
    };

    const getLibraryName = function (string) {
        return string.replace(/([A-Z])/g, ' $1');
    };

    /**
     * Plugin Object
     * @param selector The html selector to initialize
     * @param {Object} options User options
     * @constructor
     */
    function UniversalIconPicker(selector, options) {
        this.selector = selector;

        let defaults = {
            allowEmpty: true,
            iconLibraries: null,
            iconLibrariesCss: null,
            mode: 'autoload', // autoload | onrequest
            onBeforeOpen: null,
            onReset: null,
            onSelect: null,
            resetSelector: null,
            language: navigator.language || navigator.userLanguage,
            loadCustomCss: false
        };
        this.options = extend(defaults, options);

        this.activeLibraryId = '';
        this.filterIcon = '';
        this.iconEventsLoaded = false;
        this.iconLibraries = {};
        this.iconLibrariesLoaded = false;
        this.iconMarkup = '';
        this.iconWrap = '';
        this.idSuffix = '-' + this.selector.replace(/[#\s[\]="]/g, '');
        this.sideBarBtn = '';
        this.sideBarList = [];

        // Set language (force lowercase and remove country code if present, defaults to English if code is not found)
        let language = this.options.language.toLowerCase().split('-')[0].split('_')[0];
        if (language in i18nMessages) {
            this.messages = i18nMessages[language];
        } else {
            this.messages = i18nMessages["en"];
        }

        this.universalWrap = '<div class="uip-modal uip-open" id="uip-modal' + this.idSuffix + '"><div class="uip-modal--content"><div class="uip-modal--header"><div class="uip-modal--header-logo-area"><span class="uip-modal--header-logo-title">' + this.messages.icon_picker + '</span></div><div class="uip-modal--header-close-btn"><img src="' + (options.closeUrl || iconPickerUrl + '/images/xmark-solid.svg') + '" width="20" height="16" alt="' + this.messages.close_label + '" title="' + this.messages.close_label + '" /></div></div><div class="uip-modal--body"><div id="uip-modal--sidebar' + this.idSuffix + '" class="uip-modal--sidebar"><div class="uip-modal--sidebar-tabs"></div></div><div id="uip-modal--icon-preview-wrap' + this.idSuffix + '" class="uip-modal--icon-preview-wrap"><div class="uip-modal--icon-search"><input name="" value="" placeholder="' + this.messages.search_placeholder + '"><img src="' + (options.searchUrl || iconPickerUrl + '/images/magnifying-glass-solid.svg') + '" width="20" height="16" alt="' + this.messages.search_label + '" title="' + this.messages.search_label + '" /></div><div class="uip-modal--icon-preview-inner"><div id="uip-modal--icon-preview' + this.idSuffix + '" class="uip-modal--icon-preview"></div></div></div></div><div class="uip-modal--footer"><button class="uip-insert-icon-button">' + this.messages.insert_label + '</button></div></div></div>';

        this.universalDomEle = createDomEle(this.universalWrap);
        this.sidebarTabs = this.universalDomEle.querySelector('.uip-modal--sidebar-tabs');
        this.previewWrap = this.universalDomEle.querySelector('#uip-modal--icon-preview' + this.idSuffix);
        this.searchInput = this.universalDomEle.querySelector('.uip-modal--icon-search input');
        if (this.options.mode === 'autoload') {
            this.init();
        } else {
            document.querySelector(this.selector).addEventListener('click', this.init.bind(this), { once: true });
        }
    }


    // Plugin prototype
    UniversalIconPicker.prototype = {

        /* Public functions
        -------------------------------------------------- */

        init: function () {
            this._loadCssFiles();
            if (this.options.mode !== 'autoload') {
                this._onBeforeOpen().then(() => {
                    this.open();
                });
            }
            document.querySelector(this.selector).addEventListener('click', () => {
                this._onBeforeOpen().then(() => {
                    this.open();
                });
            });

            //Remove selected icon
            if (this.options.resetSelector) {
                document.querySelector(this.options.resetSelector).addEventListener('click', this.options.onReset);
            }
        },

        open: function () {
            this._loadIconLibraries().then(() => {
                this.iconLibrariesLoaded = true;
                if (!document.getElementById('uip-modal' + this.idSuffix)) {
                    //push universal dom to body
                    document.body.appendChild(this.universalDomEle);

                    //Icon library close by clicking close button
                    this.universalDomEle.querySelector('.uip-modal--header-close-btn').addEventListener('click', () => {
                        this.universalDomEle.classList.add('uip-close');
                        this.universalDomEle.classList.remove('uip-open');
                    });

                    //Insert button
                    this.universalDomEle.querySelector('.uip-insert-icon-button').addEventListener('click', () => {
                        let selected = this.universalDomEle.querySelector('.universal-selected');

                        if (selected) {
                            let iconHtml = selected.querySelector('i').outerHTML;
                            let jsonOutput = {
                                'libraryId': selected.dataset.libraryId,
                                'libraryName': selected.dataset.libraryName,
                                'iconHtml': null,
                                'iconMarkup': null,
                                'iconClass': null,
                                'iconText': null
                            };
                            if (!selected.querySelector('i').classList.value.match('uip-icon-none')) {
                                jsonOutput.iconHtml = iconHtml;
                                jsonOutput.iconMarkup = escapeHtml(iconHtml);
                                jsonOutput.iconClass = selected.querySelector('i').classList.value;
                                jsonOutput.iconText = selected.querySelector('i').innerText;
                            }

                            this.options.onSelect(jsonOutput);
                        }
                        this.universalDomEle.classList.add('uip-close');
                        this.universalDomEle.classList.remove('uip-open');
                    });
                } else {
                    //Icon library open if dom element exist
                    this.universalDomEle.classList.remove('uip-close');
                    this.universalDomEle.classList.add('uip-open');
                }

                if (!this.iconEventsLoaded) {
                    // selected icon highlighted by adding class
                    this.universalDomEle.querySelectorAll('.uip-icon-item').forEach((item) => {
                        item.addEventListener('click', (evt) => {
                            this.iconWrap.forEach((el) => {
                                el.classList.remove('universal-selected');
                            });
                            evt.currentTarget.classList.toggle('universal-selected');
                        });
                        item.addEventListener('dblclick', (evt) => {
                            this.universalDomEle.querySelector('.uip-insert-icon-button').click();
                        });
                    });
                    this.iconEventsLoaded = true;
                }

                this.universalDomEle.querySelector('.uip-modal--icon-search input').focus();
            });
        },

        setOptions: function (opts) {
            this.options = extend(this.options, opts);
            if (opts.iconLibrariesCss) {
                this._loadCssFiles();
            }
            if (opts.iconLibraries) {
                // dom icon events need to be reloaded
                this.iconEventsLoaded = false;
                this.iconLibrariesLoaded = false;
                this._resetIconAndSidebarList();
            }
        },

        /* Private functions
        -------------------------------------------------- */

        _clickHandlerFunc: function (e) {
            if (!e.currentTarget.classList.contains('universal-active')) {
                this.sideBarBtn.forEach(function (item) {
                    item.classList.remove('universal-active');
                });
                e.currentTarget.classList.add('universal-active');
            }
            this._sidebarFilterFunc(e.currentTarget.dataset['libraryId']);
        },

        _iconItemMarkup: function (libraryName, libraryItem) {
            let markup = '',
                library = libraryItem['icon-style'],
                prefix = libraryItem['prefix'];
            if (this.options.allowEmpty) {
                markup += '<div class="uip-icon-item" data-library-id="' + library + '" data-filter="" data-library-name="' + libraryName + '"><div class="uip-icon-item-inner"><i class="' + prefix + ' uip-icon-none">&nbsp;</i><div class="uip-icon-item-name" title="None">None</div></div></div>';
            }
            if (prefix.match(/^material-icons/)) {
                libraryItem['icons'].forEach(function (item) {
                    markup += '<div class="uip-icon-item" data-library-id="' + library + '" data-filter="' + item + '" data-library-name="' + libraryName + '"><div class="uip-icon-item-inner"><i class="' + prefix + '">' + item + '</i><div class="uip-icon-item-name" title="' + item + '">' + item.replace('-', ' ') + '</div></div></div>';
                });
            } else {
                libraryItem['icons'].forEach(function (item) {
                    markup += '<div class="uip-icon-item" data-library-id="' + library + '" data-filter="' + item + '" data-library-name="' + libraryName + '"><div class="uip-icon-item-inner"><i class="' + [prefix, item].join('') + '"></i><div class="uip-icon-item-name" title="' + item + '">' + item.replace('-', ' ') + '</div></div></div>';
                });
            }

            return markup;
        },

        _iconItemPush: function (arrayList) {
            this.previewWrap.innerHTML = '';
            arrayList.forEach((item) => {
                this.previewWrap.appendChild(item[1]);
            });
        },

        _loadCssFiles: function () {
            let link = document.createElement('link');
            if (!loadedDependencies.includes('universal-icon-picker.min.css') && !this.options.loadCustomCss) {
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = iconPickerUrl + 'stylesheets/universal-icon-picker.min.css';
                link.media = 'screen';
                document.head.appendChild(link);
                loadedDependencies.push('universal-icon-picker.min.css');
            }
            if (this.options.iconLibrariesCss) {
                this.options.iconLibrariesCss.forEach(cssFile => {
                    if (!loadedDependencies.includes(cssFile)) {
                        let cssFileLink = iconPickerUrl + 'stylesheets/' + cssFile;
                        if (cssFile.match(/^http|^\/\//)) {
                            cssFileLink = cssFile;
                        }
                        link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.type = 'text/css';
                        link.href = cssFileLink;
                        link.media = 'screen';
                        document.head.appendChild(link);
                        loadedDependencies.push(cssFile);
                    }
                });
            }
        },

        _loadIconLibraries: async function (i = 0) {
            if (!this.options.iconLibraries) {
                console.error('Universal icon picker - no icon library loaded');
                return false;
            }
            if (this.iconLibrariesLoaded) {
                return true;
            }
            if (i === 0 && this.options.iconLibraries.length > 1) {
                this.sideBarList.push({
                    "title": this.messages.all_icons,
                    'list-icon': '',
                    'library-id': 'all',
                    'prefix': '',
                });
            }

            let iconLibUrl = this.options.iconLibraries[i];
            let iconLib;
            if (iconLibUrl.includes('/')) {
                iconLib = /[^/]*$/.exec(iconLibUrl)[0];
                iconLib = /^[^.]*/.exec(iconLib)[0];
            } else {
                iconLibUrl = iconPickerUrl + 'icons-libraries/' + iconLibUrl;
                iconLib = iconLibUrl.substring(iconLibUrl.lastIndexOf('/') + 1);
            }

            await fetch(iconLibUrl)
                .then(response => response.json())
                .then(data => {
                    // Success!
                    const camelCasedIconLibrary = iconLib.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }).replace(/\.[a-z.]+$/, '');
                    let newLibrary = {};
                    newLibrary[camelCasedIconLibrary] = data;
                    Object.assign(this.iconLibraries, newLibrary);  // new icon library merge
                    if (i + 1 === this.options.iconLibraries.length) {
                        //set icon and sidebar list
                        this._setIconAndSidebarList();

                        this.activeLibraryId = this.sideBarList[0]['library-id'];

                        //sidebar list markup push
                        this.sidebarTabs.innerHTML = this._sideBarListMarkup(this.sideBarList);

                        //icon markup push
                        this.previewWrap.innerHTML = this.iconMarkup;

                        // get all icon wrapper dom element
                        this.iconWrap = this.previewWrap.querySelectorAll('.uip-icon-item');

                        //set event lisner to search input
                        this.searchInput.addEventListener('keyup', debounce(this._searchFunc, 100).bind(this), false);

                        //get all sidebar list item wrapper dom element
                        this.sideBarBtn = this.sidebarTabs.querySelectorAll('.uip-modal--sidebar-tab-item');

                        //set click event lisner to sidebar list item
                        this.sideBarBtn.forEach((item) => {
                            item.addEventListener('click', this._clickHandlerFunc.bind(this), false);
                        });

                        return true;
                    } else {
                        return this._loadIconLibraries(i + 1);
                    }
                }).catch((error) => {
                    console.log(error);
                    return error;
                });
        },

        _onBeforeOpen: async function () {
            if (typeof (this.options.onBeforeOpen) === 'function') {
                return this.options.onBeforeOpen();
            }
        },

        _resetIconAndSidebarList: function () {
            this.sideBarList = [];
            this.iconMarkup = '';
            this.iconLibraries = {};
            this.iconWrap = '';
            this.filterIcon = '';
            this.sideBarBtn = '';
            this.activeLibraryId = '';
        },

        _searchFunc: function (e) {
            // console.log(this.value.toLowerCase());

            const searchText = e.target.value.toLowerCase();
            this._searchFilterFunc(searchText, 'filter');

        },

        _searchFilterFunc: function (filterText, dataName) {
            this.filterIcon = Object.entries(this.iconWrap).filter((item) => {
                if (-1 === item[1].dataset[dataName].indexOf(filterText) || (this.activeLibraryId !== 'all' && item[1].dataset['libraryId'] !== this.activeLibraryId)) {
                    return false;
                }
                return true;
            });

            this._iconItemPush(this.filterIcon);

        },

        _setIconAndSidebarList: function () {
            for (const [libraryName, libraryContent] of Object.entries(this.iconLibraries)) {
                this._setSideBarList(libraryContent.verboseName || getLibraryName(libraryName), libraryContent);
                this._setIconMarkup(libraryName, libraryContent);
            }
        },

        _setIconMarkup: function (libraryName, libraryContent) {
            if (libraryContent.icons !== undefined) {
                this.iconMarkup += this._iconItemMarkup(libraryName, libraryContent);
            } else {
                Object.entries(libraryContent).forEach((item) => {
                    this.iconMarkup += this._iconItemMarkup(libraryName, item[1]);
                });
            }
        },

        _sidebarFilterFunc: function (filterText) {
            this.activeLibraryId = filterText;
            this.filterIcon = Object.entries(this.iconWrap).filter(function (item) {
                if ('all' === filterText || filterText === item[1].dataset['libraryId']) {
                    return true;
                }
                return false;
            });

            this._iconItemPush(this.filterIcon);

        },

        _setSideBarList: function (libraryName, libraryContent) {
            let listItem;
            if (libraryContent.icons !== undefined) {
                listItem = {
                    'title': libraryName,
                    'prefix': libraryContent['prefix'] !== undefined ? libraryContent['prefix'] : '',
                    'list-icon': libraryContent['list-icon'] !== undefined ? libraryContent['list-icon'] : '',
                    'library-id': libraryContent['icon-style'] !== undefined ? libraryContent['icon-style'] : 'all',
                };
                this.sideBarList.push(listItem);
            } else {
                Object.entries(libraryContent).forEach(item => {
                    listItem = {
                        'title': libraryName + ' - ' + item[0],
                        'prefix': item[1]['prefix'] !== undefined ? item[1]['prefix'] : '',
                        'list-icon': item[1]['list-icon'] !== undefined ? item[1]['list-icon'] : '',
                        'library-id': item[1]['icon-style'] !== undefined ? item[1]['icon-style'] : 'all',
                    };
                    this.sideBarList.push(listItem);
                });
            }
        },

        _sideBarListMarkup: function (sideBarList) {
            let markup = '';
            sideBarList.forEach((item) => {
                let activeClazz = '';
                if (item['library-id'] === this.activeLibraryId) {
                    activeClazz = ' universal-active';
                }
                if ('all' !== item['library-id']) {
                    let iconTag = '<i class="' + item['list-icon'] + '"></i>';
                    if (item['prefix'].match(/^material-icons/)) {
                        iconTag = '<i class="' + item['prefix'] + '">' + item['list-icon'] + '</i>';
                    }
                    markup += '<div class="uip-modal--sidebar-tab-item' + activeClazz + '" data-library-id="' + item['library-id'] + '">' + iconTag + item['title'] + '</div>';
                } else {
                    markup += '<div class="uip-modal--sidebar-tab-item' + activeClazz + '" data-library-id="' + item['library-id'] + '"><img src="' + (this.options.starUrl || iconPickerUrl + '/images/star-of-life-solid.svg') + '" width="13.125px" height="auto" alt="' + this.messages.all_label + '" title="' + this.messages.all_label + '" />' + item['title'] + '</div>';
                }
            });

            return markup;
        },
    };

    return UniversalIconPicker;
}));
