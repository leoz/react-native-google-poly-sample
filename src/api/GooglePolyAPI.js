//
import { observable, computed, action } from "mobx";
import ExpoTHREE from "expo-three";
import AssetUtils from "expo-asset-utils";
import * as THREE from "three";
require("./util/OBJLoader");
require("./util/MTLLoader");

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

export default class GooglePolyAPI {
  @observable results = [];
  @observable current = {};
  @observable pageToken = "";
  @observable keywords = "";

  constructor(key) {
    this.key = key;
  }

  // Returns a query URL based on the given data...
  static getQueryURL(key, keywords, pageToken) {
    var baseURL = "https://poly.googleapis.com/v1/assets?";

    var url = baseURL + "key=" + key;
    url += "&pageSize=10";
    url += "&maxComplexity=MEDIUM";
    url += "&format=OBJ";
    if (keywords) {
      url += "&keywords=" + encodeURIComponent(keywords);
    }
    if (pageToken) {
      url += "&pageToken=" + pageToken;
    }
    return url;
  }

  // Sets current search parameters and resets member variables...
  @action
  setSearchParams = keywords => {
    this.results = [];
    this.pageToken = "";
    this.keywords = keywords;
  };

  @action
  setCurrentAsset = asset => {
    this.current = asset;
  };

  // Returns the results of the current query...
  @action
  getSearchResults() {
    var url = GooglePolyAPI.getQueryURL(
      this.key,
      this.keywords,
      this.pageToken
    );

    return fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(
        function(data) {
          if (data && !data.error) {
            this.results = this.results.concat(data.assets);
            this.pageToken = data.nextPageToken;
            //console.log(data);
            return Promise.resolve(data.assets);
          }
          return Promise.resolve(null);
        }.bind(this)
      );
  }

  @computed
  get canLoadMore() {
    return this.pageToken && this.pageToken != "";
  }

  // Returns a Three.js object
  getThreeModel(success, failure) {
    if (!success) {
      success = function() {};
    }
    if (!failure) {
      failure = function() {};
    }
    if (!this.current || isEmpty(this.current)) {
      failure("current is null");
      return;
    }

    // Search for a format...
    var format = this.current.formats.find(format => {
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
  }
}
