//
import React from "react";
import PolyAssetList from "./list/PolyAssetList";

export default class SearchView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAsset: null
    };
  }

  onAssetPress = asset => {
    this.setState({ currentAsset: asset });
    this.props.navigation.goBack(null);
    //console.log('onAssetPress');
    //console.log(asset);
  };

  render() {
    return <PolyAssetList onAssetPress={this.onAssetPress} />;
  }
}
