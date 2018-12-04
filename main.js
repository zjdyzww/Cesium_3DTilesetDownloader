var fs = require('fs');
const url = require('url');
var request = require('request');
var defined = require('./defined');
var DownLoader = require('./Downloader');

var path = "E:/CesiumData";

var basePath = "http://explore.construkted.com/3DTilesets/11294";
console.log("basePath = " + basePath);

var baseUrl = url.parse(basePath);

var tilesetUrl = baseUrl.protocol + "//" + baseUrl.host +  baseUrl.pathname + "/" + "tileset.json";

if(baseUrl.search)
    tilesetUrl = tilesetUrl + baseUrl.search;

console.log("tilesetUrl = " + tilesetUrl);

var options = {
    url: tilesetUrl,
    gzip: true // note that tileset.json is compressed in gzip format.
};

var timeout = 2000; // 1s

/*
 first download tileset.json.
 */
request(options, function(err, res, body) {
    // from direct network
    var tilesetJson = JSON.parse(body);

    var asset = tilesetJson.asset;

    if(!defined(asset)) {
        console.error("asset is no defined!");
        return;
    }

    if (asset.version !== '0.0' && asset.version !== '1.0') {
        console.error('The tileset must be 3D Tiles version 0.0 or 1.0.  See https://github.com/AnalyticalGraphicsInc/3d-tiles#spec-status');
        return;
    }

    // Append the tileset version to the basePath
    var hasVersionQuery = /[?&]v=/.test(tilesetUrl);

    if (!hasVersionQuery && asset.tilesetVersion) {
        var versionQuery = '?v=' + asset.tilesetVersion;

        basePath = basePath + "&" + versionQuery;
        tilesetUrl = tilesetUrl + "&" + tilesetUrl;
    }

    var stack = [];

    stack.push({
        header : tilesetJson.root
    });

    var contentUrl = "";

    var infoList = [];

    // first prepare root tile content
    var urlObject = url.parse(basePath);

    if(tilesetJson.root.content) {
        urlObject.pathname = urlObject.pathname + "/" + tilesetJson.root.content.url;

        contentUrl = urlObject.protocol + "//" + urlObject.host +  urlObject.pathname

        if(urlObject.search)
            contentUrl = contentUrl + urlObject.search;

        var filename = path + "/" + tilesetJson.root.content.url;

        infoList.push({
            url: contentUrl,
            filename: filename
        });
    }

    while (stack.length > 0) {
        var tile = stack.pop();

        var children = tile.header.children;

        if (defined(children)) {
            var length = children.length;

            for (var i = 0; i < length; ++i) {
                var childHeader = children[i];

                urlObject = url.parse(basePath);

                // I am not sure what is correct url or uri
                // var subPath = childHeader.content.url;
                var subPath = childHeader.content.uri;

                contentUrl = urlObject.href + "/" + subPath;

                if(urlObject.search)
                    contentUrl = contentUrl + urlObject.search;

                filename = path + "/" + subPath;

                infoList.push({
                    url: contentUrl,
                    filename: filename
                });

                stack.push({
                    header : childHeader
                });
            }
        }
    }

    DownLoader.recursivelyDownload(infoList, infoList.length, timeout);
});


