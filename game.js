const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const roadWidth = canvas.width / 3;
// Tải âm thanh
const engineSound = new Audio("/sounds/background-sound.mp3");
const crashSound = new Audio("/sounds/crash.mp3");


// Tạo biến theo dõi trạng thái âm thanh
let isMuted = false;
const muteButton = document.getElementById("muteButton");

let player = { x: canvas.width / 2 - 25, y: canvas.height - 100, width: 50, height: 100, speed: 5 };
let obstacles = [];
let items = [];
let score = 0;
let gameOver = false;
let keys = {};
let roadLines = [];
let roadSpeed = 3;
let isMenu = true; // Biến này sẽ giúp xác định xem game có đang ở trong menu hay không
// Khởi tạo điểm cao nhất khi bắt đầu trò chơi
let highestScore = localStorage.getItem("highestScore") || 0;
let startTime = Date.now();

// Tải hình ảnh quà và xe
const giftImg = new Image();
giftImg.src = "/images/gift.png";

const playerImg = new Image();
playerImg.src = "/images/playercar.jpg";

const obstacleImages = [
    "/images/obstaclecar.png",
    "/images/obstraclebird.png",
    "/images/obstracletree.jpg"
];

// Tạo menu
function showMenu() {
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.top = "50%";
    menu.style.left = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.background = "linear-gradient(145deg, #ff6f61, #ff3b30)";
    menu.style.padding = "50px";
    menu.style.borderRadius = "20px";
    menu.style.boxShadow = "0px 8px 20px rgba(0, 0, 0, 0.2)";
    menu.style.textAlign = "center";
    menu.style.color = "white";
    menu.style.fontFamily = "'Arial', sans-serif";
    menu.style.fontSize = "24px";
    menu.style.transition = "transform 0.3s ease-out";
    menu.style.transform = "translate(-50%, -50%) scale(1.1)";

    menu.innerHTML = `
        <h1>RACING CAR</h1>
        <p style="margin-bottom: 20px;">Press Enter to Start</p>
        <p style="margin-bottom: 20px;">High Score: ${localStorage.getItem("highestScore") || 0}</p>
        <button id="startButton">Start Game</button>
        <button id="exitButton" style="margin-top: 20px;">Exit</button>
    `;

    document.body.appendChild(menu);

    setTimeout(() => {
        menu.style.transform = "translate(-50%, -50%) scale(1)";
    }, 100);

    document.getElementById("startButton").addEventListener("click", () => {
        document.body.removeChild(menu);
        isMenu = false;
        gameLoop(); // Bắt đầu game
    });

    document.getElementById("exitButton").addEventListener("click", () => {
        window.close(); // Đóng cửa sổ game
    });

    window.addEventListener("keydown", function handleKeyPress(event) {
        if (event.key === "Enter" && isMenu) {
            document.body.removeChild(menu);
            isMenu = false;
            gameLoop(); // Bắt đầu game
        }
    });
}

// Hiển thị menu khi tải trang
showMenu();

// Đặt lặp lại cho âm thanh động cơ
engineSound.loop = true;
engineSound.volume = 0.3;


muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    if (isMuted) {
        engineSound.volume = 0;
        crashSound.volume = 0;
        muteButton.textContent = "Unmute";
    } else {
        engineSound.volume = 1;
        crashSound.volume = 0.3;
        muteButton.textContent = "Mute";
    }
});
window.addEventListener("keypress", (event) => {
        muteButton.click();
})

// Khởi tạo đường kẻ
for (let lane = 1; lane <= 2; lane++) {
    for (let i = 0; i < 10; i++) {
        roadLines.push({ x: lane * roadWidth - 5, y: i * 100, width: 10, height: 50 });
    }
}

// Lắng nghe phím di chuyển
window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function movePlayer() {
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.width) player.x += player.speed;
}

// Tạo chướng ngại vật ngẫu nhiên với vị trí không cố định
function createObstacle() {
    let x = Math.random() * (canvas.width - 50); // Vị trí ngẫu nhiên trong toàn bộ canvas
    let randomImageIndex = Math.floor(Math.random() * obstacleImages.length);
    let obstacleImage = new Image();
    obstacleImage.src = obstacleImages[randomImageIndex];

    obstacles.push({
        x: x,
        y: -100,
        width: 50,
        height: 100,
        speed: 2 + Math.random() * 2,
        image: obstacleImage
    });
}

// Tạo vật phẩm
function createItem() {
    let x = Math.random() * (canvas.width - 30); // Vị trí ngẫu nhiên cho vật phẩm
    items.push({ x, y: -50, width: 30, height: 30, speed: 2 });
}

// Kiểm tra va chạm
function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function update() {
    if (gameOver) return;

    movePlayer();

    roadLines.forEach((line) => {
        line.y += roadSpeed;
        if (line.y > canvas.height) {
            line.y = -50;
        }
    });

    let elapsedTime = (Date.now() - startTime) / 10000;
    let obstacleSpeed = 2 + Math.random() * 2 + elapsedTime / 10;

    items.forEach((item, index) => {
        item.y += item.speed;
        if (checkCollision(player, item)) {
            score += 10;
            items.splice(index, 1);
        }
    });

    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacleSpeed;
        if (checkCollision(player, obstacle)) {
            gameOver = true;
            crashSound.play();
            showGameOverPopup();
        }
    });

    if (Math.random() < 0.02) createObstacle();
    if (Math.random() < 0.01) createItem();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    roadLines.forEach((line) => {
        ctx.fillRect(line.x, line.y, line.width, line.height);
    });

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    obstacles.forEach((obstacle) => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    items.forEach((item) => {
        ctx.drawImage(giftImg, item.x, item.y, item.width, item.height);
    });

    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Highest Score: " + (localStorage.getItem("highestScore") || 0), 10, 40);
}

function showGameOverPopup() {
    let highestScore = localStorage.getItem("highestScore") || 0;
    if (score > highestScore) {
        localStorage.setItem("highestScore", score);
        highestScore = score;
    }

    setTimeout(() => {
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.background = "linear-gradient(145deg, #ff6f61, #ff3b30)";
        popup.style.padding = "30px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0px 8px 20px rgba(0, 0, 0, 0.2)";
        popup.style.textAlign = "center";
        popup.style.color = "white";
        popup.style.fontFamily = "'Arial', sans-serif";
        popup.style.fontSize = "18px";
        popup.style.transition = "transform 0.3s ease-out";
        popup.style.transform = "translate(-50%, -50%) scale(1.1)";

        popup.innerHTML = `
            <h2 style="margin-bottom: 10px; font-size: 24px; font-weight: bold;">Game Over!</h2>
            <p style="margin-bottom: 20px;">Score: ${score}</p>
            <p>Highest Score: ${highestScore}</p>
            <p>Press Enter to Restart or Escape to Exit</p>
            <p>Press M to mute or unmute the sound</p>        `;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.style.transform = "translate(-50%, -50%) scale(1)";
        }, 100);

        window.addEventListener("keydown", function handleKeyPress(event) {
            if (event.key === "Enter") {
                document.body.removeChild(popup);
                restartGame();
                window.removeEventListener("keydown", handleKeyPress);
            } else if (event.key === "Escape") {
                this.window.close(); // Đóng cửa sổ game
                window.removeEventListener("keydown", handleKeyPress);
            }
        });
    }, 100);
}

function restartGame() {
    window.location.reload(); // Tải lại trang để bắt đầu lại trò chơi
    gameLoop();
}

function gameLoop() {
    if (isMenu) return;
    if (!isMuted) engineSound.play();
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}
