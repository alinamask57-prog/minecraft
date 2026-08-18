/* =========================================================
   BLOCKWORLD
   Minecraft-inspired browser voxel sandbox
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    25,
    100
);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    300
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

document.getElementById("game").appendChild(
    renderer.domElement
);


/* =========================================================
   LIGHT
   ========================================================= */

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    1.2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.5
);

sun.position.set(
    50,
    80,
    30
);

sun.castShadow = true;

scene.add(sun);


/* =========================================================
   BLOCK TYPES
   ========================================================= */

const BLOCKS = {

    grass: {
        name: "Grass",
        emoji: "🌿",
        color: 0x4caf50
    },

    dirt: {
        name: "Dirt",
        emoji: "🟫",
        color: 0x795548
    },

    stone: {
        name: "Stone",
        emoji: "⬜",
        color: 0x777777
    },

    wood: {
        name: "Wood",
        emoji: "🪵",
        color: 0x8d6e63
    },

    leaves: {
        name: "Leaves",
        emoji: "🍃",
        color: 0x2e7d32,
        transparent: true
    },

    sand: {
        name: "Sand",
        emoji: "🟨",
        color: 0xe7d28b
    },

    glass: {
        name: "Glass",
        emoji: "🔷",
        color: 0x8ed6ff,
        transparent: true
    },

    diamond: {
        name: "Diamond",
        emoji: "💎",
        color: 0x36e0e8
    },

    gold: {
        name: "Gold",
        emoji: "🟨",
        color: 0xffd700
    },

    bedrock: {
        name: "Bedrock",
        emoji: "⬛",
        color: 0x222222
    }

};

const blockList = Object.keys(BLOCKS);

let selectedBlock = 0;


/* =========================================================
   WORLD
   ========================================================= */

const world = new Map();

const WORLD_SIZE = 60;
const MAX_HEIGHT = 15;

const cubeGeometry =
    new THREE.BoxGeometry(1,1,1);

function key(x,y,z) {
    return `${x},${y},${z}`;
}

function noise(x,z) {

    return (
        Math.sin(x * .17) +
        Math.sin(z * .13) +
        Math.sin((x + z) * .07)
    );
}

function heightAt(x,z) {

    let h =
        5 +
        Math.floor(
            noise(x,z) * 2
        );

    return Math.max(
        2,
        Math.min(MAX_HEIGHT,h)
    );
}


/* =========================================================
   CREATE BLOCK
   ========================================================= */

function addBlock(
    x,
    y,
    z,
    type,
    permanent = false
) {

    if (world.has(key(x,y,z))) {
        return;
    }

    const data = BLOCKS[type];

    const material =
        new THREE.MeshLambertMaterial({
            color: data.color,
            transparent: !!data.transparent,
            opacity: data.transparent ? .65 : 1
        });

    const mesh =
        new THREE.Mesh(
            cubeGeometry,
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData.type = type;

    scene.add(mesh);

    world.set(
        key(x,y,z),
        {
            mesh,
            type,
            permanent
        }
    );
}


function removeBlock(x,y,z) {

    const k = key(x,y,z);

    const block = world.get(k);

    if (!block) return;

    if (block.permanent) return;

    scene.remove(block.mesh);

    block.mesh.geometry.dispose();

    if (block.mesh.material.dispose) {
        block.mesh.material.dispose();
    }

    world.delete(k);
}


/* =========================================================
   GENERATE WORLD
   ========================================================= */

function generateWorld() {

    for (
        let x = -WORLD_SIZE / 2;
        x < WORLD_SIZE / 2;
        x++
    ) {

        for (
            let z = -WORLD_SIZE / 2;
            z < WORLD_SIZE / 2;
            z++
        ) {

            const h = heightAt(x,z);

            for (
                let y = 0;
                y <= h;
                y++
            ) {

                let type;

                if (y === 0) {

                    type = "bedrock";

                } else if (y === h) {

                    type = "grass";

                } else if (y > h - 3) {

                    type = "dirt";

                } else {

                    type = "stone";
                }

                addBlock(
                    x,
                    y,
                    z,
                    type,
                    y === 0
                );
            }

            /* Trees */

            if (
                Math.random() < .035 &&
                h > 4
            ) {

                makeTree(
                    x,
                    h + 1,
                    z
                );
            }
        }
    }
}


/* =========================================================
   TREES
   ========================================================= */

function makeTree(x,y,z) {

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        addBlock(
            x,
            y+i,
            z,
            "wood"
        );
    }

    for (
        let dx = -2;
        dx <= 2;
        dx++
    ) {

        for (
            let dz = -2;
            dz <= 2;
            dz++
        ) {

            for (
                let dy = 2;
                dy <= 4;
                dy++
            ) {

                if (
                    Math.abs(dx) +
                    Math.abs(dz) < 4
                ) {

                    addBlock(
                        x+dx,
                        y+dy,
                        z+dz,
                        "leaves"
                    );
                }
            }
        }
    }
}


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    position: new THREE.Vector3(
        0,
        heightAt(0,0) + 2,
        0
    ),

    velocity: new THREE.Vector3(),

    speed: 5,

    sprint: 8,

    jump: 8,

    health: 20,

    hunger: 20,

    creative: false,

    onGround: false
};

