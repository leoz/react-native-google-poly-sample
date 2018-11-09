//
import React from "react";
import { View, Text } from "react-native";
import { observer, inject } from "mobx-react";

@inject("googlePolyAPI")
@observer
export default class MainView extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Main View</Text>
        <Text>{JSON.stringify(this.props.googlePolyAPI.current)}</Text>
      </View>
    );
  }
}
