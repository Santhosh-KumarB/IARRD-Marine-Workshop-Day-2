// ==========================================
// CONTROL ROOM: STATE MACHINE & FX ENGINE
// ==========================================

let workshopState = 'INIT';

// Substate Trackers
let commSubState = 0;
let optSubState = 0;
let rfcSubState = 0;
let titanicSubState = 0;
let futureSubState = 0;
let sensorSubState = 0;
let powerSubState = 0;
let mtSubState = 0; // Tracks Mariana Trench playlist

let titlesRevealed = false;
let isTransitioning = false;
let bubbleInterval = null;

// Playlist Array for Mariana Trench
const mtPlaylist = [
    'MT-1.mp4', 'MT-2.mp4', 'MT-3.mp4', 'MT-4.mp4', 'MT-5.mp4',
    'MT-6.mp4', 'MT-8.mp4', 'MT-9.mp4', 'MT-10.mp4'
];

// Cache Core DOM Elements
const waitingPhase = document.getElementById('waiting-phase');
const landingPhase = document.getElementById('landing-phase');
const mapPhase = document.getElementById('map-phase');

// Node 3 Cache
const commPhase = document.getElementById('comm-page');
const challengesPhase = document.getElementById('challenges-page');
const opticalPhase = document.getElementById('optical-page');
const rfcPhase = document.getElementById('rfc-page');
const titanicPhase = document.getElementById('titanic-page');
const futureCommPhase = document.getElementById('future-comm-page');

// Node 4 Cache
const sensorPhase = document.getElementById('sensor-page');

// Node 5 Cache
const controlIntroPhase = document.getElementById('control-intro-page');
const feedbackPhase = document.getElementById('feedback-page');
const pidPhase = document.getElementById('pid-page');
const powerIntroPhase = document.getElementById('power-intro-page');
const energySourcesPhase = document.getElementById('energy-sources-page');
const fuelCellPhase = document.getElementById('fuel-cell-page');
const nuclearPhase = document.getElementById('nuclear-page');

// Node 6 Cache
const mtPhase = document.getElementById('mariana-trench-page');

const faderBlack = document.getElementById('fade-to-black');

// Video Elements
const landingVideo = document.getElementById('landing-video');
const vidCommIntro = document.getElementById('vid-comm-intro');
const vidRfc = document.getElementById('vid-rfc');
const vidTitanic = document.getElementById('vid-titanic');
const vidFuture = document.getElementById('vid-future');
const vidSensorIntro = document.getElementById('vid-sensor-intro');
const vidControlIntro = document.getElementById('vid-control-intro');
const vidPowerIntro = document.getElementById('vid-power-intro');
const vidFuelCell = document.getElementById('vid-fuel-cell');
const vidNuclear = document.getElementById('vid-nuclear');
const vidMtMain = document.getElementById('vid-mt-main');

// Specific Phase UI Elements
const landingTitles = document.getElementById('landing-titles');
const bubbleContainer = document.getElementById('bubble-container');
const commTitle1 = document.getElementById('comm-title-1');
const commTitle2 = document.getElementById('comm-title-2');
const commMatrix = document.getElementById('comm-matrix');
const optTitle = document.getElementById('opt-title');
const optMatrix = document.getElementById('opt-matrix');
const rfcTitle = document.getElementById('rfc-title');
const newsContainer = document.getElementById('news-container');
const titanicVideoContainer = document.getElementById('titanic-video-container');
const futureVideoContainer = document.getElementById('future-video-container');
const controlTitle = document.getElementById('control-title');
const powerTitle = document.getElementById('power-title');
const timelineMenu = document.getElementById('timeline-panel');

// STRICT AUDIO PROTOCOL: Force Mute via JS
document.querySelectorAll('video').forEach(vid => vid.muted = true);

// ==========================================
// TIMELINE HUD MENU LOGIC
// ==========================================
function toggleMenu() {
    timelineMenu.classList.toggle('open');
}

