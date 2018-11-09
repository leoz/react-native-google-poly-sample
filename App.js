//
import React from "react";
import { Provider } from "mobx-react";

import Stores from "./src/api/Stores";
import RootStack from "./src/navigators/RootStack";

export default class App extends React.Component {
  render() {
    return (
      <Provider {...Stores}>
        <RootStack />
      </Provider>
    );
  }
}
