'use strict';

Physijs.scripts.worker = 'vendor/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

const json_loader = new THREE.JSONLoader();
const object_loader = new THREE.ObjectLoader();

var initScene,
  render,
  ground_material,
  renderer,
  render_stats,
  physics_stats,
  scene,
  ground,
  light,
  camera,
  vehicle_body,
  vehicle,
  loader,
  config,
  input,
  ball;

var primaryCar = {},
  secondaryCar = {};

vehicle = [undefined, undefined];
input = [undefined, undefined];

var Axis = function (matrix, axis) {
  return new THREE.Vector3(
    matrix.elements[4 * axis],
    matrix.elements[4 * axis + 1],
    matrix.elements[4 * axis + 2]
  );
};

let resetVehicle = function (number) {
  vehicle[number].mesh.position.set(20 * number, 2, 0);
  vehicle[number].mesh.setLinearVelocity(new THREE.Vector3(0, 0, 0));
  vehicle[number].mesh.__dirtyPosition = true;
  vehicle[number].mesh.rotation.set(0, 0, 0);
  vehicle[number].mesh.__dirtyRotation = true;
};

let jumpVehicle = function (number) {
  var vehicle_to_jump = vehicle[number];
  var force = 0.0;
  for (var i = 0; i < vehicle_to_jump.wheels.length; i++) {
    var local = new THREE.Vector3(
      vehicle_to_jump.wheels[0].matrix.elements[12],
      vehicle_to_jump.wheels[0].matrix.elements[13],
      vehicle_to_jump.wheels[0].matrix.elements[14]
    );
    var dist = local.y;
    var contraction = dist < 1.5 ? 1.0 : 0.0;
    force += contraction;
  }
  if (contraction > 0.0) {
    force = (config.jump_force * contraction) / vehicle_to_jump.wheels.length;
    vehicle_to_jump.mesh.applyCentralImpulse(new THREE.Vector3(0, force, 0));
    var v = new THREE.Vector3(
      vehicle_to_jump.mesh.matrixWorld.elements[8],
      vehicle_to_jump.mesh.matrixWorld.elements[9],
      vehicle_to_jump.mesh.matrixWorld.elements[10]
    );
  }
};

let setVehicle = function (car, number) {
  var load_car = car.load_car.clone().translate(0, -0.9, 0);
  load_car.scale(1.4, 1.4, 1.4);

  if (vehicle[number]) {
    scene.remove(vehicle[number]);
  }

  var mesh = new Physijs.ConvexMesh(load_car, new THREE.MeshFaceMaterial(car.load_car_materials));
  mesh.position.y = 2;
  mesh.position.x = number * 20;
  mesh.__dirtyPosition = true;
  mesh.castShadow = mesh.receiveShadow = true;

  vehicle[number] = new Physijs.Vehicle(
    mesh,
    new Physijs.VehicleTuning(
      config.suspension_stiffness,
      config.suspension_compression,
      config.suspension_damping,
      config.max_suspension_travel,
      config.fraction_slip,
      config.max_suspension_force
    )
  );
  scene.add(vehicle[number]);

  var wheel_material = new THREE.MeshFaceMaterial(car.load_wheel_materials);

  const otherWheel = car.load_wheel.clone().rotateY(Math.PI);

  for (var i = 0; i < 4; i++) {
    vehicle[number].addWheel(
      i % 2 === 0 ? car.load_wheel : otherWheel,
      wheel_material,
      new THREE.Vector3(i % 2 === 0 ? -1.6 : 1.6, -1, i < 2 ? 2.865 : -2.5),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(-1, 0, 0),
      0.5,
      0.7,
      i < 2 ? false : true
    );
  }
};

