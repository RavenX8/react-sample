import React, {Component} from 'react';
import {GridColumn, Grid, GridToolbar} from '@progress/kendo-react-grid';
import {process} from '@progress/kendo-data-query';
import {CommandCell} from "./command-cell";
import DataLoader from "../loading-portal";
import {ModalDialog} from "../dialog-box";

const TOOLBAR_ADD = "add";
const TOOLBAR_CANCEL = "cancel";
export const TOOLBAR_REFRESH = "refresh";
export const TOOLBAR_DELETE_SELECTED = "delete-selected";

export const ITEM_CHANGE_ADD = "add";
export const ITEM_CHANGE_UPDATE = "update";
export const ITEM_CHANGE_REMOVE = "remove";

export class GridWithState extends Component {
    constructor(props) {
        super(props);
        const dataState = props.pageable ? {
            filter: undefined,
            group: undefined,
            skip: 0,
            sort: undefined,
            take: this.props.pageSize
        } : {skip: 0};

        this.state = {
            dataState: dataState,
            result: process(this.makeDeepCopy(this.props.data), dataState),
            allData: this.props.data,
            pendingDeleteAction: []
        };
    }

    isString(value) {
        return typeof value === 'string' || value instanceof String;
    }

    makeDeepCopy = (data) => {
        return this.isString(data) ? JSON.parse(data) : JSON.parse(JSON.stringify(data));
    };

    cleanRecord = (item) => {
        delete item[this.props.editField];
        delete item[this.props.selectedField];
        return item;
    };

    generateId = () => {
        let id = 1;
        if (this.state.allData.length > 0) {
            const lastId = this.state.allData.reduce(function (a, b) {
                return a.id < b.id ? b : a;
            });
            if (lastId) id = lastId.id + 1;
        }
        return id;
    };

    updateDataState = (data) => {
        const {dataState} = this.state;
        let skip = dataState.skip;
        if (dataState.skip >= data.length)
            skip = dataState.skip - dataState.take;

        const state = this.props.pageable ? {
            filter: this.state.dataState.filter,
            group: this.state.dataState.group,
            skip: skip,
            sort: this.state.dataState.sort,
            take: this.state.dataState.take
        } : dataState;
        this.setState({
            dataState: state
        });
    };

    toggleDeleteDialog = (event, action) => {
        switch (action) {
            case 'yes': {
                if (event.callback && typeof event.callback === 'function')
                    event.callback.call(undefined, event);

                const data = this.state.allData.filter(item => item.id !== event.dataItem.id);
                const stringData = JSON.stringify(data);

                this.updateDataState(data);
                this.setState({
                    result: process(this.makeDeepCopy(stringData), this.state.dataState),
                    allData: this.makeDeepCopy(stringData)
                });
                break;
            }
            case 'no':
            case 'close':
            default:
                break;
        }
        this.setState({
            pendingDeleteAction: this.state.pendingDeleteAction.filter((action) => action !== event)
        });
    };

    validateRequired = (data) => {
        //TODO: do validation here
        if (this.props.validateData && typeof this.props.validateData === 'function')
            return this.props.validateData.call(undefined, data);

        let valid = true;
        if (!this.props.columns) return valid;
        for (let column of this.props.columns) {
            if (column.required === true && !data[column.field]) {
                valid = false;
            }
        }
        return valid;
    };

    createDeleteEvent = (command, data, callback) => {
        return {
            title: 'Please confirm',
            question: 'Are you sure you want to delete the following record? ' + data.name,
            dataItem: data,
            value: command,
            callback: callback || null
        }
    };

    render() {
        let {data} = this.state.result;

        const hasEditedItem = data.some(p => p.inEdit);
        const hasSelectedItems = data.some(p => p.selected && p.id);
        const confirmDelete = ModalDialog(this.state.pendingDeleteAction, this.toggleDeleteDialog);

        return (
            <>
                {confirmDelete}
                <Grid
                    editField={this.props.editField}
                    selectedField={this.props.selectedField}
                    {...this.props}
                    {...this.state.dataState}
                    {...this.state.result}

                    onRowClick={this.onRowClick}
                    onItemChange={this.onItemChange}
                    onDataStateChange={this.onDataStateChange}
                >
                    <GridToolbar>
                        <button
                            title="Refresh"
                            className="k-button k-primary"
                            onClick={event => this.onToolbarButtonClick(event, TOOLBAR_REFRESH)}
                            data-testid={"refresh-table"}
                        >
                            Refresh
                        </button>
                        <button
                            title="Add new"
                            className="k-button k-primary"
                            onClick={event => this.onToolbarButtonClick(event, TOOLBAR_ADD)}
                            data-testid={"add-row"}
                        >
                            Add new
                        </button>
                        {hasSelectedItems && (<button
                            title="Delete Selected Items"
                            className="k-button"
                            onClick={event => this.onToolbarButtonClick(event, TOOLBAR_DELETE_SELECTED)}
                            data-testid={"delete-selected-row"}
                        >
                            Delete Selected Items
                        </button>)}
                        {hasEditedItem && (
                            <button
                                title="Cancel current changes"
                                className="k-button"
                                onClick={event => this.onToolbarButtonClick(event, TOOLBAR_CANCEL)}
                                data-testid={"cancel-current-changes"}
                            >
                                Cancel current changes
                            </button>)}
                    </GridToolbar>

                    {this.props.children}

                    <GridColumn
                        sortable={false}
                        filterable={false}
                        resizable={false}
                        field={this.props.editField}
                        title=" "
                        width="180px"
                        cell={CommandCell}
                    />
                </Grid>
                <DataLoader
                    container={".k-grid-content"}
                    fetchData={this.props.fetchData}
                    dataState={this.state.dataState}
                    onDataReceived={this.onDataReceived}
                />
            </>
        );
    }

