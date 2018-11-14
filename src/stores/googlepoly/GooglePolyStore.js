//
import { observable, computed, action } from "mobx";

export default class GooglePolyStore {
  @observable results = [];
  @observable current = {};
  @observable pageToken = "";
  @observable keywords = "";

  constructor(key, api) {
    this.key = key;
    this.api = api;
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
  async getSearchResults() {
    let data = await this.api.fetchSearchResults(
      this.key,
      this.keywords,
      this.pageToken
    );

    if (data && !data.error) {
      this.results = this.results.concat(data.assets);
      this.pageToken = data.nextPageToken;
    }
  }

  @computed
  get canLoadMore() {
    return this.pageToken && this.pageToken != "";
  }
}
