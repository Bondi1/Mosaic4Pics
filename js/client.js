/**
 * Based on the event of Image Selection, reads the image file and creates Mosaic object
 * @param  {Event} evt     Image Selection
 */
var selectFile = function(evt) {
  var selectedFile = evt.target.files[0]; // FileList object

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = function(theFile) {
      // get the selectedFile and assign it to the element
      var img = document.getElementById('selectedImage');
      img.src = reader.result;

      // Create the Mosaic with a number of options
      if(img.src != "" && img.src != null){
       var mosaic = new Mosaic({
            image: img,
            targetElement: document.getElementById('targetSvgImage'),
            width: img.width,
            height: img.height,
            tileWidth: TILE_WIDTH,
            tileHeight: TILE_HEIGHT
        });
      }
    }
    // Read in the image file as a data URL.
    if (selectedFile && selectedFile.type.match('image.*')) {
      reader.readAsDataURL(selectedFile);
    }
}

var fileElement = document.getElementById('input_file');
if(fileElement){
  fileElement.addEventListener('change', selectFile, false);
}

/**
 * Process a single row from the input image
 * @return {object} Context of the canvas created
 */
function processRow(rowNum, context) {
  var width = context.canvas.width;
  // CanvasRenderingContext2D.getImageData returns ImageData,an object providing
  // a Uint8ClampedArray, representing a one-dimensional array containing the data in the RGBA order
  // So, size of contextImageData = canvas.width * canvas.height * 4
  var contextImageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  // For the given row traverse through the columns and process each tile
  // defaults has the number of tiles in a row from extend()
  for (var j = 0; j < Mosaic.prototype.defaults.divX; j++) {
      // get the tile co-ordinates
      var x = j * Mosaic.prototype.defaults.tileWidth,
          y = rowNum * Mosaic.prototype.defaults.tileHeight;
      // extract the sub-array from the contextImageData for the given tile's colored data
      var tileColorDataArr = getTileColorData(x, y, width, contextImageData);
      // get the object for the average color of the tile
      var averageColor = getAverageColor(tileColorDataArr);
      // format to rgba() to get the hex color
      var color = 'rgba(' + averageColor.r + ',' + averageColor.g + ',' + averageColor.b  + ')';
      var hexColor = rgb2hex(color);

      // Parallellism at work!
      // Use workers and get an SVG from the server for each tile,
      // So that all the workers can be run in parallel
      if( !window.Worker ){ //check for support
        // Assuming here that if web workers are not supported, no point in continuing.
        // But if need be it should be pretty straight forward to create a non-web worker
        // implementation of the below functionality.
        console.log('Web workers not supported on this browser');
        throw new Error('Incompatible browser. Please contact support');
      }
      var worker = new Worker("js/worker.js");

      // Watch for messages from the worker
      worker.onmessage = function(e){
        // The message from the client:
        var respValue = e.data;
        if(respValue != undefined && respValue != ''){
          var outputJson = JSON.parse(respValue);
          if( outputJson == undefined ||
            outputJson["columnNum"] == undefined ||
            outputJson["StatusMsg"] == undefined ){
            console.log('Error while parsing the JSON response - rowNum:' +  rowNum);
            throw new Error("Invalid response while getting the svg tile.");
          }

          var statusMsg = outputJson["StatusMsg"];
          var colNum = outputJson["columnNum"];
          if( statusMsg != "OK" ){
            console.log(statusMsg + '- rowNum:' +  rowNum + ', colNum:' + colNum);
            throw new Error("Invalid response while getting the svg tile.");
          }

          var outputResponse = outputJson["svg"];
          // Store the response svg element in the tileArray
          Mosaic.tileArray[rowNum][colNum] = outputResponse;
          // Function to check if all the tiles in a row are populated
          areAllRowTilesPopulated(rowNum, context);
        }
        else {
          console.log('Invalid JSON response - rowNum:' +  rowNum);
          throw new Error("Invalid response while getting the svg tile.");
        }
      };

      worker.onerror = function(error) {
        console.log('Worker error [rowNum:' +  rowNum + '] - ' + error.message );
        throw new Error("Error while getting the svg tile.");
      };

      // Need to send the complete URL to the worker as the 'document' is not available for it.
      var url = document.URL + 'color/' + hexColor;
      // We need to preserve the column number associated with the particular worker, as there can be
      // quite a few of them at a time. So using a JSON to send multiple inputs to the worker.
      worker.postMessage('{ "columnNum" : ' + j + ',' + '"url" :"' + url + '"}');
  }
}


