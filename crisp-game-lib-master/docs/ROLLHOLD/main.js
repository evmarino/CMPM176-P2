
title = "ROLLHOLD";

description = `
[Hold]
 Hold an angle
`;

characters = [
  `
 ll
lll
lllll
 bb
  cc
 bb
`,
  `
lll
rr
llrrlll
LLRRlll
rr
lll
`,
  `
lrl
llrrlll
LLRRlll
lrl
`,
  `
lrlLll
lrlLll
`,
];

options = {
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  isDrawingParticleFront: true,
  isDrawingScoreFront: true,
  seed: 9,
};

let playerPos = vec(50, 50);
const turretRadius = 12;
let turretAngle;
let turretVa;
/** @type {{pos: Vector, angle: number}[]} */
let shots;
let fireTicks;
/** @type {{pos: Vector, vx: number, score: number, isFired: boolean}[]} */
let enemies;
/** @type {{pos: Vector, vx: number}} */
let nextEnemy;
let nextEnemyTicks;
/** @type {{pos: Vector, vel: Vector}[]} */
let bullets;
/** @type {{pos: Vector, size: Vector}[]} */
let buildings;
let nextBuildingTicks;
let animTicks;

let x = 50

// Power-up Variables
let powerUp = null;
let isPowerUpActive = false;
let powerUpDuration = 180; // Duration of double points effect (3 seconds at 60 fps)
let powerUpRemaining = 0;
let powerUpSpawnTimer = 600; // Power-up spawn delay (10 seconds at 60 fps)

function spawnPowerUp() {
  // Spawn the power-up at a random position with the same horizontal movement as an enemy
  powerUp = {
    pos: vec(rndi(0, 100), rndi(10, 80)),
    vx: (rndi(0, 2) * 2 - 1) * sqrt(difficulty) * 0.4, // Same speed and horizontal direction as an enemy
    isActive: true,
  };
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    if (x < 100){
      x += 1;
    }else {
      x = 0;
    }
  } else if (event.key === 'ArrowLeft') {
    if (x > 0){
      x -= 1;
    }else{
      x = 100;
    }
  }
  playerPos = vec(x, 50);
});