camera.position.copy(
    player.position
);

camera.position.y += 1.6;


/* =========================================================
   POINTER LOCK
   ========================================================= */

const controls =
    new THREE.PointerLockControls(
        camera,
        document.body
    );

scene.add(controls.getObject());


document
    .getElementById("playBtn")
    .onclick = () => {

        player.creative = false;

        document
            .getElementById("startScreen")
            .style.display = "none";

        controls.lock();
    };


document
    .getElementById("creativeBtn")
    .onclick = () => {

        player.creative = true;

        document
            .getElementById("startScreen")
            .style.display = "none";

        controls.lock();
    };


/* =========================================================
   KEYBOARD
   ========================================================= */

const keys = {};

document.addEventListener(
    "keydown",
    e => {

        keys[e.code] = true;

        if (
            e.code.startsWith("Digit")
        ) {

            const n =
                Number(
                    e.code.replace("Digit","")
                );

            if (
                n >= 1 &&
                n <= 8
            ) {

                selectedBlock = n - 1;

                updateHotbar();
            }
        }

        if (
            e.code === "KeyE"
        ) {

            toggleInventory();
        }

        if (
            e.code === "KeyF"
        ) {

            eatFood();
        }
    }
);

document.addEventListener(
    "keyup",
    e => {

        keys[e.code] = false;
    }
);


/* =========================================================
   MOVEMENT
   ========================================================= */

function updatePlayer(dt) {

    let speed =
        keys.ShiftLeft ||
        keys.ShiftRight
            ? player.sprint
            : player.speed;

    if (
        player.creative
    ) {

        speed *= 1.4;
    }

    const direction =
        new THREE.Vector3();

    if (keys.KeyW)
        direction.z -= 1;

    if (keys.KeyS)
        direction.z += 1;

    if (keys.KeyA)
        direction.x -= 1;

    if (keys.KeyD)
        direction.x += 1;

    if (direction.length() > 0) {

        direction.normalize();

        direction.applyQuaternion(
            camera.quaternion
        );

        direction.y = 0;

        player.position.x +=
            direction.x *
            speed *
            dt;

        player.position.z +=
            direction.z *
            speed *
            dt;

    }


    if (
        keys.Space &&
        player.onGround &&
        !player.creative
    ) {

        player.velocity.y =
            player.jump;

        player.onGround = false;
    }


    if (
        player.creative &&
        keys.Space
    ) {

        player.position.y +=
            speed * dt;
    }

    if (
        player.creative &&
        keys.ControlLeft
    ) {

        player.position.y -=
            speed * dt;
    }


    if (!player.creative) {

        player.velocity.y -=
            20 * dt;

        player.position.y +=
            player.velocity.y * dt;

        const ground =
            heightAt(
                Math.round(player.position.x),
                Math.round(player.position.z)
            ) + 1.7;

        if (
            player.position.y <= ground
        ) {

            player.position.y =
                ground;

            player.velocity.y = 0;

            player.onGround = true;
        }
    }


    camera.position.set(
        player.position.x,
        player.position.y,
        player.position.z
    );


    /* Hunger */

    if (
        !player.creative &&
        Math.random() < .002
    ) {

        player.hunger =
            Math.max(
                0,
                player.hunger - 1
            );
    }


    if (
        player.hunger <= 0 &&
        Math.random() < .01
    ) {

        damagePlayer(1);
    }


    if (
        player.position.y < -10
    ) {

        damagePlayer(20);
    }
}


/* =========================================================
   BLOCK INTERACTION
   ========================================================= */

const raycaster =
    new THREE.Raycaster();

function getTargetBlock() {

    raycaster.setFromCamera(
        new THREE.Vector2(0,0),
        camera
    );

    const objects = [];

    world.forEach(
        block => objects.push(block.mesh)
    );

    const hits =
        raycaster.intersectObjects(
            objects,
            false
        );

    if (!hits.length) {
        return null;
    }

    return hits[0];
}


