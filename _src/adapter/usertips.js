/**
 * 用 @ 提及用户
 */
UE.userTips = function(editor, options) {
    var userTips = UE.userTips;

    userTips.template = ''
    + '<div class="usertips">'
        + '<input type="text">'
        + '<div class="ut-info">想用 @ 提及谁？</div>'
        + '<ul class="ut-lists">'
            + '<li class="ut-user">用户1</li>'
        + '</ul>'
    + '</div>'

    //数据缓存
    userTips.history = {}

    userTips.getData = function(word) {
        return $.Deferred(function(dfd) {
            var history = userTips.history

            if (history[word||'_none']) {
                dfd.resolve(history[word||'_none'])
            } else {
                $.ajax({
                    url: editor.getOpt('userTipsUrl') || './server/usertips.php',
                    data: {
                        key: word
                    },
                    dataType: 'json',
                    type: "post"
                }).done(function(data) {
                    history[word||'_none'] = data
                    dfd.resolve(history[word||'_none'])
                }).fail(function(xhr, textStatus, errorThrown) {
                    dfd.reject('Network error', xhr, textStatus, errorThrown)
                })
            }
        }).promise()
    }

    userTips.show = function() {
        userTips.tips = userTips.tips || $(userTips.template);

        userTips.tips.css({
            zIndex: editor.getOpt('zIndex')
        });

        userTips.tips.appendTo('body').css(getCursorPosition())
            .on('click', function(e) {
                e.stopPropagation()
            })

        userTips.list = userTips.tips.find('.ut-lists').empty()
        userTips.input = userTips.tips.find('input')
        userTips.input.val('')

        setTimeout(function() {
            userTips.input.focus()
        }, 0)

        userTips.input.off().on('keyup', inputKeyupFn).on('keydown', inputKeydownFn).keyup()
        userTips.list.off().on('click', 'li', function() {
            var data = $(this).data();

            if (window.openDatabase) {
                lastRange.select(true); //修复 safari 的光标定位问题
            }

            editor.execCommand('insertHtml', data.name + '(' + data.id + ')&nbsp;')
            userTips.hide()
        }).on('mouseenter', 'li', function() {
            $(this).siblings().removeClass('active').end().addClass('active')
        })

        $(document).on('click', userTips.hide)
        editor.addListener('click', userTips.hide)
    }

    userTips.update = function() {
        var word = userTips.input.val()

        userTips.getData(word).done(function(data) {
            userTips.current = 0
            userTips.list.html(userTips.genList(data, word))
        })
    }

    userTips.genList = function(data, word) {

        var list = ''
        if (data != null) {
            for (var i = 0; i < data.length; i++) {
                var item = data[i],
                    name = item.uname.replace((new RegExp(word, 'ig')), function(word) {
                        return '<b>' + word + '</b>'
                    })

                list += '<li class="ut-user' + (i == 0 ? ' active' : '') + '" data-id="' + item.id + '" data-name="' + item.uname + '">' + name + '</li>'
            }
        }
        return list
    }

    userTips.hide = function() {
        userTips.tips.remove()
        $(document).off('click', userTips.hide)
        editor.removeListener('click', userTips.hide)
        editor.focus()
    }

    userTips.selectOffset = function(offset) {
        var list = userTips.list.find('li'),
            length = list.length

        userTips.current += offset
        while (userTips.current < 0) {
            userTips.current += length
        }
        userTips.current %= length

        list.removeClass('active')
            .eq(userTips.current).addClass('active')
    }

    $.extend(userTips, options)

    var inputKeyupFn = function(event) {
        switch (event.which) {
            case 13: //Enter
                break;
            case 38: //Up
                break;
            case 40: //Down
                break;
            default:
                userTips.update()
        }
    }

    var inputKeydownFn = function(event) {
        switch (event.which) {
            case 13: //Enter
                event.preventDefault()
                userTips.list.find('.active').click()
                break;
            case 8: //Backspace
                if (!userTips.input.val().length) {
                    event.preventDefault();
                    userTips.hide()
                }
                break;
            case 27: //Esc
                userTips.hide()
                break;
            case 38: //Up
                userTips.selectOffset(-1)
                break;
            case 40: //Down
                userTips.selectOffset(1)
                break;
        }
    }

    var editorKeyupFn = function(type, event) {
        var me = this,
            show = false,
            range = me.selection.getRange();

        if (type == 'usertips') {
            show = true
        } else if (type == 'keyup' && event.keyCode == 50 && (range.startContainer.nodeValue || range.startContainer.innerText).charAt(range.startOffset - 1) == '@') {
            show = true
        } else if (type == 'keypress' && String.fromCharCode(event.keyCode) == '@') {
            show = true
        }

        setTimeout(function() {
            show && userTips.show()
        }, 200)
    }
    var lastRange;
    var getCursorPosition = function() {
        var range = editor.selection.getRange(),
            container = range.startContainer,
            shadowId = 'usertip-cursor-shadow',
            shadow, offset, shadowOffset, iframeOffset
        container = container.nodeType == 1 ? container : container.parentNode
        editor.execCommand('insertHtml', '<span id="' + shadowId + '"> <span>')
        shadow = $(container).find('#' + shadowId)

        lastRange = range;
        shadowOffset = shadow.offset()
        iframeOffset = $(editor.iframe).offset()
        offset = {
            top: shadowOffset.top + iframeOffset.top,
            left: shadowOffset.left + iframeOffset.left
        }

        shadow.remove()

        return offset
    }

    editor.addListener('focus blur', function(type) {
        if (type == 'focus') {
            editor.addListener('keyup keypress', editorKeyupFn)
        } else if (type == 'blur') {
            editor.removeListener('keyup keypress', editorKeyupFn)
        }
    })

    editor.addListener('usertips', editorKeyupFn)

}


UE.registerUI('usertips', function(editor, uiName) {
    //注册按钮执行时的command命令，使用命令默认就会带有回退操作
    editor.registerCommand(uiName, {
        execCommand: function() {
            this.execCommand('insertHtml', '@')
            var me = this
            setTimeout(function() {
                me.fireEvent('usertips')
            }, 100)

        }
    });
    //创建一个button
    var btn = new UE.ui.Button({
        //按钮的名字
        name: uiName,
        //提示
        title: '用 @ 提及他人',
        //添加额外样式，指定icon图标，这里默认使用一个重复的icon
        cssRules: 'background-position: -340px 0;',
        //点击时执行的命令
        onclick: function() {
            //这里可以不用执行命令,做你自己的操作也可
            editor.execCommand(uiName);
        }
    });

    UE.userTips(editor);

    //使用草稿
    setTimeout(function() {
        if (!editor.getOpt('useDraft')) return;

        var localData = editor.execCommand('getlocaldata'),
            content = $.trim(editor.getContentTxt());
        if (localData && !content) {
            editor.setContent(localData);
        }
    }, 500)

    //因为你是添加button,所以需要返回这个button
    return btn;
});
