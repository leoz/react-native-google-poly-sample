//
import GooglePolyApiKey from "./googlepoly/GooglePolyApiKey";
import GooglePolyApi from "./googlepoly/GooglePolyApi";
import GooglePolyStore from "./googlepoly/GooglePolyStore";

const polyApi = new GooglePolyApi();
const polyStore = new GooglePolyStore(GooglePolyApiKey.key, polyApi);

export default {
  polyStore: polyStore
};