function jumpToTimeline(targetPhaseId, targetState) {
    if (isTransitioning) return;
    isTransitioning = true;
    toggleMenu();
   
    faderBlack.style.opacity = '1';
   
    setTimeout(() => {
        // 1. Hide All Sections
        document.querySelectorAll('.fullscreen-section').forEach(el => el.classList.remove('active'));
       
        // 2. Global Deep Cleanup
        stopBubbleEngine();
        document.querySelectorAll('video').forEach(vid => { vid.pause(); vid.currentTime = 0; });
        document.querySelectorAll('.video-node').forEach(node => node.classList.remove('playing'));
       
        // Node 3 Cleanup
        if(vidCommIntro) vidCommIntro.classList.remove('blur-active');
        if(commTitle1) commTitle1.classList.remove('show');
        if(commTitle2) { commTitle2.classList.remove('show', 'top-center'); commTitle2.classList.add('hide', 'dead-center'); }
        if(commMatrix) commMatrix.classList.add('hide');
        if(optTitle) { optTitle.classList.remove('show', 'top-center'); optTitle.classList.add('hide', 'dead-center'); }
        if(optMatrix) optMatrix.classList.add('hide');
        if(rfcTitle) rfcTitle.classList.remove('show'); rfcTitle.classList.add('hide');
        if(newsContainer) newsContainer.classList.remove('fade-blur');
        gsap.set(".news-clipping", { clearProps: "all", opacity: 0 });
        if(titanicVideoContainer) { titanicVideoContainer.classList.remove('show'); titanicVideoContainer.classList.add('hide'); }
        if(futureVideoContainer) { futureVideoContainer.classList.remove('show'); futureVideoContainer.classList.add('hide'); }

        // Node 4 Cleanup
        document.querySelectorAll('.sensor-stage').forEach(el => el.classList.remove('active'));
        document.getElementById('sensor-stage-0').classList.add('active');
        document.getElementById('title-sensor-intro').classList.remove('show');
        document.getElementById('title-sensor-intro').classList.add('hide');

        // Node 5 Cleanup
        if(controlTitle) { controlTitle.classList.remove('show'); controlTitle.classList.add('hide'); }
        if(powerTitle) { powerTitle.classList.remove('show'); powerTitle.classList.add('hide'); }
        let fbRow2 = document.getElementById('feedback-row-2');
        if(fbRow2) fbRow2.classList.add('hide');
        let pidRow2 = document.getElementById('pid-row-2');
        if(pidRow2) pidRow2.classList.add('hide');

        // Node 6 Cleanup
        if(vidMtMain) { vidMtMain.pause(); vidMtMain.removeAttribute('src'); vidMtMain.load(); }

        // 3. Show Target Section
        document.getElementById(targetPhaseId).classList.add('active');
        workshopState = targetState;
       
        // 4. State Triggers
        if (targetState === 'INIT_LANDING') {
            landingTitles.classList.add('show');
            titlesRevealed = true;
            startBubbleEngine();
        }
        else if (targetState === 'NODE_COMM_START') {
            commSubState = 0;
            vidCommIntro.play();
            workshopState = 'NODE_COMM';
        }
        else if (targetState === 'NODE_COMM_MATRIX') {
            commSubState = 3;
            vidCommIntro.classList.add('blur-active');
            commTitle2.classList.remove('hide', 'dead-center');
            commTitle2.classList.add('show', 'top-center');
            commMatrix.classList.remove('hide');
            workshopState = 'NODE_COMM';
        }
        else if (targetState === 'OPTICAL_START') {
            optSubState = 1;
            optTitle.classList.remove('hide');
            optTitle.classList.add('show');
            workshopState = 'OPTICAL_COMM';
        }
        else if (targetState === 'RFC_START') {
            rfcSubState = 0;
            vidRfc.play();
            workshopState = 'RFC_COMM';
        }
        else if (targetState === 'TITANIC_START') {
            titanicSubState = 0;
            workshopState = 'TITANIC_COMM';
        }
        else if (targetState === 'FUTURE_COMM_START') {
            futureSubState = 1;
            futureVideoContainer.classList.remove('hide');
            futureVideoContainer.classList.add('show');
            vidFuture.play();
            workshopState = 'FUTURE_COMM';
        }
        else if (targetState === 'NODE_SENSOR_START') {
            sensorSubState = 0;
            vidSensorIntro.play();
            workshopState = 'NODE_SENSOR';
        }
        else if (targetState === 'NODE_POWER_START') {
            powerSubState = 0;
            vidControlIntro.play();
            workshopState = 'NODE_POWER';
        }
        else if (targetState === 'NODE_POWER_ENERGY') {
            powerSubState = 6;
            vidPowerIntro.play();
            workshopState = 'NODE_POWER';
        }
        else if (targetState === 'NODE_CASE_STUDY_START') {
            mtSubState = 0;
            vidMtMain.src = mtPlaylist[mtSubState];
            vidMtMain.play();
            workshopState = 'NODE_CASE_STUDY';
        }

        faderBlack.style.opacity = '0';
        isTransitioning = false;
    }, 800);
}

