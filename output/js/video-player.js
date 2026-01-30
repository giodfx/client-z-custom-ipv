/**
 * Video Slideshow Player
 * Features: Play/Pause, Navigation, Volume Control, Closed Captions, Fullscreen
 */
(function() {
  'use strict';

  document.querySelectorAll('.video-player-section').forEach(function(section) {
    var scenes = section.querySelectorAll('.video-scene');
    var container = section.querySelector('.video-container');
    var playBtn = section.querySelector('.video-play-pause');
    var prevBtn = section.querySelector('.video-prev');
    var nextBtn = section.querySelector('.video-next');
    var progressFill = section.querySelector('.progress-fill');
    var progressText = section.querySelector('.progress-text');

    // New controls
    var volumeContainer = section.querySelector('.video-volume');
    var volumeBtn = section.querySelector('.video-volume-btn');
    var volumeSlider = section.querySelector('.video-volume-slider');
    var ccBtn = section.querySelector('.video-cc');
    var fullscreenBtn = section.querySelector('.video-fullscreen');
    var captionEl = section.querySelector('.video-caption');
    var captionText = section.querySelector('.video-caption-text');

    var currentScene = 0;
    var isPlaying = false;
    var volume = 1;
    var isMuted = false;
    var captionsEnabled = false;  // CC off by default - user can enable
    var playTimer = null;

    // Get caption text from scene
    function getCaptionText(sceneEl) {
      // Try to get script/narration from data attribute
      var script = sceneEl.dataset.script;
      if (script) return script;

      // Fallback: use heading and bullets as caption
      var heading = sceneEl.querySelector('.scene-heading');
      var bullets = sceneEl.querySelectorAll('.scene-bullets li');

      var text = '';
      if (heading) text = heading.textContent;
      if (bullets.length > 0) {
        var bulletTexts = [];
        bullets.forEach(function(li) {
          bulletTexts.push(li.textContent);
        });
        if (text) text += ': ';
        text += bulletTexts.join('. ');
      }
      return text || '';
    }

    // Update caption display
    function updateCaption() {
      if (!captionEl || !captionText) return;

      if (captionsEnabled) {
        var text = getCaptionText(scenes[currentScene]);
        captionText.textContent = text;
        captionEl.classList.remove('hidden');
      } else {
        captionEl.classList.add('hidden');
      }
    }

    // Toggle captions
    function toggleCaptions() {
      captionsEnabled = !captionsEnabled;
      if (ccBtn) {
        ccBtn.classList.toggle('active', captionsEnabled);
      }
      updateCaption();
    }

    // Set volume
    function setVolume(val) {
      volume = parseFloat(val);
      if (volumeSlider) volumeSlider.value = volume;

      scenes.forEach(function(scene) {
        var audio = scene.querySelector('.scene-audio');
        if (audio) audio.volume = volume;
      });

      isMuted = (volume === 0);
      updateVolumeIcon();
    }

    // Toggle mute
    function toggleMute() {
      if (isMuted || volume === 0) {
        setVolume(1);
      } else {
        setVolume(0);
      }
    }

    // Update volume icon
    function updateVolumeIcon() {
      if (!volumeBtn) return;
      var iconOn = volumeBtn.querySelector('.icon-volume-on');
      var iconOff = volumeBtn.querySelector('.icon-volume-off');
      if (iconOn && iconOff) {
        iconOn.style.display = isMuted ? 'none' : 'block';
        iconOff.style.display = isMuted ? 'block' : 'none';
      }
    }

    // Toggle fullscreen
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        section.requestFullscreen().catch(function(err) {
          console.warn('Fullscreen failed:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }

    // Handle fullscreen change
    function onFullscreenChange() {
      var isFs = !!document.fullscreenElement;
      section.classList.toggle('fullscreen', isFs);

      if (fullscreenBtn) {
        var iconFs = fullscreenBtn.querySelector('.icon-fullscreen');
        var iconExit = fullscreenBtn.querySelector('.icon-fullscreen-exit');
        if (iconFs && iconExit) {
          iconFs.style.display = isFs ? 'none' : 'block';
          iconExit.style.display = isFs ? 'block' : 'none';
        }
      }
    }

    function showScene(index) {
      if (index < 0 || index >= scenes.length) return;

      // Stop current audio
      var currentAudio = scenes[currentScene].querySelector('.scene-audio');
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Hide current, show new
      scenes[currentScene].classList.remove('active');
      currentScene = index;
      scenes[currentScene].classList.add('active');

      // Update controls
      if (prevBtn) prevBtn.disabled = currentScene === 0;
      if (nextBtn) nextBtn.disabled = currentScene === scenes.length - 1;
      if (progressFill) progressFill.style.width = ((currentScene + 1) / scenes.length * 100) + '%';
      if (progressText) progressText.textContent = 'Slide ' + (currentScene + 1) + ' of ' + scenes.length;

      // Update caption
      updateCaption();

      // Play audio if playing
      if (isPlaying) {
        playCurrentAudio();
      }
    }

    function playCurrentAudio() {
      var audio = scenes[currentScene].querySelector('.scene-audio');
      if (audio) {
        audio.volume = volume;
        audio.play().catch(function() {});

        // Auto-advance when audio ends
        audio.onended = function() {
          if (currentScene < scenes.length - 1) {
            showScene(currentScene + 1);
          } else {
            stopPlayback();
          }
        };
      } else {
        // No audio, use duration
        var duration = parseInt(scenes[currentScene].dataset.duration) || 15;
        clearTimeout(playTimer);
        playTimer = setTimeout(function() {
          if (isPlaying) {
            if (currentScene < scenes.length - 1) {
              showScene(currentScene + 1);
            } else {
              stopPlayback();
            }
          }
        }, duration * 1000);
      }
    }

    function startPlayback() {
      isPlaying = true;
      if (playBtn) {
        var iconPlay = playBtn.querySelector('.icon-play');
        var iconPause = playBtn.querySelector('.icon-pause');
        if (iconPlay) iconPlay.style.display = 'none';
        if (iconPause) iconPause.style.display = 'block';
      }
      playCurrentAudio();
    }

    function stopPlayback() {
      isPlaying = false;
      clearTimeout(playTimer);

      if (playBtn) {
        var iconPlay = playBtn.querySelector('.icon-play');
        var iconPause = playBtn.querySelector('.icon-pause');
        if (iconPlay) iconPlay.style.display = 'block';
        if (iconPause) iconPause.style.display = 'none';
      }

      var audio = scenes[currentScene].querySelector('.scene-audio');
      if (audio) {
        audio.pause();
      }
    }

    // Event listeners
    if (playBtn) {
      playBtn.addEventListener('click', function() {
        if (isPlaying) stopPlayback();
        else startPlayback();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        showScene(currentScene - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        showScene(currentScene + 1);
      });
    }

    if (volumeBtn) {
      volumeBtn.addEventListener('click', toggleMute);
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', function(e) {
        setVolume(e.target.value);
      });
    }

    if (ccBtn) {
      ccBtn.addEventListener('click', toggleCaptions);
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // Fullscreen change event
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      // Only handle if not in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Check if this section is in view or fullscreen
      var rect = section.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView && !section.classList.contains('fullscreen')) return;

      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          showScene(currentScene - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          showScene(currentScene + 1);
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          if (isPlaying) stopPlayback();
          else startPlayback();
          break;
        case 'c':
          toggleCaptions();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    });

    // Initialize first scene
    if (scenes.length > 0) {
      scenes[0].classList.add('active');
      if (progressText) progressText.textContent = 'Slide 1 of ' + scenes.length;

      // CC is off by default - hide caption and remove active state from button
      if (captionEl) captionEl.classList.add('hidden');
      if (ccBtn) ccBtn.classList.remove('active');
    }
  });
})();
