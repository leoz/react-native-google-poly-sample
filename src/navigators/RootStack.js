//
import { createStackNavigator } from 'react-navigation';

import MainStack from './MainStack';
import SearchStack from './SearchStack';

export default createStackNavigator(
    {
        Main: {
            screen: MainStack,
        },
        Search: {
            screen: SearchStack,
        },
    },
    {
        mode: 'modal',
        headerMode: 'none',
    }
);
