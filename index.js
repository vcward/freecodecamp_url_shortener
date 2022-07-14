require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const crypto = require('crypto');
const dns = require('dns');
require('url');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
const bodyParser = require('body-parser');
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

const shortenerSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const ShortUrl = mongoose.model('ShortUrl', shortenerSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  const { shorturl } = req.params;
  ShortUrl.findOne({short_url: shorturl}, (error, data) => {
    if (error) {
      console.log('error retrieving short url', error);
    }
    if (data) {
      res.redirect(data.original_url);
    }
    if (!data) {
      res.json({
        error: "No short URL found for the given input"
      });
    }
  });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  const urlObj = new URL(url);
  dns.lookup(urlObj.hostname, (error, address, family) => {
    if (error) {
      res.json({
        error: 'invalid url'
      });
    }
    if (!error) {
      ShortUrl.findOne({ original_url: url }, (error, data) => {
        if (error) {
          console.log('error searching DB', error);
        }
        if (data) {
          res.json({
            original_url: data.original_url,
            short_url: data.short_url
          });
        }
        if (!data) {
          const newUrl = new ShortUrl({
            original_url: url,
            short_url: crypto.randomUUID()
          });
          newUrl.save((error, data) => {
            if (error) {
              console.log('error saving data', error);
            }
          });
          res.json({
            original_url: newUrl.original_url,
            short_url: newUrl.short_url
          });
        }
      });
    }
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