// ==========================================
// MASTER INPUT LISTENERS (Spacebar)
// ==========================================
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        processSpacebarLogic();
    }
});

document.getElementById('begin-btn').addEventListener('click', () => {
    if (workshopState === 'INIT_LANDING' && titlesRevealed) {
        processSpacebarLogic();
    }
});

// ==========================================
// MAIN TIMELINE PROGRESSION
// ==========================================
function processSpacebarLogic() {
    if (isTransitioning) return;

    if (workshopState === 'INIT') {
        transitionSection(waitingPhase, landingPhase);
        landingVideo.play();
        workshopState = 'INIT_LANDING';
    }
    else if (workshopState === 'INIT_LANDING') {
        if (!titlesRevealed) return;
        stopBubbleEngine();
        transitionSection(landingPhase, mapPhase);
        workshopState = 'ON_MAP';
    }
    // Node 3 Flows
    else if (workshopState === 'NODE_COMM') {
        if (commSubState === 0) return;
        if (commSubState === 1) {
            commTitle1.classList.remove('show');
            vidCommIntro.classList.add('blur-active');
            setTimeout(() => {
                commTitle2.classList.remove('hide');
                commTitle2.classList.add('show');
                commSubState = 2;
            }, 800);
        }
        else if (commSubState === 2) {
            commTitle2.classList.remove('dead-center');
            commTitle2.classList.add('top-center');
            setTimeout(() => {
                commMatrix.classList.remove('hide');
                commSubState = 3;
            }, 1000);
        }
        else if (commSubState === 3) {
            pauseAllNodeVideos();
            transitionSection(commPhase, challengesPhase);
            workshopState = 'CHALLENGES';
        }
    }
    else if (workshopState === 'CHALLENGES') {
        pauseAllNodeVideos();
        transitionSection(challengesPhase, opticalPhase);
        setTimeout(() => {
            optTitle.classList.remove('hide');
            optTitle.classList.add('show');
            optSubState = 1;
            workshopState = 'OPTICAL_COMM';
        }, 500);
    }
    else if (workshopState === 'OPTICAL_COMM') {
        if (optSubState === 1) {
            optTitle.classList.remove('dead-center');
            optTitle.classList.add('top-center');
            setTimeout(() => {
                optMatrix.classList.remove('hide');
                optSubState = 2;
            }, 1000);
        }
        else if (optSubState === 2) {
            pauseAllNodeVideos();
            transitionSection(opticalPhase, rfcPhase);
            rfcSubState = 0;
            vidRfc.currentTime = 0;
            vidRfc.play();
            workshopState = 'RFC_COMM';
        }
    }
    else if (workshopState === 'RFC_COMM') {
        if (rfcSubState === 1) {
            transitionSection(rfcPhase, titanicPhase);
            titanicSubState = 0;
            workshopState = 'TITANIC_COMM';
        }
    }
    else if (workshopState === 'TITANIC_COMM') {
        if (titanicSubState === 0) {
            isTransitioning = true;
            gsap.set(".news-clipping", { scale: 4, opacity: 0 });
            gsap.to(".news-clipping", {
                scale: 1, opacity: 1, rotation: () => Math.random() * 30 - 15,
                duration: 0.4, stagger: 0.15, ease: "back.out(1.7)",
                onComplete: () => { titanicSubState = 1; isTransitioning = false; }
            });
        }
        else if (titanicSubState === 1) {
            newsContainer.classList.add('fade-blur');
            setTimeout(() => {
                titanicVideoContainer.classList.remove('hide');
                titanicVideoContainer.classList.add('show');
                vidTitanic.play();
                titanicSubState = 2;
            }, 800);
        }
        else if (titanicSubState === 2) {
            transitionSection(titanicPhase, futureCommPhase);
            futureSubState = 0;
            setTimeout(() => {
                futureVideoContainer.classList.remove('hide');
                futureVideoContainer.classList.add('show');
                vidFuture.play();
                futureSubState = 1;
            }, 800);
            workshopState = 'FUTURE_COMM';
        }
    }
    else if (workshopState === 'FUTURE_COMM') {
        if (futureSubState === 1) {
            returnToMapGlobal();
        }
    }
    // Node 4 Flows
    else if (workshopState === 'NODE_SENSOR') {
        if (sensorSubState === 0) return;
       
        if (sensorSubState < 8) {
            let currentStage = document.getElementById(`sensor-stage-${sensorSubState - 1}`);
            let nextStage = document.getElementById(`sensor-stage-${sensorSubState}`);
            currentStage.classList.remove('active');
            nextStage.classList.add('active');
           
            let nextVid = nextStage.querySelector('video');
            if (nextVid) { nextVid.currentTime = 0; nextVid.play(); }
           
            sensorSubState++;
        }
        else if (sensorSubState === 8) {
            returnToMapGlobal();
        }
    }
    // Node 5 Flows (POWER & CONTROL)
    else if (workshopState === 'NODE_POWER') {
        if (powerSubState === 0) return;
       
        if (powerSubState === 1) {
            transitionSection(controlIntroPhase, feedbackPhase);
            powerSubState = 2;
        }
        else if (powerSubState === 2) {
            document.getElementById('feedback-row-2').classList.remove('hide');
            powerSubState = 3;
        }
        else if (powerSubState === 3) {
            pauseAllNodeVideos();
            transitionSection(feedbackPhase, pidPhase);
            powerSubState = 4;
        }
        else if (powerSubState === 4) {
            document.getElementById('pid-row-2').classList.remove('hide');
            powerSubState = 5;
        }
        else if (powerSubState === 5) {
            pauseAllNodeVideos();
            transitionSection(pidPhase, powerIntroPhase);
            powerSubState = 6;
            vidPowerIntro.currentTime = 0;
            vidPowerIntro.play();
        }
        else if (powerSubState === 6) return;

        else if (powerSubState === 7) {
            transitionSection(powerIntroPhase, energySourcesPhase);
            powerSubState = 8;
        }
        else if (powerSubState === 8) {
            pauseAllNodeVideos();
            transitionSection(energySourcesPhase, fuelCellPhase);
            vidFuelCell.currentTime = 0;
            vidFuelCell.play();
            powerSubState = 9;
        }
        else if (powerSubState === 9) {
            transitionSection(fuelCellPhase, nuclearPhase);
            vidFuelCell.pause();
            vidNuclear.currentTime = 0;
            vidNuclear.play();
            powerSubState = 10;
        }
        else if (powerSubState === 10) {
            returnToMapGlobal();
        }
    }
    // Node 6 Flow (MARIANA TRENCH)
    else if (workshopState === 'NODE_CASE_STUDY') {
        // Spacebar during the Case Study instantly escapes to the Mission Map
        returnToMapGlobal();
    }
}

