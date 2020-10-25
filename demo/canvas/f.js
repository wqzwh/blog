function showFPS(isDev, style) {
  window.requestAnimationFrame =
    window.requestAnimationFrame || //Chromium
    window.webkitRequestAnimationFrame || //Webkit
    window.mozRequestAnimationFrame || //Mozilla Geko
    window.oRequestAnimationFrame || //Opera Presto
    window.msRequestAnimationFrame || //IE Trident?
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  var fps, last, offset, step, appendFps;
  var e = document.createElement('div');
  if (style) {
    e.style = style;
  } else {
    e.style.position = 'absolute';
    e.style.left = '810px';
    e.style.top = '6px';
    e.style.backgroundColor = '#fff';
    e.style.opacity = 0.66;
    e.style.padding = '0px 2px';
    e.style.fontSize = '20px';
    e.style.zIndex = 9990;
  }
  document.body.appendChild(e);
  fps = 0;
  last = Date.now();
  step = function() {
    offset = Date.now() - last;
    fps += 1;
    if (offset >= 1000) {
      last += offset;
      appendFps(fps);
      fps = 0;
    }
    window.requestAnimationFrame(step);
  };
  appendFps = function(fps) {
    e.innerHTML = fps + 'fps';
  };
  step();
}
window.__showFPS = showFPS;