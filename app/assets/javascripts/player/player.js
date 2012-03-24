(function() {
  console.log("Stratus loading...");
  $(function() {
    var b, booleans, getScaledImageData, link, params, scApiUrl, source_origin, strtobool, timecode, _i, _len;
    window.Track = Backbone.Model.extend({
      initialize: function() {
        var that, track;
        that = this;
        track = this.attributes;
        track.timecode = timecode(track.duration);
        return soundManager.createSound({
          id: "sound_" + track.id,
          multiShot: false,
          url: track.stream_url + (/\?/.test(track.stream_url) ? '&' : '?') + 'consumer_key=' + Stratus.options.key,
          volume: Stratus.options.volume,
          whileplaying: function() {
            Stratus.$('.played').width((this.position / track.duration * 100) + '%');
            return Stratus.$('#player .duration').text(timecode(this.position) + ' / ' + timecode(track.duration));
          },
          whileloading: function() {
            return Stratus.$('.loaded').width((this.bytesLoaded / this.bytesTotal * 100) + '%');
          },
          onplay: function() {
            if (this.loaded) {
              return Stratus.$('.loaded').width('100%');
            }
          },
          onresume: function() {
            if (this.loaded) {
              return Stratus.$('.loaded').width('100%');
            }
          },
          onfinish: function() {
            return Stratus.nextTrack();
          }
        });
      },
      sound: function() {
        return "sound_" + this.id;
      },
      play: function() {
        return soundManager.play(this.sound());
      },
      pause: function() {
        return soundManager.pause(this.sound());
      },
      seek: function(relative) {
        return soundManager.setPosition(this.sound(), this.get('duration') * relative);
      },
      getWave: function(callback) {
        var that;
        that = this;
        return $.getJSON('http://wave64.it/w?callback=?', {
          url: this.get('waveform_url')
        }, function(data) {
          var waveform;
          waveform = new Image();
          waveform.src = data.data;
          return waveform.onload = function() {
            var waveform_data;
            waveform_data = getScaledImageData(waveform);
            that.set({
              'waveform_data': waveform_data
            });
            return callback();
          };
        });
      },
      comment: function(text) {
        return SC.post("/tracks/" + this.id + "/comments", {
          "comment[body]": text
        }, function() {
          Stratus.$('#comment input').val('');
          Stratus.toggleComment();
          return alert("Comment posted!");
        });
      },
      favorite: function() {
        if (Stratus.$('.love').hasClass('loved')) {
          return SC["delete"]("/me/favorites/" + this.id, function() {
            return Stratus.$('.love').removeClass('loved');
          });
        } else {
          return SC.put("/me/favorites/" + this.id, function() {
            return Stratus.$('.love').addClass('loved');
          });
        }
      },
      isFavorite: function() {
        return SC.get("/me/favorites/" + this.id, function(data) {
          if (!(data.errors != null)) {
            return Stratus.$('.love').addClass('loved');
          }
        });
      }
    });
    window.TrackList = Backbone.Collection.extend({
      model: Track,
      select: function(track) {
        this.stop();
        this.current = track;
        return this.trigger('player:select');
      },
      toggle: function(track) {
        if (track && this.current !== track) {
          this.select(track);
        }
        if (this.playing) {
          return this.pause();
        } else {
          return this.play();
        }
      },
      play: function(track) {
        if (track && this.current !== track) {
          this.select(track);
        }
        this.playing = true;
        this.current.play();
        return this.trigger('player:toggle');
      },
      pause: function() {
        this.playing = false;
        this.current.pause();
        return this.trigger('player:toggle');
      },
      stop: function() {
        this.playing = false;
        return soundManager.stopAll();
      },
      prev: function() {
        var i;
        i = this.indexOf(this.current) - 1;
        if (i > -1) {
          return this.at(i);
        } else {
          return this.last();
        }
      },
      next: function() {
        var i;
        i = this.indexOf(this.current) + 1;
        if (i < _.size(this)) {
          return this.at(i);
        } else {
          return this.first();
        }
      },
      random: function() {
        var i;
        i = Math.round(Math.random() * _.size(this));
        return this.at(i);
      }
    });
    window.Tracks = new TrackList();
    window.TrackView = Backbone.View.extend({
      tagName: "li",
      events: {
        "click": "toggleTrack"
      },
      render: function() {
        return $(this.el).html(ich.track(this.model.toJSON()));
      },
      toggleTrack: function() {
        return Tracks.toggle(this.model);
      }
    });
    window.AppView = Backbone.View.extend({
      el: $('#stratus'),
      defaults: {
        align: 'bottom',
        animate: 'slide',
        auto_play: false,
        buying: true,
        color: 'F60',
        download: true,
        env: 'production',
        key: 'ybtyKcnlhP3RKXpJ58fg',
        links: ['http://soundcloud.com/qotsa/sets/test'],
        random: false,
        redirect: 'http://stratus.sc/callback.html',
        user: true,
        stats: true,
        volume: 50
      },
      events: {
        "dblclick": "showDrawer",
        "click .prev": "prevTrack",
        "click .toggle": "toggleCurrent",
        "click .next": "nextTrack",
        "click #time": "seekTrack",
        "mousemove #time": "movePosition",
        "click .share": "toggleShare",
        "click .close.sharing": "toggleShare",
        "click .comment": "toggleComment",
        "click .close.commenting": "toggleComment",
        "keypress #add input": "commentTrack",
        "click .love": "favoriteTrack",
        "click #avatar": "logout",
        "click .popup": "popupPlayer"
      },
      initialize: function() {
        var options, that;
        console.log("Stratus initializing...");
        that = this;
        this.options = options = _.extend(this.defaults, this.options);
        Tracks.bind('add', this.add, this);
        Tracks.bind('player:select', this.render, this);
        Tracks.bind('player:toggle', this.toggle, this);
        SC.initialize({
          client_id: options.key,
          redirect_uri: options.redirect
        });
        return SC.whenStreamingReady(function() {
          return that.loadTracks(options.links, function() {
            Tracks.select(options.random ? Tracks.random() : Tracks.first());
            if (options.auto_play) {
              Tracks.play();
            }
            if (options.align === 'top') {
              options.top = true;
            }
            options.color = {
              base: tinycolor(options.color).toHexString(),
              light: tinycolor.lighten(options.color).toHexString(),
              dark: tinycolor.darken(options.color).toHexString()
            };
            $('head').append(ich.theme(options));
            if (SC.isConnected()) {
              that.updateUser();
            }
            return that.animate(function() {
              return that.resize();
            });
          });
        });
      },
      loadTracks: function(links, callback) {
        var index, loadURL;
        index = 0;
        loadURL = function(link) {
          var url;
          console.log("Loading " + link + "...");
          url = scApiUrl(link);
          return SC.get(url, function(data) {
            index += 1;
            if (data.tracks) {
              Tracks.add(data.tracks);
            } else if (data.username || data.creator) {
              links.push(data.uri + '/tracks');
            } else {
              Tracks.add(data);
            }
            if (links[index]) {
              return loadURL(links[index]);
            } else {
              return callback();
            }
          });
        };
        return loadURL(links[index]);
      },
      render: function() {
        var artwork, data, el, that, track;
        that = this;
        track = Tracks.current;
        data = Tracks.current.toJSON();
        el = this.$('#tracks .track_' + data.id);
        this.$('#track').html(ich.current(data));
        this.$('#buttons').html(ich.buttons(data));
        this.$('#stats').html(ich.stats(data));
        this.$('#share').html(ich.share(data));
        artwork = data.artwork_url ? data.artwork_url : data.user.avatar_url;
        this.$('#artwork img').attr({
          src: artwork.replace('-large', '-t300x300')
        });
        el.addClass('current').siblings().removeClass('current');
        if (track.has('waveform_data')) {
          this.updateWave(track);
        } else {
          track.getWave(function() {
            return that.updateWave(track);
          });
        }
        if (SC.isConnected()) {
          track.isFavorite();
        }
        return this.resize();
      },
      add: function(track) {
        var view;
        view = new TrackView({
          model: track,
          className: 'track_' + track.id
        });
        return this.$("#tracks").append(view.render());
      },
      toggle: function() {
        return this.$('#player').toggleClass('playing', Tracks.playing);
      },
      toggleCurrent: function() {
        Tracks.toggle();
        return false;
      },
      prevTrack: function() {
        Tracks.play(Tracks.prev());
        return false;
      },
      nextTrack: function() {
        Tracks.play(Tracks.next());
        return false;
      },
      seekTrack: function(e) {
        var relative;
        if (!Tracks.playing) {
          Tracks.play();
        }
        relative = Math.min(this.$('.loaded').width(), (e.pageX - this.$('#time').offset().left) / this.$('#time').width());
        Tracks.current.seek(relative);
        return false;
      },
      movePosition: function(e) {
        return this.$('.position').css({
          "left": e.pageX - this.$('#time').offset().left
        });
      },
      updateWave: function(track) {
        var canvas, context;
        canvas = this.$('#waveform').get(0);
        context = canvas.getContext('2d');
        canvas.setAttribute('width', 180);
        canvas.setAttribute('height', 40);
        context.clearRect(0, 0, 180, 40);
        return context.putImageData(track.get('waveform_data'), 0, 0);
      },
      animate: function(callback) {
        if (this.options.popup) {
          this.$('#player, #drawer').fadeIn('slow');
        }
        switch (this.options.animate) {
          case 'slide':
            return this.$('#player').slideDown('slow', function() {
              return callback();
            });
          case 'fade':
            return this.$('#player').fadeIn('slow', function() {
              return callback();
            });
          default:
            return this.$('#player').show(0, function() {
              return callback();
            });
        }
      },
      resize: function() {
        this.$('#share').css({
          "margin-right": this.$('#buttons').width() - 30
        });
        return this.$('#comment').css({
          "margin-right": this.$('#buttons').width() - 60
        });
      },
      showDrawer: function() {
        this.$('#drawer').toggle();
        return $.postMessage(true, source_origin, parent);
      },
      popupPlayer: function() {
        Tracks.stop();
        this.toggle();
        return $.popupWindow($.url().attr('source') + '&popup=true', {
          height: 199,
          width: 800,
          location: false
        });
      },
      toggleShare: function() {
        this.$('#share').toggle();
        this.$('#share input').select();
        return false;
      },
      toggleComment: function() {
        var that;
        that = this;
        if (SC.isConnected()) {
          this.$('#comment').toggle();
          this.$('#comment input').select();
        } else {
          this.login(function() {
            return that.toggleComment();
          });
        }
        return false;
      },
      commentTrack: function(e) {
        var text;
        text = this.$('#comment input').val();
        if (e.keyCode === 13) {
          return Tracks.current.comment(text);
        }
      },
      favoriteTrack: function() {
        if (SC.isConnected()) {
          Tracks.current.favorite();
        } else {
          this.login(function() {
            return Tracks.current.favorite();
          });
        }
        return false;
      },
      login: function(callback) {
        var that;
        that = this;
        return SC.connect(function(user) {
          that.updateUser();
          return callback();
        });
      },
      updateUser: function() {
        var that;
        that = this;
        return SC.get("/me", function(user) {
          return that.$('#avatar').attr({
            src: user.avatar_url
          });
        });
      },
      logout: function() {
        SC.disconnect();
        return alert("Logged out.");
      }
    });
    link = decodeURIComponent($.url().param('link'));
    source_origin = $.url(link).attr('base');
    $.receiveMessage(function(e) {
      var result, url;
      url = e.data;
      result = Tracks.find(function(track) {
        return track.get('permalink_url') === url;
      });
      if (result) {
        return Tracks.toggle(result);
      } else {
        return SC.get("/resolve", {
          url: url
        }, function(track) {
          Tracks.add(track);
          return Tracks.play(Tracks.get(track.id));
        });
      }
    }, source_origin);
    scApiUrl = function(url) {
      if (/api\./.test(url)) {
        return url;
      } else {
        return "/resolve?url=" + url;
      }
    };
    timecode = function(ms) {
      return SC.Helper.millisecondsToHMS(ms);
    };
    strtobool = function(str) {
      switch (str) {
        case 'true':
          return true;
        case true:
          return true;
        default:
          return false;
      }
    };
    getScaledImageData = function(image) {
      var color, height, isImageData, lastIndex, orig, origCtx, origImageData, origWidth, populateScaledImagedData, precise, scaleX, scaleY, scaled, scaledCtx, scaledImageData, width, x, y;
      color = Stratus.$('#player').css('background-color');
      color = tinycolor(color).toRgb();
      precise = function(number, precision) {
        precision = Math.pow(10, precision || 0);
        return Math.round(number * precision) / precision;
      };
      populateScaledImagedData = function(x, y, srcImageData, indexOffset) {
        var alpha, index, indexScaled, isOpaque;
        indexOffset = indexOffset || 0;
        index = (Math.floor(y / scaleY) * origWidth + Math.floor(x / scaleX)) * 4;
        indexScaled = indexOffset + (y * width + x) * 4;
        alpha = srcImageData.data[index + 3];
        isOpaque = alpha === 255;
        scaledImageData.data[indexScaled] = isOpaque ? color['r'] : 0;
        scaledImageData.data[indexScaled + 1] = isOpaque ? color['g'] : 0;
        scaledImageData.data[indexScaled + 2] = isOpaque ? color['b'] : 0;
        scaledImageData.data[indexScaled + 3] = alpha;
        return indexScaled;
      };
      height = 40;
      width = 180;
      origWidth = image.width;
      scaleX = precise(width / image.width, 4);
      scaleY = precise(height / image.height, 4);
      try {
        isImageData = !(image instanceof Image);
      } catch (e) {
        isImageData = image.hasOwnProperty("data") && image.data.hasOwnProperty("length");
      }
      orig = document.createElement("canvas");
      orig.width = image.width;
      orig.height = image.height;
      origCtx = orig.getContext("2d");
      if (!isImageData) {
        origCtx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width, image.height);
      } else {
        origCtx.putImageData(image, 0, 0);
      }
      origImageData = origCtx.getImageData(0, 0, image.width, image.height);
      scaled = document.createElement("canvas");
      scaled.width = width;
      scaled.height = height;
      scaledCtx = scaled.getContext("2d");
      scaledImageData = scaledCtx.getImageData(0, 0, width, height);
      y = 0;
      while (y < height) {
        x = 0;
        while (x < width) {
          lastIndex = populateScaledImagedData(x, y, origImageData, 0);
          x++;
        }
        y++;
      }
      return scaledImageData;
    };
    params = $.url().param();
    if (params.links) {
      params.links = decodeURIComponent(params.links);
      params.links = params.links.split(',');
    }
    if (params.redirect) {
      params.redirect = decodeURIComponent(params.redirect);
    }
    booleans = ['auto_play', 'buying', 'download', 'random', 'user', 'stats', 'popup'];
    for (_i = 0, _len = booleans.length; _i < _len; _i++) {
      b = booleans[_i];
      if (params[b]) {
        params[b] = strtobool(params[b]);
      }
    }
    return window.Stratus = new AppView(params);
  });
}).call(this);
