import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// Player parameters
const player = {
  height: 4,
  speed: 0.08,
  sideTurnSpeed: 0.05,
  verticalTurnSpeed: 0.5,
  gravity: 0.04,
};

// essential variables
let collider_mesh_array = []
let keyPressed = {};
let isColliding_frwd = false;
let isColliding_back = false;
let isColliding_left = false;
let isColliding_right = false;
let loaded = false
let is_pointer_locked = false
let model;

// camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);


// scene
const scene = new THREE.Scene();

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.render(scene, camera);


// keyboard event to store the status of key press
addEventListener("keydown", (e) => {
  keyPressed[e.key.toLowerCase()] = true;
});
addEventListener("keyup", (e) => {
  keyPressed[e.key.toLowerCase()] = false;
});


// pitch and yaw object creation
// pitch stores the camera as a child and yaw stores pitch as a child
// when pitch and yaw rotate the camera moves inherently as the camera is a child of yaw and pitch
var pitchObj = new THREE.Object3D();
pitchObj.add(camera);

var yawObj = new THREE.Object3D();
yawObj.position.y = player.height;
yawObj.add(pitchObj);
scene.add(yawObj);


// Player movement dunction
function player_movement() {
  if (is_pointer_locked && keyPressed["w"] && !isColliding_frwd) {
    yawObj.position.x += Math.sin(-yawObj.rotation.y) * player.speed;
    yawObj.position.z += -Math.cos(-yawObj.rotation.y) * player.speed;
  }
  if (is_pointer_locked && keyPressed["s"] && !isColliding_back) {
    yawObj.position.x -= Math.sin(-yawObj.rotation.y) * player.speed;
    yawObj.position.z -= -Math.cos(-yawObj.rotation.y) * player.speed;
  }
  if (is_pointer_locked && keyPressed["a"] && !isColliding_left) {
    yawObj.position.x -=
      Math.sin(-yawObj.rotation.y + Math.PI / 2) * player.speed;
    yawObj.position.z -=
      -Math.cos(-yawObj.rotation.y + Math.PI / 2) * player.speed;
  }
  if (is_pointer_locked && keyPressed["d"] && !isColliding_right) {
    yawObj.position.x -=
      Math.sin(-yawObj.rotation.y - Math.PI / 2) * player.speed;
    yawObj.position.z -=
      -Math.cos(-yawObj.rotation.y - Math.PI / 2) * player.speed;
  }
  if (keyPressed["q"]) {
    yawObj.position.y += player.speed * 0.2;
  }
  if (keyPressed["e"]) {
    yawObj.position.y -= player.speed * 0.2;
  }
}


// Pointer lock over redner element
const rendererEl = renderer.domElement;
rendererEl.addEventListener("click", () => {
  if (!is_pointer_locked && rendererEl.requestPointerLock) {
    rendererEl.requestPointerLock();
  }
});

// pointer unlock
document.addEventListener("pointerlockchange",()=>{
  console.log("locking system")
  is_pointer_locked = is_pointer_locked? false : true  //switching the is_pointer_locked state
})

// raycast
const raycast_frwd = new THREE.Raycaster();
const raycast_back = new THREE.Raycaster();
const raycast_left = new THREE.Raycaster();
const raycast_right = new THREE.Raycaster();
const raycast_down = new THREE.Raycaster();

raycast_frwd.far = 2;
raycast_back.far = 2;
raycast_left.far = 2;
raycast_right.far = 2;
raycast_down.far = 10;

// collision threshold
let surrounding_raycast_dist = 1.5
let height_raycast_dist = 2

