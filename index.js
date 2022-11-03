const timecut = require('timecut');
const http = require("http");
const url = require('url');
const fs = require('fs');
const path = require('path');
const PORT = 5000;

const downloadVideo = (url, dest) => {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      console.log("finishfinishfinish => ")
      file.close();  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    console.log("errorerrorerrorerror => ")
    fs.unlink(dest); // Delete the file async. (But we don't check the result)    
  });
};

const server = http.createServer(async (req, res) => { 
  const url_parts = await url.parse(req.url);
  
  if (url_parts.pathname === "/api/record-canvas" && req.method === "GET") {  
    const queryObject = JSON.parse(JSON.stringify(url.parse(req.url, true).query)); 
    console.log("queryObject => ", queryObject)
    const height = queryObject?.height || 2000
    const json_url = queryObject?.json_url || null
    const width = queryObject?.width || 2000
    const duration = queryObject?.duration || 10
    const fps = queryObject?.fps || fps
    const selector = queryObject?.selector || 'c'   

    try{
      await timecut({
        url: queryObject.page_url+'?json_url='+json_url+'&width='+width+'&height='+height,
        viewport: {
          width: Number(width),               // sets the viewport (window size) to 800x600
          height: Number(height)
        },
        selector: `#${selector}`,     // crops each frame to the bounding box of '#container'
        left: 0, top: 0,          // further crops the left by 20px, and the top by 40px
        right: 0, bottom: 0,       // and the right by 6px, and the bottom by 30px
        fps: Number(fps),                    // saves 30 frames for each virtual second
        duration: Number(duration),               // for 10 virtual seconds 
        output: 'videos/video1.mp4'         // to video.mp4 of the current working directory
      }).then(async() => {
        console.log('Done!');
        const url = 'videos/video1.mp4';
        
        // Image will be stored at this path
        // const path = `${__dirname}/${url}`; 

        //await downloadVideo('http://43.205.119.196:5000/videos/video1.mp4', 'video1.mp4')

        var filePath = path.join(__dirname, url);
        var stat = fs.statSync(filePath);
         
        // res.setHeader('Content-Type', 'video/mp4');
        // filePath.pipe(res);

        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Length': stat.size
        });        

        var readStream = fs.createReadStream(filePath);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);

       // res.writeHead(200, { "Content-Type": "application/json" });     
       // res.end("Video Uploaded on S3 Bucket please check in your S3 bucket");
      })
    } catch(error){
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(error));
    };     

  } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found" }));
  }
});

server.listen(PORT, () => {
    console.log(`server started on port: ${PORT}`);
});