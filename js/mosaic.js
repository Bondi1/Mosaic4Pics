// Constants shared between client and server.

var TILE_WIDTH = 16;
var TILE_HEIGHT = 16;
var TEST_ENV = false;

var exports = exports || null;
if (exports) {
  exports.TILE_WIDTH = TILE_WIDTH;
  exports.TILE_HEIGHT = TILE_HEIGHT;
  exports.TEST_ENV = TEST_ENV;
}

'use-strict';
var window = {};
window.Mosaic = Mosaic;
Mosaic.tileArray = {}; // 2d array to store the hex colors for each tile
Mosaic.rowsCompleted = {}; // array to store display staus of each row

function Mosaic(properties) {
  if (!properties.image) {
    throw new Error('input image is not passed');
  }
  if (!properties.targetElement) {
    throw new Error('targetElement is not passed in properties');
  }
  this.properties = this.extend(this.defaults, properties);

  if (this.properties.image.complete) {
    try {
      this.processInputImg();

      // get the context
      var context = this.renderImage();

      // process the first row
      processRow(0, context);
    }
    catch (err) {
      console.log(err);
      document.getElementById('Message').innerHTML = 'Oops! please ensure the server is running and access http://server_ip:server_port' + '<br/>' +
       '<a href=http://127.0.0.1:8765>Example: local server </a>' + '<br/>' + err;
    }
  }
}

/**
 * Extends a Javascript Object
 * @param  {object} destination The object in which the final extended values are saved
 * @param  {object} sources     The object to be extended
 * @return {}
 */
Mosaic.prototype.extend = function(destination, sources) {
  for (var source in sources) {
    if (sources.hasOwnProperty(source)) {
      destination[source] = sources[source];
    }
  }
  return destination;
};

/**
 * Process the input image
 * And break it up into rows and columns
 */
Mosaic.prototype.processInputImg = function() {
  // calculating the number of tile columns and tile rows
  this.properties.divX = Math.floor(this.properties.width / this.properties.tileWidth);
  this.properties.divY = Math.floor(this.properties.height / this.properties.tileHeight);

  // initialize arrays with number of rows and columns
  Mosaic.tileArray = new Array(this.properties.divY);
  Mosaic.rowsCompleted = new Array(this.properties.divY);
  for (var i = 0; i < this.properties.divY; i++) {
    Mosaic.tileArray[i] = new Array(this.properties.divX); // array of arrays
    Mosaic.rowsCompleted[i] = false; // initially no rows are complete
  };

  // the outer parent targetSvgImage needs to be responsive to the browser dimensions
  var parentSvgImg = document.getElementById('targetSvgImage');
  parentSvgImg.setAttribute('viewBox', '0 0 ' + this.properties.width  + ' ' + this.properties.height);
};

/**
 * The defaults properties object
 * @type {Object}
 */
Mosaic.prototype.defaults = {
  'image': null,
  'tileWidth': TILE_WIDTH,
  'tileHeight': TILE_HEIGHT,
  'targetElement': null,
  'tileShape': 'circle',
  'opacity': 1,
  'width': null,
  'height': null
};

/**
 * Renders the image on a canvas and gets its context
 * @return {object} Context of the canvas created
 */
Mosaic.prototype.renderImage = function() {
  var properties = this.properties;
  var canvas = document.createElement('canvas');

  canvas.width = properties.tileWidth * properties.divX;
  canvas.height = properties.tileHeight * properties.divY;

  var context = canvas.getContext('2d');
  context.drawImage(properties.image, 0, 0, canvas.width, canvas.height);
  return context;
};
