(function () {
  "use strict";

  const videos = Array.isArray(window.LEARNING_VIDEOS) ? window.LEARNING_VIDEOS : [];
  const search = document.querySelector("#learning-search");
  const grid = document.querySelector("#learning-video-grid");
  const count = document.querySelector("#learning-video-count");
  const noResults = document.querySelector("#learning-no-results");

  function videoCard(video) {
    const link = document.createElement("a");
    link.className = "learning-video-card";
    link.href = "video.html?id=" + encodeURIComponent(video.id);
    const thumbnail = document.createElement("div");
    thumbnail.className = "learning-video-thumb";
    const image = document.createElement("img");
    image.src = "https://img.youtube.com/vi/" + video.youtubeId + "/hqdefault.jpg";
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", function () { thumbnail.classList.add("thumbnail-failed"); }, { once: true });
    thumbnail.append(image);
    if (video.trending) {
      const badge = document.createElement("span");
      badge.className = "learning-trending-badge";
      badge.textContent = "TRENDING";
      thumbnail.append(badge);
    }
    const play = document.createElement("span");
    play.className = "learning-card-play";
    play.setAttribute("aria-hidden", "true");
    play.textContent = "PLAY";
    thumbnail.append(play);
    const copy = document.createElement("div");
    copy.className = "learning-video-copy";
    const title = document.createElement("h2");
    title.textContent = video.title;
    const description = document.createElement("p");
    description.textContent = video.description;
    copy.append(title, description);
    link.append(thumbnail, copy);
    return link;
  }

  function renderVideos() {
    const query = search.value.trim().toLocaleLowerCase();
    const visibleVideos = videos.filter(function (video) {
      return [video.title, video.description].join(" ").toLocaleLowerCase().includes(query);
    }).sort(function (first, second) {
      return Number(Boolean(second.trending)) - Number(Boolean(first.trending)) || first.title.localeCompare(second.title);
    });
    grid.replaceChildren.apply(grid, visibleVideos.map(videoCard));
    count.textContent = visibleVideos.length + (visibleVideos.length === 1 ? " lesson" : " lessons");
    noResults.hidden = visibleVideos.length > 0;
    noResults.textContent = videos.length === 0 ? "Lessons will appear here soon." : "No lessons match that search.";
  }

  search.addEventListener("input", renderVideos);
  renderVideos();
})();