// ==========================================
// CINEMATIC VIDEO END TRIGGERS
// ==========================================
landingVideo.addEventListener('ended', () => {
    if (workshopState === 'INIT_LANDING') {
        landingTitles.classList.add('show');
        titlesRevealed = true;
        startBubbleEngine();
    }
});

vidCommIntro.addEventListener('ended', () => {
    if (workshopState === 'NODE_COMM' && commSubState === 0) {
        commTitle1.classList.add('show');
        commSubState = 1;
    }
});

vidRfc.addEventListener('ended', () => {
    if (workshopState === 'RFC_COMM' && rfcSubState === 0) {
        rfcTitle.classList.remove('hide');
        rfcTitle.classList.add('show');
        rfcSubState = 1;
    }
});

vidSensorIntro.addEventListener('ended', () => {
    if (workshopState === 'NODE_SENSOR' && sensorSubState === 0) {
        document.getElementById('title-sensor-intro').classList.remove('hide');
        document.getElementById('title-sensor-intro').classList.add('show');
        sensorSubState = 1;
    }
});

// Node 5 Specific Triggers
if (vidControlIntro) {
    vidControlIntro.addEventListener('ended', () => {
        if (workshopState === 'NODE_POWER' && powerSubState === 0) {
            controlTitle.classList.remove('hide');
            controlTitle.classList.add('show');
            powerSubState = 1;
        }
    });
}

