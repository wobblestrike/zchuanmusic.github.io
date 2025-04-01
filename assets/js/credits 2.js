const $ = str => document.querySelector(str);
const $$ = str => document.querySelectorAll(str);
const $isDOM = el => el instanceof Element;

(function() {
if (!window.app) {
    window.app = {};
}
app.carousel = {
    updateClass: function(el, classname='') {
        if (el) {
            el.className = classname;
            return el;
        }
        return;
    },
    reorder: function() {
        //let childcnt = $("#carousel").children.length;
        //let childs = $("#carousel").children;
        
        let cnt = 0;
        $$("#carousel > .album").forEach(item => {
            item.dataset.pos = cnt;
            cnt++;
        });

        //for (let j=0; j< childcnt; j++) { childs[j].dataset.pos = j; }
    },
    updatePositions: function() {
        let cur = $(".selected");
        let next, prev, cnt=0;

        while (next = cur.nextElementSibling) {
            next.className = (cnt < 3) ? `album next-${cnt}` : 'album hideRight';
            cur = next;
            cnt++;
        }

        cur = $(".selected");
        cnt = 0;
        while (prev = cur.previousElementSibling) {
            prev.className = (cnt < 3) ? `album prev-${cnt}` : 'album hideLeft';
            cur = prev;
            cnt++;
        }
    },
    move: function(el) {
        let i, selected = el;

        if (typeof el === "string") {
            selected = (el === "next") ? $(".selected").nextElementSibling : $(".selected").previousElementSibling;
        } 
        
        if (app.carousel.state.sleeve) {
            app.carousel.closeSleeve();    
        }

        let curpos = parseInt(app.selected.dataset.pos);
        let tgtpos = parseInt(selected.dataset.pos);
        
        let cnt = curpos - tgtpos;
        let dir = (cnt < 0) ? -1 : 1;
        let shift = Math.abs(cnt);
        
        for (i=0; i<shift; i++) {
            let el = (dir == -1) ? $("#carousel").firstElementChild : $("#carousel").lastElementChild;
            
            if (dir == -1) {
                el.dataset.pos = $("#carousel").children.length; 
                $('#carousel').append(el);
            } else {
                el.dataset.pos = 0;
                $('#carousel').prepend(el);
            }

            app.carousel.reorder();
        }
        
        app.selected = selected;
        selected.className = 'album selected';

        let next = [], 
            prev = [];

        next[0] = selected.nextElementSibling;
        prev[0] = selected.previousElementSibling;
        
        app.carousel.updateClass(next[0], `album next-0`);
        app.carousel.updateClass(prev[0], `album prev-0`);

        for (i = 1; i < 3; i++) {
            next[i] = next[i-1] ? next[i-1].nextElementSibling : selected.parentElement.firstElementChild;
            prev[i] = prev[i-1] ? prev[i-1].previousElementSibling : selected.parentElement.lastElementChild;
            
            app.carousel.updateClass(prev[i], `album prev-${i}`);
            app.carousel.updateClass(next[i], `album next-${i}`);
        }

        app.carousel.nextAll(next[2]).forEach(item=>{ item.className = 'album'; item.classList.add('hideRight') });
        app.carousel.prevAll(prev[2]).forEach(item=>{ item.className = 'album'; item.classList.add('hideLeft') });
    },
    nextAll: function(el) {
        let els = [];
        
        if (el) {
            while (el = el.nextElementSibling) { els.push(el); }
        }

        return els;
            
    },
    prevAll: function(el) {
        let els = [];
        
        if (el) {
            while (el = el.previousElementSibling) { els.push(el); }
        }

        return els;
    },
    keypress: function(e) {
        switch (e.which) {
            case 37: // left
                app.carousel.move('prev');
                break;

            case 39: // right
                app.carousel.move('next');
                break;
           
            case 27: // escape
            case 13: // enter
                app.carousel.toggleSleeve();
                return false;
            default:
                return;
        }
        e.stopPropagation();
        e.preventDefault();
        return false; 
    },
    select: function(e) {
        
        let tgt = e;

        if (!$isDOM(tgt)) {
            tgt = e.target 
        }
        while (!tgt.parentElement.classList.contains('carousel')) {
            tgt = tgt.parentElement;
        }
        
        app.carousel.move(tgt);

    },
    previous: function(e) {
        app.carousel.move('prev');
    },
    next: function(e) {
        app.carousel.move('next');
    },
    doDown: function(e) {
        app.carousel.state.downX = e.x;
        app.carousel.state.dragging = 1;
    },
    doUp: function(e) {
        let direction = 0, 
            velocity = 0,
            tgt = e.target;
        if ((e.target.classList.contains('tab')) || 
            (tgt.classList.contains('card-similar') || tgt.offsetParent.classList.contains('card-similar')) || 
            (tgt.classList.contains('card-albums') || tgt.offsetParent.classList.contains('card-albums'))) {
            return true;
        }
        if (app.carousel.state.downX) {
            direction = (app.carousel.state.downX > e.x) ? -1 : 1;
            velocity = app.carousel.state.downX - e.x;
            
            if (tgt.classList.contains('carousel')) {
                return true;
            }
            while (!tgt.parentElement.classList.contains('carousel')) {
                tgt = tgt.parentElement;
            }
            if (tgt.classList.contains('selected')) {
                app.carousel.toggleSleeve();
                return false;
            }

            if (Math.abs(app.carousel.state.downX - e.x) < 10) {
                app.carousel.select(e);
                return false;
            }
            if (direction === -1) {
                app.carousel.move('next');
            } else {
                app.carousel.move('prev');
            }
            app.carousel.state.downX = 0;
        }
        app.carousel.state.dragging = 0;
    },
    doMove: function(e) {
        let dist = app.carousel.state.downX - e.x
    },
    closeSleeve: function() {
        let sel = $(".selected");
        let sleeve = sel.querySelector(".sleeve");

        app.carousel.state.sleeve = 0;
        sel.classList.remove("open");
        sleeve.style.marginLeft = "0vw";
    },
    toggleSleeve: function() {
        let sel = $(".selected");
        let sleeve = sel.querySelector(".sleeve");
        
        app.carousel.state.sleeve ^= 1;
        //setTimeout(function() { $(".selected").classList.toggle("open"); }, 1000);
        sel.classList.toggle("open");
        sel.querySelector(".sleeve").style.marginLeft = (app.carousel.state.sleeve) ? "20vw" : "0vw";
        app.carousel.albumInfo(sel.querySelector(".artist").innerText, sel.querySelector(".albumName").innerText);
    },
    albumUpdate: function(artist, album, idx) {
        const card = $(`#album-${idx}`);
        if (card) {

            app.carousel.albumGet(artist, album).then(data=> {
                app.carousel.data.albums[album+artist].lastfm = data;
                let cover = card.querySelector("img");
                let url = data.album.image[data.album.image.length-1]['#text'];
                
                if (!url) {
                    url = "img/unknown.png";
                    cover.style.background = "#999";
                }
                if (cover) {
                    //console.log( url);
                    cover.src = url;
                }
                
            });
        }
    },
    albumGet: function(artist, album) {
        if (app.carousel.data.albums[artist+album] && app.carousel.data.albums[artist+album].lastfm) {
            Promise.resolve(app.carousel.data.albums[artist+album].lastfm);
        } else {
            return fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8ab04dc41aad7d43deffb0e2ba49b690&artist=${artist}&album=${album}&format=json`).then(r=>r.json());
        }
    },
    albumCards: function(data, album, artist) {
            if (data && album && artist) {
            let out = `<div class='card-liner'><ol class='tracks'>`;
            
            if (data.album?.tracks?.track?.length) {
                data.album.tracks.track.forEach((item, idx) => {
                //console.dir(item);
                    out += `<li>${item.name} <span class='track-length'>[${app.carousel.formatTime(item.duration)}]</span></li>`;
                });
            }
            out += "</ol></div>";
            out += "<div class='card-info'>";
            if (data.album.wiki && data.album.wiki.content) {
                let content = data.album.wiki.content;
                content = content.replace(/\n/g, '<br>').replace(/<a.+?Read\smore.*/, '');
                
                out += `<div class='wiki'>${content}</div>`;
            }

            if (data.album.playcount) {
                out += `<div class='stats'><div class='playcount'>Plays: ${app.carousel.makeHuman(data.album.playcount)}</div>`;
                out += `<div class='playcount'>Replay: ${(Math.floor((data.album.playcount / data.album.listeners) * 100)) / 100}</div>`;
                out += `<div class='playcount'>Ratio: ${(Math.floor((data.album.listeners / data.album.playcount) * 100)) / 100}</div>`;
                out += `<div class='playcount'>Listeners: ${app.carousel.makeHuman(data.album.listeners)}</div></div>`;
            }
            out += `<div class='debug'>MBID: ${data.album.mbid}</div>`;
            out += '</div>';
            out += "<div class='card-albums'></div>";
            out += "<div class='card-similar'></div>";

            $(".selected").classList.add('tabtracks');
            $(".selected").querySelector(".sleeve").innerHTML += out;
            
            app.carousel.data.albums[album+artist].ui += out;
            
            app.carousel.similarArtists(artist);
            app.carousel.topAlbums(artist);
        } else {
            console.log(`ERROR: called without artist or album: artist:${artist} album:${album}`);
            console.dir(data);
        }
    },
    albumInfo: function(artist, album) {
        //console.log(`looking up for artist: ${artist} album: ${album}`);

        let out = `<div class='tabbar'>`, first = ' tabselected';
        app.carousel.config.tabs.forEach(tab=>{
            out += `<a class='tab ${tab}tab${first}' href='#${album}_${tab}' onclick="return app.carousel.switchTab('${tab}', event)">${tab.replace(/\b\w/g, c=> c.toUpperCase())}</a>`;
            first = '';
        });
        out += "</div>";
        out += `<div class='infohead'><h1>${artist}</h1><h2>${album}</h2></div>`;
        app.carousel.data.albums[album+artist].ui = out;
        $(".selected").querySelector(".sleeve").innerHTML = out;

        if (!app.carousel.data.albums[album+artist].lastfm) {
            fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8ab04dc41aad7d43deffb0e2ba49b690&artist=${artist}&album=${album}&format=json`).then(r=>r.json()).then(data=>{
                app.carousel.data.albums[album+artist].lastfm = data;
                app.carousel.albumCards(data, album, artist);
            });
        } else {
            app.carousel.albumCards(app.carousel.data.albums[album+artist].lastfm, album, artist);
        }
    },
    topAlbums: function(artist) {
        artist = artist.replace(/'/g, "\\\'");
        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getTopAlbums&artist=${artist}&api_key=8ab04dc41aad7d43deffb0e2ba49b690&format=json`).then(res=>res.json())
            .then(data=>{
                let list = data.topalbums.album;
                let out = "";
                list.forEach((item, idx)=>{
                    if (idx < 16) {
                        out += `<div class='card'><a title='${item.name}' href='#${item.name.replace(/\s/g, '_')}' onclick="return app.carousel.addAlbum('${artist}','${item.name}')"><img src='https://cdr2.com/autonomic/carousel/art.php?q=${artist}&l=${item.name}' height='100' width='100'><div>${item.name}</div></a></div>`;
                    }
                });

                $(".selected .card-albums").innerHTML = out;
            });
    },
    similarArtists: function(artist) {
        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${artist}&api_key=8ab04dc41aad7d43deffb0e2ba49b690&format=json`).then(res=>res.json())
            .then(data=>{
                let list = data.similarartists.artist;
                let out = "";
                list.forEach((item, idx)=>{
                    if (idx < 5) {
                        out += `<div class='card'><a title='${item.name}' href='https://en.wikipedia.org/wiki/${item.name.replace(/\s/g, '_')}' target='_blank'><img src='https://cdr2.com/autonomic/carousel/art.php?q=${item.name}' height='100' width='100'><div>${item.name}</div></a></div>`;
                    }
                });

                $(".selected .card-similar").innerHTML = out;
            });
    },
    makeHuman: function(num) {
        let out = '',
            letter = '';
        if (num > 1000000) {
            num = num / 1000000;
            letter = "M";
        } else if (num > 1000) {
            num = num / 1000;
            letter = "K";
        }
        num = Math.floor(num * 10) / 10;
        return num + letter;
    },
    formatTime: function(seconds) {
        let formatted, min, sec;

        if (seconds) {
            min = Math.floor(seconds / 60);
            sec = seconds - (min * 60);
            if (sec < 10) {
                sec = "0" + sec;
            }
            formatted = min + ':' + sec;
        } else {
            formatted = '0:00';
        }
        return formatted;
    },
    switchTab: function(tab, evt) {
        console.log("switchTab");
        console.dir(evt);
        
        
        let par = app.carousel.findParent(evt.target, 'album');
        if (par) {
            app.carousel.clearTabs(par);
            par.classList.add(`tab${tab}`);
            par.querySelector(".tabselected")?.classList.remove('tabselected');
            par.querySelector(`a.tab.${tab}tab`)?.classList.add('tabselected');
        }

        return app.carousel.blockEvent(evt);
    },
    findParent: function(el, tgtClass) {
        let par;
        while (!par) {
            if (el.classList.contains(tgtClass)) {
              return el;
            }
            el = el.parentElement;
        }
        return false;
    },
    blockEvent: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        return false;
    },
    clearTabs: function(container) {
        const tabs = ['tracks', 'info', 'albums', 'similar'];
        tabs.forEach(tab => container.classList.remove(`tab${tab}`));
    },
    fetchData: function(url, cb) {
        fetch(url).then(
            response=>response.json()
        ).then(data=>{
            let result = cb(data);
            console.dir(result);
        });
    },
    makeItem: function(data, cls, id='') {
        let did = id ? `id="${id}" ` : '';
        cls = cls ? cls : 'hideRight';
        return `<div ${did} class="album ${cls}"><img alt="${data.name}" src="${data.url}"><div class="sleeve"></div><div class="title"><div class="artist">${data.artist}</div><div class="albumName">${data.name}</div></div></div>`;
    },
    getArt: function(artist, album, img) {
        
    },
    formAlbum: function(e) {
        let artist = $("#artist").value;
        let album = $("#album").value;
        e.preventDefault();
        e.stopPropagation();
        return app.carousel.addAlbum(artist, album);
    },
    addAlbum: function(artist, album) {
        app.carousel.toggleSleeve();

        let wrap = document.createElement("div");
        let count = $$("#carousel > .album").length;
        app.carousel.data.albumCount = count;

        wrap.innerHTML = app.carousel.makeItem({artist: artist, name: album, url: `https://cdr2.com/autonomic/carousel/art.php?q=${artist}&l=${album}` }, 'next-1', `album-${count}`);
        let el = wrap.querySelector("div.album");
        console.dir(el);
        console.dir(wrap);
        $(".selected").parentNode.insertBefore(el, $(".selected").nextSibling);
        app.carousel.reorder();
        app.carousel.data.albums[`${album}${artist}`] = {name: album, artist: artist};
        app.carousel.albumUpdate(artist, album, count);
        app.carousel.data.albumCount++;
        app.carousel.updatePositions();
        setTimeout(function() { app.carousel.select(el); }, 500);
        setTimeout(app.carousel.toggleSleeve, 1000);
        return false;
    },
    fillCarousel: function(data) {
        console.log("fillCarousel");
        let out = "", html = "";
        //let keys = ['hideLeft', 'prev-4', 'prev-3', 'prev-2', 'prev-1', 'selected', 'next-1', 'next-2', 'next-3', 'next-4', 'hideRight'];
        let keys = ['hideLeft', 'prev-2', 'prev-1', 'prev-0', 'selected', 'next-0', 'next-1', 'next-2', 'hideRight'];
        let kl = keys.length, key = '';
        data.albums.forEach((item, idx)=>{
            key = (idx > kl) ? 'hideRight' : keys[idx];
            app.carousel.data.albums[item.name+item.artist] = {};
            html = app.carousel.makeItem(item, key, `album-${idx}`);
            out += html;
        });
        $("#carousel").innerHTML = out;
        app.carousel.reorder();
    },
    addAlbums: function(data) {
        app.carousel.data.albumsList = data.albums;
        app.carousel.fillCarousel(data);
        data.albums.forEach((album, idx) => {
            app.carousel.albumUpdate(album.artist, album.name, idx);
        });
        app.selected = $(".selected");
    },
    load: function(url) {
        // console.dir(url);
        // app.carousel.fetchData(url, app.carousel.addAlbums);
        app.carousel.addAlbums({
    "albums": [
        { "name": "Punk in Drublic", "artist": "NOFX" },
        { "name": "Houses of the Holy", "artist": "Led Zeppelin" },
        { "name": "Dark Side of the Moon", "artist": "Pink Floyd" },
        { "name": "Sublime", "artist": "Sublime" },
        { "name": "The Decline", "artist": "NOFX" },
        { "name": "No Control", "artist": "Bad Religion" },
        { "name": "Suffer", "artist": "Bad Religion" },
        { "name": "Paul's Boutique", "artist": "Beastie Boys" },
        { "name": "Tales from Wyoming", "artist": "Teenage Bottlerocket" },
        { "name": "Legend", "artist": "Bob Marley & the Wailers" },
        { "name": "Aerosmith's Greatest Hits", "artist": "Aerosmith" },
        { "name": "Fly Like an Eagle", "artist": "Steve Miller Band" },
        { "name": "Appetite for Destruction", "artist": "Guns N' Roses" }
    ]
});
    },
    scroll: function(e) {
        const now = Date.now();
        if ($(".selected .sleeve").contains(e.target)) {
            console.log("scrolling over sleeve");
            return true;
        };
        e.preventDefault();
        e.stopPropagation();
        // console.dir(e);
        if (now - app.carousel.state.delta.last < 100) {
            return false;
        }

        // Reset delta tracking after no movement for 300ms
        if (( now - app.carousel.state.delta.last) > 300) {
            app.carousel.clearDelta()
        }
        app.carousel.state.delta.x += e.wheelDeltaX;
        app.carousel.state.delta.y += e.wheelDeltaY;
        app.carousel.state.delta.last = Date.now();
        
        if ((e.wheelDeltaX < 0) || (e.wheelDeltaY < 0)) {
            if ((app.carousel.state.delta.x < -750) || (app.carousel.state.delta.y < -500)) {
                app.carousel.clearDelta();
                app.carousel.next();
            }
        } else if ((e.wheelDeltaX > 0) || (e.wheelDeltaY > 0)) {
            if ((app.carousel.state.delta.x > 750) || (app.carousel.state.delta.y > 500)) {
                app.carousel.clearDelta();
                app.carousel.previous();
            }
        }
        return false;
    },
    onScroll: function(x) {
        // console.dir(x);

    },
    clearDelta: function() {
        app.carousel.state.delta.x = 0;
        app.carousel.state.delta.y = 0;
    },
    init: function() {
        window.addEventListener("wheel", app.carousel.scroll, { passive: false });
        document.addEventListener("keydown", app.carousel.keypress);

        let wrap = app.carousel.wrapper = $("#carousel");
        wrap.addEventListener("mousedown", app.carousel.doDown);
        wrap.addEventListener("mousemove", app.carousel.doMove);
        wrap.addEventListener("touchstart", app.carousel.doDown, {passive: true});
        wrap.addEventListener("mouseup", app.carousel.doUp);
        wrap.addEventListener("touchend", app.carousel.doup);

        app.carousel.reorder();
        $('#prev').addEventListener("click", app.carousel.previous);
        $('#next').addEventListener("click", app.carousel.next);
        app.carousel.load("https://cdr2.com/autonomic/carousal/sample-albums.json");
        app.selected = $(".selected");

    },
    state: {
        delta: {
            x: 0,
            y: 0,
            last: Date.now()
        },
        sleeve: 0
    },
    data: {
        albums: {},
        artists: {},
        tracks: {},
        albumCount: 0
    },
    config: {
        tabs: ['tracks', 'info', 'albums', 'similar'],
        count: 7,
        counts: {
            similarArtists: 5,
            topAlbums: 5,
            topTracks: 8
        }
    }

}
app.carousel.init();
})();

