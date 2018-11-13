//
import GooglePolyApiKey from "./googlepoly/GooglePolyApiKey";
import GooglePolyStore from "./googlepoly/GooglePolyStore";

export default {
  polyStore: new GooglePolyStore(GooglePolyApiKey.key)
};
