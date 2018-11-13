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

  static getDefaultModel = () => {
    return TurkeyObject;
  };

  // Returns a Three.js object
  static getModel = (current, success, failure) => {
    if (!success) {
      success = function() {};
    }
    if (!failure) {
      failure = function() {};
    }
    if (!current || ThreeModelApi.isEmpty(current)) {
      failure("current is null");
      return;
    }

    // Search for a format...
    var format = current.formats.find(format => {
      return format.formatType == "OBJ";
    });
    if (format === undefined) {
      failure("No format found");
      return;
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
    var loader = new THREE.MTLLoader();
    loader.setCrossOrigin(true);
    loader.setTexturePath(path);
    loader.load(mtl.url, function(materials) {
      // Load the OBJ...
      loader = new THREE.OBJLoader();
      loader.setMaterials(materials);
      loader.load(obj.url, async function(object) {
        // If there is a texture, apply it...
        if (tex !== undefined) {
          var texUri = await AssetUtils.uriAsync(tex.url);
          var texture = new THREE.MeshBasicMaterial({
            map: await ExpoTHREE.loadAsync(texUri)
          });
          object.traverse(child => {
            if (child instanceof THREE.Mesh) {
              child.material = texture;
            }
          });
        }

        // Return the object...
        success(object);
      });
    });
  };
}
