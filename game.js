const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const roadWidth = canvas.width / 3;
let player = { x: canvas.width / 2 - 25, y: canvas.height - 100, width: 50, height: 100, speed: 5 };
let obstacles = [];
let items = [];
let score = 0;
let gameOver = false;
let keys = {};
let roadLines = [];
let roadSpeed = 5;
// Tải âm thanh
const engineSound = new Audio("/sounds/background-sound.mp3"); // Âm thanh khi xe chạy
const crashSound = new Audio("/sounds/crash.mp3");   // Âm thanh khi va chạm

// Thiết lập để âm thanh động cơ phát liên tục
engineSound.loop = true; // Âm thanh sẽ lặp lại liên tục
engineSound.volume = 0.3; // Giảm âm lượng để không quá lớn

// Tạo biến để theo dõi trạng thái âm thanh
let isMuted = false;

// Thêm sự kiện cho nút Mute
const muteButton = document.getElementById("muteButton");

muteButton.addEventListener("click", () => {
    isMuted = !isMuted; // Đảo ngược trạng thái âm thanh
    if (isMuted) {
        // Tắt âm thanh
        engineSound.volume = 0;
        crashSound.volume = 0;
        muteButton.textContent = "Unmute"; // Đổi tên nút thành "Unmute"
    } else {
        // Bật âm thanh
        engineSound.volume = 0.3; // Đặt lại âm lượng của âm thanh động cơ
        crashSound.volume = 1;    // Đặt lại âm lượng của âm thanh va chạm
        muteButton.textContent = "Mute"; // Đổi tên nút thành "Mute"
    }
});


// Tải quà
const giftImg = new Image();
giftImg.src = "/images/gift.png";


// Tải hình ảnh xe
const playerImg = new Image();
playerImg.src = "/images/playercar.jpg";

// Mảng chứa các đường dẫn đến hình ảnh của chướng ngại vật
const obstacleImages = [
    "/images/obstaclecar.png",  // Hình ảnh 1
    "/images/obstraclebird.png",  // Hình ảnh 2
    "/images/obstracletree.jpg"   // Hình ảnh 3
];


// Khởi tạo vạch kẻ đường trên mỗi làn
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

// Hàm tạo chướng ngại vật với hình ảnh ngẫu nhiên
function createObstacle() {
    let x = Math.floor(Math.random() * 3) * roadWidth + 10;
    // Chọn ngẫu nhiên một hình ảnh chướng ngại vật từ mảng
    let randomImageIndex = Math.floor(Math.random() * obstacleImages.length);
    let obstacleImage = new Image();
    obstacleImage.src = obstacleImages[randomImageIndex];

    // Thêm đối tượng chướng ngại vật vào mảng
    obstacles.push({
        x: x,
        y: -100,
        width: 50,
        height: 100,
        speed: 3 + Math.random() * 2,
        image: obstacleImage  // Lưu trữ hình ảnh vào đối tượng
    });
}


// Hàm tạo vật phẩm
function createItem() {
    let x = Math.floor(Math.random() * 3) * roadWidth + 25;
    items.push({ x, y: -50, width: 30, height: 30, speed: 3 });
}

// Kiểm tra va chạm
function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

let startTime = Date.now(); // Thời gian bắt đầu trò chơi

// Hàm cập nhật game
function update() {
    if (gameOver) return;

    // Bắt đầu phát âm thanh động cơ khi game đang chạy
    if (!engineSound.isPlaying) {
        engineSound.play();
    }

    movePlayer();

    // Cập nhật vạch kẻ đường
    roadLines.forEach((line) => {
        line.y += roadSpeed;
        if (line.y > canvas.height) {
            line.y = -50;
        }
    });

    // Tính toán thời gian đã trôi qua từ khi bắt đầu game
    let elapsedTime = (Date.now() - startTime) / 1000; // Thời gian tính bằng giây

    // Tăng tốc độ chướng ngại vật theo thời gian
    let obstacleSpeed = 3 + Math.random() * 2 + elapsedTime / 10; // Tăng tốc độ mỗi giây trôi qua

    // Cập nhật vật phẩm
    items.forEach((item, index) => {
        item.y += item.speed;
        if (checkCollision(player, item)) {
            score += 10;
            items.splice(index, 1);
        }
    });

    // Cập nhật xe khác
    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacleSpeed;
        if (checkCollision(player, obstacle)) {
            gameOver = true;
            crashSound.play(); // Phát âm thanh va chạm khi xe tông vào chướng ngại vật
            showGameOverPopup();
        }
    });

    // Thêm xe & vật phẩm ngẫu nhiên
    if (Math.random() < 0.02) createObstacle();
    if (Math.random() < 0.01) createItem();
}


// Hàm vẽ game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ đường kẻ
    ctx.fillStyle = "white";
    roadLines.forEach((line) => {
        ctx.fillRect(line.x, line.y, line.width, line.height);
    });

    // Vẽ xe người chơi bằng hình ảnh
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Vẽ các chướng ngại vật (có thể có hình ảnh khác nhau)
    obstacles.forEach((obstacle) => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Vẽ vật phẩm (quà)
    items.forEach((item) => {
        ctx.drawImage(giftImg, item.x, item.y, item.width, item.height);
    });

    // Hiển thị điểm số
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 10, 20);
}


// Hàm hiển thị thông báo Game Over
function showGameOverPopup() {
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
            <p>Press Enter or Exit</p>
        `;
        document.body.appendChild(popup);

        // Hiệu ứng nhẹ nhàng khi popup xuất hiện
        setTimeout(() => {
            popup.style.transform = "translate(-50%, -50%) scale(1)";
        }, 100);

        // Lắng nghe sự kiện phím
        window.addEventListener("keydown", function handleKeyPress(event) {
            if (event.key === "Enter") {
                document.body.removeChild(popup);
                restartGame(); // Chơi lại
                window.removeEventListener("keydown", handleKeyPress); // Hủy lắng nghe sự kiện sau khi đã xử lý
            } else if (event.key === "Escape") {
                document.body.removeChild(popup); // Thoát
                window.removeEventListener("keydown", handleKeyPress); // Hủy lắng nghe sự kiện sau khi đã xử lý
                // Có thể thêm hành động thoát trò chơi ở đây nếu cần, ví dụ: window.close();
            }
        });
    }, 100);
}


// Hàm restart game
function restartGame() {
    player.x = canvas.width / 2 - 25;
    obstacles = [];
    items = [];
    score = 0;
    gameOver = false;
    gameLoop();
}

// Game loop
function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

gameLoop();