document.addEventListener(
    "mousedown",
    e => {

        if (!controls.isLocked) return;

        const hit =
            getTargetBlock();

        if (!hit) return;

        const pos =
            hit.object.position;

        if (e.button === 0) {

            /* Break */

            if (
                hit.object.userData.type ===
                "bedrock"
            ) {
                return;
            }

            removeBlock(
                Math.round(pos.x),
                Math.round(pos.y),
                Math.round(pos.z)
            );

        }

        if (e.button === 2) {

            /* Place */

            const normal =
                hit.face.normal;

            const x =
                Math.round(
                    pos.x + normal.x
                );

            const y =
                Math.round(
                    pos.y + normal.y
                );

            const z =
                Math.round(
                    pos.z + normal.z
                );

            if (
                y > 0 &&
                y < 50
            ) {

                addBlock(
                    x,
                    y,
                    z,
                    blockList[selectedBlock]
                );
            }
        }
    }
);


/* Disable browser right click */

document.addEventListener(
    "contextmenu",
    e => e.preventDefault()
);


/* =========================================================
   HOTBAR
   ========================================================= */

function updateHotbar() {

    const hotbar =
        document.getElementById(
            "hotbar"
        );

    hotbar.innerHTML = "";

    blockList
        .slice(0,8)
        .forEach(
            (type,index) => {

                const slot =
                    document.createElement("div");

                slot.className =
                    "slot";

                if (
                    index === selectedBlock
                ) {

                    slot.classList.add(
                        "selected"
                    );
                }

                slot.innerHTML = `
                    <span>
                        ${BLOCKS[type].emoji}
                    </span>
                    <small>${index+1}</small>
                `;

                slot.onclick = () => {

                    selectedBlock = index;

                    updateHotbar();
                };

                hotbar.appendChild(slot);
            }
        );
}

updateHotbar();


/* =========================================================
   HEALTH
   ========================================================= */

function updateHUD() {

    const health =
        Math.max(
            0,
            player.health
        );

    const hunger =
        Math.max(
            0,
            player.hunger
        );

    document.getElementById(
        "health"
    ).textContent =
        "❤️".repeat(
            Math.ceil(health / 2)
        );

    document.getElementById(
        "hunger"
    ).textContent =
        "🍗".repeat(
            Math.ceil(hunger / 2)
        );

    document.getElementById(
        "coords"
    ).textContent =
        `X: ${Math.floor(player.position.x)}
         Y: ${Math.floor(player.position.y)}
         Z: ${Math.floor(player.position.z)}`;
}


function damagePlayer(amount) {

    if (player.creative) return;

    player.health -= amount;

    if (
        player.health <= 0
    ) {

        player.health = 0;

        document.getElementById(
            "deathScreen"
        ).style.display = "flex";

        controls.unlock();
    }
}


/* =========================================================
   FOOD
   ========================================================= */

function eatFood() {

    if (
        player.hunger >= 20
    ) return;

    player.hunger =
        Math.min(
            20,
            player.hunger + 6
        );

    player.health =
        Math.min(
            20,
            player.health + 2
        );
}


/* =========================================================
   INVENTORY
   ========================================================= */

function toggleInventory() {

    const inventory =
        document.getElementById(
            "inventory"
        );

    if (
        inventory.style.display ===
        "flex"
    ) {

        inventory.style.display =
            "none";

    } else {

        inventory.style.display =
            "flex";

        renderInventory();

        controls.unlock();
    }
}


document.getElementById(
    "closeInventory"
).onclick = () => {

    document.getElementById(
        "inventory"
    ).style.display = "none";

    controls.lock();
};


function renderInventory() {

    const box =
        document.getElementById(
            "inventoryItems"
        );

    box.innerHTML = "";

    blockList.forEach(
        type => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "inventoryItem";

            item.innerHTML = `
                ${BLOCKS[type].emoji}
                <small>${BLOCKS[type].name}</small>
            `;

            box.appendChild(item);
        }
    );
}


/* =========================================================
   SAVE / LOAD
   ========================================================= */

function saveGame() {

    const savedWorld = [];

    world.forEach(
        (block, k) => {

            if (
                !block.permanent
            ) {

                savedWorld.push({
                    key: k,
                    type: block.type
                });
            }
        }
    );

    localStorage.setItem(
        "blockworldSave",
        JSON.stringify({
            player: {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z,
                health: player.health,
                hunger: player.hunger
            },
            blocks: savedWorld
        })
    );
}


function loadGame() {

    const data =
        localStorage.getItem(
            "blockworldSave"
        );

    if (!data) {

        alert("No save found!");

        return;
    }

    const save =
        JSON.parse(data);

    player.position.set(
        save.player.x,
        save.player.y,
        save.player.z
    );

    player.health =
        save.player.health;

    player.hunger =
        save.player.hunger;

    save.blocks.forEach(
        block => {

            const p =
                block.key
                    .split(",")
                    .map(Number);

            addBlock(
                p[0],
                p[1],
                p[2],
                block.type
            );
        }
    );

    document.getElementById(
        "startScreen"
    ).style.display = "none";

    controls.lock();
}


