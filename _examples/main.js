requirejs.config({
  baseUrl: '../',
  paths: {
    jquery: '_examples/jquery'
  },
  shims: {
    'zerozclipboard': {
      exports: 'ZeroClipboard'
    }
  }
});

define(['jquery'], function ($) {
  var editor = UE.getEditor('ueditor');
  clearlocaldata = function(){
    var setkey = location.href.split(/[\?#]/)[0].replace('://', '_').replace( /[.:\/]/g, '_' ) + 'ueditor-drafts-data';
    if(setkey) {
      var root = JSON.parse(window.localStorage.ueditor_preference)
      delete root[setkey]
      window.localStorage.ueditor_preference = JSON.stringify(root)
    }
  }
})