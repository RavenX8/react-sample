import React, {Component} from 'react';
import {GridColumn, Grid, GridToolbar} from '@progress/kendo-react-grid';
import {Dialog, DialogActionsBar} from '@progress/kendo-react-dialogs';
import {process} from '@progress/kendo-data-query';
import {CommandCell} from "./command-cell";
import DataLoader from "../loading-portal";

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
                if (event.callback)
                    event.callback.call(undefined, event);

                //this.props.onChange({dataItem: event, value: 'delete'});
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
        return true;
    };

    createEvent = (command, data, callback) => {
        return {dataItem: data, value: command, callback: callback || null}
    };

    // rowRender(trElement, props) {
    //     const trProps = { className: 'overflow-x-auto overflow-y-auto' };
    //     return React.cloneElement(trElement, { ...trProps }, trElement.props.children);
    // }

    render() {
        let {data} = this.state.result;

        const hasEditedItem = data.some(p => p.inEdit);
        const hasSelectedItems = data.some(p => p.selected);
        return (
            <>
                {this.state.pendingDeleteAction.length > 0 && <Dialog title={"Please confirm"}
                                                                      onClose={() => this.toggleDeleteDialog(this.state.pendingDeleteAction[0], 'close')}>
                    <p style={{margin: "25px", textAlign: "center"}}>Are you sure you want to delete the following
                        record?</p>
                    <p style={{
                        margin: "25px",
                        textAlign: "center"
                    }}>{this.state.pendingDeleteAction[0].dataItem.name}</p>
                    <DialogActionsBar>
                        <button className="k-button"
                                onClick={() => this.toggleDeleteDialog(this.state.pendingDeleteAction[0], 'yes')}>Yes
                        </button>
                        <button className="k-button"
                                onClick={() => this.toggleDeleteDialog(this.state.pendingDeleteAction[0], 'no')}>No
                        </button>
                    </DialogActionsBar>
                </Dialog>}
                <Grid
                    editField={this.props.editField}
                    selectedField={this.props.selectedField}
                    {...this.props}
                    {...this.state.dataState}
                    {...this.state.result}

                    // rowRender={this.rowRender}
                    onRowClick={this.onRowClick}
                    onItemChange={this.onItemChange}
                    onDataStateChange={this.onDataStateChange}
                >
                    <GridToolbar>
                        <button
                            title="Refresh"
                            className="k-button k-primary"
                            onClick={event => this.onToolbarButtonClick(event, 'refresh')}
                            data-testid={"refresh-table"}
                        >
                            Refresh
                        </button>
                        <button
                            title="Add new"
                            className="k-button k-primary"
                            onClick={event => this.onToolbarButtonClick(event, 'add')}
                            data-testid={"add-row"}
                        >
                            Add new
                        </button>
                        {hasSelectedItems && (<button
                            title="Delete Selected Items"
                            className="k-button"
                            onClick={event => this.onToolbarButtonClick(event, 'delete-selected')}
                            data-testid={"delete-selected-row"}
                        >
                            Delete Selected Items
                        </button>)}
                        {hasEditedItem && (
                            <button
                                title="Cancel current changes"
                                className="k-button"
                                onClick={event => this.onToolbarButtonClick(event, 'cancel')}
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
            case 'add': {
                let data = this.makeDeepCopy(this.state.allData);
                let newItem = {[this.props.editField]: true, id: undefined};

                data.splice([this.state.dataState.skip], 0, newItem);
                this.setState({
                    result: process([...data], this.state.dataState)
                });
                break;
            }
            case 'cancel': {
                this.setState({
                    result: process(this.makeDeepCopy(this.state.allData), this.state.dataState)
                });
                break;
            }
            case 'delete-selected': {
                let data = this.state.allData;
                let dataToDelete = this.state.result.data.filter(item => item.selected);
                let deleteEvents = dataToDelete.map(item => this.createEvent(command, item, this.props.onClick));

                this.setState({
                    pendingDeleteAction: this.state.pendingDeleteAction.concat(deleteEvents)
                });
                // for (let item of dataToDelete) {
                //     //TODO: confirm delete
                //
                //     this.props.onClick.call(undefined, {
                //         event,
                //         dataItem: item,
                //         value: command,
                //         callback: this.onDataReceived
                //     });
                //     data = data.filter(element => element.id !== item.id);
                // }
                // const stringData = JSON.stringify(data);
                // this.updateDataState(data);
                // this.setState({
                //     result: process(this.makeDeepCopy(stringData), this.state.dataState),
                //     allData: this.makeDeepCopy(stringData)
                // });
                break;
            }
            case 'refresh': {
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

                case 'add': {
                    //TODO: check if all required fields are set
                    if (false === this.validateRequired(event.dataItem)) {
                        //TODO: throw error notification
                        return;
                    }
                    this.cleanRecord(event.dataItem);

                    event.dataItem.id = this.generateId();
                    this.props.onChange(event);
                    const stringData = JSON.stringify([...this.state.allData, event.dataItem]);
                    this.updateDataState(this.makeDeepCopy(stringData));
                    this.setState({
                        result: process(this.makeDeepCopy(stringData), this.state.dataState),
                        allData: [...this.state.allData, event.dataItem]
                    });
                    return;
                }
                case 'update': {
                    if (false === this.validateRequired(event.dataItem)) {
                        //TODO: throw error notification
                        return;
                    }
                    this.cleanRecord(event.dataItem);
                    this.props.onChange(event);
                    newData = this.state.result.data.map(item => item.id === event.dataItem.id ? event.dataItem : item);
                    const updatedAllData = allData.map(item => item.id === event.dataItem.id ? event.dataItem : item);
                    this.setState({
                        allData: updatedAllData
                    });
                    break;
                }
                case 'remove': {
                    this.cleanRecord(event);
                    this.setState({
                        pendingDeleteAction: this.state.pendingDeleteAction.concat(this.createEvent(event.value, event.dataItem, this.props.onChange))
                    });
                    // this.props.onChange(event);
                    // const data = allData.filter(item => item.id !== event.dataItem.id);
                    // const stringData = JSON.stringify(data);
                    //
                    // this.updateDataState(data);
                    // this.setState({
                    //     result: process(this.makeDeepCopy(stringData), this.state.dataState),
                    //     allData: this.makeDeepCopy(stringData)
                    // });
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