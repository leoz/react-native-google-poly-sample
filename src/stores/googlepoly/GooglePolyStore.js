//
import { observable, computed, action } from "mobx";

export default class GooglePolyStore {
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
    var url = GooglePolyStore.getQueryURL(
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
}
