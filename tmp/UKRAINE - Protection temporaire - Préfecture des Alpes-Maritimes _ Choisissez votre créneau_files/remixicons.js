Quasar.iconSet.set( {
    name: 'remix-icons',
    type: {
        positive: 'ri-check-line',
        negative: 'ri-alert-line',
        info: 'ri-information-line',
        warning: 'ri-error-warning-line'
    },
    arrow: {
        up: 'ri-arrow-up-s-line',
        right: 'ri-arrow-right-s-line',
        down: 'ri-arrow-down-s-line',
        left: 'ri-arrow-left-s-line',
        dropdown: 'ri-arrow-drop-down-line'
    },
    chevron: {
        left: 'ri-arrow-drop-left-line',
        right: 'ri-arrow-drop-right-line'
    },
    colorPicker: {
        spectrum: 'ri-eye-line',
        tune: 'ri-equalizer-line',
        palette: 'ri-palette-line'
    },
    pullToRefresh: {
        icon: 'ri-refresh-line'
    },
    carousel: {
        left: 'ri-arrow-left-s-line',
        right: 'ri-arrow-right-s-line',
        up: 'ri-arrow-up-s-line',
        down: 'ri-arrow-down-s-line',
        navigationIcon: 'ri-checkbox-blank-circle-fill'
    },
    chip: {
        remove: 'ri-close-line',
        selected: 'ri-check-line'
    },
    datetime: {
        arrowLeft: 'ri-arrow-drop-left-line',
        arrowRight: 'ri-arrow-drop-right-line',
        now: 'ri-time-line',
        today: 'ri-map-pin-time'
    },
    editor: {
        bold: 'ri-bold',
        italic: 'ri-italic',
        strikethrough: 'ri-strikethrough',
        underline: 'ri-underline',
        unorderedList: 'ri-list-unordered',
        orderedList: 'ri-list-ordered',
        subscript: 'ri-subscript',
        superscript: 'ri-superscript-2',
        hyperlink: 'ri-link',
        toggleFullscreen: 'ri-fullscreen',
        quote: 'ri-double-quotes-r',
        left: 'ri-align-left',
        center: 'ri-align-center',
        right: 'ri-align-right',
        justify: 'ri-align-justify',
        print: 'ri-printer-line',
        outdent: 'ri-indent-decrease',
        indent: 'ri-indent-increase',
        removeFormat: 'ri-eraser',
        formatting: 'ri-h-1',
        fontSize: 'ri-font-size',
        align: 'ri-align-left',
        hr: 'ri-checkbox-indeterminate-line',
        undo: 'ri-arrow-go-back-line',
        redo: 'ri-arrow-go-forward-line',
        heading: 'ri-h-1',
        code: 'ri-code-view',
        size: 'ri-text-size',
        font: 'ri-text',
        viewSource: 'ri-code-view'
    },
    expansionItem: {
        icon: 'ri-arrow-drop-down-line',
        denseIcon: 'ri-arrow-drop-down-fill'
    },
    fab: {
        icon: 'ri-add-line',
        activeIcon: 'ri-close-line'
    },
    field: {
        clear: 'ri-close-circle-line',
        error: 'ri-error-warning-line'
    },
    pagination: {
        first: 'ri-skip-back-line',
        prev: 'ri-arrow-left-s-line',
        next: 'ri-arrow-right-s-line',
        last: 'ri-skip-forward-line'
    },
    rating: {
        icon: 'ri-star-line'
    },
    stepper: {
        done: 'ri-check-double-line',
        active: 'ri-pencil-line',
        error: 'ri-error-warning-line'
    },
    tabs: {
        left: 'ri-arrow-left-s-line',
        right: 'ri-arrow-right-s-line',
        up: 'ri-arrow-up-s-line',
        down: 'ri-arrow-down-s-line'
    },
    table: {
        arrowUp: 'ri-arrow-up-line',
        warning: 'ri-error-warning-line',
        firstPage: 'ri-skip-back-line',
        prevPage: 'ri-arrow-left-s-line',
        nextPage: 'ri-arrow-right-s-line',
        lastPage: 'ri-skip-forward-line',
		filterFull: 'ri-filter-fill'
    },
    tree: {
        icon: 'ri-play-line'
    },
    uploader: {
        done: 'ri-delete-bin-2-fill',
        clear: 'ri-close-line',
        add: 'ri-add-box-line',
        upload: 'ri-upload-2-line',
        removeQueue: 'ri-clear-line',
        removeUploaded: 'ri-eraser-line'
    }
});

Quasar.iconSet.iconMapFn = function(iconName) {
    if (iconName.startsWith('ri-') === true) {
        return {
            cls: iconName,
            content : ' '
        }
    }
};