function update() {
  if (!ticks) {
    turretAngle = 0;
    turretVa = 1;
    shots = [];
    fireTicks = 0;
    enemies = [];
    nextEnemy = { pos: vec(), vx: 0 };
    setNextEnemy();
    nextEnemyTicks = 0;
    bullets = [];
    buildings = [];
    nextBuildingTicks = 0;
    animTicks = 0;
    powerUpSpawnTimer = 600;  
  }
  const df = sqrt(difficulty);

  // Power-Up Spawn Logic
  if (powerUp == null && !isPowerUpActive) {
    powerUpSpawnTimer--;
    if (powerUpSpawnTimer <= 0) {
      spawnPowerUp();
      powerUpSpawnTimer = 600;
    }
  }

    // Render and Move Power-Up if Available
    if (powerUp && powerUp.isActive) {
      color("yellow");
      box(powerUp.pos, 8); // Render power-up as a square with the same size as an enemy
      powerUp.pos.x += powerUp.vx * df; // Move horizontally across the screen
  
      // Check if power-up is hit by a bullet or touches the player
      remove(shots, (s) => {
        if (s.pos.distanceTo(powerUp.pos) < 5 || powerUp.pos.distanceTo(playerPos) < 10) { // collision range check
          isPowerUpActive = true;
          powerUpRemaining = powerUpDuration; // Set duration for double points
          play("powerUp");
          particle(powerUp.pos, 10, 1, 0, 0.5); // Particle effect on break
          powerUp = null; // Immediately despawn power-up after being hit or touching player
          console.log(score);
          addScore(score, s.pos);
          console.log(score);
          return true;
        }
        return false;
      });
  
      // Despawn if power-up moves off-screen
      if (powerUp && (powerUp.pos.x < -10 || powerUp.pos.x > 110)) {
        powerUp = null;
      }
    }
  
    // Double Points Effect
    if (isPowerUpActive) {
      powerUpRemaining--;
      if (powerUpRemaining <= 0) {
        isPowerUpActive = false;
      }
    }
  
    // Scoring function that applies double points if power-up is active
    function addScoringPoints(points, pos) {
      addScore(isPowerUpActive ? points * 2 : points, pos);
    }

  nextBuildingTicks--;
  if (nextBuildingTicks <= 0) {
    buildings.push({
      pos: vec(100, 85),
      size: vec(rndi(10, 20), -rndi(30, 60)),
    });
    nextBuildingTicks = rndi(5, 50) * 10;
  }
  remove(buildings, (b) => {
    b.pos.x -= 0.1;
    color("light_black");
    rect(b.pos, b.size);
    color("white");
    rect(b.pos.x + 1, b.pos.y, b.size.x - 2, b.size.y + 1);
    return b.pos.x + b.size.x < 0;
  });
  color("light_cyan");
  rect(0, 85, 100, 20);
  color("light_purple");
  rect(0, 70, 100, 9);
  rect(0, 92, 100, 3);
  animTicks += df;
  if (input.isJustPressed) {
    play("select");
    turretVa *= -1;
    fireTicks = 0;
  }
  const tp = vec(turretRadius).rotate(turretAngle).add(playerPos);
  color("light_cyan");
  if (!input.isPressed) {
    turretAngle = wrap(turretAngle + turretVa * 0.07 * df, -PI, PI);
  } else {
    fireTicks -= df;
    if (fireTicks < 0) {
      play("laser");
      shots.push({ pos: vec(tp), angle: turretAngle });
      fireTicks = 9;
      particle(tp, 3, 1, turretAngle, 0.5);
    }
    bar(tp, 4, 1, turretAngle + (turretVa > 0 ? PI / 2 : -PI / 2), -0.5);
  }
  color("cyan");
  remove(shots, (s) => {
    s.pos.addWithAngle(s.angle, df * 2);
    bar(s.pos, 3, 2, s.angle);
    return !s.pos.isInRect(-9, -9, 120, 120);
  });
  color("black");
  char("a", playerPos, {
    mirror: { x: turretAngle < -PI / 2 || turretAngle > PI / 2 ? -1 : 1 },
  });
  color("blue");
  bar(tp, 2, 3, turretAngle);
  nextEnemyTicks -= df;
  if (nextEnemyTicks < 0) {
    enemies.push({
      pos: vec(nextEnemy.pos),
      vx: nextEnemy.vx,
      score: 9,
      isFired: false,
    });
    if (rnd() < 0.25) {
      setNextEnemy();
      nextEnemyTicks = 120 / df;
    } else {
      nextEnemyTicks = 25 / df;
    }
  }
  color("black");
  remove(enemies, (e) => {
    e.pos.x += e.vx;
    if (
      !e.isFired &&
      ((e.vx > 0 && e.pos.x > 90) || (e.vx < 0 && e.pos.x < 9))
    ) {
      play("click");
      const a = e.pos.angleTo(playerPos);
      bullets.push({
        pos: vec(e.pos),
        vel: vec(df * 0.3).rotate(a),
      });
      particle(e.pos, 3, 2, a, 0.2);
      e.isFired = true;
    }
    const c = char(
      addWithCharCode("b", [0, 1, 2, 1][floor(animTicks / 20) % 4]),
      e.pos,
      { mirror: { x: e.vx > 0 ? 1 : -1 } }
    ).isColliding.rect;
    if (c.cyan || c.blue) {
      play("powerUp", { seed: 5 });
      addScore(c.blue ? 10 : ceil(e.score), e.pos);
      particle(e.pos);
      return true;
    }
    e.score -= 0.033 * df;
    return e.pos.x < -5 || e.pos.x > 105;
  });
  // color("red");
  // remove(bullets, (b) => {
  //   b.pos.add(b.vel);
  //   const c = box(b.pos, 4).isColliding;
  //   if (c.rect.blue) {
  //     play("powerUp");
  //     addScore(10, b.pos);
  //     particle(b.pos);
  //     return true;
  //   } else if (c.char.a) {
  //     x = 50
  //     playerPos = vec(50, 50);
  //     play("explosion");
  //     end();
  //   }
  // });
}

function setNextEnemy() {
  const vx = sqrt(difficulty) * (rndi(2) * 2 - 1) * 0.4;
  nextEnemy.pos.set(vx > 0 ? -3 : 103, rnd(9, 90));
  nextEnemy.vx = vx;
}