    onToolbarButtonClick = (event, command) => {
        switch (command) {
            case TOOLBAR_ADD: {
                let data = this.makeDeepCopy(this.state.allData);
                let newItem = {[this.props.editField]: true, id: undefined};

                data.splice([this.state.dataState.skip], 0, newItem);
                this.setState({
                    result: process([...data], this.state.dataState)
                });
                break;
            }
            case TOOLBAR_CANCEL: {
                this.setState({
                    result: process(this.makeDeepCopy(this.state.allData), this.state.dataState)
                });
                break;
            }
            case TOOLBAR_DELETE_SELECTED: {
                let dataToDelete = this.state.result.data.filter(item => item.selected);
                let deleteEvents = dataToDelete.map(item => this.createDeleteEvent(command, item, this.props.onClick));

                this.setState({
                    pendingDeleteAction: this.state.pendingDeleteAction.concat(deleteEvents)
                });
                break;
            }
            case TOOLBAR_REFRESH: {
                if (this.props.onClick && typeof this.props.onClick === 'function')
                    this.props.onClick.call(undefined, {event, value: command, callback: this.onDataReceived});
                break;
            }
            default:
                break;
        }
    };

    onDataReceived = (e) => {
        console.log('dataReceived');
        this.setState({
            result: process(this.makeDeepCopy(e), this.state.dataState),
            allData: e
        });
    };

    onDataStateChange = (e) => {
        console.log('onDataStateChange');
        this.setState({
            dataState: e.data,
            result: process(this.makeDeepCopy(this.state.allData), e.data)
        });
    };

    onRowClick = (event) => {
        let newData = this.state.result.data.map(item => {
            let rtn = item;
            if (rtn.id === event.dataItem.id)
                rtn[this.props.selectedField] = !rtn[this.props.selectedField];
            return rtn;
        });

        this.setState({
            result: {
                ...this.state.result,
                data: [...newData]
            },
        });
    };

    onItemChange = (event) => {
        console.log('itemChange');
        const {allData} = this.state;
        let newData = this.state.result.data;

        if (event.field === this.props.editField) {
            switch (event.value) {
                case 'edit': {
                    newData = this.state.result.data.map(item => {
                        let rtn = item;
                        if (rtn.id === event.dataItem.id)
                            rtn[event.field] = true;
                        return rtn;
                    });
                    break;
                }
                case 'discard': {
                    this.setState({
                        result: process(this.makeDeepCopy(this.state.allData), this.state.dataState)
                    });
                    return;
                }
                case 'cancel': {
                    const originalItem = this.state.allData.find(p => p.id === event.dataItem.id);
                    const data = this.state.result.data.map(item => item.id === originalItem.id ? originalItem : item);

                    this.setState({
                        result: {
                            ...this.state.result,
                            data: this.makeDeepCopy(data)
                        },
                    });
                    return;
                }
                case ITEM_CHANGE_ADD: {
                    if (false === this.validateRequired(event.dataItem)) {
                        //TODO: throw error notification
                        console.log('data validation failed');
                        return;
                    }
                    this.cleanRecord(event.dataItem);

                    event.dataItem.id = this.generateId();
                    if (this.props.onChange && typeof this.props.onChange === 'function')
                        this.props.onChange(event);
                    const stringData = JSON.stringify([...this.state.allData, event.dataItem]);
                    this.updateDataState(this.makeDeepCopy(stringData));
                    this.setState({
                        result: process(this.makeDeepCopy(stringData), this.state.dataState),
                        allData: [...this.state.allData, event.dataItem]
                    });
                    return;
                }
                case ITEM_CHANGE_UPDATE: {
                    if (false === this.validateRequired(event.dataItem)) {
                        //TODO: throw error notification
                        console.log('data validation failed');
                        return;
                    }
                    this.cleanRecord(event.dataItem);
                    if (this.props.onChange && typeof this.props.onChange === 'function')
                        this.props.onChange(event);
                    newData = this.state.result.data.map(item => item.id === event.dataItem.id ? event.dataItem : item);
                    const updatedAllData = allData.map(item => item.id === event.dataItem.id ? event.dataItem : item);
                    this.setState({
                        allData: updatedAllData
                    });
                    break;
                }
                case ITEM_CHANGE_REMOVE: {
                    this.cleanRecord(event);
                    this.setState({
                        pendingDeleteAction: this.state.pendingDeleteAction.concat(this.createDeleteEvent(event.value, event.dataItem, this.props.onChange))
                    });
                    return;
                }
                default:
                    return;
            }
        } else {
            newData = this.state.result.data.map(item => {
                let rtn = item;
                if (rtn.id === event.dataItem.id)
                    rtn[event.field] = event.value;
                return rtn;
            });
        }

        this.setState({
            result: {
                ...this.state.result,
                data: [...newData]
            },
        });
    };
}