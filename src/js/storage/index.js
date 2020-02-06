import {createStore, applyMiddleware} from "redux";
import thunk from 'redux-thunk';
import rootReducer from "../reducers";

const api = require('../../.settings.json').main.apiUrl;

export default function configureStore(initialState) {
    return createStore(rootReducer,
        initialState,
        applyMiddleware(thunk.withExtraArgument(api))
    );
}