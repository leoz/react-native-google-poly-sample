//
import GooglePolyApiKey from "./googlepoly/GooglePolyApiKey";
import GooglePolyApi from "./googlepoly/GooglePolyApi";

export default {
  googlePolyAPI: new GooglePolyApi(GooglePolyApiKey.key)
};
