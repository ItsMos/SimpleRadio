const express = require('express')
const app = express()
const fs = require('fs')
const getMusicMeta = require('musicmetadata')
                     require('colors')


var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
}
app.use(allowCrossDomain)

app.use(express.static('public'))

// this ^ line replaces the below lines
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/index.html');
// })

let radio = {
  scanMusic() {
    this.playList = fs.readdirSync('music')
  },

  playList: [],

  currentTrack: {
    id: 0,
    title: '',
    duration: '',
    currentTime: 0,
    dataURI: ''
  },

  nextTrack: {
    id: 0,
    title: '',
    duration: '',
    currentTime: 0,
    dataURI: ''
  },
  
  timer: null,
  
  start() {
    this.loadTrack(0)
    this.timer = setInterval(_=> {
      this.currentTrack.currentTime ++
      if (this.currentTrack.currentTime >= this.currentTrack.duration) {
        
        // copy nextTrack object to current track without making a refrence
        this.currentTrack = Object.assign({}, this.nextTrack)
        
        let id = this.currentTrack.id

        if (id < this.playList.length - 1) {
          this.loadTrack(id + 1, true)
        } else {
          this.loadTrack(0, true)
        }
      }

      this.consoleDisplay()      
    }, 1000)
  },

  loadTrack(id, loadNextTrackOnly) {
    let obj = {}
    if (loadNextTrackOnly) {
      obj = this.nextTrack
    } else {
      obj = this.currentTrack
    }

    let songName = this.playList[id]
    let readStream = fs.createReadStream(`music/${songName}`)
    
    getMusicMeta(readStream, {duration: true}, (err, meta) => {
      if (err)
        return console.err(err)
      
      obj.id = id
      obj.title = meta.title
      obj.duration = meta.duration.toFixed(2)
      obj.currentTime = 0
      readStream.close()

      // convert audio to base64 URI string
      let file = fs.readFileSync(`music/${songName}`)
      file = file.toString('base64')
      obj.dataURI = 'data:audio/mpeg;base64,' + file
    })

    if (!loadNextTrackOnly) {
      let nextID = (id < this.playList.length - 1) ? id + 1:0
      this.loadTrack(nextID, true)
    }
  },

  consoleDisplay() {
    console.log('======================== '.bgMagenta + 'Radio running on port 8080'.underline.green + ' ========================'.bgMagenta);
    console.log('\n\n');
    console.log(('\t Now playing: ' + this.currentTrack.title.black.underline + ` (${this.currentTrack.currentTime} / ${this.currentTrack.duration})` ).bgGreen)
    console.log(('\t Next track: ' + this.nextTrack.title.black.underline + ` (${this.nextTrack.currentTime} / ${this.nextTrack.duration})` ).bgGreen)
    
    for (let i = 0; i < 13; i++) {
      console.log(' ');
      
    }
  }
}

app.get('/stream', (req, res) => {
  let obj = {}

  if (req.query.dataURI) {     // /stream?dataURI=1
    obj.dataURI = radio.currentTrack.dataURI
    res.send(JSON.stringify(obj))

  } else if (req.query.info) {  // /stream?info=1
    obj.id = radio.currentTrack.id
    obj.title = radio.currentTrack.title
    obj.duration = radio.currentTrack.duration
    obj.currentTime = radio.currentTrack.currentTime
    res.send(JSON.stringify(obj))

  } else if (req.query.list) {  // /stream?list=1
    let id = radio.currentTrack.id
    obj.list = []
    for (let i = 0; i < 3; i++) {
      if (id == radio.playList.length - 1) {
        id = 0
      } else {
        id++
      }
      obj.list.push(radio.playList[id])
    }
    res.send(JSON.stringify(obj))

  } else {
    res.sendStatus(404)
  }

})

app.get('/next', (req, res) => {
  res.send(JSON.stringify(radio.nextTrack))
})

app.listen('8080', _ => {
  console.log('Radio running on port 8080'.blue);
})

radio.scanMusic();
radio.start()