import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {toODataString} from '@progress/kendo-data-query';
import {Notify} from "./notifications";

class DataLoader extends Component {
    state = {
        lastSuccess: '',
        pending: '',
        notifications: []
    };

    requestDataIfNeeded() {
        const {fetchData} = this.props;

        if (this.state.pending || toODataString(this.props.dataState) === this.state.lastSuccess) {
            return;
        }

        this.setState({
            ...this.state,
            pending: toODataString(this.props.dataState)
        });

        if (fetchData && typeof fetchData === 'function') {
            fetchData.call(undefined)
                .then(res => {
                    if (res.type.indexOf('SUCCESS') !== -1) {
                        this.setState({
                            lastSuccess: this.state.pending,
                            pending: ''
                        });

                        if (toODataString(this.props.dataState) === this.state.lastSuccess) {
                            if (this.props.onDataReceived && typeof this.props.onDataReceived === 'function')
                                this.props.onDataReceived.call(undefined, res.data);
                        } else {
                            this.requestDataIfNeeded();
                        }
                    } else if (res.type.indexOf('FAILURE') !== -1) {
                        // Throw up a notification indicating an error occurred
                        const data = res.payload.message;
                        const message = {type: 'error', text: data};
                        this.setState({
                            notifications: this.state.notifications.concat(message)
                        });
                    }
                });
        }
    }

    onCloseNotification = (data) => {
        this.setState({
            notifications: this.state.notifications.filter(notification => notification !== data)
        });
    };

    render() {
        this.requestDataIfNeeded();
        const notifyBox = Notify(this.state.notifications, this.onCloseNotification);
        return (
            <>
                {notifyBox}
                {this.state.pending && <LoadingPanel container={this.props.container}/>}
            </>
        );
    }
}


class LoadingPanel extends Component {
    render() {
        const loadingPanel = (
            <div className="k-loading-mask">
                <span className="k-loading-text">Loading</span>
                <div className="k-loading-image"></div>
                <div className="k-loading-color"></div>
            </div>
        );

        const container = document && document.querySelector(this.props.container);
        return container ? ReactDOM.createPortal(loadingPanel, container) : loadingPanel;
    }
}

export default DataLoader;

