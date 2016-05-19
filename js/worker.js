/**
 * web worker on receiving message executes the below function
 * @param  {Event} e Event data containing input Json string
*/

onmessage = function(e){
  if(e.data != undefined && e.data != ''){
    getSVGFromServer(e.data);
  }
  else {
    postMessage('{ "StatusMsg" : "Invalid input for the Server request", "columnNum" : "Unknown" }');
    close();
  }
};

/**
 * send XMLHttpRequest to the server to fetch the svg element per tile
 * @param  input Json string containing columNum and url
*/
function getSVGFromServer(input){
  var RESPONSE_READY = 4;
  var STATUS_OK = 200;
  var TIMEOUT_IN_MILLISECS = 60000;// 60 seconds timeout
  var inputJson = JSON.parse(input);
  if( inputJson == undefined || inputJson["columnNum"] == undefined || inputJson["url"] == undefined ){
    postMessage('{ "StatusMsg" : "Invalid input for the Server request", "columnNum" : "Unknown" }');
    close();
  }
  var colNum = inputJson["columnNum"];
  var url = inputJson["url"];
  // Do the usual XHR stuff
  var req = new XMLHttpRequest();
  req.timeout = TIMEOUT_IN_MILLISECS;
  req.open('GET', url, true); // Asynchronous flag
  req.onreadystatechange = function() {
      if (req.readyState == RESPONSE_READY) {
        if( req.status == STATUS_OK ){
          respValue = req.responseText;
          if(respValue != undefined && respValue != ''){
            // We need to do the stringify as the svg tag element contains double quotes which need to be escaped.
            postMessage('{ "StatusMsg" : "OK", "columnNum" : ' + colNum + ',' + '"svg" :' + JSON.stringify(respValue) + '}');
          }
          else {
            postMessage('{ "StatusMsg" : "Server Response value Invalid", "columnNum" : ' + colNum + '}');
          }
        }
        else {
          postMessage('{ "StatusMsg" : "Server Response status Invalid", "columnNum" : ' + colNum + '}');
        }
        // Worker's job is done. Do not waste it any further.
        close();
      }
  };

  req.ontimeout = function(){
    postMessage('{ "StatusMsg" : "Server Request timed out", "columnNum" : ' + colNum + '}');
    close();
  }
  req.send();
}