initScene = function () {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true;
  document.getElementById('viewport').appendChild(renderer.domElement);

  render_stats = new Stats();
  render_stats.domElement.style.position = 'absolute';
  render_stats.domElement.style.top = '0';
  render_stats.domElement.style.zIndex = 100;
  document.getElementById('viewport').appendChild(render_stats.domElement);

  physics_stats = new Stats();
  physics_stats.domElement.style.position = 'absolute';
  physics_stats.domElement.style.top = '0';
  physics_stats.domElement.style.left = '80px';
  physics_stats.domElement.style.zIndex = 100;
  document.getElementById('viewport').appendChild(physics_stats.domElement);

  scene = new Physijs.Scene();
  scene.setGravity(new THREE.Vector3(0, -30, 0));

  scene.addEventListener('update', function () {
    for (var i = 0; i < 2; i++) {
      if (input[i]) {
        if (vehicle[i]) {
          var direction = Axis(vehicle[i].mesh.matrixWorld, 2);
          var linVelocity = vehicle[i].mesh.getLinearVelocity();
          var directionalSpeed = direction.dot(linVelocity);

          if (input[i].direction !== null) {
            input[i].steering += input[i].direction / 25;
            if (input[i].steering < -0.6) input[i].steering = -0.6;
            if (input[i].steering > 0.6) input[i].steering = 0.6;
          } else {
            input[i].steering *= 0.9;
          }
          vehicle[i].setSteering(input[i].steering, 0);
          vehicle[i].setSteering(input[i].steering, 1);

          // vehicle.setSteering(input.steering, 4);
          // vehicle.setSteering(input.steering, 5);

          if (input[i].power === true && input[i].forward === true) {
            vehicle[i].applyEngineForce(config.power / (1 + Math.max(0.0, directionalSpeed) * 0.1));
          } else if (input[i].power === true && input[i].forward === false) {
            vehicle[i].applyEngineForce(-config.power * 0.2);
            // } else if (input[i].power === false) {
            //   vehicle[i].setBrake(20, 2);
            //   vehicle[i].setBrake(20, 3);
          } else {
            vehicle[i].applyEngineForce(0);
          }
        }
      }

      scene.simulate(undefined, 2);
      physics_stats.update();
    }
  });

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 2000);
  scene.add(camera);

  // Light

  // var sndlight = new THREE.AmbientLight( 0x333344);
  // var sndlight = new THREE.AmbientLight( 0x434354);
  var sndlight = new THREE.HemisphereLight("rgb(255,255,240)", "rgb(191,180,153)", 1);
  scene.add( sndlight );

  // var light2 = new THREE.DirectionalLight( 0xFFFFFF,0.1 );
  // scene.add( light2 );


  light = new THREE.DirectionalLight("rgb(75,75,75)",0.2 );
  light.position.set( 200, 200, -150 );
  light.target.position.copy( scene.position );
  light.castShadow = true;
  light.shadowCameraLeft = -150;
  light.shadowCameraTop = -150;
  light.shadowCameraRight = 150;
  light.shadowCameraBottom = 150;
  light.shadowCameraNear = 20;
  light.shadowCameraFar = 1500;
  light.shadowBias = -.0001;
  light.shadowMapWidth = light.shadowMapHeight = 2048;	//no effect?
  light.shadowDarkness = .7;
  scene.add( light );

  ball = new Physijs.SphereMesh(
    new THREE.SphereGeometry(3, 12, 12),
    new THREE.MeshPhongMaterial({ color: 0xffffff }),
    1
  );

  scene.add(ball);
  // Loader
  loader = new THREE.TextureLoader();

  // Materials
  ground_material = Physijs.createMaterial(
    new THREE.MeshLambertMaterial({
      map: loader.load('images/paper.jpg'),
    }),
    0.8, // high friction
    0.4 // low restitution
  );
  ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
  ground_material.map.repeat.set(3, 3);

  // Ground
  var NoiseGen = new SimplexNoise();

  var ground_geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  ground_geometry.computeFaceNormals();
  ground_geometry.computeVertexNormals();

  // If your plane is not square as far as face count then the HeightfieldMesh
  // takes two more arguments at the end: # of x faces and # of z faces that were passed to THREE.PlaneMaterial
  ground = new Physijs.PlaneMesh(
    ground_geometry,
    ground_material,
    0 // mass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  var objects = {};

  json_loader.load('models/oak.json', function (oak_obj, oak_materials) {
    json_loader.load('models/birch.json', function (birch_obj, birch_materials) {
      json_loader.load('models/bumper.json', function (bumper_obj, bumper_materials) {
        const oak = new THREE.Mesh(oak_obj, new THREE.MeshFaceMaterial(oak_materials), 0);
        oak.position.set(0, 0, 0);
        oak.scale.set(2, 2, 2);
        objects.oak = oak;

        const birch = new THREE.Mesh(birch_obj, new THREE.MeshFaceMaterial(birch_materials), 0);
        birch.position.set(0, 0, 0);
        birch.scale.set(2, 2, 2);
        objects.birch = birch;

        const bumper = new Physijs.BoxMesh(
          bumper_obj,
          new THREE.MeshFaceMaterial(bumper_materials),
          0
        );
        bumper.position.set(0, 0, 0);
        bumper.scale.set(3, 3, 3);
        objects.bumper = bumper;

        objectsReady();
      });
    });
  });

  function placeObj(obj, pos, rot = 0, freeze = false) {
    const clone = obj.clone();
    clone.setAngu;
    clone.position.set(pos[0], pos[1], pos[2]);
    clone.rotation.y = rot;

    if (freeze) {
      clone.setAngularFactor(new THREE.Vector3(0, 0, 0));
      clone.setLinearFactor(new THREE.Vector3(0, 0, 0));
    }

    scene.add(clone);
  }

  function objectsReady() {
    placeObj(objects.oak, [0, 0, 0], 0);

    placeObj(objects.bumper, [10, 0, 0], 0, true);
  }

  json_loader.load('models/car1.json', function (car1, car1_materials) {
    json_loader.load('models/car2.json', function (car2, car2_materials) {
      json_loader.load('models/mustang_wheel.json', function (wheel, wheel_materials) {
        primaryCar.load_car = car1;
        primaryCar.load_car_materials = car1_materials;
        primaryCar.load_wheel = wheel;
        primaryCar.load_wheel_materials = wheel_materials;

        secondaryCar.load_car = car2;
        secondaryCar.load_car_materials = car2_materials;
        secondaryCar.load_wheel = wheel;
        secondaryCar.load_wheel_materials = wheel_materials;

        setVehicle(primaryCar, 0);
        setVehicle(secondaryCar, 1);

        input = [
          {
            power: null,
            direction: null,
            steering: 0,
            forward: true,
          },
          {
            power: null,
            direction: null,
            steering: 0,
            forward: true,
          },
        ];

        document.addEventListener('keydown', function (ev) {
          switch (ev.keyCode) {
            case 37: // left
              input[0].direction = 1;
              break;

            case 38: // forward
              input[0].power = true;
              input[0].forward = true;
              break;

            case 39: // right
              input[0].direction = -1;
              break;

            case 40: // back
              input[0].power = true;
              input[0].forward = false;
              break;

            case 65: // left
              input[1].direction = 1;
              break;

            case 87: // forward
              input[1].power = true;
              input[1].forward = true;
              break;

            case 68: // right
              input[1].direction = -1;
              break;

            case 83: // back
              input[1].power = true;
              input[1].forward = false;
              break;

            case 88: // "X"
              jumpVehicle(1);
              break;

            case 191: // "/"
              jumpVehicle(0);
              break;

            case 82: // R
              ball.position.set(0, 3, 0);
              ball.setAngularVelocity(new THREE.Vector3(0, 0, 0));
              ball.setLinearVelocity(new THREE.Vector3(0, 0, 0));
              ball.__dirtyPosition = true;
              break;
          }
        });

        document.addEventListener('keyup', function (ev) {
          switch (ev.keyCode) {
            case 37: // left
              input[0].direction = null;
              break;

            case 38: // forward
              input[0].power = false;
              break;

            case 39: // right
              input[0].direction = null;
              break;

            case 40: // back
              input[0].power = false;
              break;
            case 49: // 1
              if (vehicle[0]) {
                resetVehicle(0);
              }
              break;
            case 50: // T
              if (vehicle[1]) {
                resetVehicle(1);
              }
              break;

            case 65: // left
              input[1].direction = null;
              break;

            case 87: // forward
              input[1].power = false;
              break;

            case 68: // right
              input[1].direction = null;
              break;

            case 83: // back
              input[1].power = false;
              break;
          }
        });
      });
    });
  });

  const gui = new dat.GUI();
  const folder = gui.addFolder('General');
  folder.open();

  config = {
    power: 4000,
    suspension_stiffness: 50,
    suspension_compression: 0.083,
    suspension_damping: 100.05,
    max_suspension_travel: 50000,
    fraction_slip: 10.5,
    max_suspension_force: 6000,
    jump_force: 13000,
    number_of_players: 2,
  };

  folder.add(config, 'power', 1000, 50000);
  folder.add(config, 'jump_force', 1, 100000);
  folder.add(config, 'number_of_players', 1, 2, 1);
  // folder.add(config, 'suspension_stiffness', 1, 100);
  // folder.add(config, 'suspension_compression', 0.01, 5);
  // folder.add(config, 'suspension_damping', 0.01, 3);
  // folder.add(config, 'max_suspension_travel', 100, 5000);
  // folder.add(config, 'fraction_slip', 1, 100);
  // folder.add(config, 'max_suspension_force', 1000, 20000);

  requestAnimationFrame(render);
  scene.simulate();
};

render = function () {
  requestAnimationFrame(render);

  if (vehicle[0] && vehicle[1]) {
    if (config.number_of_players === 2) {
      var distance = vehicle[0].mesh.position.distanceTo(vehicle[1].mesh.position);
      camera.position
        .copy(vehicle[0].mesh.position.clone().add(vehicle[1].mesh.position).divideScalar(2.0))
        .add(new THREE.Vector3(40, 50 + distance * 0.5, 40));
      camera.lookAt(
        vehicle[0].mesh.position.clone().add(vehicle[1].mesh.position).divideScalar(2.0)
      );
    } else {
      camera.position.copy(vehicle[0].mesh.position.clone().add(new THREE.Vector3(40, 60, 40)));
      camera.lookAt(vehicle[0].mesh.position);
    }
    // camera.lookAt(vehicle[0].mesh.position);
    // light.target.position.copy(vehicle.mesh.position);
    // light.position.addVectors(light.target.position, new THREE.Vector3(20, 20, -15));
  }

  renderer.render(scene, camera);
  render_stats.update();
};

window.onload = initScene;
