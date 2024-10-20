(function() {
    // Add these variables at the top of your file, with other global variables
    let isMobile = false;
    const mobileBreakpoint = 768; // typical tablet breakpoint

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    let score = 0;
    let isFirstScoreUpdate = true;
    let catX = 0;
    let catY = 0;
    let catVelocityX = 0;
    let catVelocityY = 0;
    const catMaxSpeed = 15; // Increased from 10
    const catAcceleration = 0.8; // Increased from 0.5
    const catDeceleration = 0.95; // Slightly increased from 0.9 for smoother deceleration
    let waveSpeed = 100; // Adjust this value to set the base speed of objects
    let isGameRunning = false;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load images
    let fishImage = new Image();
    let catImage = new Image();
    let loadedTrashImages = [];

    let imagesLoaded = 0;
    const totalImages = 2;

    let catHealth = 100; // New variable for cat's health
    const maxCatHealth = 100; // Maximum cat health

    // Add this to your existing array of images to load
    const trashImages = [
        { src: './assets/trash-can.png', width: 60, height: 80 },    // Doubled from 30x40
        { src: './assets/trash-bottle.png', width: 40, height: 80 }, // Doubled from 20x40
        { src: './assets/trash-bag.png', width: 70, height: 70 },    // Doubled from 35x35
    ];

    // Modify the imageLoaded function
    function imageLoaded() {
        imagesLoaded++;
        console.log(`Image loaded. Total: ${imagesLoaded}/${totalImages + trashImages.length}`); // Debug log
        if (imagesLoaded === totalImages + trashImages.length) {
            console.log('All images loaded. Initializing game.'); // Debug log
            initializeGame();
        }
    }

    // Load cat and fish images
    catImage.onload = imageLoaded;
    catImage.src = './assets/pizza-cat.png'; // Make sure this path is correct

    fishImage.onload = imageLoaded;
    fishImage.src = './assets/buffalo-fish.png'; // Make sure this path is correct

    // Load trash images
    trashImages.forEach((trashItem, index) => {
        const img = new Image();
        img.onload = imageLoaded;
        img.onerror = function() {
            console.error(`Failed to load image: ${trashItem.src}`);
            imageLoaded(); // Still call imageLoaded to avoid blocking the game
        };
        img.src = trashItem.src;
        loadedTrashImages[index] = img;
    });

    let catFacingRight = true; // New variable to track cat's facing direction

    // Define an array of bright, Hawaiian-inspired colors
    const hawaiianColors = [
        '#FF6B6B', // Bright Coral
        '#4ECDC4', // Turquoise
        '#45B7D1', // Ocean Blue
        '#F7FFF7', // White (for contrast)
        '#FFD93D', // Sunny Yellow
        '#FF8C42', // Mango Orange
        '#98D9C2', // Mint Green
        '#E84855', // Hibiscus Red
        '#F9DC5C', // Pineapple Yellow
        '#3185FC', // Tropical Sky Blue
        '#E56399', // Orchid Pink
        '#7AE7C7', // Seafoam Green
        '#FFA69E', // Soft Coral
        '#9B5DE5', // Lavender
        '#00BBF9', // Bright Sky Blue
    ];

    function getRandomHawaiianColor() {
        return hawaiianColors[Math.floor(Math.random() * hawaiianColors.length)];
    }

    // Add this near the top of your script with other initializations
    const waveBackgroundSound = document.getElementById('waveBackgroundSound');

    // Function to start playing the background wave sound
    function startBackgroundWaveSound() {
        waveBackgroundSound.play().catch(e => console.error("Error playing background sound:", e));
    }

    // Function to stop the background wave sound
    function stopBackgroundWaveSound() {
        waveBackgroundSound.pause();
        waveBackgroundSound.currentTime = 0;
    }

    // Adjust these constants near the top of your file
    const INITIAL_MAX_TRASH_ITEMS = 3;
    const MAX_POSSIBLE_TRASH_ITEMS = 10;
    const INITIAL_TRASH_SPAWN_RATE = 0.01;
    const MAX_TRASH_SPAWN_RATE = 0.035;
    const TRASH_SPEED_VARIATION = 0.7;

    // Add these new constants for fish
    const INITIAL_FISH_SPAWN_RATE = 0.005;
    const MAX_FISH_SPAWN_RATE = 0.015;

    // Time (in seconds) to reach maximum difficulty
    const TIME_TO_MAX_DIFFICULTY = 180; // 3 minutes

    // Add these variables to track game progression
    let gameTime = 0;
    let maxTrashItems = INITIAL_MAX_TRASH_ITEMS;
    let trashSpawnRate = INITIAL_TRASH_SPAWN_RATE;
    let fishSpawnRate = INITIAL_FISH_SPAWN_RATE;

    // Add these constants near the top of your file
    const INITIAL_WAVE_SPEED = 2; // Starting speed
    const MAX_WAVE_SPEED = 8; // Maximum speed
    const TIME_TO_MAX_SPEED = 300; // Time (in seconds) to reach max speed (5 minutes)

    // Add this variable to track game progression
    waveSpeed = INITIAL_WAVE_SPEED;

    // Add this variable to track game state
    let isGameOver = false;

    // Define these variables globally if they're not already defined
    let catWidth, catHeight;
    let leftPressed = false;
    let rightPressed = false;
    let upPressed = false;
    let downPressed = false;

    // Adjust these values to make the cat slightly smaller
    const CAT_WIDTH = 200;  // Reduced from 250 to 200
    const CAT_HEIGHT = 200; // Reduced from 250 to 200

    function initializeCat() {
        catWidth = CAT_WIDTH;
        catHeight = CAT_HEIGHT;
        catX = canvas.width / 5; // Adjust initial position
        catY = (canvas.height - catHeight) / 2; // Center vertically
    }

    function initializeGame() {
        // Initialize game state
        isGameRunning = false;
        score = 0;
        catHealth = maxCatHealth;
        isFirstScoreUpdate = true; // Reset this flag when initializing the game
        updateScore();
        updateHealthBar(); // Draw the initial health bar
        
        // Initialize cat position
        initializeCat();
        
        // Show start button initially
        document.getElementById('start-button').style.display = 'inline-block';
        document.getElementById('stop-button').style.display = 'none';

        // Draw initial game state
        drawInitialState();

        // Start the game loop
        requestAnimationFrame(gameLoop);

        gameTime = 0;
        maxTrashItems = INITIAL_MAX_TRASH_ITEMS;
        trashSpawnRate = INITIAL_TRASH_SPAWN_RATE;
        fishSpawnRate = INITIAL_FISH_SPAWN_RATE;
        waveSpeed = INITIAL_WAVE_SPEED;
    }

    function drawInitialState() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCat();
    }

    let lastTime = 0;
    function gameLoop(timestamp) {
        if (!gameLoopRunning) return;

        const deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        update(deltaTime);
        
        if (isGameRunning || isGameOver) {
            requestAnimationFrame(gameLoop);
        } else {
            gameLoopRunning = false;
        }
    }

    function update(deltaTime) {
        if (!isGameRunning) return;

        updateCatPosition();
        
        if (!isGameOver) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawCat();
            updateGameObjects(deltaTime);
            drawGameObjects();
            drawHealthBar();
            drawSurfMoveEffect();
        }
    }

    const surfMoves = [
        { name: 'Aerial', scale: 1.2, rotation: Math.PI * 2 },
        { name: 'Cutback', scale: 1.1, rotation: Math.PI },
        { name: 'Barrel', scale: 0.9, rotation: 0 },
        { name: 'Floater', scale: 1.15, rotation: Math.PI / 2 },
    ];

    let currentSurfMove = null;
    let surfMoveStartTime = 0;
    let surfMoveProgress = 0;

    // Add these variables at the top of your file
    let isTouching = false;
    let touchX = 0;
    let touchY = 0;

    // Modify the touch event listeners
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', () => { isTouching = false; }, { passive: true });

    let lastTapTime = 0;

    function handleTouch(event) {
        event.preventDefault();
        isTouching = true;
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);

        // Detect double tap for trick
        const currentTime = Date.now();
        if (currentTime - lastTapTime < 300) { // 300ms between taps
            performTrick();
        }
        lastTapTime = currentTime;
    }

    // Add these variables at the top of your file
    let targetX = 0;
    let targetY = 0;
    const RESISTANCE = 0.1; // Adjust this value to change the level of resistance (0.1 = 10% movement towards target per frame)

    function updateCatPosition() {
        // Update cat velocity based on key presses
        if (keys.ArrowLeft) {
            catVelocityX = Math.max(catVelocityX - catAcceleration, -catMaxSpeed);
            catFacingRight = false;
        }
        if (keys.ArrowRight) {
            catVelocityX = Math.min(catVelocityX + catAcceleration, catMaxSpeed);
            catFacingRight = true;
        }
        if (keys.ArrowUp) catVelocityY = Math.max(catVelocityY - catAcceleration, -catMaxSpeed);
        if (keys.ArrowDown) catVelocityY = Math.min(catVelocityY + catAcceleration, catMaxSpeed);

        // Update cat position
        catX += catVelocityX;
        catY += catVelocityY;

        // Apply deceleration
        catVelocityX *= catDeceleration;
        catVelocityY *= catDeceleration;

        // Keep the cat within the canvas bounds
        catX = Math.max(0, Math.min(canvas.width - catWidth, catX));
        catY = Math.max(0, Math.min(canvas.height - catHeight, catY));
    }

    function startSurfMove() {
        currentSurfMove = surfMoves[Math.floor(Math.random() * surfMoves.length)];
        surfMoveStartTime = Date.now();
        surfMoveProgress = 0;
        console.log(`Starting surf move: ${currentSurfMove.name}`);
    }

    function updateSurfMove() {
        const elapsedTime = Date.now() - surfMoveStartTime;
        surfMoveProgress = Math.min(elapsedTime / 1000, 1); // Max 1 second for full animation
    }

    function endSurfMove() {
        const endDuration = 500; // 0.5 seconds to return to normal
        const endStartTime = Date.now();

        function animateEnd() {
            const elapsedTime = Date.now() - endStartTime;
            const endProgress = Math.min(elapsedTime / endDuration, 1);
            surfMoveProgress = 1 - endProgress;

            if (endProgress < 1) {
                requestAnimationFrame(animateEnd);
            } else {
                currentSurfMove = null;
                surfMoveProgress = 0;
            }
        }

        animateEnd();
    }

    // Function to check if the device is mobile
    function checkMobile() {
        isMobile = window.innerWidth <= mobileBreakpoint;
    }

    // Call this function initially and on window resize
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const DEBUG_MODE = false; // Set this to true when you want to see the trick threshold

    function drawCat() {
        ctx.save(); // Save the current state of the context
        if (!catFacingRight) {
            // If cat is facing left, flip the image horizontally
            ctx.scale(-1, 1);
            ctx.drawImage(catImage, -catX - catWidth, catY, catWidth, catHeight);
        } else {
            // If cat is facing right, draw normally
            ctx.drawImage(catImage, catX, catY, catWidth, catHeight);
        }
        ctx.restore(); // Restore the context state
    }

    // Near the top of the file, update these audio elements
    const fishCatchSound1 = new Audio('./assets/cat-meow-1.MP3');
    const fishCatchSound2 = new Audio('./assets/cat-bite-1.MP3');
    const fishCatchSound3 = new Audio('./assets/cat-meow-2.MP3');

    // Add this near the top of your script with other initializations
    const fishCatchSounds = [
        fishCatchSound1,
        fishCatchSound2,
        fishCatchSound3
    ];
    let currentSoundIndex = 0;

    function playNextFishCatchSound() {
        const currentSound = fishCatchSounds[currentSoundIndex];
        
        // Only play if the current sound is not already playing
        if (currentSound.paused) {
            currentSound.play().catch(e => console.error("Error playing sound:", e));
            
            // Move to the next sound for the next catch
            currentSoundIndex = (currentSoundIndex + 1) % fishCatchSounds.length;
        }
    }

    // Modify fishArray to include both fish and trash
    let gameObjects = [];

    // Modify the updateGameObjects function
    function updateGameObjects(deltaTime) {
        // Spawn new objects
        if (Math.random() < trashSpawnRate + fishSpawnRate) {
            spawnObject();
        }

        for (let i = gameObjects.length - 1; i >= 0; i--) {
            const obj = gameObjects[i];
            
            // Move the object
            obj.x -= obj.speed * deltaTime;

            // Remove objects that are off-screen
            if (obj.x + obj.width < 0) {
                gameObjects.splice(i, 1);
                continue;
            }

            // Collision detection
            const catCenterX = catX + catWidth / 2;
            const catCenterY = catY + catHeight / 2;
            const objCenterX = obj.x + obj.width / 2;
            const objCenterY = obj.y + obj.height / 2;

            const distanceX = Math.abs(catCenterX - objCenterX);
            const distanceY = Math.abs(catCenterY - objCenterY);

            if (distanceX < (catWidth + obj.width) / 2 * 0.8 &&
                distanceY < (catHeight + obj.height) / 2 * 0.8) {
                if (obj.type === 'fish') {
                    gameObjects.splice(i, 1);
                    score += 10;
                    // Increase cat's health when catching a fish
                    catHealth = Math.min(maxCatHealth, catHealth + 10); // Increase by 10, cap at maxCatHealth
                    updateScore();
                    updateHealthBar(); // Update the health bar display
                    playNextFishCatchSound();
                } else if (obj.type === 'trash') {
                    gameObjects.splice(i, 1);
                    catHealth = Math.max(0, catHealth - 20);
                    updateHealthBar();
                    playCatMeowSound();
                    
                    // Trigger flash effect
                    isFlashing = true;
                    flashStartTime = Date.now();
                }
            }
        }

        // Update flash effect
        if (isFlashing && Date.now() - flashStartTime > flashDuration) {
            isFlashing = false;
        }

        // Check for game over condition
        if (catHealth <= 0) {
            gameOver();
        }

        // Update trick name display time
        if (trickNameDisplayTime > 0) {
            trickNameDisplayTime -= deltaTime;
            console.log("Updating trick name display time:", trickNameDisplayTime);
        }
    }

    function spawnObject() {
        const minY = canvas.height * 0.25;
        const maxY = canvas.height - 50;
        const objectY = minY + Math.random() * (maxY - minY);
        
        const canSpawnTrash = gameObjects.filter(obj => obj.type === 'trash').length < maxTrashItems && Math.random() < trashSpawnRate / (trashSpawnRate + fishSpawnRate);

        if (canSpawnTrash) {
            const trashIndex = Math.floor(Math.random() * trashImages.length);
            const trashItem = trashImages[trashIndex];
            const scaleFactor = Math.random() * 0.3 + 0.5;
            const trashWidth = trashItem.width * scaleFactor;
            const trashHeight = trashItem.height * scaleFactor;
            gameObjects.push({
                x: canvas.width,
                y: objectY,
                width: trashWidth,
                height: trashHeight,
                type: 'trash',
                imageIndex: trashIndex,
                speed: 100 + Math.random() * 50 // Adjust this speed as needed
            });
        } else {
            const fishSize = Math.random() * 40 + 20;
            gameObjects.push({
                x: canvas.width,
                y: objectY,
                width: fishSize,
                height: fishSize,
                type: 'fish',
                speed: 150 + Math.random() * 100 // Adjust this speed as needed
            });
        }
    }

    // Modify the drawGameObjects function
    function drawGameObjects() {
        for (let obj of gameObjects) {
            if (obj.type === 'fish' && fishImage.complete) {
                ctx.drawImage(fishImage, obj.x, obj.y, obj.width, obj.height);
            } else if (obj.type === 'trash' && loadedTrashImages[obj.imageIndex] && loadedTrashImages[obj.imageIndex].complete) {
                ctx.drawImage(loadedTrashImages[obj.imageIndex], obj.x, obj.y, obj.width, obj.height);
            }
        }
    }

    // Modify the drawHealthBar function
    function drawHealthBar() {
        const healthBarY = 10; // Position at the top of the page
        const healthBarWidth = 300; // Increased width for better visibility
        const healthBarHeight = 30; // Increased height
        const healthBarX = (canvas.width - healthBarWidth) / 2; // Center horizontally
        
        // Draw background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Draw health
        const currentHealthWidth = (catHealth / maxCatHealth) * healthBarWidth;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)'; // Semi-transparent green
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
        
        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Health: ${catHealth} / ${maxCatHealth}`, canvas.width / 2, healthBarY + healthBarHeight + 20);
    }

    // Add this function to update the health bar
    function updateHealthBar() {
        drawHealthBar(); // Simply redraw the health bar
    }

    // Add this function to update the score display
    function updateScore() {
        console.log("Updating score..."); // Debug log
        const scoreContainer = document.getElementById('score-container');
        const scoreNumberElement = document.getElementById('score-number');
        console.log("Score elements:", scoreContainer, scoreNumberElement); // Debug log
        if (scoreContainer && scoreNumberElement) {
            scoreNumberElement.textContent = score;
            
            if (isFirstScoreUpdate) {
                scoreNumberElement.style.color = 'white';
                isFirstScoreUpdate = false;
            } else {
                // Get a random Hawaiian-inspired color
                const randomColor = getRandomHawaiianColor();
                scoreNumberElement.style.color = randomColor;
                
                // Trigger animation
                scoreContainer.classList.remove('animate');
                void scoreContainer.offsetWidth; // Trigger reflow
                scoreContainer.classList.add('animate');
            }
            
            console.log("Score updated: " + score); // Debug log
        } else {
            console.error("Score elements not found!"); // Debug log
            console.log("All elements with class 'game-text':", document.getElementsByClassName('game-text')); // Debug log
        }
    }

    function getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r},${g},${b})`;
    }

    // Control cat movement
    const keys = {};
    window.addEventListener("keydown", (e) => {
        keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });

    // Adjust these values to fine-tune touch sensitivity
    const touchSensitivity = 0.15; // Increase this to make touch more sensitive
    const touchMaxSpeed = 15; // Maximum speed from touch input

    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;

    // Add touch event listeners
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);

    function handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    }

    function handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];

        let dx = touch.clientX - lastTouchX;
        let dy = touch.clientY - lastTouchY;

        // Apply sensitivity
        dx *= touchSensitivity;
        dy *= touchSensitivity;

        // Update cat velocity
        catVelocityX += dx;
        catVelocityY += dy;

        // Limit max speed
        const speed = Math.sqrt(catVelocityX * catVelocityX + catVelocityY * catVelocityY);
        if (speed > touchMaxSpeed) {
            const ratio = touchMaxSpeed / speed;
            catVelocityX *= ratio;
            catVelocityY *= ratio;
        }

        // Update cat facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
            catFacingRight = dx > 0;
        }

        // Update last touch position
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    }

    function handleTouchEnd(event) {
        event.preventDefault();
        // Gradually reduce velocity when touch ends
        catVelocityX *= 0.9;
        catVelocityY *= 0.9;
    }

    // Modify the handleInput function to work with both keyboard and touch
    function handleInput() {
        if (isGameRunning) {
            if (keys["ArrowUp"]) catVelocityY -= catAcceleration;
            if (keys["ArrowDown"]) catVelocityY += catAcceleration;
            if (keys["ArrowLeft"]) {
                catVelocityX -= catAcceleration;
                catFacingRight = false;
            }
            if (keys["ArrowRight"]) {
                catVelocityX += catAcceleration;
                catFacingRight = true;
            }

            // Limit max speed
            const speed = Math.sqrt(catVelocityX * catVelocityX + catVelocityY * catVelocityY);
            if (speed > catMaxSpeed) {
                const ratio = catMaxSpeed / speed;
                catVelocityX *= ratio;
                catVelocityY *= ratio;
            }
        }
    }

    // Add event listeners for start and stop buttons
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('stop-button').addEventListener('click', stopGame);

    // Add this event listener near the top of your file, or where you have other event listeners
    document.addEventListener('keydown', handleKeyDown);

    function handleKeyDown(event) {
        if (event.code === 'Space') {
            event.preventDefault(); // Prevent scrolling
            if (!isGameRunning) {
                startGame();
            } else if (!isGameOver) {
                performTrick(); // Call performTrick here
            }
        }
        
        // Keep your existing key handling for game controls here
        if (isGameRunning && !isGameOver) {
            switch(event.code) {
                case 'ArrowLeft':
                    leftPressed = true;
                    break;
                case 'ArrowRight':
                    rightPressed = true;
                    break;
                case 'ArrowUp':
                    upPressed = true;
                    break;
                case 'ArrowDown':
                    downPressed = true;
                    break;
            }
        }
    }

    // Make sure your startGame function looks like this:
    function startGame() {
        if (!isGameRunning) {
            isGameRunning = true;
            isGameOver = false;
            // Reset game state, score, cat position, etc.
            score = 0;
            catHealth = maxCatHealth;
            initializeCat();
            gameObjects = [];
            gameTime = 0;
            // ... any other initializations ...

            if (waveSoundAudio) {
                waveSoundAudio.currentTime = 0;
                waveSoundAudio.play().catch(error => console.error("Audio play failed:", error));
            }

            // Hide start button and show stop button
            document.getElementById('start-button').style.display = 'none';
            document.getElementById('stop-button').style.display = 'inline-block';

            // Start the game loop if it's not already running
            if (!gameLoopRunning) {
                gameLoopRunning = true;
                requestAnimationFrame(gameLoop);
            }
        }
    }

    // And your stopGame function:
    function stopGame() {
        isGameRunning = false;
        // Hide stop button and show start button
        document.getElementById('stop-button').style.display = 'none';
        document.getElementById('start-button').style.display = 'inline-block';
        
        if (waveSoundAudio) {
            waveSoundAudio.pause();
        }

        // Any other cleanup or state reset you need to do when stopping the game
    }

    // Initialize the game when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        initializeGame();
    });

    // Function to resize canvas and adjust game elements
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        checkMobile();
        
        // Adjust cat position when resizing
        if (isMobile) {
            catY = Math.min(catY, canvas.height - canvas.height * 0.5); // Ensure cat doesn't go off-screen
        }
        
        // You might want to adjust other game element sizes here as well
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Call once to set initial size

    function drawSurfMoveEffect() {
        if (currentSurfMove) {
            ctx.save();
            ctx.font = '24px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(currentSurfMove.name, canvas.width / 2, 50);
            ctx.restore();
        }
    }

    // Add this debug function
    function debugGameObjects() {
        console.log('Current game objects:');
        console.log(gameObjects);
    }

    // Near the top of your file with other initializations
    const catMeowSound = new Audio('./assets/cat-meow-2.MP3');

    // Add this function to play the cat meow sound
    function playCatMeowSound() {
        catMeowSound.currentTime = 0; // Reset the audio to the beginning
        catMeowSound.play().catch(e => console.error("Error playing cat meow sound:", e));
    }

    // Modify the updateDifficulty function
    function updateDifficulty() {
        const difficultyProgress = Math.min(gameTime / TIME_TO_MAX_DIFFICULTY, 1);
        
        // Use easing function for spawn rates
        const spawnRateProgress = easeOutQuad(difficultyProgress);
        
        // Gradually increase maxTrashItems (linear progression)
        maxTrashItems = Math.floor(INITIAL_MAX_TRASH_ITEMS + (MAX_POSSIBLE_TRASH_ITEMS - INITIAL_MAX_TRASH_ITEMS) * difficultyProgress);
        
        // Gradually increase trashSpawnRate (with easing)
        trashSpawnRate = INITIAL_TRASH_SPAWN_RATE + (MAX_TRASH_SPAWN_RATE - INITIAL_TRASH_SPAWN_RATE) * spawnRateProgress;

        // Gradually increase fishSpawnRate (with easing, but slower than trash)
        fishSpawnRate = INITIAL_FISH_SPAWN_RATE + (MAX_FISH_SPAWN_RATE - INITIAL_FISH_SPAWN_RATE) * (spawnRateProgress * 0.5);

        // Gradually increase wave speed (with different easing)
        const speedProgress = easeInOutQuad(Math.min(gameTime / TIME_TO_MAX_SPEED, 1));
        waveSpeed = INITIAL_WAVE_SPEED + (MAX_WAVE_SPEED - INITIAL_WAVE_SPEED) * speedProgress;
    }

    // Add this easing function for a smoother speed increase
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Add this easing function
    function easeOutQuad(t) {
        return t * (2 - t);
    }

    // Add this function to handle game over
    function gameOver() {
        isGameOver = true;
        isGameRunning = false;

        // Stop the wave sound
        if (waveSoundAudio) {
            waveSoundAudio.pause();
            console.log("Wave sound stopped (game over)");
        }

        // Display game over message, final score, etc.
        // ...

        // Show start button to allow restarting
        document.getElementById('start-button').style.display = 'inline-block';
        document.getElementById('stop-button').style.display = 'none';
    }

    // Add this variable to track if the game loop is running
    let gameLoopRunning = false;

    // Add this event listener for keyup
    document.addEventListener('keyup', function(event) {
        switch(event.code) {
            case 'ArrowLeft':
                leftPressed = false;
                break;
            case 'ArrowRight':
                rightPressed = false;
                break;
            case 'ArrowUp':
                upPressed = false;
                break;
            case 'ArrowDown':
                downPressed = false;
                break;
        }
    });

    let isTrickActive = false;
    let trickTimer = 0;
    const TRICK_DURATION = 1000; // 1 second for each trick
    let lastTrickTime = 0;
    const TRICK_COOLDOWN = 2000; // 2 seconds cooldown between tricks
    const TRICK_THRESHOLD = canvas.height * 0.25; // Top 1/4 of the page

    function performTrick() {
        const currentTime = Date.now();
        if (!isTrickActive && 
            currentTime - lastTrickTime > TRICK_COOLDOWN && 
            isGameRunning && 
            !isGameOver && 
            catY + catHeight < TRICK_THRESHOLD) {
            isTrickActive = true;
            trickTimer = TRICK_DURATION;
            lastTrickTime = currentTime;
            score += 5;
            updateScore();
            
            // Set a random trick name
            const trickNames = ['Tail Spin', 'Paw Flip', 'Whisker Twist', 'Furry 360', 'Meow Spin'];
            currentTrickName = trickNames[Math.floor(Math.random() * trickNames.length)];
            trickNameDisplayTime = TRICK_NAME_DISPLAY_DURATION;
            
            console.log("Trick performed:", currentTrickName, "Display time set to:", trickNameDisplayTime);
        }
    }

    // ... rest of your game code ...

    // Audio elements
    let waveSoundAudio;

    // Load audio files
    function loadAudio() {
        waveSoundAudio = new Audio('./assets/surf-sound-1.MP3');
        waveSoundAudio.loop = true;
        waveSoundAudio.volume = 0.5; // Set volume to 50%, adjust as needed
        console.log("Attempting to load wave sound");
        
        waveSoundAudio.addEventListener('canplaythrough', () => {
            console.log("Wave sound loaded successfully");
        });
        
        waveSoundAudio.addEventListener('error', (e) => {
            console.error("Error loading wave sound:", e);
        });
    }

    // Call this function when the page loads
    window.addEventListener('load', loadAudio);

    function draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        drawBackground();

        // Draw game objects
        drawGameObjects();

        // Draw cat
        drawCat();

        // Draw flash overlay
        drawFlashOverlay();

        // Draw UI elements
        drawHealthBar();
        drawScore();
        drawTrickName();

        // Draw debug info if needed
        drawDebugInfo();
    }

    let currentTrickName = '';
    let trickNameDisplayTime = 0;
    const TRICK_NAME_DISPLAY_DURATION = 2000; // Display for 2 seconds

    function drawTrickName() {
        if (trickNameDisplayTime > 0) {
            ctx.save(); // Save the current context state
            ctx.font = 'bold 36px Arial'; // Increase font size
            ctx.fillStyle = 'yellow';
            ctx.strokeStyle = 'black'; // Add a stroke for better visibility
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = currentTrickName;
            const x = canvas.width / 2;
            const y = canvas.height / 2; // Center of the screen
            ctx.strokeText(text, x, y); // Draw the stroke
            ctx.fillText(text, x, y); // Draw the fill
            ctx.restore(); // Restore the context state
            console.log("Drew trick name:", currentTrickName, "at", x, y);
        }
    }

    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, 80); // Position below health bar
    }

    function drawDebugInfo() {
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(`Current Trick: ${currentTrickName}`, 10, canvas.height - 60);
        ctx.fillText(`Trick Display Time: ${trickNameDisplayTime.toFixed(2)}`, 10, canvas.height - 40);
        ctx.fillText(`Cat Y: ${catY.toFixed(2)}, Threshold: ${TRICK_THRESHOLD.toFixed(2)}`, 10, canvas.height - 20);
    }

    // Add this to your draw function
    function draw() {
        // ... other drawing code ...
        drawDebugInfo();
    }

    let isFlashing = false;
    let flashDuration = 500; // Duration of the flash in milliseconds
    let flashStartTime = 0;

    function drawFlashOverlay() {
        if (isFlashing) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.35)'; // Red with 35% opacity
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }
})();