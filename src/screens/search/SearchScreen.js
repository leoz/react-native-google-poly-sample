//
import React from 'react';
import { Button } from 'react-native';
import SearchView from './SearchView';

export default class SearchScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: 'Select Model',
            headerLeft: (
                <Button
                    onPress={() => navigation.goBack(null)}
                    title="Exit"
                />
            ),
        };
    };

    render() {
        return (
            <SearchView {...this.props} />
        );
    }
}