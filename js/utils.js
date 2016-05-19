/**
 * Returns the average color of the canvas.
 * @param  {Array} data     The data received by using the getTileColorData() method
 * @return {Object}         The object containing the RGB value
 * inspired from https://msdn.microsoft.com/en-us/library/jj203843(v=vs.85).aspx
 * inspired from http://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript
 */
function getAverageColor(data) {
  var i = -4,
      blocksize = 5,
      count = 0,
        rgb = {
          r: 0,
          g: 0,
          b: 0
        },
        length = data.length;

  while ((i += blocksize * 4) < length) {
    count++;
    rgb.r += data[i];
    rgb.g += data[i + 1];
    rgb.b += data[i + 2];
  }

  // floor the average values to give correct rgb values
  rgb.r = Math.floor(rgb.r / count);
  rgb.g = Math.floor(rgb.g / count);
  rgb.b = Math.floor(rgb.b / count);

  return rgb;
};

/**
* Returns an rgb(r,g,b) to a hexColor
* @param  {String} rgb     The comma seperated rgb values
* @return {String}         hex value
**/
function rgb2hex(rgb) {
  if (rgb.search('rgb') == -1) {
    return rgb;
  } else {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    function hex(x) {
      return ('0' + parseInt(x).toString(16)).slice(-2);
    }
    return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }
};