// function to check collisions
function update() {
  const raycast_origin = yawObj.position; //raycast origin

  // raycast directions
  const frwd_direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
    yawObj.quaternion
  );
  const back_direction = new THREE.Vector3(0, 0, 1).applyQuaternion(
    yawObj.quaternion
  );
  const left_direction = new THREE.Vector3(-1, 0, 0).applyQuaternion(
    yawObj.quaternion
  );
  const right_direction = new THREE.Vector3(1, 0, 0).applyQuaternion(
    yawObj.quaternion
  );
  const bottom_direction = new THREE.Vector3(0, -1, 0).applyQuaternion(
    yawObj.quaternion
  );

  raycast_frwd.set(raycast_origin, frwd_direction);
  raycast_back.set(raycast_origin, back_direction);
  raycast_left.set(raycast_origin, left_direction);
  raycast_right.set(raycast_origin, right_direction);
  raycast_down.set(raycast_origin, bottom_direction);

  const intersects_frwd = raycast_frwd.intersectObjects(collider_mesh_array);
  const intersects_back = raycast_back.intersectObjects(collider_mesh_array);
  const intersects_left = raycast_left.intersectObjects(collider_mesh_array);
  const intersects_right = raycast_right.intersectObjects(collider_mesh_array);
  const intersects_down = raycast_down.intersectObjects(collider_mesh_array);

  // logic to stop moving when collision is detected
  if (intersects_frwd.length > 0 && intersects_frwd[0].distance < surrounding_raycast_dist) {
    isColliding_frwd = true;
  } else {
    isColliding_frwd = false;
  }

  if (intersects_back.length > 0 && intersects_back[0].distance < surrounding_raycast_dist) {
    isColliding_back = true;
  } else {
    isColliding_back = false;
  }

  if (intersects_left.length > 0 && intersects_left[0].distance < surrounding_raycast_dist) {
    isColliding_left = true;
  } else {
    isColliding_left = false;
  }

  if (intersects_right.length > 0 && intersects_right[0].distance < surrounding_raycast_dist) {
    isColliding_right = true;
  } else {
    isColliding_right = false;
  }

  if (intersects_down.length > 0 && intersects_down[0].distance < height_raycast_dist) {
    yawObj.position.y =  intersects_down[0].point.y + height_raycast_dist;
  } else if (intersects_down.length > 0 && intersects_down[0].distance > height_raycast_dist + 0.1) {
    yawObj.position.y -= intersects_down[0].distance * player.gravity;
  }
}


// Camera look around mechanic
addEventListener("mousemove", (e) => {
  if (is_pointer_locked && e.movementX) {
    yawObj.rotation.y -= e.movementX * 0.002; //holds camera as a child
  }
  if (is_pointer_locked && e.movementY) {
    pitchObj.rotation.x -= e.movementY * 0.002;
    pitchObj.rotation.x = Math.max( //limiting turnup and down angle
      -Math.PI / 2,
      Math.min(Math.PI / 2, pitchObj.rotation.x)
    );
  }
});


// Load manager
const manager = new THREE.LoadingManager();
manager.onStart = function () {
  console.log("started");
};
manager.onProgress = function () {
  console.log("loading");
};
manager.onLoad = function () {
  collider_mesh_array = model.children[2].children //pushing the collider object to an array
  loaded = true
  collider_mesh_array.forEach(element => {
    element.material.wireframe   = true
    element.material.color.set(0xff0000)
    element.material.transparent   = false
  });
};
manager.onError = function (e) {
  console.log("error: ", e);
};

// lighting
const light = new THREE.AmbientLight();
scene.add(light);
renderer.shadowMapDebug = true;

const point = new THREE.PointLight(0xff0000, 20)
point.position.y = 5.5
point.castShadow = true
// scene.add(point)

const direction = new THREE.DirectionalLight();
direction.intensity = 10;
direction.castShadow = true
scene.add(direction);
renderer.shadowMap.antialias = true;

//GLTF loader
const loader = new GLTFLoader(manager);
loader.load("assets/Museum_Collider.glb", (gltf) => {
  model = gltf.scene;
  model.traverse((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
  scene.add(model);
});

// resize window listener
addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
});


// gui for collision threshold setting
const gui = new GUI()
let obj = {threshold: 1}
const collison_threshold_folder = gui.addFolder("Collision Threshold")
collison_threshold_folder.add(obj, "threshold").min(0).max(2).step(0.1).name("Surrounding Threshold").onChange((value)=>{
  surrounding_raycast_dist = value
})
collison_threshold_folder.add(obj, "threshold").min(0).max(5).step(0.1).name("Height Threshold").onChange((value)=>{
  height_raycast_dist = value
})

// animate
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
  player_movement();  //player player_movement
  if(loaded)  update();   //checks collision
}
animate();
