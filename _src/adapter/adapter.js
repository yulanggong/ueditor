/**
 * @file adapter.js
 * @desc adapt ui to editor
 * @import core/Editor.js, core/utils.js
 */

(function () {
    var _editorUI = {},
        _editors = {};

    function parseData(data, editor) {
        $.each(data, function (i, v) {
            if (v.label) {
                if (v.data) {
                    parseData(v.data, editor);
                } else {
                    if ($.type(v.exec) == 'string') {
                        var command = v.exec;
                        v.exec = function () {
                            editor.execCommand(command)
                        };
                        if (!v.query) {
                            v.query = function () {
                                editor.queryCommandState(command)
                            }
                        }
                    } else {
                        var fn = v.exec;
                        v.exec = $.proxy(fn, null, editor, v);
                        var queryfn = v.query;
                        v.query = $.proxy(queryfn, null, editor, v);
                    }
                }

            }
        });
        return data;
    }

    utils.extend(UE, {
        registerUI: function (name, fn) {
            utils.each(name.split(/\s+/), function (uiname) {
                _editorUI[uiname] = fn;
            })
        },
        getActiveEditor: function () {
            var ac;
            utils.each(UE.instants, function (editor) {
                if (editor.selection.isFocus()) {
                    ac = editor;
                    return false;
                }
            });
            return ac;
        },
        getEditor: function (id, options) {
            return _editors[id] || (_editors[id] = this.createEditor(id, options));

        },
        createEditor: function (id, opt) {
            var editor = new UE.Editor(opt);
            var $container = this.createUI('#' + id, editor);
            editor.ready(function(){
                this.addListener('click',function(){
                    $container.find('.dropdown-menu').each(function(){
                        $(this).edui().hide()
                    })
                })
            });
            editor.render(id);
            $container.css({
                width: $(editor.iframe).width()
            });
            editor.container = $container.get();

        },
        createUI: function (id, editor) {
            var $editorCont = $(id),
                $container = $('<div class="edui-container"><div class="editor-body"></div></div>').insertBefore($editorCont);
            $container.find('.editor-body').append($editorCont).before(this.createToolbar(editor.options, editor));
            return $container;
        },
        createToolbar: function (options, editor) {
            var $toolbar = $.eduitoolbar(), toolbar = $toolbar.edui();
            //创建下来菜单列表

            if (options.menulist) {
                $.each(options.menulist, function (i, v) {
                    $.eduicontextmenu(parseData(v.data, editor)).edui().attachTo(toolbar.appendToTextmenu(toolbar.createTextItem(v.label)));
                })
            } else {
                $toolbar.find('.text-toolbar').remove()
            }

            if (options.toolbar) {
                $.each(options.toolbar,function(i,group){

                })

            } else {
                $toolbar.find('.btn-toolbar').remove()
            }
            return $toolbar;
        }

    })


})();