if (vidPowerIntro) {
    vidPowerIntro.addEventListener('ended', () => {
        if (workshopState === 'NODE_POWER' && powerSubState === 6) {
            powerTitle.classList.remove('hide');
            powerTitle.classList.add('show');
            powerSubState = 7;
        }
    });
}

// Mariana Trench Playlist Engine (Infinite Loop)
if (vidMtMain) {
    vidMtMain.addEventListener('ended', () => {
        if (workshopState === 'NODE_CASE_STUDY') {
            mtSubState++;
           
            // Loop Rule: If it goes past the last video, wrap back to the first video
            if (mtSubState >= mtPlaylist.length) {
                mtSubState = 0;
            }
           
            vidMtMain.src = mtPlaylist[mtSubState];
            vidMtMain.play();
        }
    });
}

// ==========================================
// MAP & NODE NAVIGATION
// ==========================================
function transitionSection(hideSection, showSection) {
    if(hideSection) hideSection.classList.remove('active');
    if(showSection) showSection.classList.add('active');
}

function launchPlaceholder(name) {
    console.log(`[SYSTEM] Placeholder activated for ${name}.`);
}

function launchCommNode() {
    if (isTransitioning) return;
    isTransitioning = true;
    faderBlack.style.opacity = '1';
    setTimeout(() => {
        document.querySelectorAll('.fullscreen-section').forEach(el => el.classList.remove('active'));
        commPhase.classList.add('active');
        faderBlack.style.opacity = '0';
        commSubState = 0;
        vidCommIntro.currentTime = 0;
        vidCommIntro.play();
        workshopState = 'NODE_COMM';
        isTransitioning = false;
    }, 800);
}

function launchSensorNode() {
    if (isTransitioning) return;
    isTransitioning = true;
    faderBlack.style.opacity = '1';
    setTimeout(() => {
        document.querySelectorAll('.fullscreen-section').forEach(el => el.classList.remove('active'));
        sensorPhase.classList.add('active');
       
        document.querySelectorAll('.sensor-stage').forEach(el => el.classList.remove('active'));
        document.getElementById('sensor-stage-0').classList.add('active');
        document.getElementById('title-sensor-intro').classList.remove('show');
        document.getElementById('title-sensor-intro').classList.add('hide');

        faderBlack.style.opacity = '0';
        sensorSubState = 0;
        vidSensorIntro.currentTime = 0;
        vidSensorIntro.play();
        workshopState = 'NODE_SENSOR';
        isTransitioning = false;
    }, 800);
}

function launchPowerNode() {
    if (isTransitioning) return;
    isTransitioning = true;
    faderBlack.style.opacity = '1';
   
    setTimeout(() => {
        document.querySelectorAll('.fullscreen-section').forEach(el => el.classList.remove('active'));
        if (controlIntroPhase) controlIntroPhase.classList.add('active');
       
        let fbRow2 = document.getElementById('feedback-row-2');
        if (fbRow2) fbRow2.classList.add('hide');
        let pidRow2 = document.getElementById('pid-row-2');
        if (pidRow2) pidRow2.classList.add('hide');
        if (controlTitle) { controlTitle.classList.remove('show'); controlTitle.classList.add('hide'); }

        faderBlack.style.opacity = '0';
        powerSubState = 0;
        if (vidControlIntro) { vidControlIntro.currentTime = 0; vidControlIntro.play(); }
       
        workshopState = 'NODE_POWER';
        isTransitioning = false;
    }, 800);
}

