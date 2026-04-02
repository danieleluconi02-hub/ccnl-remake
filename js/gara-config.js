// La Gara dei Numeri - Configuration & Asset Paths
const GARA_CONFIG = {
    CANVAS_W: 800,
    CANVAS_H: 600,
    BOARD_SQUARES: 40,
    TURNS_PER_GAME: 20,
    BASE_SPEED: 2,
    THEMES: {
        underwater: {
            name: 'Underwater',
            nameIt: 'Mondo Sottomarino',
            bg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/backgroundUnderwater.gif',
            gameOver: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/gameOverUnderwater.gif',
            instrucs: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/instrucsUnderwater.gif',
            instrucSound: 'Assets/Playground_media/gara_dei_numeri/web_assets/sounds/InstrucScreen/instrucsUnderwater.wav',
            boardColor: '#0a4a7a',
            squareColor1: '#1a6fa8',
            squareColor2: '#0e5a8f',
            hazardColor: '#ff4466',
            characters: [
                { id: 'dolphin6', name: 'Dolphin', imgs: ['dolphin6A.gif','dolphin6B.gif'], icon: 'dolphin6A_100sq.gif', iconSel: 'dolphin6A_100sq_selec.gif' },
                { id: 'dolphin8', name: 'Dolphin 2', imgs: ['dolphin8A.gif','dolphin8B.gif'], icon: 'dolphin8A_100sq.gif', iconSel: 'dolphin8A_100sq_selec.gif' },
                { id: 'orca', name: 'Orca', imgs: ['orcaA.gif','orcaB.gif'], icon: 'orcaA_100sq.gif', iconSel: 'orcaA_100sq_selec.gif' },
                { id: 'whale1', name: 'Whale', imgs: ['whale1A.gif','whale1B.gif'], icon: 'whale1A_100sq.gif', iconSel: 'whale1A_100sq_selec.gif' },
                { id: 'whale2', name: 'Whale 2', imgs: ['whale2A.gif','whale2B.gif'], icon: 'whale2A_100sq.gif', iconSel: 'whale2A_100sq_selec.gif' },
                { id: 'whale3', name: 'Whale 3', imgs: ['whale3A.gif','whale3B.gif'], icon: 'whale3A_100sq.gif', iconSel: 'whale3A_100sq_selec.gif' }
            ],
            enemies: [
                { id: 'crab2', imgs: ['crab2A.gif','crab2B.gif'] },
                { id: 'crab3', imgs: ['crab3A.gif','crab3B.gif'] },
                { id: 'squid', imgs: ['squidA.gif','squidB.gif'] },
                { id: 'puff_fish', imgs: ['puff_fishA.gif','puff_fishB.gif'] }
            ],
            hazards: [
                { id: 'anemone1', imgs: ['anemone1A.gif','anemone1B.gif'] },
                { id: 'anemone2', imgs: ['anemone2A.gif','anemone2B.gif'] },
                { id: 'anemone3', imgs: ['anemone3A.gif','anemone3B.gif'] }
            ],
            rewards: Array.from({length:7},(_,i)=>({ left:`rewardFish${i+1}_left.gif`, right:`rewardFish${i+1}_right.gif` })),
            chestClosed: { left:'leftChestClosed192.gif', right:'rightChestClosed192.gif' },
            chestOpen: { left:'leftChestOpen192.gif', right:'rightChestOpen192.gif' },
            startMarker: 'startMarker.gif',
            finishMarker: 'finishMarker.gif',
            imgBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/',
            characBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/characChoicePage/',
            rewardBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/rewardScreen/',
            gameBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/gameScreens/',
            characBg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/characChoicePage/characChoicePage.gif',
            rewardBg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/rewardScreen/rewardChoiceScreen.gif',
            rewardViewBg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/underWater/rewardScreen/rewardViewScreen.gif'
        },
        jungle: {
            name: 'Jungle',
            nameIt: 'Giungla',
            bg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/backgroundJungle.gif',
            gameOver: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/gameOverJungle.gif',
            instrucs: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/instrucsJungle.gif',
            instrucSound: 'Assets/Playground_media/gara_dei_numeri/web_assets/sounds/InstrucScreen/instrucsJungle.wav',
            boardColor: '#2d5a1e',
            squareColor1: '#3a7a28',
            squareColor2: '#2a6a1e',
            hazardColor: '#cc3300',
            characters: [
                { id: 'singe1', name: 'Monkey', imgs: ['singe1a.gif','singe1b.gif'], icon: 'singe1vert.gif', iconSel: 'singe1violet.gif' },
                { id: 'singe2', name: 'Monkey 2', imgs: ['singe2a.gif','singe2b.gif'], icon: 'singe2vert.gif', iconSel: 'singe2violet.gif' },
                { id: 'singe3', name: 'Monkey 3', imgs: ['singe3a.gif','singe3b.gif'], icon: 'singe3vert.gif', iconSel: 'singe3violet.gif' },
                { id: 'perroquet1', name: 'Parrot', imgs: ['perroquet1a.gif','perroquet1b.gif'], icon: 'perroquet1vert.gif', iconSel: 'perroquet1violet.gif' },
                { id: 'perroquet2', name: 'Parrot 2', imgs: ['perroquet2a.gif','perroquet2b.gif'], icon: 'perroquet2vert.gif', iconSel: 'perroquet2violet.gif' },
                { id: 'elephant', name: 'Elephant', imgs: ['elephant1a.gif','elephant1b.gif'], icon: 'elephantvert.gif', iconSel: 'elephantviolet.gif' }
            ],
            enemies: [
                { id: 'tigre1', imgs: ['tigre1a.gif','tigre1b.gif'] },
                { id: 'tigre2', imgs: ['tigre2a.gif','tigre2b.gif'] },
                { id: 'cobra1', imgs: ['cobra1a.gif','cobra1b.gif'] },
                { id: 'carnivore1', imgs: ['carnivore1a.gif','carnivore1b.gif'] },
                { id: 'carnivore2', imgs: ['carnivore2a.gif','carnivore2b.gif'] },
                { id: 'carnivore3', imgs: ['carnivore3a.gif','carnivore3b.gif'] }
            ],
            hazards: [
                { id: 'serpent1', imgs: ['serpent1a.gif','serpent1b.gif'] }
            ],
            rewards: Array.from({length:7},(_,i)=>({ left:`butterfly${i+1}_left.gif`, right:`butterfly${i+1}_right.gif` })),
            chestClosed: { left:'lefttreeclosed.gif', right:'righttreeclosed.gif' },
            chestOpen: { left:'lefttreeopen.gif', right:'righttreeopen.gif' },
            startMarker: 'startMarker.gif',
            finishMarker: 'finishMarker.gif',
            imgBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/',
            characBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/characChoicePage/',
            rewardBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/rewardScreen/',
            gameBase: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/gameScreens/',
            characBg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/characChoicePage/characChoicePage.gif',
            rewardBg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/rewardScreen/rewardChoiceScreen.gif',
            rewardViewBg: 'Assets/Playground_media/gara_dei_numeri/web_assets/images/inJungle/rewardScreen/rewardViewScreen.gif'
        }
    },
    SOUNDS: {
        base: 'Assets/Playground_media/gara_dei_numeri/web_assets/sounds/',
        music: { intro:'Music/intro.wav', bg:'Music/background2.wav', rewardChoice:'Music/rewardChoice.wav', rewardMusic:'Music/rewardMusic.wav' },
        effects: { cheer:'Effects/cheer.wav', chestOpen:'Effects/chestOpen.wav', iconClick:'Effects/iconClick.wav', right:'Effects/right.wav', wrong1:'Effects/wrong1.wav', wrong2:'Effects/wrong2.wav' },
        help: { chooseSide:'Help/choisiscote.wav', chooseFast:'Help/choisisvite.wav', advance:'Help/faisavancerton.wav', continue:'Help/pourcontinuer.wav', newTraps:'Help/attentionnouveauxpieges.wav' },
        gameOver: { gameOver:'GameOverScreen/jeuxsur.wav', wellDone:'GameOverScreen/bienjoue.wav', youWin:'GameOverScreen/tuasgagne.wav', noLuck:'GameOverScreen/pasdechance.wav', gameEnd:'GameOverScreen/lejeutermine.wav' }
    },
    TITLE_PAGES: Array.from({length:8},(_,i)=>`Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/mainPage${i===0?'':i}.gif`),
    DIFFICULTY: { MIN: 0.1, MAX: 0.99, START: 0.75, STEP_UP: 0.025, STEP_DOWN: 0.05 },
    NOTATION: { DOTS: 0, DIGITS: 1, ARABIC: 2 },
    // Gold tokens required to unlock each character slot (index = character position)
    CHAR_UNLOCK: [0, 3, 8, 15, 25, 40]
};
