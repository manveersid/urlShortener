require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//url objects
class UrlObj { 
  constructor(url, shortUrl) {
    this.original_url = url,
    this.short_url = shortUrl
  }
};

//return from or save in database
const saveUrl = async (url) => {
  const database = await fs.readFile(__dirname + '/database.json', 'utf8');
  const urlArray = await JSON.parse(database);
  
  const foundUrlObj = urlArray.find(urlObj => urlObj["original_url"] === url);
  if(foundUrlObj) {
    return foundUrlObj;
  } else {
    const newUrlObj = new UrlObj(url, urlArray.length);
    urlArray.push(newUrlObj);

    const something = await fs.writeFile(__dirname + '/database.json', JSON.stringify(urlArray))
      .catch(error => console.log(error));
    console.log(something);
    return newUrlObj;
  }
};

//search for a short url in database
const searchUrl = async (shortUrl) => {
  const database = await fs.readFile(__dirname + '/database.json', 'utf8');
  const urlArray = await JSON.parse(database);
  
  const foundUrlObj = urlArray.find(urlObj => urlObj["short_url"] == shortUrl);
  if(foundUrlObj) {
    return foundUrlObj["original_url"];
  } else {
    return {
      'error': "No short URL found for the given input"
    };
  };
};

//handling post requests
app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;
  
  //check if url is valid
  if(!(url.includes('https://') || url.includes('http://'))) {
    res.send({
      'error' : 'Invalid URL'
    });
    return;
  }

  //check url in database
  saveUrl(url)
    .then(data=> res.send(data))
    .catch(error=> console.log(error));

});

app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;
  
  //check in database if it exists
  searchUrl(shortUrl)
    .then(response => {
      console.log(response);
      res.redirect(response);
    })
    .catch(error => console.log(error));
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
