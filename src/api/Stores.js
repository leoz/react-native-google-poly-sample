//
import ApiKeys from "./ApiKeys";
import GooglePolyAPI from "./GooglePolyAPI";

export default {
  googlePolyAPI: new GooglePolyAPI(ApiKeys.key)
  // place for other stores...
};
