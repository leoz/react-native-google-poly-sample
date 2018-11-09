//
import React from "react";
import PolyAssetList from "./list/PolyAssetList";

export default class SearchView extends React.Component {
  render() {
    return <PolyAssetList {...this.props} />;
  }
}