document.getElementById(
    "loadBtn"
).onclick = loadGame;


/* Auto-save */

setInterval(
    saveGame,
    10000
);


/* =========================================================
   RESPAWN
   ========================================================= */

document.getElementById(
    "respawnBtn"
).onclick = () => {

    player.health = 20;
    player.hunger = 20;

    player.position.set(
        0,
        heightAt(0,0) + 3,
        0
    );

    player.velocity.set(
        0,0,0
    );

    document.getElementById(
        "deathScreen"
    ).style.display = "none";

    controls.lock();
};


/* =========================================================
   DAY / NIGHT
   ========================================================= */

let worldTime = 0;

function updateDayNight(dt) {

    worldTime += dt * .5;

    const angle =
        worldTime * .05;

    sun.position.x =
        Math.cos(angle) * 80;

    sun.position.y =
        Math.sin(angle) * 80;

    sun.position.z = 30;

    if (
        sun.position.y < 0
    ) {

        scene.background.set(
            0x11152e
        );

        scene.fog.color.set(
            0x11152e
        );

        document.getElementById(
            "time"
        ).textContent =
            "🌙 NIGHT";

        sun.intensity = .25;

    } else {

        scene.background.set(
            0x87ceeb
        );

        scene.fog.color.set(
            0x87ceeb
        );

        document.getElementById(
            "time"
        ).textContent =
            "☀️ DAY";

        sun.intensity = 1.5;
    }
}


/* =========================================================
   SIMPLE ENEMIES
   ========================================================= */

const enemies = [];

function createEnemy(x,z) {

    const geometry =
        new THREE.BoxGeometry(
            .9,
            1.8,
            .9
        );

    const material =
        new THREE.MeshLambertMaterial({
            color: 0x55aa55
        });

    const enemy =
        new THREE.Mesh(
            geometry,
            material
        );

    enemy.position.set(
        x,
        heightAt(x,z) + 1,
        z
    );

    enemy.userData.health = 10;

    scene.add(enemy);

    enemies.push(enemy);
}


for (
    let i = 0;
    i < 8;
    i++
) {

    const x =
        Math.floor(
            Math.random() * 40 - 20
        );

    const z =
        Math.floor(
            Math.random() * 40 - 20
        );

    createEnemy(x,z);
}


function updateEnemies(dt) {

    if (player.creative) return;

    enemies.forEach(
        enemy => {

            const dx =
                player.position.x -
                enemy.position.x;

            const dz =
                player.position.z -
                enemy.position.z;

            const distance =
                Math.sqrt(
                    dx*dx +
                    dz*dz
                );

            if (
                distance < 15 &&
                distance > 1.5
            ) {

                enemy.position.x +=
                    (dx / distance) *
                    dt *
                    1.2;

                enemy.position.z +=
                    (dz / distance) *
                    dt *
                    1.2;
            }

            if (
                distance < 1.5
            ) {

                if (
                    Math.random() < .02
                ) {

                    damagePlayer(1);
                }
            }
        }
    );
}


/* =========================================================
   ATTACK ENEMY
   ========================================================= */

function attackEnemy() {

    raycaster.setFromCamera(
        new THREE.Vector2(0,0),
        camera
    );

    const hits =
        raycaster.intersectObjects(
            enemies
        );

    if (!hits.length) return;

    const enemy =
        hits[0].object;

    enemy.userData.health -= 5;

    enemy.material.color.set(
        0xff4444
    );

    setTimeout(
        () => {

            if (enemy.material) {

                enemy.material.color.set(
                    0x55aa55
                );
            }

        },
        100
    );

    if (
        enemy.userData.health <= 0
    ) {

        scene.remove(enemy);

        const index =
            enemies.indexOf(enemy);

        if (index >= 0) {

            enemies.splice(
                index,
                1
            );
        }
    }
}


/* Left click can attack nearby enemy */

document.addEventListener(
    "mousedown",
    e => {

        if (
            e.button === 0 &&
            controls.isLocked
        ) {

            attackEnemy();
        }
    }
);


/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


/* =========================================================
   GAME LOOP
   ========================================================= */

let lastTime =
    performance.now();

function animate() {

    requestAnimationFrame(
        animate
    );

    const now =
        performance.now();

    const dt =
        Math.min(
            (now - lastTime) / 1000,
            .05
        );

    lastTime = now;

    if (
        controls.isLocked
    ) {

        updatePlayer(dt);

        updateEnemies(dt);

        updateDayNight(dt);

        updateHUD();
    }

    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   START
   ========================================================= */

generateWorld();

setTimeout(
    () => {

        document.getElementById(
            "loading"
        ).style.display = "none";

    },
    800
);

animate();
