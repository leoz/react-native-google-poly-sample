//
import ExpoTHREE from "expo-three";
import AssetUtils from "expo-asset-utils";
import * as THREE from "three";

require("./util/OBJLoader");
require("./util/MTLLoader");

import TurkeyObject from "./objects/TurkeyObject.json";

export default class ThreeModelApi {
  static isEmpty = obj => {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }
    return true;
  };

  static promisifyLoader = (loader, onProgress) => {
    function promiseLoader(url) {
      return new Promise((resolve, reject) => {
        loader.load(url, resolve, onProgress, reject);
      });
    }

    return {
      originalLoader: loader,
      load: promiseLoader
    };
  };

  static getDefaultModel = () => {
    return TurkeyObject;
  };

  static load_MTL = async (url, path) => {
    var loader = new THREE.MTLLoader();
    loader.setCrossOrigin(true);
    loader.setTexturePath(path);

    var mtl_loader = ThreeModelApi.promisifyLoader(loader);
    let materials = await mtl_loader.load(url);

    return materials;
  };

  static load_OBJ = async (url, materials) => {
    var loader = new THREE.OBJLoader();
    loader.setMaterials(materials);

    const obj_loader = ThreeModelApi.promisifyLoader(loader);
    let object = await obj_loader.load(url);

    return object;
  };

  static load_Texture = async (url, object) => {
    var texUri = await AssetUtils.uriAsync(url);
    var texture = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.loadAsync(texUri)
    });
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.material = texture;
      }
    });

    return object;
  };

  // Returns a Three.js object
  static getModel = async (current) => {
    if (!current || ThreeModelApi.isEmpty(current)) {
      console.log("current is null");
      return null;
    }

    // Search for a format...
    var format = current.formats.find(format => {
      return format.formatType == "OBJ";
    });
    if (format === undefined) {
      console.log("No format found");
      return null;
    }

    // Search for a resource...
    var obj = format.root;
    var mtl = format.resources.find(resource => {
      return resource.url.endsWith("mtl");
    });
    var tex = format.resources.find(resource => {
      return resource.url.endsWith("png");
    });
    var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));

    // Load the MTL...
    let materials = await ThreeModelApi.load_MTL(mtl.url, path);

    // Load the OBJ...
    let object = await ThreeModelApi.load_OBJ(obj.url, materials);

    // If there is a texture, apply it...
    if (tex !== undefined) {
      object = await ThreeModelApi.load_Texture(tex.url, object);
    }

    // Return the object...
    return object;
  };
}