/**
 * Creates an array of the color data of the tile from the data of whole image
 * @param  {number} startX            x coordinate of the tile
 * @param  {number} startY            y coordinate of the tile
 * @param  {number} width             width of the canvas
 * @param  {object} contextImageData imageData of the whole canvas
 * @return {array}                    Image data of a tile
 * inspired from https://msdn.microsoft.com/en-us/library/jj203843(v=vs.85).aspx
 * inspired from http://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript
 */
var getTileColorData = function (startX, startY, width, contextImageData) {
  var data = []; // tile array with r, g, b, a
  var tileWidth = Mosaic.prototype.defaults.tileWidth;
  var tileHeight = Mosaic.prototype.defaults.tileHeight;
  for (var x = startX; x < (startX + tileWidth); x++) {
      var xPos = x * 4;
      for (var y = startY; y < (startY + tileHeight); y++) {
          var yPos = y * width * 4;
          // get the pixel's index on the contextImageData array
          // push the next four values (r,g,b,a) into data array
          data.push(
            contextImageData.data[xPos + yPos + 0],
            contextImageData.data[xPos + yPos + 1],
            contextImageData.data[xPos + yPos + 2],
            contextImageData.data[xPos + yPos + 3]
          );
      }
  }
  return data;
};

/**
 * Call drawImage only when all the svg elements in a row are available
 * @param  rowNum row number to check if it is populated
 * @param  context argument for the function drawImage
 */
var areAllRowTilesPopulated = function(rowNum, context){
 if(Mosaic.rowsCompleted[rowNum] == true)
    return;

  var thisRowPopulated = true;
  for (var j = 0; j < Mosaic.prototype.defaults.divX; j++) {
    if(Mosaic.tileArray[rowNum][j] == undefined){
      thisRowPopulated = false;
    }
  }
  // call drawImage only when all tiles in the row are populated
  if(thisRowPopulated){
    try{
      drawImage(rowNum, context);
    }
    catch(err){
      console.log(err);
      document.getElementById('Message').innerHTML = err;
    }
  }
}

/**
 * drawImage for the row of tile
 * @param  rowNum row number to draw a row of svg images
 * @param  context to call the next Row's processing
 */

var drawImage = function(rowNum, context){
  console.log('Displaying the row :' + rowNum);
  var targetSvgImage = document.getElementById('targetSvgImage');
  // if the row is already drawn return
  if(Mosaic.rowsCompleted[rowNum] == true)
      return;

 // Create a dom element for each svg element(tile) in the row and append it to the outer parent targetSvgImage
  for (var j = 0; j < Mosaic.prototype.defaults.divX; j++) {
    var domNode = new DOMParser().parseFromString(Mosaic.tileArray[rowNum][j],'application/xml');
    var domNodeElement = domNode.documentElement;
    domNodeElement.setAttribute('x', (j * Mosaic.prototype.defaults.tileWidth));
    domNodeElement.setAttribute('y', (rowNum * Mosaic.prototype.defaults.tileHeight));
    targetSvgImage.appendChild(targetSvgImage.ownerDocument.importNode(domNodeElement, true));
  }

  // Mark the row as completed and move on to the next row
  Mosaic.rowsCompleted[rowNum] = true;
  if( rowNum < Mosaic.prototype.defaults.divY - 1) // only do this until the last but one row
  {
    try{
      processRow(rowNum+1, context); // process the next row only after the current row is done.
    }
    catch(err){
      console.log(err);
      document.getElementById('Message').innerHTML = err;
    }
  }

}
