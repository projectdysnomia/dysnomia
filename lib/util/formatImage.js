const Constants = require("../Constants");
const Endpoints = require("../rest/Endpoints");

function formatImage(url, format, size, client) {
    if(!format || !Constants.ImageFormats.includes(format.toLowerCase())) {
        format = url.includes("/a_") ? "gif" : (client?.options.defaultImageFormat ?? Constants.DefaultClientOptions.defaultImageFormat);
    }
    if(!size || size < Constants.ImageSizeBoundaries.MINIMUM || size > Constants.ImageSizeBoundaries.MAXIMUM || (size & (size - 1))) {
        size = client?.options.defaultImageSize ?? Constants.DefaultClientOptions.defaultImageSize;
    }
    return `${Endpoints.CDN_URL}${url}.${format}?size=${size}`;
}

module.exports = formatImage;