function launchCaseStudyNode() {
    if (isTransitioning) return;
    isTransitioning = true;
    faderBlack.style.opacity = '1';
   
    setTimeout(() => {
        document.querySelectorAll('.fullscreen-section').forEach(el => el.classList.remove('active'));
        if(mtPhase) mtPhase.classList.add('active');
       
        faderBlack.style.opacity = '0';
        mtSubState = 0;
       
        if (vidMtMain) {
            vidMtMain.src = mtPlaylist[mtSubState];
            vidMtMain.currentTime = 0;
            vidMtMain.play();
        }
       
        workshopState = 'NODE_CASE_STUDY';
        isTransitioning = false;
    }, 800);
}

// Master Function for safely returning to Map from ANY state
function returnToMapGlobal() {
    if (isTransitioning) return;
    isTransitioning = true;
    faderBlack.style.opacity = '1';
   
    setTimeout(() => {
        document.querySelectorAll('.fullscreen-section').forEach(el => el.classList.remove('active'));
        mapPhase.classList.add('active');
       
        // Deep Cleanup
        if(commTitle1) commTitle1.classList.remove('show');
        if(commTitle2) {
            commTitle2.classList.remove('show', 'top-center');
            commTitle2.classList.add('hide', 'dead-center');
        }
        if(commMatrix) commMatrix.classList.add('hide');
        if(vidCommIntro) vidCommIntro.classList.remove('blur-active');
       
        if(optTitle) {
            optTitle.classList.remove('show', 'top-center');
            optTitle.classList.add('hide', 'dead-center');
        }
        if(optMatrix) optMatrix.classList.add('hide');
       
        if(rfcTitle) { rfcTitle.classList.remove('show'); rfcTitle.classList.add('hide'); }
        if(newsContainer) newsContainer.classList.remove('fade-blur');
       
        gsap.set(".news-clipping", { clearProps: "all", opacity: 0 });
       
        if(titanicVideoContainer) {
            titanicVideoContainer.classList.remove('show');
            titanicVideoContainer.classList.add('hide');
        }
        if(futureVideoContainer) {
            futureVideoContainer.classList.remove('show');
            futureVideoContainer.classList.add('hide');
        }
       
        if(controlTitle) { controlTitle.classList.remove('show'); controlTitle.classList.add('hide'); }
        if(powerTitle) { powerTitle.classList.remove('show'); powerTitle.classList.add('hide'); }

        if(vidMtMain) {
            vidMtMain.pause();
            vidMtMain.removeAttribute('src');
            vidMtMain.load();
        }

        document.querySelectorAll('video').forEach(vid => { vid.pause(); vid.currentTime = 0; });
        pauseAllNodeVideos();

        faderBlack.style.opacity = '0';
        workshopState = 'ON_MAP';
        isTransitioning = false;
    }, 800);
}

function pauseAllNodeVideos() {
    document.querySelectorAll('.video-node video').forEach(vid => { vid.pause(); });
    document.querySelectorAll('.video-node').forEach(node => { node.classList.remove('playing'); });
}

// ==========================================
// COMPONENT CONTROLLERS (Bubbles & Videos)
// ==========================================
function startBubbleEngine() {
    if (bubbleInterval) return;
    bubbleInterval = setInterval(() => {
        if (!titlesRevealed) return;
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
       
        const size = Math.random() * 18 + 6;
        const leftPosition = Math.random() * 100;
        const duration = Math.random() * 4 + 4;
        const sway = (Math.random() * 80 - 40) + 'px';
       
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${leftPosition}%`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.setProperty('--sway-distance', sway);
       
        bubbleContainer.appendChild(bubble);
        setTimeout(() => { bubble.remove(); }, duration * 1000);
    }, 120);
}

function stopBubbleEngine() {
    clearInterval(bubbleInterval);
    bubbleInterval = null;
    if(bubbleContainer) bubbleContainer.innerHTML = '';
}

function togglePlay(nodeElement, videoId) {
    const vid = document.getElementById(videoId);
    if (!vid) return;

    if (vid.paused) {
        vid.play();
        nodeElement.classList.add('playing');
    } else {
        vid.pause();
        nodeElement.classList.remove('playing');
    }
}