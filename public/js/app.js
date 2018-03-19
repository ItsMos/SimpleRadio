Vue.component('music-player', {
  data: () => {
    return {
      playState: false,
      playing: {
        title: '',
        duration: 0,
        dataURI: ''
      },
      nextTrack: {}
    }
  },

  methods: {
    async playPause() {
      if (this.playState) { // pause
        this.$refs.audioEl.pause()
        
        // play
      } else {
        // 1 download, 2 get time, 3 play
        // todo: see if track changed before download is necessary
        
        await this.downloadCurrentTrack()
        await this.getTrackInfo()
        this.$refs.audioEl.play()
      }
      this.playState = !this.playState
    },

    async downloadCurrentTrack() {
      let track = await APICall('http://localhost:8080/stream?dataURI=1')
      this.playing.dataURI = track.dataURI
      return new Promise((resolve, reject) => {
        if (track)
          resolve()
      });
    },
    
    async getTrackInfo() {
      let info = await APICall('http://localhost:8080/stream?info=1')
      this.playing.title = info.title
      this.playing.duration = info.duration
      this.playing.currentTime = info.currentTime
      this.$refs.audioEl.currentTime = this.playing.currentTime
      return new Promise((resolve, reject) => {
        if (info) {
          resolve(info)
        } else {
          reject('Cant get track info')
        }
      });
    },

    async downloadNextTrack() {
      let next = await APICall('http://localhost:8080/next')
      this.nextTrack = next
    },

    playNextTrack() {
      this.playing = Object.assign({}, this.nextTrack)
      this.$refs.audioEl.currentTime = 0
      setTimeout(() => {
        this.$refs.audioEl.play()
      }, 10);

      // wait let the server ready next track
      setTimeout(() => {
        this.downloadNextTrack()
      }, 5000);
    }
  },

  async created() {
    this.downloadCurrentTrack()
    await this.getTrackInfo()
    this.downloadNextTrack()
    // TODO: create timer start at: currentTime, ends at: duration to
    // get the next track info / update play list
  }
})



var app = new Vue({
  el: '.app'
})

function APICall(url) {
  return new Promise((resolve, reject) => {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        resolve(JSON.parse(xhttp.response))
      }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
  });
}