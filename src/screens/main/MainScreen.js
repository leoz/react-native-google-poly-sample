//
import React from "react";
import { Button } from "react-native";
import ARView from "./ARView";

export default class MainScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Model Explorer",
      headerLeft: (
        <Button onPress={() => navigation.navigate("Search")} title="Search" />
      )
    };
  };

  render() {
    return <ARView />;
  }
}
