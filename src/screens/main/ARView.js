import React from 'react';
import { AR, Asset, Permissions } from 'expo';
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { AR as ThreeAR, THREE } from 'expo-three';
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from 'expo-graphics';
import AssetUtils from 'expo-asset-utils';

export default class ARView extends React.Component {
  state = { permission: false };

  componentDidMount() {
    THREE.suppressExpoWarnings();
    ThreeAR.suppressWarnings();

    this.getPermission();
  }

  getPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ permission: status === 'granted' });
  };

  render() {
    if (!this.state.permission) {
      return null;
    }
    // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
    // `isArRunningStateEnabled` Will show us the play/pause button in the corner.
    // `isArCameraStateEnabled` Will render the camera tracking information on the screen.
    // `arTrackingConfiguration` denotes which camera the AR Session will use.
    // World for rear, Face for front (iPhone X only)
    return (
      <GraphicsView
        style={{ flex: 1 }}
        onContextCreate={this.onContextCreate}
        onRender={this.onRender}
        onResize={this.onResize}
        isArEnabled
        isShadowsEnabled
        isArRunningStateEnabled
        isArCameraStateEnabled
        arTrackingConfiguration={AR.TrackingConfiguration.World}
      />
    );
  }

  // When our context is built we can start coding 3D things.
  onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    // This will allow ARKit to collect Horizontal surfaces
    AR.setPlaneDetection(AR.PlaneDetection.Horizontal);

    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);
    // Now we make a camera that matches the device orientation.
    // Ex: When we look down this camera will rotate to look down too!
    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);

    // Create ARKit lighting
    this.arPointLight = new ThreeAR.Light();
    this.arPointLight.position.y = 2;
    this.scene.add(this.arPointLight);
    this.shadowLight = this.getShadowLight();
    this.scene.add(this.shadowLight);
    this.scene.add(this.shadowLight.target);
    this.scene.add(new THREE.AmbientLight(0x404040));

    // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    const diffuseAsset = await AssetUtils.resolveAsync(
      'https://github.com/mrdoob/three.js/blob/master/examples/textures/brick_diffuse.jpg?raw=true'
    );
    const diffuse = await ExpoTHREE.loadAsync(diffuseAsset);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.anisotropy = 4;
    diffuse.repeat.set(1, 1);

    const bumpAsset = await AssetUtils.resolveAsync(
      'https://github.com/mrdoob/three.js/blob/master/examples/textures/brick_bump.jpg?raw=true'
    );
    const bumpMap = await ExpoTHREE.loadAsync(bumpAsset);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = 4;
    bumpMap.repeat.set(1, 1);

    const roughnessAsset = await AssetUtils.resolveAsync(
      'https://github.com/mrdoob/three.js/blob/master/examples/textures/brick_roughness.jpg?raw=true'
    );
    const roughnessMap = await ExpoTHREE.loadAsync(roughnessAsset);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.anisotropy = 4;
    roughnessMap.repeat.set(9, 0.5);

    const cubeMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      color: 0xffffff,
      bumpScale: 0.002,
      metalness: 0.2,
      map: diffuse,
      bumpMap,
      roughnessMap,
    });

    // Combine our geometry and material
    this.cube = new THREE.Mesh(geometry, cubeMat);
    this.cube.castShadow = true;
    this.cube.position.y = 0.05;

    this.shadowFloor = new ThreeAR.ShadowFloor({
      width: 1,
      height: 1,
      opacity: 0.6,
    });

    this.magneticObject = new ThreeAR.MagneticObject();
    this.magneticObject.maintainScale = false;
    this.magneticObject.maintainRotation = false;

    this.magneticObject.add(this.cube);
    this.magneticObject.add(this.shadowFloor);

    this.scene.add(this.magneticObject);
  };

  getShadowLight = () => {
    let light = new THREE.DirectionalLight(0xffffff, 0.6);

    light.castShadow = true;

    // default is 50
    const shadowSize = 0.4;
    light.shadow.camera.left = -shadowSize;
    light.shadow.camera.right = shadowSize;
    light.shadow.camera.top = shadowSize;
    light.shadow.camera.bottom = -shadowSize;
    light.shadow.camera.near = 0.001;
    light.shadow.camera.far = 100;
    light.shadow.camera.updateProjectionMatrix();

    // default is 512
    light.shadow.mapSize.width = 512 * 2;
    light.shadow.mapSize.height = light.shadow.mapSize.width;

    return light;
  };

  // The normalized point on the screen that we want our object to stick to.
  screenCenter = new THREE.Vector2(0.5, 0.5);

  // When the phone rotates, or the view changes size, this method will be called.
  onResize = ({ x, y, scale, width, height }) => {
    // Let's stop the function if we haven't setup our scene yet
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  // Called every frame.
  onRender = () => {
    // This will make the points get more rawDataPoints from Expo.AR
    this.magneticObject.update(this.camera, this.screenCenter);

    this.arPointLight.update();

    this.shadowFloor.opacity = this.arPointLight.intensity;

    this.shadowLight.target.position.copy(this.magneticObject.position);
    this.shadowLight.position.copy(this.shadowLight.target.position);
    this.shadowLight.position.x += 0.1;
    this.shadowLight.position.y += 1;
    this.shadowLight.position.z += 0.1;

    // Finally render the scene with the AR Camera
    this.renderer.render(this.scene, this.camera);
  };
}
