import React from "react";
import { AR, Asset, Permissions } from "expo";
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { AR as ThreeAR, THREE } from "expo-three";
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from "expo-graphics";
import { observer, inject } from "mobx-react";

import ThreeModelApi from "../../api/threemodel/ThreeModelApi";

@inject("polyStore")
@observer
export default class ARView extends React.Component {
  state = { permission: false };

  async componentDidMount() {
    THREE.suppressExpoWarnings();
    ThreeAR.suppressWarnings();

    this.props.polyStore.setCurrentAsset(ThreeModelApi.getDefaultModel());

    this.getPermission();

    await this.updateModel();
  }

  getPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ permission: status === "granted" });
  };

  render() {
    if (!this.state.permission) {
      return null;
    }
    //

    if (this.props.polyStore.current && this.threeModel) {
      this.updateModel();
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
      height
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
  };

  updateModel = async () => {
    // Remove the current object...
    if (this.threeModel) {
      this.scene.remove(this.threeModel);
    }

    // Add the current object...
    let object = await ThreeModelApi.getModel(this.props.polyStore.current);
    if (object) {
      this.threeModel = object;
      ExpoTHREE.utils.scaleLongestSideToSize(object, 0.75);
      object.position.z = -3;
      this.scene.add(object);
    }
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

  onRender = delta => {
    // Rotate the object...
    if (this.threeModel) {
      this.threeModel.rotation.x += 2 * delta;
      this.threeModel.rotation.y += 1.5 * delta;
    }

    // Render...
    this.renderer.render(this.scene, this.camera);
  };
}
