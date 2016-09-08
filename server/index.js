var express = require('express');
var app = express();
var port = 8765;

/*****************/
/* Define routes */
/*****************/

// Static files
app.use(express.static('public'));


// Start the server
app.listen(port, () => console.log(`Listening on port ${port}`));
