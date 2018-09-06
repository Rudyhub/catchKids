var stage = document.getElementById('stage');
var Game = {
    stage: stage,
    stageWidth: stage.offsetWidth,
    kidWidth: stage.offsetWidth * .24,
    prevent: {passive: false},
    isOver: false,
    score: 0,
    limit: 30,
    clock: 0,
    music: {
        bgsong: (function(){
            var audio = new Audio();
            audio.src = './audio/bg.mp3';
            audio.loop = true;
            audio.volume = .5;
            return audio;
        })(),
        score: (function(){
            var audio = new Audio();
            audio.src = './audio/score.mp3';
            audio.volume = .5;
            return audio;
        })(),
        win: (function(){
            var audio = new Audio();
            audio.src = './audio/win.mp3';
            return audio;
        })(),
        play: function(audio){
            audio.pause();
            audio.currentTime = 0;
            var t = setTimeout(function(){
                clearTimeout(t)
                audio.play();
            }, 20);
        }
    },
    runningKids: 3,
    outed: 0,
    scenes: [document.createElement('div'), document.createElement('div'), document.createElement('div')],
    style: (function(){
        var style = document.createElement('style');
        document.head.appendChild(style);
        return style
    })(),
    init: function() {
        var _this = this, reg = /^rank-/;
        //初始化一些值
        _this.stageWidth = _this.stage.offsetWidth;
        _this.kidWidth = _this.stageWidth * .24;
        _this.clock = _this.limit;
        _this.score = 0;
        _this.isOver = false;
        _this.outed = 0;
        //恢复舞台
        _this.stage.innerHTML = '';
        //阻止body的默认事件
        // document.body.addEventListener('touchstart', docStartFn, _this.prevent)
        // function docStartFn(e){
        //     e.preventDefault()
        // }
        document.body.addEventListener('touchmove', docMoveFn, _this.prevent);
        function docMoveFn(e){
            if(!reg.test(e.target.className)){
                e.preventDefault();
            }
        }
        //准备场景
        _this.initScene0();
        _this.initScene1();
        _this.initScene2();
        //添加动画style，初始速度为4s
        _this.speedup(4);
    },
    initScene0: function(){
        var _this, btn, nickname, pop;
        _this = this;
        _this.scenes[0].className = 'scene scene1';
        _this.scenes[0].innerHTML = '<img class="title-img" src="img/title.png" alt="标题图片：逃課大作戰" draggable="false">\
        <img class="kid01" src="img/kid01.png" alt="" draggable="false">\
        <img class="teacher" src="img/teacher.png" alt="" draggable="false">\
        <img class="btn01" src="img/btn01.png" alt="" draggable="false">\
        <input class="nickname" type="text" name="nickname" placeholder="輸入暱稱">\
        <div class="logobar"><img class="logo" src="img/logo.png" alt="" draggable="false"></div>';

        btn = _this.scenes[0].querySelector('.btn01');
        nickname = _this.scenes[0].querySelector('.nickname');
        nickname.value = window.localStorage.getItem('nickname');
        pop = utils.popup();
        function enterFn(){
            var nick = nickname.value.trim();
            if(!nick){
                pop.show('<span class="popup-inner">未輸入暱稱</span>');
            } else {
                if(window.localStorage.getItem('nickname')){
                    enterScene1();
                }else{
                    Game.showRules(enterScene1);
                }
                function enterScene1 (){
                    window.localStorage.setItem('nickname', nick);
                    _this.enterScene(1);
                    if(window.localStorage.getItem('bgsong')){
                        _this.music.bgsong.play();
                    }
                }
                //TODO  提交后台
            }
        }
        btn.onclick = enterFn;
        nickname.onkeydown = function (e) {
            if(e.keyCode === 13) enterFn();
        }
    },
    showRules: function(fn){
        var pop = utils.popup(null, this.stage);
        pop.onhide = fn;
        pop.show('<div class="popup-inner">30秒内，抓住正在逃跑的熊孩子並拖到底部罰站，每抓住一個最靠頂部的加15分，中間的加10分，底部的加5分。如果沒抓住，每逃出教室一個將扣5分。</div>');
    },
    initScene1: function(){
        var _this, scene, scoreEl, score, scoreAdd, scoreAddTimer, clockEl, musicBtn, clock;
        _this = this;
        scene = _this.scenes[1];
        window.localStorage.setItem('bgsong', 'play');
        scene.className = 'scene scene2';
        scene.draggable = false;
        scene.innerHTML = '<img class="kid-head" src="img/kid-head.png" draggable="false">\
        <div class="score" draggable="false">0</div>\
        <div class="clock" draggable="false">倒計時：'+_this.limit+'s</div>\
        <div class="music-btn" draggable="false"></div>\
        <img class="door01" src="img/door.png" draggable="false">\
        <img class="door02" src="img/door.png" draggable="false">\
        <img class="teacher02" src="img/teacher.png" draggable="false">\
        <div class="score-add"></div>';

        clockEl = scene.querySelector('.clock');
        clock = _this.clock;
        Object.defineProperty(_this, 'clock', {
            set: function (v) {
                if(v !== clock){
                    clock = v;
                    clockEl.innerHTML = '倒計時：'+ v +'s'
                }
            },
            get: function () {
                return clock
            }
        });

        scoreEl = scene.querySelector('.score');
        scoreAdd = scene.querySelector('.score-add');
        score = _this.score;
        Object.defineProperty(_this, 'score', {
            set: function(v){
                if(v !== score){
                    if(v !== 0){
                        scoreAdd.innerHTML = (v > score ? '+' : '-') + Math.abs(v - score);
                        scoreAdd.className = 'score-add';
                        scoreAddTimer = setTimeout(scoreAddTimerFn, 16.6);
                    }
                    score = v;
                    scoreEl.innerText = v
                }
            },
            get: function(){
                return score
            }
        });
        function scoreAddTimerFn(){
            clearTimeout(scoreAddTimer);
            scoreAdd.className = 'score-add fade-in-out'
        }

        musicBtn = scene.querySelector('.music-btn');
        musicBtn.onclick = function(){
            _this.music.bgsong.paused ? _this.music.bgsong.play() : _this.music.bgsong.pause()
            window.localStorage.setItem('bgsong', _this.music.bgsong.paused ? '' : 'play')
        };
    },
    initScene2: function(){
        var _this, scene, light, lbox, lnum, lscore, ltext, showRank, again, share;
        _this = this;
        scene = _this.scenes[2];
        scene.innerHTML = '<img class="light" src="img/light.png">\
        <div class="level-box" style="width: 84%;height: '+(Game.stageWidth * 0.78)+'px;">\
            <img class="level-num" src="img/level-2.png"><br>\
            <span class="level-score" style="font-size: '+(Game.stageWidth * .06)+'px;">300分</span>\
            <img class="level-text" src="img/level-text1.png" style="height: '+(Game.stageWidth * .07)+'px">\
        </div>\
        <img class="show-rank" src="img/rank-title.png">\
        <div class="rank-below-text" style="font-size: '+(Game.stageWidth * .04)+'px">點擊查看</div>\
        <img class="btn-again" src="img/btn-again.png">\
        <img class="btn-share" src="img/btn-share.png">\
        <img class="logo2" src="img/logo.png">';

        light = scene.querySelector('.light');
        lbox = scene.querySelector('.level-box');
        lnum = scene.querySelector('.level-num');
        lscore = scene.querySelector('.level-score');
        ltext = scene.querySelector('.level-text');
        showRank = scene.querySelector('.show-rank');
        again = scene.querySelector('.btn-again');
        share = scene.querySelector('.btn-share');
        _this.updateScene2 = function () {
            if(_this.score >= 600) {
                light.className = 'light light-show';
                lbox.className = 'level-box level-box-1';
                lnum.src = 'img/level-2.png';
                lnum.className = 'level-num';
                ltext.src = 'img/level-text1.png';
            }else {
                light.className = 'light';
                lbox.className = 'level-box';
                lnum.className = 'level-num level-num-show';
                if(_this.score >= 400){
                    lnum.src = 'img/level-2.png';
                    ltext.src = 'img/level-text2.png';
                }else if(_this.score >= 300 && _this.score < 400){
                    lnum.src = 'img/level-3.png';
                    ltext.src = 'img/level-text3.png';
                }else{
                    lnum.src = 'img/level-4.png';
                    ltext.src = 'img/level-text4.png';
                }
            }
            lscore.innerText = _this.score + '分';
        };
        showRank.onclick = function(){
            _this.showRank();
        };
        again.onclick = function () {
            _this.restart();
        };
        share.onclick = function () {
            utils.share();
        }
    },
    updateScene2: null,
    showRank: function(){
        var pop, box, xhr, items, len, i, html;
        pop = utils.popup(null, this.stage);
        box = document.createElement('div');
        xhr = new XMLHttpRequest();
        xhr.open('get', 'test.json', true);
        xhr.onreadystatechange = function () {
            if(xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        items = typeof xhr.response === 'object' ? xhr.response : JSON.parse(xhr.response);
                    } catch (e) {
                        box.innerHTML = '加載失敗，稍後重試！';
                        return;
                    }
                    if (items.code === 0) {
                        box.className = 'rank';
                        items = items.data;
                        items.sort(function(a, b){
                            return b.score - a.score
                        });
                        len = items.length;
                        html = '';
                        for (i = 0; i < len; i++) {
                            html += '<div class="rank-item">\
                            <div class="rank-num">' + (i + 1) + '</div>\
                            <div class="rank-nick">' + items[i].nickname + '</div>\
                            <div class="rank-score">' + items[i].score + '分</div>\
                        </div>';
                        }
                        box.innerHTML = '<img class="rank-title" src="img/rank-title.png">\
                            <div class="rank-body" style="height: ' + (window.innerHeight * .6) + 'px;">\
                                <div class="rank-list">' + html + '</div>\
                            </div>\
                            <img class="rank-back popup-close" src="img/back.png">';
                    } else {
                        box.innerHTML = '加載失敗，稍後重試！';
                    }
                }else{
                    box.className = 'popup-inner';
                    box.innerHTML = '加載失敗，稍後重試！';
                }
            }
        };
        xhr.send();
        box.className = 'popup-inner loading-icon';
        box.innerHTML = 'loading...';
        pop.show(box);
    },
    createKid: function(fn){
        var _this, kid, rand, clientX, clientY, className;
        _this = this;
        kid = document.createElement('div');
        rand = Math.floor(Math.random()*3.5 + 1);
        className = 'student running student' + rand;
        kid.draggable = false;
        kid.className = className;
        kid.innerHTML = '<img class="running01" src="img/running01.png" draggable="false"/>\
            <img class="running02" src="img/running02.png" draggable="false">\
            <img class="kid-caught" src="img/kid01.png" draggable="false">';

        kid.addEventListener('touchstart', startFn, _this.prevent);
        kid.addEventListener('touchmove', moveFn, _this.prevent);
        kid.addEventListener('touchend', endFn, _this.prevent);
        kid.addEventListener('webkitAnimationIteration', anmFn);
        kid.addEventListener('animationiteration', anmFn);

        function startFn(e) {
            e.preventDefault();
            if(_this.isOver) return;
            this.className = 'student'
        }
        function moveFn(e) {
            e.preventDefault();
            if(_this.isOver) return;
            clientX = e.targetTouches[0].clientX;
            clientY = e.targetTouches[0].clientY;
            this.style.top = (clientY - _this.kidWidth/2) + 'px';
            this.style.left = (clientX - _this.kidWidth/2) + 'px'
        }
        function endFn() {
            if(_this.isOver) return;
            if((this.offsetTop + _this.kidWidth) / _this.stage.offsetHeight > .9){
                this.style.bottom = '0';
                this.style.top = '';
                if(/student1/.test(className)){
                    _this.score += 15
                } else if(/student2/.test(className)){
                    _this.score += 10
                } else {
                    _this.score += 5
                }
                _this.music.play(_this.music.score);
                if(fn) fn()
            } else {
                this.className = className
            }
        }
        function anmFn(e) {
            if(/running-path/.test(e.animationName)){
                _this.outed++;
                if(_this.score > 5){
                    _this.score -= 5;
                }
                rand = Math.floor(Math.random()*3.5 + 1);
                className = 'student running student' + rand;
                this.removeAttribute('style');
                this.className = className
            }
        }
        return kid
    },
    addKids: function(scene){
        var _this, kidNum, kidTimer, clockTimer;
        _this = this;
        kidNum = 0;
        kidTimer = setInterval(function () {
            kidNum++;
            if(kidNum > _this.runningKids) clearInterval(kidTimer);
            addKid()
        }, 300);
        this.isOver = false;
        clockTimer = setInterval(function () {
            _this.clock--;
            if(_this.clock <= 0) {
                var runningKids, len, i;
                clearInterval(clockTimer);
                runningKids = document.querySelectorAll('.running');
                len = runningKids.length;
                for(i=0; i<len; i++){
                    runningKids[i].className = 'student';
                    runningKids[i].removeAttribute('style')
                }
                _this.isOver = true
                _this.gameOver()
            }
            if (_this.clock > 0 && _this.clock % 5 === 0){
                _this.speedup(_this.clock/_this.limit * 2+2)
            }
        }, 1000);
        function addKid() {
            scene.appendChild(_this.createKid(function(){
                addKid()
            }))
        }
    },
    speedup: function(speed){
        speed = speed || 4;
        this.style.innerText = '.student{\
            -webkit-animation-duration: '+speed+'s;\
            -moz-animation-duration: '+speed+'s;\
            -o-animation-duration: '+speed+'s;\
            animation-duration: '+speed+'s;\
        }';
    },
    enterScene: function(index){
        this.stage.innerHTML = '';
        this.stage.appendChild(this.scenes[index]);
        switch (index) {
            case 1:
                var kids = this.scenes[1].querySelectorAll('.student');
                for(var i=0, len=kids.length; i<len; i++){
                    this.scenes[1].removeChild(kids[i]);
                }
                this.addKids(this.scenes[1]);
                break;
            default:
                this.scenes[0].classList.add('on');
        }
    },
    gameOver(){
        this.updateScene2();
        utils.popup(null, this.stage).show(this.scenes[2]);
        window.localStorage.setItem('score', this.score);
    },
    restart: function(){
        this.clock = this.limit;
        this.score = 0;
        this.isOver = false;
        this.outed = 0;
        this.enterScene(1);
    },
    start: function(){
        this.init();
        this.enterScene(0)
    }
};

function main(){
    var medias = ['back.png','bg01.jpg', 'bg02.jpg', 'btn01.png', 'btn-again.png', 'btn-share.png',
            'cover.jpg', 'door.png', 'kid01.png', 'kid-head.png',
            'level-1.png', 'level-2.png', 'level-3.png', 'level-4.png', 'level-bg.png', 'light.png',
            'level-text1.png', 'level-text2.png', 'level-text3.png', 'level-text4.png','logo.png',
            'music-icon.png', 'rank-title.png', 'running01.png', 'running02.png', 'teacher.png', 'title.png'],
        len = medias.length,
        i = 0;
    for(; i<len; i++) {
        medias[i] = './img/'+medias[i];
    }
    medias.push('./audio/bg.mp3', './audio/win.mp3', './audio/score.mp3');
    utils.ready(medias, function () {
        Game.start();
    })
}
main();