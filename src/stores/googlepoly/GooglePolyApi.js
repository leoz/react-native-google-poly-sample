//
export default class GooglePolyApi {
  // Returns a query URL based on the given data...
  static makeSearchURL = (key, keywords, pageToken) => {
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
  };

  // Returns the results of the current query...
  fetchSearchResults = (key, keywords, pageToken) => {
    let url = GooglePolyApi.makeSearchURL(key, keywords, pageToken);
    const promise = fetch(url)
      .then(response => {
        if (response.status >= 400) {
          throw `Response invalid ( ${response.status} )`;
          return;
        }
        return response.json();
      })
      .then(data => {
        return data;
      })
      .catch(error => {
        console.log(error);
      });

    return promise;
  };
}
